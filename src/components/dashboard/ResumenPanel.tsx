"use client";

import { useRouter } from "next/navigation";
import { Pestanas } from "@/components/base/Pestanas";
import { AGENTE_POR_ID, IDS_AGENTES, esIdAgente, type IdAgente } from "@/lib/agentes";
import { PLAN_POR_ID, planMinimo, type IdPlan } from "@/lib/planes";
import { ActividadReciente, Inicio, LineaTiempo, PrimerosPasos, TarjetaEquipo, useCerrable, type Atajo, type ModoPedido, type OpcionPedido } from "./Centro";
import { nombresAgentes } from "./nombres";
import { EnlaceMas, Vacio } from "./Piezas";
import { useAhora } from "./tiempo";
import type { Evento } from "./tipos";

export type ConversacionReal = {
  id: string;
  agente: string;
  titulo: string;
  actualizado_en: string;
  participantes?: string[] | null;
  tema?: string | null;
};

export type ResumenReal = {
  id: string;
  remitente: string | null;
  asunto: string | null;
  resumen: string;
  accion_sugerida: string | null;
  creado_en: string;
};

const conSugerencia = (accion: string | null) => Boolean(accion && accion.trim().toLowerCase() !== "ninguna");

function integrantes(c: ConversacionReal): IdAgente[] {
  const p = (c.participantes ?? []).filter(esIdAgente);
  if (p.length >= 2) return p;
  return esIdAgente(c.agente) ? [c.agente] : ["clara"];
}

/** Arma la línea de tiempo con lo que de verdad pasó: correos que Clara resumió y conversaciones con tu equipo. */
function actividadReal(resumenes: ResumenReal[], conversaciones: ConversacionReal[]): Evento[] {
  const eventos: (Evento & { orden: number })[] = [];

  // Los resúmenes del mismo día van juntos si son más de dos (como "resumió 5 correos")
  const porDia = new Map<string, ResumenReal[]>();
  resumenes.forEach((r) => {
    const dia = new Date(r.creado_en).toDateString();
    porDia.set(dia, [...(porDia.get(dia) ?? []), r]);
  });
  porDia.forEach((lista) => {
    if (lista.length > 2) {
      eventos.push({
        id: `resumenes-${lista[0].id}`,
        agente: "clara",
        verbo: "resumió",
        objeto: `${lista.length} correos`,
        fecha: lista[0].creado_en,
        orden: new Date(lista[0].creado_en).getTime(),
        agrupado: {
          etiqueta: "Ver los correos",
          elementos: lista.map((r) => ({ id: r.id, titulo: r.asunto || "(sin asunto)", detalle: r.remitente ?? undefined })),
        },
        accion: { etiqueta: "Ir a Correo", href: "/panel?vista=correo#historial" },
      });
      return;
    }
    lista.forEach((r) =>
      eventos.push({
        id: `resumen-${r.id}`,
        agente: "clara",
        verbo: "resumió un correo",
        objeto: r.remitente ? `de ${r.remitente.replace(/<.*>/, "").trim()}` : undefined,
        fecha: r.creado_en,
        orden: new Date(r.creado_en).getTime(),
        tarjeta: {
          tipo: "mensaje",
          para: r.asunto || "(sin asunto)",
          texto: r.resumen,
          pie: conSugerencia(r.accion_sugerida) ? `Sugerencia: ${r.accion_sugerida}` : undefined,
        },
      }),
    );
  });

  conversaciones.slice(0, 8).forEach((c) => {
    const ids = integrantes(c);
    const grupo = ids.length > 1;
    eventos.push({
      id: `conv-${c.id}`,
      agente: ids[0],
      con: grupo ? ids[1] : undefined,
      verbo: grupo
        ? `y ${ids.length === 2 ? AGENTE_POR_ID[ids[1]].nombre : `${ids.length - 1} agentes más`} trabajaron contigo en`
        : "habló contigo sobre",
      objeto: grupo ? c.tema || nombresAgentes(ids) : c.titulo,
      fecha: c.actualizado_en,
      orden: new Date(c.actualizado_en).getTime(),
      accion: { etiqueta: "Abrir la conversación", href: `/panel/chat?c=${encodeURIComponent(c.id)}` },
    });
  });

  return eventos.sort((a, b) => b.orden - a.orden).slice(0, 10);
}

/**
 * El inicio del panel con DATOS REALES, calco del home de GitHub: la
 * bienvenida, la caja para pedirle algo a tu equipo (lleva al chat real con
 * el texto ya escrito), los atajos, "Conoce a tu equipo", "Primeros pasos"
 * (con lo que de verdad ya hiciste) y la actividad reciente.
 */
