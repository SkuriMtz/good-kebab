"use client";

import { useRouter } from "next/navigation";
import { Pestanas } from "@/components/base/Pestanas";
import { AGENTE_POR_ID, IDS_AGENTES, esIdAgente, type IdAgente } from "@/lib/agentes";
import { PLAN_POR_ID, planMinimo, type IdPlan } from "@/lib/planes";
import { pasosPanel } from "./ArmazonPanel";
import { Inicio, LineaTiempo, type Atajo, type ModoPedido, type OpcionPedido } from "./Centro";
import { nombresAgentes } from "./nombres";
import { VistaPendientes, type FiltroPendientes, type GrupoPendientes } from "./Pendientes";
import { Vacio } from "./Piezas";
import { ResumenVista, type AgenteResumen, type FilaPendiente } from "./Resumen";
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

/** Cuentas reales para el inicio: [últimos 7 días, los 7 anteriores]. null = no se pudo leer. */
export type CuentasResumen = {
  /** Conversaciones de los últimos 7 días (para lo que hizo cada agente). */
  semana: { agente: string; participantes: string[] | null }[] | null;
  mensajes: [number | null, number | null];
  nuevas: [number | null, number | null];
  correos: [number | null, number | null];
};

const conSugerencia = (accion: string | null) => Boolean(accion && accion.trim().toLowerCase().replace(/\.$/, "") !== "ninguna");

