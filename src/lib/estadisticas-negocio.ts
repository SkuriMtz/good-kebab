import type { SupabaseClient } from "@supabase/supabase-js";
import { esIdAgente, IDS_AGENTES, type IdAgente } from "./agentes";
import type { Cuenta } from "./cuenta";
import {
  accionValida,
  diaLocal,
  diasEntre,
  horaLocal,
  inicioDia,
  normalizar,
  partirRemitente,
  rangos,
  sumarDias,
  ZONA,
  type Dia,
  type FilaConversacion,
  type FilaMensaje,
  type FilaResumen,
  type Periodo,
} from "./estadisticas";

/* =====================================================================
   Estadísticas del NEGOCIO (no de los agentes): cuántos clientes te
   escribieron, cuántas citas, qué preguntan, quién escribe más y cuándo.
   - calcularNegocio(): función pura. /panel y /pruebalo pasan sus filas
     por el mismo camino (las de ejemplo están en
     src/components/dashboard/estadisticas-negocio/ejemplo.ts).
   - cargarNegocio(): lee SOLO tablas que ya existen (resumenes_correo,
     mensajes, conversaciones y negocios). RLS ya deja ver a cada quien
     solo lo suyo; además se filtra por owner_id o por sus negocios.
   - Lo que todavía no se guarda (WhatsApp y citas) llega como null y la
     vista muestra "—" con "Se llena cuando conectes WhatsApp con Lola".
     Nada se inventa.
   Este archivo no importa nada que sea solo del servidor: los tipos, las
   cuentas y los enlaces también los usa la vista.
   ===================================================================== */

export type Canal = "correo" | "whatsapp";

/** Un número del periodo y el del periodo anterior. null = no hay de dónde contarlo ("—"). */
export type Cifra = { valor: number | null; antes: number | null };
export type SerieDia = { dias: Dia[]; actual: number[]; antes: number[] };

export type ClienteTop = {
  clave: string;
  nombre: string;
  /** Por dónde escribe más. */
  canal: Canal;
  /** Mensajes y correos que mandó en el periodo. */
  total: number;
  /** Escribió por primera vez en este periodo. */
  nuevo: boolean;
  /** Quién lo atendió (solo como crédito). */
  agente: IdAgente | null;
};

export type TemaTop = {
  texto: string;
  /** El texto con el que se filtran los Pendientes (?accion=). */
  accion: string;
  total: number;
  agente: IdAgente | null;
};

export type DatosNegocio = {
  negocio: string;
  periodo: Periodo;
  /** Hoy, en la hora de México. */
  hoy: Dia;
  actual: { desde: Dia; hasta: Dia };
  anterior: { desde: Dia; hasta: Dia };
  /** De dónde hay datos. En /panel, hoy solo el correo. */
  canales: Record<Canal | "citas", boolean>;
  /** Personas distintas que escribieron; nuevas y que regresan. */
  clientes: Cifra & { nuevos: number | null; regresan: number | null };
  citas: { agendadas: Cifra; canceladas: number | null; reagendadas: number | null };
  /** Correos de clientes que tu equipo resumió o respondió; cuántos traían algo que hacer. */
  correos: Cifra & { conAccion: number | null };
  /** Mensajes que tu equipo contestó, y en cuántas conversaciones. */
  respuestas: Cifra & { conversaciones: number | null; agentes: IdAgente[] };
  /** Clientes distintos por día, en el periodo y en el anterior. null = sin de dónde contar. */
  serie: { dias: Dia[]; diasAntes: Dia[]; actual: number[]; antes: number[] } | null;
  /** Lo mismo por día (en el periodo y en el anterior) para citas, respuestas y correos. null = sin de dónde contar. */
  series: { citas: SerieDia | null; respuestas: SerieDia | null; correos: SerieDia | null };
  /** Movimiento (mensajes y correos) por hora del día, de 0 a 23, en el periodo. */
  porHora: number[] | null;
  temas: TemaTop[];
  quienes: ClienteTop[];
  /** Movimiento (mensajes y correos) por día de la semana (0 = lunes) y hora (0–23). */
  calor: number[][] | null;
  diasTop: { dia: Dia; total: number }[];
  horasTop: { hora: number; total: number }[];
  /** Citas de esta semana, de lunes a domingo (sin las canceladas). */
  semana: { dia: Dia; citas: number }[] | null;
  /** Conversaciones con clientes que atendió tu equipo (correos + chats de WhatsApp). */
  ahorro: number | null;
  /** Se leyó el máximo de filas: los números más viejos pueden quedarse cortos. */
  recortado: boolean;
};

