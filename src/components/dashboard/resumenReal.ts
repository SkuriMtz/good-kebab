import { AGENTE_POR_ID, IDS_AGENTES, esIdAgente, type IdAgente } from "@/lib/agentes";
import { PLAN_POR_ID, planMinimo, type IdPlan } from "@/lib/planes";
import { diaLargo, diaSemana, numero, periodo, rellenar, serie, sumarDias, totalDia } from "./actividad";
import { NOVEDADES } from "./novedades";
import type { ConversacionReciente, DatosResumen, Destacado, DiaActividad, GrupoEventos, Evento, Pendiente, Recomendacion } from "./tipos";

/*
 * Arma el Resumen del panel con los DATOS REALES de la cuenta (lo que ya
 * guarda Atendel: respuestas de los agentes en el chat, correos que Clara
 * resumió, conversaciones, uso del plan). No inventa nada: donde no hay
 * datos, deja el estado vacío que explica qué va ahí y cómo se llena.
 * Las fechas se cuentan en la hora de la Ciudad de México.
 */

export const ZONA = "America/Mexico_City";
const fmtDia = new Intl.DateTimeFormat("en-CA", { timeZone: ZONA, year: "numeric", month: "2-digit", day: "2-digit" });
const fmtHora = new Intl.DateTimeFormat("es-MX", { timeZone: ZONA, hour: "2-digit", minute: "2-digit", hour12: false });
const fmtFechaCorta = new Intl.DateTimeFormat("es-MX", { timeZone: ZONA, day: "numeric", month: "short" });
const fmtMes = new Intl.DateTimeFormat("es-MX", { timeZone: ZONA, month: "long" });

/** Día local (AAAA-MM-DD) de una fecha ISO. */
export const diaLocal = (iso: string) => fmtDia.format(new Date(iso));
/** El lunes de hace 25 semanas: el primer día de la gráfica. */
export const inicioGrafica = (hoy: string) => sumarDias(sumarDias(hoy, -diaSemana(hoy)), -25 * 7);

export type FilaResumenCorreo = {
  id: string;
  remitente: string | null;
  asunto: string | null;
  resumen: string;
  accion_sugerida: string | null;
  creado_en: string;
};
export type FilaConversacion = {
  id: string;
  agente: string;
  titulo: string;
  tema: string | null;
  participantes: string[] | null;
  actualizado_en: string;
};

export type EntradaResumen = {
  ahora: string;
  nombre: string;
  correo: string;
  negocio: string;
  planId: IdPlan;
  activos: IdAgente[];
  usados: number;
  conGoogle: boolean;
  /** Respuestas de los agentes (rol assistant), con el agente ya resuelto. */
  mensajes: { creado_en: string; agente: IdAgente | null }[];
  resumenes: FilaResumenCorreo[];
  conversaciones: FilaConversacion[];
};

