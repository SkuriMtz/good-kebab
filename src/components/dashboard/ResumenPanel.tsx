"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AGENTE_POR_ID, IDS_AGENTES, esIdAgente, type IdAgente } from "@/lib/agentes";
import { cambio, diaLocal, hayDatos, horaLocal, partirRemitente, type DatosEstadisticas } from "@/lib/estadisticas";
import type { CorreoPendiente } from "@/lib/pendientes";
import type { PasoPanel } from "@/lib/pasos";
import { PLAN_POR_ID, planMinimo, type IdPlan } from "@/lib/planes";
import { VistaAjustes } from "./Ajustes";
import { Inicio, LineaTiempo, type Atajo, type ModoPedido, type OpcionPedido } from "./Centro";
import { rangoHora } from "./estadisticas/formato";
import { nombresAgentes } from "./nombres";
import { VistaPendientes, type FiltroPendientes, type GrupoPendientes } from "./Pendientes";
import { Accionable, Vacio } from "./Piezas";
import { Icono } from "@/components/base/Iconos";
import { ResumenVista, coincideAccion, type AgenteResumen, type FilaPendiente } from "./Resumen";
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

/** Igual que en src/lib/pendientes.ts: no vacía y que no empiece con "ninguna". */
const conSugerencia = (accion: string | null) => Boolean(accion && accion.trim() && !accion.trim().toLowerCase().startsWith("ninguna"));

/** "Andrea Solís <andrea@…>" → "Andrea Solís" (el mismo nombre que usan Estadísticas y el filtro de Correo). */
const nombreRemitente = (r: string | null) => partirRemitente(r)?.nombre ?? "Sin remitente";

/** Correo de ese remitente, con su historial filtrado. */
const correoDe = (quien: string) => `/panel?vista=correo&de=${encodeURIComponent(quien)}#historial`;

function integrantes(c: ConversacionReal): IdAgente[] {
  const p = (c.participantes ?? []).filter(esIdAgente);
  if (p.length >= 2) return p;
  return esIdAgente(c.agente) ? [c.agente] : ["clara"];
}