/* ---------- Filas de entrada ---------- */

/** Un resumen de Clara. `tema` (opcional) es cómo se llama lo que pide, si se sabe. */
export type FilaCorreo = FilaResumen & { tema?: string | null };

/** Un mensaje de WhatsApp (todavía no se guarda: solo lo trae el ejemplo). */
export type FilaWhatsapp = {
  conversacion: string;
  cliente: string;
  creado_en: string;
  de: "cliente" | "equipo";
  agente: IdAgente;
  /** Lo que preguntó (en el primer mensaje de la conversación). */
  tema?: string;
};

/** Una cita (todavía no se guarda: solo la trae el ejemplo). `creado_en` es cuándo se agendó. */
export type FilaCita = { cliente: string; dia: Dia; creado_en: string; estado: "agendada" | "cancelada" | "reagendada" };

export type EntradaNegocio = {
  negocio: string;
  periodo: Periodo;
  hoy: Dia;
  /** Desde el inicio del periodo anterior. */
  correos: readonly FilaCorreo[];
  /** Remitentes de antes del periodo anterior (para saber quién regresa). */
  remitentesAntes?: readonly (string | null)[];
  /** El chat del panel. */
  mensajes: readonly FilaMensaje[];
  conversaciones: readonly FilaConversacion[];
  /** undefined = no se guarda todavía ("—"). */
  whatsapp?: readonly FilaWhatsapp[];
  citas?: readonly FilaCita[];
  recortado?: boolean;
  zona?: string;
  tope?: number;
};

/* ---------- El cálculo (puro) ---------- */

/** Día de la semana de un día, con el lunes = 0. */
export function diaSemana(dia: Dia) {
  return (new Date(`${dia}T12:00:00Z`).getUTCDay() + 6) % 7;
}

/** El lunes de la semana de ese día. */
export function lunesDe(dia: Dia): Dia {
  return sumarDias(dia, -diaSemana(dia));
}

const claveWhatsapp = (nombre: string) => `wa:${normalizar(nombre)}`;

/**
 * Junta las filas en lo que muestra la vista. Cómo se cuenta:
 * - Clientes: personas distintas que escribieron (remitentes de correo y,
 *   cuando exista, clientes de WhatsApp). Nuevos = su primer mensaje cae en
 *   este periodo; regresan = ya habían escrito antes.
 * - Correos: cada resumen de Clara (con acción = trae algo que hacer).
 * - Respuestas: lo que contestó tu equipo (sus mensajes del chat y de WhatsApp).
 * - Movimiento (mapa de calor y días/horas): todo mensaje y todo correo.
 * - Ahorro: conversaciones con clientes que tu equipo atendió (cada correo
 *   resumido y cada chat de WhatsApp).
 */
