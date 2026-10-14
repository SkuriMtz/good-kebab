import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { conversacionesDe, cuentaDe, respuestasRecientes, resumenesCorreo, sesion, usuarioDe } from "@/components/app/datos";
import { claveDia, haceCuanto, momento, nombreDia } from "@/components/dashboard/momento";
import type { AgenteFijado, ConversacionReciente, Destacado, Evento, ItemParaTi } from "@/components/dashboard/tipos";
import { AGENTE_POR_ID, AGENTES_INFO, esIdAgente, type IdAgente } from "@/lib/agentes";
import { planMinimo } from "@/lib/planes";
import { Panel, type DatosResumen } from "./Panel";

export const metadata: Metadata = { title: "Panel" };

const plural = (n: number, uno: string, varios: string) => `${n.toLocaleString("es-MX")} ${n === 1 ? uno : varios}`;
const conSugerencia = (accion: string | null) => Boolean(accion && accion.trim().toLowerCase() !== "ninguna");

/**
 * /panel: el Resumen del dashboard con los datos reales de la cuenta, y la
 * vista Correo (?vista=correo) con el modo de prueba de Clara, Gmail y el
 * historial. Lo que todavía no tiene datos muestra un estado vacío que
 * explica qué va a aparecer ahí. (La barra y el lateral los pone layout.tsx.)
 */