/** Arma la línea de tiempo con lo que de verdad pasó: correos que Clara resumió y conversaciones con tu equipo. */
function actividadReal(resumenes: ResumenReal[], conversaciones: ConversacionReal[], tope = 10): Evento[] {
  const eventos: (Evento & { orden: number })[] = [];

  // Los resúmenes del mismo día van juntos si son más de dos (como "resumió 5 correos")
  const porDia = new Map<string, ResumenReal[]>();
  resumenes.forEach((r) => {
    // El día en la hora de México (el servidor corre en UTC)
    const dia = diaLocal(r.creado_en);
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

  conversaciones.slice(0, Math.max(8, tope)).forEach((c) => {
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

  return eventos.sort((a, b) => b.orden - a.orden).slice(0, tope);
}

type Comun = {
  planId: IdPlan;
  activos: IdAgente[];
  conGoogle: boolean;
  /** Lo que espera algo de ti, contado en el servidor (src/lib/pendientes.ts). */
  pendientes: { correos: number | null; lista: CorreoPendiente[]; pasos: PasoPanel[]; total: number | null };
};

/** Las filas de pendientes: correos con una acción sugerida y los primeros pasos que faltan. */
function filasPendientes({ pendientes, activos }: Comun) {
  const correos: FilaPendiente[] = pendientes.lista.map((r) => {
    const quien = nombreRemitente(r.remitente);
    return {
      id: `correo-${r.id}`,
      tipo: "Correo",
      titulo: r.asunto || "(sin asunto)",
      detalle: `${quien} · Clara sugiere: ${r.accion_sugerida}`,
      quien,
      accion: r.accion_sugerida,
      fecha: r.creado_en,
      href: correoDe(quien),
    };
  });
  const pasos: FilaPendiente[] = pendientes.pasos.map((p) => ({
    id: `paso-${p.id}`,
    tipo: "Primer paso",
    titulo: p.titulo,
    detalle: p.detalle,
    agente: p.id === "gmail" ? "clara" : activos[0],
    href: p.href,
  }));
  return { correos, pasos };
}

/**
 * El inicio del panel con DATOS REALES: el nombre del negocio, la caja para
 * pedirle algo a tu equipo (lleva al chat real con el texto ya escrito),
 * los agentes con lo que hicieron esta semana, los pendientes y las
 * estadísticas en pequeño. Sin datos: "—" y estados vacíos.
 */
/** Estadísticas en 7 días, con esa métrica (y ese agente). */
const aEstadisticas = (metrica: string, agente?: IdAgente) => `/panel?vista=estadisticas&periodo=7d&metrica=${metrica}${agente ? `&agente=${agente}` : ""}`;

export function ResumenPanel({ nombre, negocio, usados, est, ...comun }: Comun & { nombre?: string; negocio: string; usados: number; /** Las estadísticas de 7 días (las mismas que en su vista). null si no se pudieron leer. */ est: DatosEstadisticas | null }) {
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

  // Lo que hizo cada agente en 7 días: lo mismo que cuenta Estadísticas
  const conDatos = est !== null && hayDatos(est);
  const porAgente = (id: IdAgente) => (conDatos ? (est?.porAgente.find((f) => f.agente === id)?.mensajes ?? 0) : null);
  const agentes: AgenteResumen[] = IDS_AGENTES.map((id) => {
    const href = `/panel/agentes?agente=${id}`;
    if (!plan.agentes.includes(id)) return { id, href, estado: { tono: "neutro", etiqueta: "No incluido" }, cifra: null, unidad: "", bloqueado: `Con ${planMinimo(id).nombre}` };
    if (!activos.includes(id)) return { id, href, estado: { tono: "neutro", etiqueta: "Fuera de tu equipo" }, cifra: porAgente(id), unidad: "mensajes en 7 días" };
    const etiqueta = id === "clara" ? (conGoogle ? "Conectada a tu Gmail" : "Lista para leer correos") : "Lista en el chat";
    return { id, href, estado: { tono: "exito", etiqueta }, cifra: porAgente(id), unidad: "mensajes en 7 días" };
  });
  const dato = (id: "mensajes" | "conversaciones" | "correos") => ({
    valor: est ? est.totales[id] : null,
    delta: est ? cambio(est.totales[id], est.totalesAnteriores[id]) : null,
    href: aEstadisticas(id),
  });

  const { correos, pasos } = filasPendientes(comun);
  const filas = [...correos, ...pasos].slice(0, 5);
  const total = comun.pendientes.total;
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
        total,
        filas,
        accion: { href: "/panel?vista=pendientes" },
        vacio: <Vacio agente="clara" titulo="Todo al día" texto="Cuando Clara resuma un correo que pida algo, aparece aquí." compacto />,
      }}
      estadisticas={{
        periodo: "7 días contra los 7 anteriores",
        accion: { href: "/panel?vista=estadisticas&periodo=7d" },
        uso: { usados, limite: plan.mensajesMes, plan: `${plan.nombre} · este mes`, href: "/panel?vista=estadisticas&periodo=mes&metrica=uso" },
        cifras: [
          { id: "mensajes", etiqueta: "Mensajes", icono: "mensaje", ...dato("mensajes") },
          { id: "conversaciones", etiqueta: "Conversaciones", icono: "conversaciones", ...dato("conversaciones") },
          { id: "correos", etiqueta: "Correos resumidos", icono: "correo", ...dato("correos") },
          { id: "pendientes", etiqueta: "Por revisar", icono: "check-circulo", valor: total, delta: null, href: "/panel?vista=pendientes" },
        ],
      }}
    />
  );
}

/** Pendientes con datos reales, filtrados por tipo (?tipo=correos|pasos) o por remitente (?de=). */
export function PendientesPanel({ tipo, de, accion, ...comun }: Comun & { tipo?: string; de?: string; accion?: string }) {
  const ahora = useAhora();
  const { correos, pasos } = filasPendientes(comun);
  const totalCorreos = comun.pendientes.correos ?? correos.length;
  const filtrado = Boolean(de || accion);
  const correosDe = correos.filter((c) => (!de || c.quien === de) && (!accion || coincideAccion(c.accion, accion)));

  // Correos agrupados por quién los mandó
  const porRemitente = new Map<string, FilaPendiente[]>();
  correosDe.forEach((c) => porRemitente.set(c.quien ?? "", [...(porRemitente.get(c.quien ?? "") ?? []), c]));

  const grupos: GrupoPendientes[] = [];
  if (tipo !== "pasos" && correosDe.length) {
    grupos.push({
      id: "correos",
      titulo: "Correos con una acción sugerida",
      agente: "clara",
      // Sin filtro, el total exacto (aunque solo se listen los más recientes)
      total: filtrado ? correosDe.length : totalCorreos,
      subgrupos: [...porRemitente.entries()].map(([quien, filas]) => ({
        id: quien,
        titulo: quien,
        filas: filas.map((f) => ({ ...f, detalle: f.detalle?.replace(`${quien} · `, "") })),
      })),
      nota: totalCorreos > correos.length ? `Se ven los ${correos.length} más recientes de ${totalCorreos}.` : undefined,
    });
  }
  if (tipo !== "correos" && !filtrado && pasos.length) {
    grupos.push({ id: "pasos", titulo: "Primeros pasos que faltan", icono: "check-circulo", total: pasos.length, filas: pasos });
  }

  const base = "/panel?vista=pendientes";
  const filtros: FiltroPendientes[] = [
    { id: "todos", etiqueta: "Todos", cuenta: comun.pendientes.total ?? undefined, href: base, actual: !tipo && !filtrado },
    { id: "correos", etiqueta: "Correos", cuenta: totalCorreos, href: `${base}&tipo=correos`, actual: tipo === "correos" && !filtrado },
    { id: "pasos", etiqueta: "Primeros pasos", cuenta: pasos.length, href: `${base}&tipo=pasos`, actual: tipo === "pasos" && !filtrado },
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
      total={filtrado ? correosDe.length : tipo === "correos" ? totalCorreos : tipo === "pasos" ? pasos.length : comun.pendientes.total}
      quitarFiltros={[
        ...(de ? [{ etiqueta: `De: ${de}`, href: accion ? `${base}&tipo=correos&accion=${encodeURIComponent(accion)}` : base }] : []),
        ...(accion ? [{ etiqueta: `Acción: ${accion}`, href: de ? `${base}&de=${encodeURIComponent(de)}` : `${base}&tipo=correos` }] : []),
      ]}
      vacio={
        de || accion ? (
          <Vacio
            icono="correo"
            titulo={accion ? `Ningún correo reciente pide «${accion}»` : `Ningún correo de ${de} espera algo de ti`}
            texto="Aquí se ven los correos más recientes que traen una acción sugerida."
            accion={
              <Link href={`${base}&tipo=correos`} className="dash-enlace">
                Ver todos los correos pendientes
              </Link>
            }
          />
        ) : undefined
      }
      ahora={ahora}
      actividad={{ href: "/panel?vista=actividad" }}
    />
  );
}

const fechaDia = new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
/** "2026-11-04" → "miércoles 4 de noviembre". */
const nombreDia = (dia: string) => fechaDia.format(new Date(`${dia}T12:00:00Z`));

/**
 * Actividad (como "Feed"): lo último que pasó, con el detalle. Filtros en
 * la dirección (desde Estadísticas o los botones de arriba): &agente=,
 * &hora= (0–23) y &dia= (AAAA-MM-DD), en la hora de México.
 */
export function ActividadPanel({
  conversaciones,
  resumenes,
  hora,
  dia,
  agente,
}: {
  conversaciones: ConversacionReal[];
  resumenes: ResumenReal[];
  hora?: number;
  dia?: string;
  agente?: IdAgente;
}) {
  const ahora = useAhora();
  const filtrado = Boolean(agente || hora !== undefined || dia);
  // Con filtro se mira todo lo que llegó y se queda lo que toca (hasta 50)
  const todos = actividadReal(resumenes, conversaciones, filtrado ? 1000 : 10);
  const eventos = todos.filter(
    (e) =>
      (!agente || e.agente === agente || e.con === agente) &&
      (hora === undefined || (e.fecha && horaLocal(e.fecha) === hora)) &&
      (!dia || (e.fecha && diaLocal(e.fecha) === dia)),
  ).slice(0, 50);
  const enlace = (cambio: { agente?: IdAgente | null; hora?: number | null; dia?: string | null }) => {
    const q = new URLSearchParams({ vista: "actividad" });
    const ag = cambio.agente === undefined ? agente : cambio.agente;
    const h = cambio.hora === undefined ? hora : cambio.hora;
    const d = cambio.dia === undefined ? dia : cambio.dia;
    if (ag) q.set("agente", ag);
    if (h !== undefined && h !== null) q.set("hora", String(h));
    if (d) q.set("dia", d);
    return `/panel?${q}`;
  };
  return (
    <div className="pnl-pagina">
      <header className="pnl-vista__cabeza">
        <h1 className="pnl-vista__titulo">Actividad</h1>
      </header>
      <div className="pnl-filtros" role="group" aria-label="Filtrar la actividad">
        <Link href={enlace({ agente: null })} className={`pnl-filtro pnl-picable${agente ? "" : " pnl-filtro--actual"}`} aria-current={agente ? undefined : "page"}>
          Todo el equipo
        </Link>
        {IDS_AGENTES.map((id) => (
          <Link key={id} href={enlace({ agente: id })} className={`pnl-filtro pnl-picable${agente === id ? " pnl-filtro--actual" : ""}`} aria-current={agente === id ? "page" : undefined}>
            {AGENTE_POR_ID[id].nombre}
          </Link>
        ))}
        {hora !== undefined ? (
          <Accionable accion={{ href: enlace({ hora: null }) }} className="pnl-filtro pnl-filtro--quitar pnl-picable" etiqueta={`Quitar el filtro: de ${rangoHora(hora)}`}>
            De {rangoHora(hora)}
            <Icono nombre="cerrar" tam={16} />
          </Accionable>
        ) : null}
        {dia ? (
          <Accionable accion={{ href: enlace({ dia: null }) }} className="pnl-filtro pnl-filtro--quitar pnl-picable" etiqueta={`Quitar el filtro: ${nombreDia(dia)}`}>
            {nombreDia(dia)}
            <Icono nombre="cerrar" tam={16} />
          </Accionable>
        ) : null}
      </div>
      <section className="pnl-tarjeta dash-actividad" aria-label="Actividad de tu equipo">
        {eventos.length ? (
          <LineaTiempo eventos={eventos} ahora={ahora} />
        ) : filtrado ? (
          <Vacio
            icono="reloj"
            titulo="Nada con ese filtro en lo más reciente"
            texto="Aquí se ven las últimas conversaciones y los últimos correos resumidos."
            accion={
              <Link href="/panel?vista=actividad" className="dash-enlace">
                Ver toda la actividad
              </Link>
            }
          />
        ) : (
          <Vacio agente="clara" titulo="Aquí verás lo que hace tu equipo" texto="Cada correo que Clara resuma y cada conversación aparece aquí, con la hora." />
        )}
      </section>
    </div>
  );
}

/** Ajustes con los datos de la cuenta (el plan solo se ve: para cambiarlo, los planes o escribirnos). */
export function AjustesPanel({ planId, usados, conGoogle }: { planId: IdPlan; usados: number; conGoogle: boolean }) {
  return (
    <VistaAjustes
      plan={PLAN_POR_ID[planId]}
      usados={usados}
      conGmail={conGoogle}
      gmail={{ href: conGoogle ? "/panel?vista=correo" : "/panel?vista=correo#gmail" }}
      equipo={{ href: "/panel/agentes" }}
      planes={{ href: "/precios" }}
    />
  );
}