export function calcularNegocio(e: EntradaNegocio): DatosNegocio {
  const zona = e.zona ?? ZONA;
  const tope = e.tope ?? 5;
  const { actual, anterior } = rangos(e.periodo, e.hoy);
  const enActual = new Set(actual.dias);
  const enAnterior = new Set(anterior.dias);
  const indice = new Map(actual.dias.map((d, i) => [d, i]));
  const indiceAntes = new Map(anterior.dias.map((d, i) => [d, i]));

  // Día y hora de cada instante (México cambia por horas enteras: basta una vez por hora UTC)
  const cache = new Map<string, [Dia, number]>();
  const enZona = (fecha: string): [Dia, number] => {
    const clave = zona === ZONA && fecha.length > 13 && fecha[10] === "T" ? fecha.slice(0, 13) : fecha;
    let v = cache.get(clave);
    if (!v) {
      v = [diaLocal(fecha, zona), horaLocal(fecha, zona)];
      cache.set(clave, v);
    }
    return v;
  };

  const hayCorreo = e.correos.length > 0 || (e.remitentesAntes?.length ?? 0) > 0;
  const hayWhatsapp = e.whatsapp !== undefined;
  const hayClientes = hayCorreo || hayWhatsapp;

  // Quién ya había escrito antes del periodo actual
  const conocidos = new Set<string>();
  for (const r of e.remitentesAntes ?? []) {
    const q = partirRemitente(r);
    if (q) conocidos.add(q.clave);
  }

  type Cliente = { clave: string; nombre: string; correo: number; whatsapp: number; agente: IdAgente | null };
  const clientes = new Map<string, Cliente>();
  const clientesAntes = new Set<string>();
  const porDia = actual.dias.map(() => new Set<string>());
  const porDiaAntes = anterior.dias.map(() => new Set<string>());
  const calor = Array.from({ length: 7 }, () => Array<number>(24).fill(0));
  const movDia = new Map<Dia, number>();
  const movHora = Array<number>(24).fill(0);
  const temas = new Map<string, TemaTop & { porAgente: Map<IdAgente | null, number> }>();
  const nuevaSerie = (): SerieDia => ({ dias: actual.dias, actual: actual.dias.map(() => 0), antes: anterior.dias.map(() => 0) });
  const sCitas = nuevaSerie();
  const sRespuestas = nuevaSerie();
  const sCorreos = nuevaSerie();
  /** Uno más en su día, sea del periodo o del anterior. */
  const sumar = (s: SerieDia, dia: Dia) => {
    const i = indice.get(dia);
    if (i !== undefined) s.actual[i] += 1;
    else {
      const j = indiceAntes.get(dia);
      if (j !== undefined) s.antes[j] += 1;
    }
  };

  const mover = (dia: Dia, hora: number) => {
    calor[diaSemana(dia)][hora] += 1;
    movDia.set(dia, (movDia.get(dia) ?? 0) + 1);
    movHora[hora] += 1;
  };
  /** Un tema más; el crédito es para quien atendió más veces ese tema. */
  const anotarTema = (texto: string, accion: string, agente: IdAgente | null) => {
    const clave = normalizar(texto);
    const fila = temas.get(clave) ?? { texto, accion, total: 0, agente, porAgente: new Map() };
    fila.total += 1;
    const n = (fila.porAgente.get(agente) ?? 0) + 1;
    fila.porAgente.set(agente, n);
    if (n > (fila.porAgente.get(fila.agente) ?? 0)) fila.agente = agente;
    temas.set(clave, fila);
  };
  /** Un mensaje de un cliente: cuenta para su día, para él y para saber si regresa. */
  const deCliente = (clave: string, nombre: string, canal: Canal, agente: IdAgente | null, dia: Dia) => {
    if (dia < actual.desde) {
      conocidos.add(clave);
      const j = indiceAntes.get(dia);
      if (j !== undefined) {
        porDiaAntes[j].add(clave);
        clientesAntes.add(clave);
      }
      return;
    }
    const i = indice.get(dia);
    if (i === undefined) return;
    porDia[i].add(clave);
    const c = clientes.get(clave) ?? { clave, nombre, correo: 0, whatsapp: 0, agente };
    c[canal] += 1;
    if (canal === "whatsapp" || !c.agente) c.agente = agente;
    clientes.set(clave, c);
  };

  // Correos
  let correos = 0;
  let correosAntes = 0;
  let conAccion = 0;
  for (const r of e.correos) {
    const [dia, hora] = enZona(r.creado_en);
    const quien = partirRemitente(r.remitente);
    if (quien) deCliente(quien.clave, quien.nombre, "correo", "clara", dia);
    if (enAnterior.has(dia)) correosAntes += 1;
    sumar(sCorreos, dia);
    if (!enActual.has(dia)) continue;
    correos += 1;
    mover(dia, hora);
    const accion = accionValida(r.accion_sugerida);
    if (accion) {
      conAccion += 1;
      anotarTema(r.tema?.trim() || accion, accion, "clara");
    }
  }

  // Chat del panel: lo que contestó tu equipo
  const agenteDe = new Map(e.conversaciones.map((c) => [c.id, c.agente]));
  let respuestas = 0;
  let respuestasAntes = 0;
  const convRespondidas = new Set<string>();
  const quienesContestaron = new Set<IdAgente>();
  for (const m of e.mensajes) {
    const [dia, hora] = enZona(m.creado_en);
    const delEquipo = m.rol === "assistant";
    if (enAnterior.has(dia) && delEquipo) respuestasAntes += 1;
    if (delEquipo) sumar(sRespuestas, dia);
    if (!enActual.has(dia)) continue;
    mover(dia, hora);
    if (delEquipo) {
      respuestas += 1;
      convRespondidas.add(`chat:${m.conversacion_id}`);
      const quien = esIdAgente(m.agente) ? m.agente : agenteDe.get(m.conversacion_id);
      if (esIdAgente(quien)) quienesContestaron.add(quien);
    }
  }

  // WhatsApp (solo el ejemplo, por ahora)
  const chatsWhatsapp = new Set<string>();
  for (const w of e.whatsapp ?? []) {
    const [dia, hora] = enZona(w.creado_en);
    if (w.de === "cliente") deCliente(claveWhatsapp(w.cliente), w.cliente, "whatsapp", w.agente, dia);
    if (enAnterior.has(dia) && w.de === "equipo") respuestasAntes += 1;
    if (w.de === "equipo") sumar(sRespuestas, dia);
    if (!enActual.has(dia)) continue;
    mover(dia, hora);
    chatsWhatsapp.add(w.conversacion);
    if (w.de === "equipo") {
      respuestas += 1;
      convRespondidas.add(`wa:${w.conversacion}`);
      quienesContestaron.add(w.agente);
    } else if (w.tema) anotarTema(w.tema, w.tema, w.agente);
  }

  // Citas (solo el ejemplo, por ahora)
  let citas: DatosNegocio["citas"] = { agendadas: { valor: null, antes: null }, canceladas: null, reagendadas: null };
  let semana: DatosNegocio["semana"] = null;
  if (e.citas) {
    let agendadas = 0;
    let agendadasAntes = 0;
    let canceladas = 0;
    let reagendadas = 0;
    const lunes = lunesDe(e.hoy);
    const dias = diasEntre(lunes, sumarDias(lunes, 6));
    const enSemana = new Map(dias.map((d) => [d, 0]));
    for (const c of e.citas) {
      const [dia] = enZona(c.creado_en);
      sumar(sCitas, dia);
      if (enAnterior.has(dia)) agendadasAntes += 1;
      if (enActual.has(dia)) {
        agendadas += 1;
        if (c.estado === "cancelada") canceladas += 1;
        if (c.estado === "reagendada") reagendadas += 1;
      }
      if (c.estado !== "cancelada" && enSemana.has(c.dia)) enSemana.set(c.dia, (enSemana.get(c.dia) ?? 0) + 1);
    }
    citas = { agendadas: { valor: agendadas, antes: agendadasAntes }, canceladas, reagendadas };
    semana = dias.map((dia) => ({ dia, citas: enSemana.get(dia) ?? 0 }));
  }

  const lista = [...clientes.values()];
  const nuevos = lista.filter((c) => !conocidos.has(c.clave)).length;
  const hayMovimiento = hayClientes || e.mensajes.length > 0;
  const orden = <T extends { total: number }>(a: T, b: T, ta: string, tb: string) => b.total - a.total || ta.localeCompare(tb, "es-MX");

  return {
    negocio: e.negocio,
    periodo: e.periodo,
    hoy: e.hoy,
    actual: { desde: actual.desde, hasta: actual.hasta },
    anterior: { desde: anterior.desde, hasta: anterior.hasta },
    canales: { correo: hayCorreo, whatsapp: hayWhatsapp, citas: e.citas !== undefined },
    clientes: {
      valor: hayClientes ? lista.length : null,
      antes: hayClientes ? clientesAntes.size : null,
      nuevos: hayClientes ? nuevos : null,
      regresan: hayClientes ? lista.length - nuevos : null,
    },
    citas,
    correos: { valor: hayCorreo ? correos : null, antes: hayCorreo ? correosAntes : null, conAccion: hayCorreo ? conAccion : null },
    respuestas: {
      valor: e.mensajes.length || hayWhatsapp ? respuestas : null,
      antes: e.mensajes.length || hayWhatsapp ? respuestasAntes : null,
      conversaciones: e.mensajes.length || hayWhatsapp ? convRespondidas.size : null,
      agentes: IDS_AGENTES.filter((a) => quienesContestaron.has(a)),
    },
    serie: hayClientes
      ? { dias: actual.dias, diasAntes: anterior.dias, actual: porDia.map((s) => s.size), antes: porDiaAntes.map((s) => s.size) }
      : null,
    series: {
      citas: e.citas ? sCitas : null,
      respuestas: e.mensajes.length || hayWhatsapp ? sRespuestas : null,
      correos: hayCorreo ? sCorreos : null,
    },
    porHora: hayMovimiento ? movHora : null,
    temas: [...temas.values()]
      .map(({ texto, accion, total, agente }): TemaTop => ({ texto, accion, total, agente }))
      .sort((a, b) => orden(a, b, a.texto, b.texto))
      .slice(0, tope),
    quienes: lista
      .map((c): ClienteTop => ({
        clave: c.clave,
        nombre: c.nombre,
        canal: c.whatsapp >= c.correo ? "whatsapp" : "correo",
        total: c.correo + c.whatsapp,
        nuevo: !conocidos.has(c.clave),
        agente: c.agente,
      }))
      .sort((a, b) => orden(a, b, a.nombre, b.nombre))
      .slice(0, tope),
    calor: hayMovimiento ? calor : null,
    diasTop: [...movDia.entries()]
      .map(([dia, total]) => ({ dia, total }))
      .sort((a, b) => b.total - a.total || a.dia.localeCompare(b.dia))
      .slice(0, 3),
    horasTop: movHora
      .map((total, hora) => ({ hora, total }))
      .filter((h) => h.total > 0)
      .sort((a, b) => b.total - a.total || a.hora - b.hora)
      .slice(0, 3),
    semana,
    ahorro: hayClientes ? correos + chatsWhatsapp.size : null,
    recortado: Boolean(e.recortado),
  };
}