export function ResumenPanel({
  nombre,
  planId,
  activos,
  conGoogle,
  conversaciones,
  resumenes,
}: {
  nombre?: string;
  planId: IdPlan;
  activos: IdAgente[];
  conGoogle: boolean;
  conversaciones: ConversacionReal[];
  resumenes: ResumenReal[];
}) {
  const ahora = useAhora();
  const router = useRouter();
  const plan = PLAN_POR_ID[planId];
  const [equipoAbierto, cerrarEquipo] = useCerrable("atendel-panel-equipo-cerrado");
  const eventos = actividadReal(resumenes, conversaciones).slice(0, 6);
  const equipo: IdAgente[] = activos.length ? activos : ["clara"];
  const primero = AGENTE_POR_ID[equipo[0]];

  const opciones: OpcionPedido[] = [
    ...(equipo.length > 1 ? [{ id: "equipo", nombre: "Todos los agentes", detalle: `Empieza ${primero.nombre}`, agentes: equipo }] : []),
    ...equipo.map((id) => ({ id, nombre: AGENTE_POR_ID[id].nombre, detalle: AGENTE_POR_ID[id].area, agentes: [id] })),
  ];
  const modos: ModoPedido[] = [
    { id: "pedir", etiqueta: "Pedir", icono: "mensaje", texto: "" },
    ...(activos.includes("lola") ? [{ id: "cita", etiqueta: "Agendar cita", icono: "calendario" as const, texto: "Agenda una cita para ", opcion: "lola" }] : []),
    ...(activos.includes("clara") ? [{ id: "correo", etiqueta: "Resumir un correo", icono: "correo" as const, texto: "Resume este correo: ", opcion: "clara" }] : []),
    ...(activos.includes("victor") ? [{ id: "clientes", etiqueta: "Escribir a clientes", icono: "clientes" as const, texto: "Escribe un mensaje para ", opcion: "victor" }] : []),
    ...(activos.includes("iris") ? [{ id: "reporte", etiqueta: "Preparar un reporte", icono: "documento" as const, texto: "Prepara un reporte de ", opcion: "iris" }] : []),
  ];
  const atajos: Atajo[] = [
    activos.includes("lola")
      ? { id: "cita", etiqueta: "Agendar cita", icono: "calendario", modo: "cita" }
      : { id: "cita", etiqueta: "Agendar cita", icono: "calendario", href: "/panel/agentes#agente-lola" },
    { id: "correo", etiqueta: "Resumir un correo", icono: "correo", href: "/panel?vista=correo" },
    ...(plan.id !== "free" && activos.length > 1 ? [{ id: "grupo", etiqueta: "Nuevo grupo", icono: "usuarios" as const, href: "/panel/chat" }] : []),
    {
      id: "citas",
      etiqueta: "Ver citas",
      icono: "reloj",
      menu: [
        { tipo: "titulo", etiqueta: "Tus citas" },
        { id: "pronto", etiqueta: "Las llevará Lola", descripcion: "Aquí verás las de mañana", icono: "calendario", pronto: true },
      ],
    },
  ];

  return (
    <div className="dash-pagina dash-inicio-pagina">
      <Inicio
        titulo={nombre ? `Te damos la bienvenida, ${nombre}` : "Te damos la bienvenida a Atendel"}
        opciones={opciones}
        modos={modos}
        alPedir={(texto, id) => router.push(`/panel/chat?${id === "equipo" ? "" : `agente=${id}&`}pide=${encodeURIComponent(texto)}`)}
        atajos={atajos}
      />

      {equipoAbierto ? (
        <TarjetaEquipo
          texto={`Con ${plan.nombre} trabajan ${nombresAgentes(equipo)}. Toca a uno para escribirle.`}
          agentes={IDS_AGENTES.map((id) =>
            activos.includes(id)
              ? { id, href: `/panel/chat?agente=${id}` }
              : { id, href: `/panel/agentes#agente-${id}`, nota: plan.agentes.includes(id) ? "Fuera de tu equipo" : `Con ${planMinimo(id).nombre}`, apagado: true },
          )}
          alCerrar={cerrarEquipo}
        />
      ) : null}

      <PrimerosPasos
        pasos={[
          { id: "correo", titulo: "Conecta tu correo", detalle: "Clara lee tu Gmail. Solo lectura.", listo: conGoogle, boton: "Conectar", href: "/panel?vista=correo#gmail" },
          { id: "equipo", titulo: "Elige tu equipo", detalle: nombresAgentes(equipo), listo: activos.length > 0, boton: "Elegir", href: "/panel/agentes" },
          { id: "chat", titulo: "Prueba el chat", detalle: "Pídele algo a un agente.", listo: conversaciones.length > 0, boton: "Abrir el chat", href: "/panel/chat" },
        ]}
      />

      <ActividadReciente
        eventos={eventos}
        ahora={ahora}
        accion={eventos.length ? <EnlaceMas accion={{ href: "/panel?vista=actividad" }}>Ver todo</EnlaceMas> : undefined}
        vacio={<Vacio agente="clara" titulo="Aquí verás lo que hace tu equipo" texto="Cada correo que Clara resuma y cada conversación aparece aquí." />}
      />
    </div>
  );
}

/** Actividad (como "Feed"): todo lo que pasó, con el detalle, y lo que espera tu visto bueno. */
export function ActividadPanel({ conversaciones, resumenes }: { conversaciones: ConversacionReal[]; resumenes: ResumenReal[] }) {
  const ahora = useAhora();
  const eventos = actividadReal(resumenes, conversaciones);
  return (
    <div className="dash-pagina dash-vista dash-inicio-pagina">
      <header className="dash-vista__cabeza">
        <h1 className="t-app-titulo-grande">Actividad</h1>
      </header>
      <section className="dash-actividad" aria-label="Actividad de tu equipo">
        <Pestanas
          etiqueta="Actividad de tu equipo"
          alineacion="izquierda"
          classNamePanel="dash-actividad__panel"
          pestanas={[
            {
              id: "actividad",
              etiqueta: "Todo",
              contenido: eventos.length ? (
                <LineaTiempo eventos={eventos} ahora={ahora} />
              ) : (
                <Vacio agente="clara" titulo="Aquí verás lo que hace tu equipo" texto="Cada correo que Clara resuma y cada conversación aparece aquí, con la hora." />
              ),
            },
            {
              id: "visto-bueno",
              etiqueta: "Espera tu visto bueno",
              contenido: <Vacio icono="check-circulo" titulo="Nada espera tu visto bueno" texto="Lo que salga a tu nombre aparecerá aquí antes de enviarse." />,
            },
          ]}
        />
      </section>
    </div>
  );
}