const conSugerencia = (a: string | null) => Boolean(a && a.trim().toLowerCase() !== "ninguna");
/** "Laura Méndez <laura@gmail.com>" → "Laura Méndez" */
const soloNombre = (r: string | null) => (r ? r.replace(/<[^>]*>/g, "").replace(/"/g, "").trim() || r : "alguien");
const corto = (t: string, n = 140) => (t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t);
const mayuscula = (t: string) => t.charAt(0).toLocaleUpperCase("es-MX") + t.slice(1);

export function armarResumen(e: EntradaResumen): DatosResumen {
  const plan = PLAN_POR_ID[e.planId];
  const hoy = diaLocal(e.ahora);
  const ayer = sumarDias(hoy, -1);
  const inicio = inicioGrafica(hoy);
  const etiquetaDia = (d: string) => (d === hoy ? "Hoy" : d === ayer ? "Ayer" : mayuscula(diaLargo(d)));

  // Cuentas por día: respuestas de cada agente + correos resumidos (de Clara)
  const cuentas = new Map<string, Partial<Record<IdAgente, number>>>();
  const correosPorDia = new Map<string, Partial<Record<IdAgente, number>>>();
  const sumar = (m: Map<string, Partial<Record<IdAgente, number>>>, dia: string, id: IdAgente) => {
    const p = m.get(dia) ?? {};
    p[id] = (p[id] ?? 0) + 1;
    m.set(dia, p);
  };
  for (const m of e.mensajes) {
    const d = diaLocal(m.creado_en);
    if (d < inicio || d > hoy || !m.agente) continue;
    sumar(cuentas, d, m.agente);
  }
  for (const r of e.resumenes) {
    const d = diaLocal(r.creado_en);
    if (d < inicio || d > hoy) continue;
    sumar(cuentas, d, "clara");
    sumar(correosPorDia, d, "clara");
  }
  const dias: DiaActividad[] = rellenar(inicio, hoy, cuentas);
  const diasCorreo: DiaActividad[] = rellenar(inicio, hoy, correosPorDia);
  const respuestasHoy = e.mensajes.filter((m) => diaLocal(m.creado_en) === hoy).length;
  const correosHoy = totalDia(diasCorreo[diasCorreo.length - 1], "todos");
  const hayAlgo = dias.some((d) => totalDia(d, "todos") > 0);

  /* Bienvenida */
  const partes: string[] = [];
  if (respuestasHoy) partes.push(`tus agentes contestaron ${numero(respuestasHoy)} ${respuestasHoy === 1 ? "mensaje" : "mensajes"} en el chat`);
  if (correosHoy) partes.push(`Clara resumió ${numero(correosHoy)} ${correosHoy === 1 ? "correo" : "correos"}`);
  const resumenHoy = partes.length
    ? `Hoy ${partes.join(" y ")}.`
    : hayAlgo
      ? "Hoy tu equipo todavía no ha trabajado. Escríbele a un agente o pega un correo para que Clara lo resuma."
      : "Aquí vas a ver lo que hace tu equipo cada día. Empieza con Clara: pega un correo y te dice de qué trata y qué conviene hacer.";

  const mes = fmtMes.format(new Date(e.ahora));
  const siguiente = new Date(new Date(e.ahora).getTime() + 32 * 86_400_000);
  const mesSiguiente = fmtMes.format(siguiente);

  /* Agentes fijados (los cuatro; los que el plan no trae, con candado) */
  const fijados = IDS_AGENTES.map((id) => {
    const a = AGENTE_POR_ID[id];
    if (!plan.agentes.includes(id)) {
      return {
        id,
        estado: { tono: "neutro" as const, texto: "No incluido" },
        descripcion: a.lema,
        bloqueado: `Con ${planMinimo(id).nombre}`,
        accion: { etiqueta: "Ver planes", href: "/precios" },
      };
    }
    const activo = e.activos.includes(id);
    const p = periodo(dias, id, 30);
    const correos30 = id === "clara" ? periodo(diasCorreo, "clara", 30).actual : 0;
    return {
      id,
      estado: activo
        ? { tono: "exito" as const, texto: id === "clara" && e.conGoogle ? "Conectada a tu Gmail" : "Disponible" }
        : { tono: "neutro" as const, texto: "Fuera de tu equipo" },
      descripcion: a.lema,
      cifra: { valor: p.actual, etiqueta: id === "clara" ? "tareas en 30 días" : "respuestas en 30 días" },
      secundaria: id === "clara" ? `${numero(correos30)} ${correos30 === 1 ? "correo resumido" : "correos resumidos"}` : undefined,
      serie: serie(dias, id, 30),
      accion: activo ? { etiqueta: `Hablar con ${a.nombre}`, href: `/panel/chat?agente=${id}` } : { etiqueta: "Tu equipo", href: "/panel/agentes" },
    };
  });

  /* Línea de tiempo: correos resumidos y conversaciones, lo más nuevo arriba */
  type Crudo = { cuando: string; evento: Evento };
  const crudos: Crudo[] = [
    ...e.resumenes.slice(0, 12).map((r) => ({
      cuando: r.creado_en,
      evento: {
        id: `r-${r.id}`,
        agente: "clara" as IdAgente,
        texto: `resumió el correo de ${soloNombre(r.remitente)}`,
        detalle: corto(`${r.asunto ? `«${r.asunto}»: ` : ""}${r.resumen}`),
        hora: fmtHora.format(new Date(r.creado_en)),
        insignia: conSugerencia(r.accion_sugerida) ? { tono: "azul" as const, texto: "Sugiere qué hacer" } : undefined,
        accion: { etiqueta: "Ver en Correo", href: "/panel?vista=correo#historial" },
      },
    })),
    ...e.conversaciones.slice(0, 8).map((c) => {
      const ids = (c.participantes ?? []).filter(esIdAgente);
      const quien: IdAgente = ids[0] ?? (esIdAgente(c.agente) ? c.agente : "clara");
      const otros = ids.slice(1).map((id) => AGENTE_POR_ID[id].nombre);
      return {
        cuando: c.actualizado_en,
        evento: {
          id: `c-${c.id}`,
          agente: quien,
          texto: otros.length ? `y ${otros.join(" y ")} trabajaron contigo en «${c.tema || c.titulo}»` : `trabajó contigo en «${c.titulo}»`,
          hora: fmtHora.format(new Date(c.actualizado_en)),
          accion: { etiqueta: "Abrir", href: `/panel/chat?c=${c.id}` },
        },
      };
    }),
  ]
    .sort((x, y) => (x.cuando < y.cuando ? 1 : -1))
    .slice(0, 12);
  const eventos: GrupoEventos[] = [];
  for (const c of crudos) {
    const d = etiquetaDia(diaLocal(c.cuando));
    const g = eventos[eventos.length - 1];
    if (g && g.dia === d) g.eventos.push(c.evento);
    else eventos.push({ dia: d, eventos: [c.evento] });
  }

  /* Por atender: lo que Clara sugirió hacer en los últimos 14 días */
  const hace14 = sumarDias(hoy, -14);
  const pendientes: Pendiente[] = e.resumenes
    .filter((r) => conSugerencia(r.accion_sugerida) && diaLocal(r.creado_en) >= hace14)
    .slice(0, 5)
    .map((r) => ({
      id: r.id,
      agente: "clara",
      titulo: r.asunto || "Correo sin asunto",
      cita: r.accion_sugerida ?? "",
      detalle: `Correo de ${soloNombre(r.remitente)} · ${fmtFechaCorta.format(new Date(r.creado_en)).replace(".", "")}`,
      revisar: { etiqueta: "Ver el resumen", href: "/panel?vista=correo#historial" },
    }));

  /* Destacados: solo cifras que salen de tus datos */
  const destacados: Destacado[] = [];
  if (hayAlgo) {
    const mejor = dias.reduce((m, d) => (totalDia(d, "todos") > totalDia(m, "todos") ? d : m), dias[0]);
    destacados.push({ id: "d-dia", cifra: numero(totalDia(mejor, "todos")), texto: "tareas en tu día con más trabajo", detalle: mayuscula(diaLargo(mejor.fecha)) });
    const porAgente = plan.agentes.map((id) => ({ id, n: periodo(dias, id, 30).actual })).sort((a, b) => b.n - a.n);
    if (porAgente[0]?.n) {
      destacados.push({
        id: "d-agente",
        agente: porAgente[0].id,
        cifra: numero(porAgente[0].n),
        texto: `tareas de ${AGENTE_POR_ID[porAgente[0].id].nombre} en 30 días`,
        detalle: "Quien más trabajó en tu equipo",
      });
    }
    const correosTotal = diasCorreo.reduce((s, d) => s + totalDia(d, "todos"), 0);
    if (correosTotal) destacados.push({ id: "d-correos", agente: "clara", cifra: numero(correosTotal), texto: "correos resumidos en 26 semanas" });
  }
  destacados.push({ id: "d-uso", cifra: numero(e.usados), texto: `de ${numero(plan.mensajesMes)} mensajes de tu plan`, detalle: `En ${mes}` });

  /* Conversaciones recientes */
  const conversaciones: ConversacionReciente[] = e.conversaciones.slice(0, 5).map((c) => {
    const ids = (c.participantes ?? []).filter(esIdAgente);
    const agentes: IdAgente[] = ids.length ? ids : esIdAgente(c.agente) ? [c.agente] : ["clara"];
    const d = diaLocal(c.actualizado_en);
    return {
      id: c.id,
      titulo: ids.length ? c.tema || c.titulo : c.titulo,
      agentes,
      vista: ids.length ? `Con ${agentes.map((id) => AGENTE_POR_ID[id].nombre).join(", ")}` : `Con ${AGENTE_POR_ID[agentes[0]].nombre} · ${AGENTE_POR_ID[agentes[0]].area}`,
      hora: d === hoy ? fmtHora.format(new Date(c.actualizado_en)) : d === ayer ? "Ayer" : fmtFechaCorta.format(new Date(c.actualizado_en)).replace(".", ""),
      accion: { etiqueta: "Abrir", href: `/panel/chat?c=${c.id}` },
    };
  });

  /* Sugerencias según cómo está la cuenta (solo cosas que ya funcionan) */
  const sugerencias: Recomendacion[] = [];
  if (!e.conGoogle)
    sugerencias.push({
      id: "s-gmail",
      agente: "clara",
      texto: "Conecta tu Gmail y Clara resume tus correos sin leer. Solo lectura: nunca envía ni borra nada.",
      accion: { etiqueta: "Conectar Gmail", href: "/panel?vista=correo#gmail" },
    });
  if (!e.conversaciones.length)
    sugerencias.push({
      id: "s-chat",
      agente: "clara",
      texto: "Pídele a Clara un correo para cobrar una factura atrasada, con tacto.",
      accion: { etiqueta: "Hablar con Clara", href: "/panel/chat?agente=clara" },
    });
  if (plan.id !== "free" && e.activos.length > 1)
    sugerencias.push({
      id: "s-grupo",
      agente: e.activos.includes("lola") ? "lola" : e.activos[0],
      texto: "Arma un grupo con dos agentes para que se pasen el trabajo entre ellos.",
      accion: { etiqueta: "Nuevo grupo", href: "/panel/chat" },
    });
  if (plan.id === "free")
    sugerencias.push({ id: "s-plan", agente: "lola", texto: "Con Atendel One se suma Lola: contesta tu WhatsApp y lleva tus citas.", accion: { etiqueta: "Ver planes", href: "/precios" } });

  /* Cifras de 30 días */
  const pc = periodo(diasCorreo, "todos", 30);
  const pr = periodo(dias, "todos", 30);
  const serieCorreos = serie(diasCorreo, "todos", 30);
  const respuestasSerie = serie(dias, "todos", 30).map((v, i) => v - serieCorreos[i]);
  const respuestasAnterior = pr.anterior !== undefined && pc.anterior !== undefined ? pr.anterior - pc.anterior : undefined;

  return {
    ejemplo: false,
    bienvenida: {
      fecha: mayuscula(diaLargo(hoy)),
      nombre: e.nombre,
      resumen: resumenHoy,
      hoy: [
        { valor: numero(respuestasHoy), etiqueta: "respuestas hoy" },
        { valor: numero(correosHoy), etiqueta: "correos resumidos hoy" },
        { valor: numero(e.usados), etiqueta: `de ${numero(plan.mensajesMes)} mensajes del mes` },
      ],
      acciones: [
        { etiqueta: "Nueva conversación", href: "/panel/chat", icono: "mensaje" },
        { etiqueta: "Resumir un correo", href: "/panel?vista=correo", icono: "correo" },
      ],
    },
    actividad: {
      dias,
      unidad: { una: "tarea", varias: "tareas" },
      explicacion: "Cada cuadro es un día: las respuestas de tus agentes en el chat y los correos que resumió Clara.",
      agentes: [...plan.agentes],
    },
    fijados,
    eventos,
    eventosVacio: {
      titulo: "Todavía no hay actividad",
      texto: "Cuando hables con tus agentes o Clara resuma un correo, aquí verás qué hizo cada quien y a qué hora.",
      accion: { etiqueta: "Hablar con tu equipo", href: "/panel/chat", icono: "mensaje" },
    },
    pendientesEtiqueta: "Por atender",
    pendientes,
    pendientesVacio: {
      titulo: "Nada por atender",
      texto: "Cuando Clara resuma un correo y sugiera qué hacer, te lo deja aquí para que decidas.",
      accion: { etiqueta: "Resumir un correo", href: "/panel?vista=correo", icono: "correo" },
    },
    destacados,
    destacadosVacio: { titulo: "Todavía sin destacados", texto: "Cuando tu equipo empiece a trabajar, aquí verás tus mejores días y quién hizo más." },
    conversaciones,
    conversacionesVacio: {
      titulo: "Sin conversaciones todavía",
      texto: "Escríbele a Clara: pégale un correo o pregúntale cómo ordenar tu bandeja.",
      accion: { etiqueta: "Empezar una conversación", href: "/panel/chat", icono: "mensaje" },
    },
    todasConversaciones: { etiqueta: "Ver todas", href: "/panel/chat" },
    negocio: {
      nombre: e.negocio && e.negocio !== "tu negocio" ? e.negocio : "Tu negocio",
      giro: e.correo,
      plan: plan.nombre,
      uso: { etiqueta: `Mensajes de ${mes}`, valor: e.usados, max: plan.mensajesMes, detalle: `Se renueva el 1 de ${mesSiguiente}.` },
      accion: { etiqueta: "Ver tu plan", href: "/panel/agentes#plan" },
    },
    citas: null,
    citasVacio: {
      titulo: "Tu agenda",
      pronto: true,
      texto: "Lola todavía no se conecta a una agenda. Mientras, pídele en el chat confirmaciones y recordatorios para tus citas.",
      accion: e.activos.includes("lola") ? { etiqueta: "Hablar con Lola", href: "/panel/chat?agente=lola" } : undefined,
    },
    metricas: [
      {
        id: "m-respuestas",
        etiqueta: "Respuestas de tus agentes",
        valor: pr.actual - pc.actual,
        anterior: respuestasAnterior,
        serie: respuestasSerie,
        periodo: "30 días",
      },
      { id: "m-correos", agente: "clara", etiqueta: "Correos resumidos", valor: pc.actual, anterior: pc.anterior, serie: serieCorreos, periodo: "30 días" },
    ],
    recomendaciones: sugerencias.slice(0, 2),
    novedades: NOVEDADES,
  };
}