/* ---------- A dónde lleva cada cosa ---------- */

export type DestinoNegocio =
  | { tipo: "periodo"; periodo: Periodo }
  /** Correo filtrado por quién lo mandó; un cliente de WhatsApp, a sus citas. */
  | { tipo: "cliente"; nombre: string; canal: Canal }
  /** Pendientes de esa acción (el texto tal cual). */
  | { tipo: "tema"; accion: string }
  | { tipo: "hora"; hora: number }
  | { tipo: "dia"; dia: Dia }
  | { tipo: "citas"; dia?: Dia }
  | { tipo: "correo" }
  /** La actividad del equipo, sin filtro. */
  | { tipo: "actividad" };

/**
 * La dirección de cada destino (`base` = "/panel" o "/pruebalo"). Los
 * filtros van en la URL, así el botón de atrás regresa aquí.
 */
export function enlaceNegocio(d: DestinoNegocio, base: string): string {
  const vista = (q: Record<string, string>) => `${base}?${new URLSearchParams(q)}`;
  switch (d.tipo) {
    case "periodo":
      return vista({ vista: "estadisticas", periodo: d.periodo });
    case "cliente":
      return d.canal === "correo" ? vista({ vista: "correo", de: d.nombre }) : vista({ vista: "citas", de: d.nombre });
    case "tema":
      return vista({ vista: "pendientes", accion: d.accion });
    case "hora":
      return vista({ vista: "actividad", hora: String(d.hora) });
    case "dia":
      return vista({ vista: "actividad", dia: d.dia });
    case "citas":
      return vista(d.dia ? { vista: "citas", dia: d.dia } : { vista: "citas" });
    case "correo":
      return vista({ vista: "correo" });
    case "actividad":
      return vista({ vista: "actividad" });
  }
}