/** "Andrea Solís <andrea@…>" → "Andrea Solís". */
const nombreRemitente = (r: string | null) => (r ? r.replace(/<.*>/, "").replace(/"/g, "").trim() || r : "Sin remitente");

/** Cambio en % contra el periodo anterior; sin periodo anterior (o en cero), null: se ve "—". */
const cambio = ([actual, antes]: [number | null, number | null]) => (actual === null || antes === null || antes === 0 ? null : ((actual - antes) / antes) * 100);

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
        objeto: r.remitente ? `de ${nombreRemitente(r.remitente)}` : undefined,
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

type Comun = {
  planId: IdPlan;
  activos: IdAgente[];
  conGoogle: boolean;
  conversaciones: ConversacionReal[];
  resumenes: ResumenReal[];
  conGrupo: boolean;
};

/** Lo que espera algo de ti, con datos reales: correos con una acción sugerida y los primeros pasos que faltan. */
function pendientesReales({ planId, activos, conGoogle, conversaciones, resumenes, conGrupo }: Comun) {
  const correos: FilaPendiente[] = resumenes
    .filter((r) => conSugerencia(r.accion_sugerida))
    .map((r) => ({
      id: `correo-${r.id}`,
      tipo: "Correo",
      titulo: r.asunto || "(sin asunto)",
      detalle: `${nombreRemitente(r.remitente)} · Clara sugiere: ${r.accion_sugerida}`,
      quien: nombreRemitente(r.remitente),
      fecha: r.creado_en,
      href: "/panel?vista=correo#historial",
    }));
  const pasos: FilaPendiente[] = pasosPanel({ activos, conGoogle, conConversaciones: conversaciones.length > 0, conGrupo, conGrupos: planId !== "free" })
    .filter((p) => !p.listo)
    .map((p) => ({ id: `paso-${p.id}`, tipo: "Primer paso", titulo: p.titulo, detalle: p.detalle, agente: p.id === "gmail" ? "clara" : activos[0], href: p.href }));
  return { correos, pasos };
}

/**
 * El inicio del panel con DATOS REALES: el nombre del negocio, la caja para
 * pedirle algo a tu equipo (lleva al chat real con el texto ya escrito),
 * los agentes con lo que hicieron esta semana, los pendientes y las
 * estadísticas en pequeño. Sin datos: "—" y estados vacíos.
 */
export function ResumenPanel({ nombre, negocio, usados, cuentas, ...comun }: Comun & { nombre?: string; negocio: string; usados: number; cuentas: CuentasResumen }) {
  const { planId, activos, conGoogle } = comun;
  const ahora = useAhora();
  const router = useRouter();
  const plan = PLAN_POR_ID[planId];
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
      : { id: "cita", etiqueta: "Agendar cita", icono: "calendario", href: "/panel/agentes?agente=lola" },
    { id: "correo", etiqueta: "Resumir un correo", icono: "correo", href: "/panel?vista=correo" },
    ...(plan.id !== "free" && activos.length > 1 ? [{ id: "grupo", etiqueta: "Nuevo grupo", icono: "usuarios" as const, href: "/panel/chat" }] : []),
  ];

  // Lo que hizo cada agente esta semana (conversaciones; Clara, correos resumidos)
  const porAgente = (id: IdAgente) =>
    cuentas.semana === null ? null : cuentas.semana.filter((c) => c.agente === id || (c.participantes ?? []).includes(id)).length;
  const agentes: AgenteResumen[] = IDS_AGENTES.map((id) => {
    const href = `/panel/agentes?agente=${id}`;
    if (!plan.agentes.includes(id)) return { id, href, estado: { tono: "neutro", etiqueta: "No incluido" }, cifra: null, unidad: "", bloqueado: `Con ${planMinimo(id).nombre}` };
    if (!activos.includes(id)) return { id, href, estado: { tono: "neutro", etiqueta: "Fuera de tu equipo" }, cifra: null, unidad: "conversaciones esta semana" };
    if (id === "clara") {
      return { id, href, estado: { tono: "exito", etiqueta: conGoogle ? "Conectada a tu Gmail" : "Lista para leer correos" }, cifra: cuentas.correos[0], unidad: "correos resumidos esta semana" };
    }
    return { id, href, estado: { tono: "exito", etiqueta: "Lista en el chat" }, cifra: porAgente(id), unidad: "conversaciones esta semana" };
  });

  const { correos, pasos } = pendientesReales(comun);
  const filas = [...correos, ...pasos].slice(0, 5);
  const titulo = negocio.trim() && negocio !== "tu negocio" ? negocio : "Tu negocio";

  return (
    <ResumenVista
      negocio={titulo}
      nombre={nombre}
      ahora={ahora}
      aviso={{
        clave: "atendel-panel-aviso-estadisticas",
        texto: "Nuevo en tu panel: las estadísticas de tu equipo. Mira cuántos mensajes contestó cada agente y cuántos correos resumió Clara.",
        accion: { etiqueta: "Ver estadísticas", href: "/panel?vista=estadisticas" },
      }}
      pedido={
        <Inicio
          sinTitulo
          titulo="Pregúntale a tu equipo"
          placeholder="Pregúntale a tu equipo… o escribe @ para elegir agente"
          opciones={opciones}
          modos={modos}
          alPedir={(texto, id) => router.push(`/panel/chat?${id === "equipo" ? "" : `agente=${id}&`}pide=${encodeURIComponent(texto)}`)}
          atajos={atajos}
        />
      }
      agentes={agentes}
      verAgentes={{ href: "/panel/agentes" }}
      pendientes={{
        total: correos.length + pasos.length,
        filas,
        accion: { href: "/panel?vista=pendientes" },
        vacio: <Vacio agente="clara" titulo="Todo al día" texto="Cuando Clara resuma un correo que pida algo, aparece aquí." compacto />,
      }}
      estadisticas={{
        periodo: "Últimos 7 días contra los 7 anteriores",
        accion: { href: "/panel?vista=estadisticas" },
        uso: { usados, limite: plan.mensajesMes, plan: plan.nombre, href: "/panel/agentes#plan" },
        cifras: [
          { id: "mensajes", etiqueta: "Mensajes en el chat", icono: "mensaje", valor: cuentas.mensajes[0], delta: cambio(cuentas.mensajes), href: "/panel?vista=estadisticas" },
          { id: "conversaciones", etiqueta: "Conversaciones nuevas", icono: "conversaciones", valor: cuentas.nuevas[0], delta: cambio(cuentas.nuevas), href: "/panel?vista=estadisticas" },
          { id: "correos", etiqueta: "Correos resumidos", icono: "correo", valor: cuentas.correos[0], delta: cambio(cuentas.correos), href: "/panel?vista=estadisticas" },
          { id: "pendientes", etiqueta: "Por revisar", icono: "check-circulo", valor: correos.length + pasos.length, href: "/panel?vista=pendientes" },
        ],
      }}
    />
  );
}

/** Pendientes con datos reales, filtrados por tipo (?tipo=correos|pasos) o por remitente (?de=). */
export function PendientesPanel({ tipo, de, ...comun }: Comun & { tipo?: string; de?: string }) {
  const ahora = useAhora();
  const { correos, pasos } = pendientesReales(comun);
  const correosDe = de ? correos.filter((c) => c.quien === de) : correos;

  // Correos agrupados por quién los mandó
  const porRemitente = new Map<string, FilaPendiente[]>();
  correosDe.forEach((c) => porRemitente.set(c.quien ?? "", [...(porRemitente.get(c.quien ?? "") ?? []), c]));

  const grupos: GrupoPendientes[] = [];
  if (tipo !== "pasos" && correosDe.length) {
    grupos.push({
      id: "correos",
      titulo: "Correos con una acción sugerida",
      agente: "clara",
      total: correosDe.length,
      subgrupos: [...porRemitente.entries()].map(([quien, filas]) => ({
        id: quien,
        titulo: quien,
        filas: filas.map((f) => ({ ...f, detalle: f.detalle?.replace(`${quien} · `, "") })),
      })),
    });
  }
  if (tipo !== "correos" && !de && pasos.length) {
    grupos.push({ id: "pasos", titulo: "Primeros pasos que faltan", icono: "check-circulo", total: pasos.length, filas: pasos });
  }

  const base = "/panel?vista=pendientes";
  const filtros: FiltroPendientes[] = [
    { id: "todos", etiqueta: "Todos", cuenta: correos.length + pasos.length, href: base, actual: !tipo && !de },
    { id: "correos", etiqueta: "Correos", cuenta: correos.length, href: `${base}&tipo=correos`, actual: tipo === "correos" && !de },
    { id: "pasos", etiqueta: "Primeros pasos", cuenta: pasos.length, href: `${base}&tipo=pasos`, actual: tipo === "pasos" },
    // Los que más escriben: filtrar por remitente
    ...[...new Set(correos.map((c) => c.quien ?? ""))]
      .filter((q) => q && q !== de)
      .slice(0, 3)
      .map((q) => ({ id: `de-${q}`, etiqueta: q, cuenta: correos.filter((c) => c.quien === q).length, href: `${base}&de=${encodeURIComponent(q)}` })),
  ];

  return (
    <VistaPendientes
      grupos={grupos}
      filtros={filtros}
      quitarFiltro={de ? { etiqueta: `De: ${de}`, href: base } : undefined}
      ahora={ahora}
      actividad={{ href: "/panel?vista=actividad" }}
    />
  );
}

/** Actividad (como "Feed"): todo lo que pasó, con el detalle, y lo que espera tu visto bueno. */
export function ActividadPanel({ conversaciones, resumenes }: { conversaciones: ConversacionReal[]; resumenes: ResumenReal[] }) {
  const ahora = useAhora();
  const eventos = actividadReal(resumenes, conversaciones);
  return (
    <div className="pnl-pagina">
      <header className="pnl-vista__cabeza">
        <h1 className="pnl-vista__titulo">Actividad</h1>
      </header>
      <section className="pnl-tarjeta dash-actividad" aria-label="Actividad de tu equipo">
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