export default async function PanelPage({ searchParams }: { searchParams: { vista?: string; pestana?: string } }) {
  const { user } = await sesion();
  // El middleware ya redirige a /entrar sin sesión; esto es una segunda barrera
  if (!user) redirect("/entrar");

  const [cuenta, conversaciones, resumenes, respuestas] = await Promise.all([
    cuentaDe(user.id),
    conversacionesDe(user.id),
    resumenesCorreo(),
    respuestasRecientes(),
  ]);
  const proveedores = (user.app_metadata?.providers as string[] | undefined) ?? [];
  const conGoogle = proveedores.includes("google");
  const ahora = new Date();
  const m = momento(ahora);
  const usuario = usuarioDe(user);
  const { plan } = cuenta;

  const agentesDe = (c: (typeof conversaciones)[number]): IdAgente[] => {
    const p = (c.participantes ?? []).filter(esIdAgente);
    return p.length >= 2 ? p : [c.agente as IdAgente];
  };

  /* ---------- Actividad: correos que resumió Clara y conversaciones con el equipo ---------- */
  const conTiempo: (Evento & { t: number })[] = [
    ...resumenes.map((r) => {
      const f = new Date(r.creado_en);
      return {
        id: `r-${r.id}`,
        t: f.getTime(),
        dia: nombreDia(f, ahora),
        cuando: haceCuanto(f, ahora),
        fecha: r.creado_en,
        quien: "clara" as const,
        accion: "resumió el correo",
        objeto: r.asunto?.trim() || "sin asunto",
        detalle: `${r.remitente ? `De ${r.remitente}: ` : ""}${r.resumen}`,
        destino: { href: "/panel?vista=correo" },
      };
    }),
    ...conversaciones.map((c) => {
      const f = new Date(c.actualizado_en);
      const agentes = agentesDe(c);
      return {
        id: `c-${c.id}`,
        t: f.getTime(),
        dia: nombreDia(f, ahora),
        cuando: haceCuanto(f, ahora),
        fecha: c.actualizado_en,
        quien: agentes[0],
        accion:
          agentes.length > 1
            ? `y ${agentes
                .slice(1)
                .map((a) => AGENTE_POR_ID[a].nombre)
                .join(" y ")} hablaron contigo en`
            : "habló contigo en",
        objeto: c.titulo,
        destino: { href: `/panel/chat?c=${c.id}` },
      };
    }),
  ]
    .sort((a, b) => b.t - a.t)
    .slice(0, 12);
  const eventos: Evento[] = conTiempo.map((e) => ({
    id: e.id,
    dia: e.dia,
    cuando: e.cuando,
    fecha: e.fecha,
    quien: e.quien,
    accion: e.accion,
    objeto: e.objeto,
    detalle: e.detalle,
    destino: e.destino,
  }));

  const destacados: Destacado[] = resumenes
    .filter((r) => conSugerencia(r.accion_sugerida))
    .slice(0, 5)
    .map((r) => ({
      id: `d-${r.id}`,
      agente: "clara",
      titulo: r.accion_sugerida as string,
      detalle: [r.asunto?.trim(), r.remitente ? `de ${r.remitente}` : null].filter(Boolean).join(" · "),
      insignia: { tono: "azul", texto: "Sugerencia de Clara" },
      cuando: haceCuanto(new Date(r.creado_en), ahora),
      destino: { href: "/panel?vista=correo" },
    }));

  /* ---------- Agentes fijados ---------- */
  const fijados: AgenteFijado[] = AGENTES_INFO.map((a) => {
    const n = conversaciones.filter((c) => agentesDe(c).includes(a.id)).length;
    if (!plan.agentes.includes(a.id)) {
      const con = planMinimo(a.id).nombre;
      return { id: a.id, estado: "", tono: "neutro", dato: `Se suma con ${con}`, bloqueado: `Con ${con}`, destino: { href: "/panel/agentes" } };
    }
    const activo = cuenta.activos.includes(a.id);
    return {
      id: a.id,
      estado: !activo ? "Fuera de tu equipo" : a.id === "clara" && conGoogle ? "Conectada a tu Gmail" : "En tu equipo",
      tono: activo ? "exito" : "neutro",
      dato: n ? plural(n, "conversación", "conversaciones") : "Todavía sin conversaciones",
      destino: { href: activo ? `/panel/chat?agente=${a.id}` : "/panel/agentes" },
    };
  });

  /* ---------- Conversaciones recientes ---------- */
  const recientes: ConversacionReciente[] = conversaciones.slice(0, 5).map((c) => {
    const agentes = agentesDe(c);
    const info = AGENTE_POR_ID[agentes[0]];
    return {
      id: c.id,
      nombre: c.titulo,
      agentes,
      vistaPrevia:
        c.tema?.trim() || (agentes.length > 1 ? `Con ${agentes.map((a) => AGENTE_POR_ID[a].nombre).join(", ")}` : `Con ${info.nombre} · ${info.area}`),
      cuando: haceCuanto(new Date(c.actualizado_en), ahora),
      destino: { href: `/panel/chat?c=${c.id}` },
    };
  });

  /* ---------- Esta semana: respuestas de los agentes por día ---------- */
  const semana =
    respuestas === null
      ? null
      : m.dias.map((d, i) => {
          const clave = claveDia(new Date(ahora.getTime() - (6 - i) * 86_400_000));
          return { ...d, valor: respuestas.filter((f) => claveDia(new Date(f)) === clave).length, hoy: i === 6 };
        });

  /* ---------- Para ti: consejos según tu cuenta y lo que ya existe en Atendel ---------- */
  const paraTi: ItemParaTi[] = [];
  if (!conGoogle) {
    paraTi.push({
      id: "gmail",
      tipo: "consejo",
      titulo: "Conecta tu Gmail",
      texto: "Clara resume tus correos sin leer. Es solo lectura: nunca envía ni borra nada.",
      accion: { etiqueta: "Ir a Correo", destino: { href: "/panel?vista=correo" } },
    });
  }
  paraTi.push({
    id: "mencion",
    tipo: "consejo",
    titulo: "Menciona a un agente con @",
    texto: "En el chat escribe @ y el nombre del agente para que conteste él; con / ves las acciones de cada uno.",
    accion: { etiqueta: "Abrir el chat", destino: { href: "/panel/chat" } },
  });
  paraTi.push(
    plan.id === "free"
      ? {
          id: "one",
          tipo: "novedad",
          titulo: "Lola, en Atendel One",
          texto: "Con Atendel One se suma Lola, tu agente de atención: WhatsApp y citas.",
          accion: { etiqueta: "Ver planes", destino: { href: "/precios" } },
        }
      : {
          id: "grupos",
          tipo: "novedad",
          titulo: "Chats en grupo",
          texto: "Junta a varios agentes en una misma conversación: cada uno contesta lo suyo.",
          accion: { etiqueta: "Abrir el chat", destino: { href: "/panel/chat" } },
        },
  );
  paraTi.push({
    id: "buscar",
    tipo: "consejo",
    titulo: "Busca desde cualquier parte",
    texto: "Escribe / y encuentra una conversación, un agente o una sección sin soltar el teclado.",
  });

  /* ---------- Bienvenida ---------- */
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).getTime();
  const correosMes = resumenes.filter((r) => new Date(r.creado_en).getTime() >= inicioMes).length;
  const sinNada = cuenta.usados === 0 && conversaciones.length === 0 && resumenes.length === 0;
  const texto = sinNada
    ? "Todavía no hay actividad en tu cuenta. Empieza hablando con tu equipo o pídele a Clara que resuma un correo de ejemplo."
    : `Este mes llevas ${plural(cuenta.usados, "mensaje", "mensajes")} con tu equipo${correosMes ? ` y Clara resumió ${plural(correosMes, "correo", "correos")}` : ""}.${
        destacados.length ? ` Clara dejó ${plural(destacados.length, "sugerencia", "sugerencias")} en Destacados.` : ""
      }`;

  const nombre = usuario.nombre.split(" ")[0];
  const datos: DatosResumen = {
    fecha: m.fecha,
    saludo: nombre ? `${m.saludo}, ${nombre}` : m.saludo,
    texto,
    cifras: [
      { valor: `${cuenta.usados.toLocaleString("es-MX")} de ${plan.mensajesMes.toLocaleString("es-MX")}`, etiqueta: `mensajes de ${m.mes}` },
      { valor: correosMes.toLocaleString("es-MX"), etiqueta: "correos resumidos por Clara este mes" },
      { valor: conversaciones.length >= 60 ? "60+" : String(conversaciones.length), etiqueta: "conversaciones con tu equipo" },
    ],
    eventos,
    destacados,
    fijados,
    recientes,
    negocio: { nombre: cuenta.negocio, plan: plan.nombre, usados: cuenta.usados, limite: plan.mensajesMes, mes: m.mes, renueva: m.renueva },
    semana,
    paraTi,
    pestana: searchParams.pestana === "pendientes" || searchParams.pestana === "destacados" ? searchParams.pestana : "actividad",
  };

  return (
    <Panel
      vista={searchParams.vista === "correo" ? "correo" : "resumen"}
      datos={datos}
      conGoogle={conGoogle}
      resumenesIniciales={resumenes}
      ahora={ahora.toISOString()}
    />
  );
}