/* ---------- La consulta (servidor) ---------- */

const POR_PAGINA = 1000;
const PAGINAS = 8;

type Pagina<T> = PromiseLike<{ data: T[] | null; error: unknown }>;

/** Lee de mil en mil hasta acabar o llegar al máximo. Con error, se queda con lo que llevaba. */
async function leerPaginas<T>(pedir: (desde: number, hasta: number) => Pagina<T>): Promise<{ filas: T[]; recortado: boolean }> {
  const filas: T[] = [];
  for (let p = 0; p < PAGINAS; p++) {
    const { data, error } = await pedir(p * POR_PAGINA, (p + 1) * POR_PAGINA - 1);
    if (error) {
      console.error("estadísticas del negocio: no se pudo leer una página", error);
      return { filas, recortado: false };
    }
    filas.push(...(data ?? []));
    if (!data || data.length < POR_PAGINA) return { filas, recortado: false };
  }
  return { filas, recortado: true };
}

type CuentaNegocio = Pick<Cuenta, "negocio">;

/**
 * Carga lo del negocio para ese periodo. `cuenta` es lo que da cargarCuenta()
 * (se puede pasar la promesa sin esperarla: todo se lee al mismo tiempo).
 * Solo lee: resumenes_correo (por los negocios de la persona), mensajes y
 * conversaciones (por owner_id). WhatsApp y citas todavía no se guardan.
 */
export async function cargarNegocio(
  supabase: SupabaseClient,
  userId: string,
  periodo: Periodo,
  cuenta: CuentaNegocio | Promise<CuentaNegocio>,
  ahora: Date = new Date(),
): Promise<DatosNegocio> {
  const hoy = diaLocal(ahora);
  const { anterior } = rangos(periodo, hoy);
  const desde = inicioDia(anterior.desde).toISOString();

  const leerMensajes = leerPaginas<FilaMensaje>((a, b) =>
    supabase
      .from("mensajes")
      .select("creado_en, rol, conversacion_id, agente")
      .eq("owner_id", userId)
      .gte("creado_en", desde)
      .order("creado_en", { ascending: false })
      .range(a, b),
  );

  const leerConversaciones = leerPaginas<FilaConversacion>((a, b) =>
    supabase
      .from("conversaciones")
      .select("id, agente")
      .eq("owner_id", userId)
      .gte("actualizado_en", desde)
      .order("actualizado_en", { ascending: false })
      .range(a, b),
  );

  // resumenes_correo no tiene owner_id: se filtra por los negocios de la persona
  const leerCorreos = (async () => {
    const { data: negocios, error } = await supabase.from("negocios").select("id").eq("owner_id", userId);
    if (error) console.error("estadísticas del negocio: no se pudieron leer los negocios", error);
    const ids = (negocios ?? []).map((n) => n.id as string);
    if (!ids.length) return { recientes: { filas: [] as FilaCorreo[], recortado: false }, antes: { filas: [] as { remitente: string | null }[], recortado: false } };
    const [recientes, antes] = await Promise.all([
      leerPaginas<FilaCorreo>((a, b) =>
        supabase
          .from("resumenes_correo")
          .select("remitente, accion_sugerida, creado_en")
          .in("negocio_id", ids)
          .gte("creado_en", desde)
          .order("creado_en", { ascending: false })
          .range(a, b),
      ),
      // Solo el remitente: para saber quién ya había escrito antes
      leerPaginas<{ remitente: string | null }>((a, b) =>
        supabase
          .from("resumenes_correo")
          .select("remitente")
          .in("negocio_id", ids)
          .lt("creado_en", desde)
          .order("creado_en", { ascending: false })
          .range(a, b),
      ),
    ]);
    return { recientes, antes };
  })();

  const [mensajes, conversaciones, correos, c] = await Promise.all([leerMensajes, leerConversaciones, leerCorreos, cuenta]);

  return calcularNegocio({
    negocio: c.negocio,
    periodo,
    hoy,
    correos: correos.recientes.filas,
    remitentesAntes: correos.antes.filas.map((r) => r.remitente),
    mensajes: mensajes.filas,
    conversaciones: conversaciones.filas.filter((x) => esIdAgente(x.agente)),
    recortado: mensajes.recortado || correos.recientes.recortado || correos.antes.recortado,
  });
}
