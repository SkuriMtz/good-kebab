import type { SupabaseClient } from "@supabase/supabase-js";
import { esIdAgente, IDS_AGENTES, type IdAgente } from "./agentes";
import type { Cuenta } from "./cuenta";
import type { IdPlan } from "./planes";

/* =====================================================================
   Estadísticas del panel (?vista=estadisticas).
   - Cálculos: funciones puras (sin red ni reloj escondido), para que se
     puedan probar y para que /pruebalo pase sus datos de ejemplo por el
     mismo camino que los reales.
   - Consultas: cargarEstadisticas() lee SOLO tablas que ya existen
     (mensajes, conversaciones, resumenes_correo y, con cargarCuenta,
     uso_mensual). RLS ya deja ver a cada quien solo lo suyo; además se
     filtra por owner_id donde existe la columna. Se lee el periodo actual
     y el anterior, nada más, y se agrupa aquí en el servidor: a la vista
     solo llegan los totales.
   Este archivo no importa nada que sea solo del servidor: los tipos y las
   funciones puras también los usa la vista.
   ===================================================================== */

/** Los días se cuentan en la hora de México (el servidor corre en UTC). */
export const ZONA = "America/Mexico_City";

/* ---------- Periodos ---------- */

export type Periodo = "7d" | "30d" | "mes";

export const PERIODOS: readonly { id: Periodo; etiqueta: string; contra: string }[] = [
  { id: "7d", etiqueta: "7 días", contra: "vs. los 7 días antes" },
  { id: "30d", etiqueta: "30 días", contra: "vs. los 30 días antes" },
  { id: "mes", etiqueta: "Este mes", contra: "vs. el mes pasado" },
];

export const PERIODO_INICIAL: Periodo = "30d";

export function esPeriodo(valor: unknown): valor is Periodo {
  return valor === "7d" || valor === "30d" || valor === "mes";
}

/** Lo que venga en la URL (?periodo=…) convertido en un periodo válido. */
export function periodoDe(valor: unknown): Periodo {
  return esPeriodo(valor) ? valor : PERIODO_INICIAL;
}

/* ---------- Métricas (la fila de números de arriba) ---------- */

export type IdMetrica = "mensajes" | "conversaciones" | "correos" | "acciones" | "uso";

export type InfoMetrica = {
  id: IdMetrica;
  etiqueta: string;
  /** Título de la gráfica cuando se elige este número. */
  grafica: string;
  /** Una y varias ("1 mensaje", "12 mensajes"). */
  una: string;
  varias: string;
};

export const METRICAS: readonly InfoMetrica[] = [
  { id: "mensajes", etiqueta: "Mensajes", grafica: "Mensajes por día", una: "mensaje", varias: "mensajes" },
  { id: "conversaciones", etiqueta: "Conversaciones", grafica: "Conversaciones con movimiento, por día", una: "conversación", varias: "conversaciones" },
  { id: "correos", etiqueta: "Correos resumidos", grafica: "Correos resumidos por día", una: "correo", varias: "correos" },
  { id: "acciones", etiqueta: "Acciones sugeridas", grafica: "Correos con una acción sugerida, por día", una: "acción", varias: "acciones" },
  { id: "uso", etiqueta: "Uso del plan", grafica: "Mensajes que cuentan para tu plan, por día", una: "mensaje", varias: "mensajes" },
];

export const METRICA_POR_ID = Object.fromEntries(METRICAS.map((m) => [m.id, m])) as Record<IdMetrica, InfoMetrica>;

/* ---------- Lo que llega a la vista ---------- */

/** Un día en la hora de México: "2026-11-04". */
export type Dia = string;

export type PuntoDia = { dia: Dia } & Record<IdMetrica, number>;

export type FilaAgenteEst = { agente: IdAgente; mensajes: number; conversaciones: number };
export type FilaAccionEst = { texto: string; total: number };
export type FilaRemitenteEst = { clave: string; nombre: string; correo: string | null; total: number };

export type DatosEstadisticas = {
  periodo: Periodo;
  actual: { desde: Dia; hasta: Dia };
  anterior: { desde: Dia; hasta: Dia };
  /** Un punto por día del periodo actual (y del anterior, para comparar). */
  serie: PuntoDia[];
  serieAnterior: PuntoDia[];
  /**
   * Totales de cada periodo. `null` = no hay de dónde contar (ni una fila
   * en ninguno de los dos periodos): la vista muestra "—". En "uso" es lo
   * que cuenta para el plan (los mensajes de la persona).
   */
  totales: Record<IdMetrica, number | null>;
  totalesAnteriores: Record<IdMetrica, number | null>;
  /** Periodo actual. */
  porAgente: FilaAgenteEst[];
  acciones: FilaAccionEst[];
  remitentes: FilaRemitenteEst[];
  /** 24 casillas: mensajes del periodo actual por hora del día (0 = 12 a. m.). */
  porHora: number[];
  /** El plan y su uso del mes en curso (de cargarCuenta). */
  plan: { id: IdPlan; nombre: string; limite: number; usados: number; mes: Dia };
  /** Se leyó el máximo de filas: los números del periodo anterior pueden quedarse cortos. */
  recortado: boolean;
};

/* ---------- Fechas (puras) ---------- */

const formatos = new Map<string, Intl.DateTimeFormat>();
function formatoZona(zona: string) {
  let f = formatos.get(zona);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone: zona,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    formatos.set(zona, f);
  }
  return f;
}

/** Año, mes, día, hora, minuto y segundo de un instante en esa zona. */
function partesEn(fecha: Date, zona: string) {
  const p: Record<string, number> = {};
  for (const parte of formatoZona(zona).formatToParts(fecha)) {
    if (parte.type !== "literal") p[parte.type] = Number(parte.value);
  }
  return { y: p.year, m: p.month, d: p.day, h: p.hour % 24, min: p.minute, s: p.second };
}

const dos = (n: number) => String(n).padStart(2, "0");

/** El día (en México) de un instante. */
export function diaLocal(fecha: Date | string, zona = ZONA): Dia {
  const { y, m, d } = partesEn(new Date(fecha), zona);
  return `${y}-${dos(m)}-${dos(d)}`;
}

/** La hora (0–23, en México) de un instante. */
export function horaLocal(fecha: Date | string, zona = ZONA): number {
  return partesEn(new Date(fecha), zona).h;
}

function aUTC(dia: Dia) {
  const [y, m, d] = dia.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Suma (o resta) días de calendario: sumarDias("2026-11-01", -1) = "2026-10-31". */
export function sumarDias(dia: Dia, n: number): Dia {
  return new Date(aUTC(dia) + n * 86_400_000).toISOString().slice(0, 10);
}

/** Todos los días de `desde` a `hasta`, los dos incluidos. */
export function diasEntre(desde: Dia, hasta: Dia): Dia[] {
  const dias: Dia[] = [];
  for (let d = desde; d <= hasta; d = sumarDias(d, 1)) dias.push(d);
  return dias;
}

/** El instante en que empieza ese día en la zona (la medianoche de México, en UTC). */
export function inicioDia(dia: Dia, zona = ZONA): Date {
  const base = aUTC(dia);
  const desfase = (t: number) => {
    const p = partesEn(new Date(t), zona);
    return Date.UTC(p.y, p.m - 1, p.d, p.h, p.min, p.s) - t;
  };
  let t = base - desfase(base);
  // Si ese día cambia el horario, una segunda vuelta lo corrige
  const otra = base - desfase(t);
  if (otra !== t) t = otra;
  return new Date(t);
}

/** Días del mes de ese día (28–31). */
function diasDelMes(y: number, m: number) {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export type Rango = { desde: Dia; hasta: Dia; dias: Dia[] };

/**
 * El periodo actual (hasta hoy, incluido) y el anterior con el que se compara:
 * - 7d / 30d: los últimos 7 / 30 días y los 7 / 30 de antes.
 * - mes: del día 1 a hoy, contra el mes pasado del día 1 al mismo día
 *   (o a su último día, si el mes pasado fue más corto).
 */
export function rangos(periodo: Periodo, hoy: Dia): { actual: Rango; anterior: Rango } {
  let desde: Dia;
  let antesDesde: Dia;
  let antesHasta: Dia;
  if (periodo === "mes") {
    const [y, m, d] = hoy.split("-").map(Number);
    desde = `${y}-${dos(m)}-01`;
    const ya = m === 1 ? y - 1 : y;
    const ma = m === 1 ? 12 : m - 1;
    antesDesde = `${ya}-${dos(ma)}-01`;
    antesHasta = `${ya}-${dos(ma)}-${dos(Math.min(d, diasDelMes(ya, ma)))}`;
  } else {
    const n = periodo === "7d" ? 7 : 30;
    desde = sumarDias(hoy, -(n - 1));
    antesHasta = sumarDias(desde, -1);
    antesDesde = sumarDias(desde, -n);
  }
  return {
    actual: { desde, hasta: hoy, dias: diasEntre(desde, hoy) },
    anterior: { desde: antesDesde, hasta: antesHasta, dias: diasEntre(antesDesde, antesHasta) },
  };
}

/* ---------- Números (puros) ---------- */

/**
 * Cambio en % contra el periodo anterior, redondeado. `null` cuando no se
 * puede decir (sin datos, o el periodo anterior fue 0: no hay contra qué).
 */
export function cambio(actual: number | null, anterior: number | null): number | null {
  if (actual === null || anterior === null || anterior === 0) return null;
  return Math.round(((actual - anterior) / anterior) * 100);
}

/** La escala del eje vertical: un tope "redondo" y sus marcas (0, 25, 50…). */
export function escalaY(maximo: number, marcas = 4): { tope: number; marcas: number[] } {
  if (!(maximo > 0)) return { tope: marcas, marcas: Array.from({ length: marcas + 1 }, (_, i) => i) };
  const crudo = maximo / marcas;
  const potencia = 10 ** Math.floor(Math.log10(crudo));
  const paso = Math.max(1, ([1, 2, 2.5, 5, 10].find((f) => f * potencia >= crudo) ?? 10) * potencia);
  const tope = paso * Math.ceil(maximo / paso);
  const lista: number[] = [];
  for (let v = 0; v <= tope + paso / 2; v += paso) lista.push(Math.round(v * 100) / 100);
  return { tope, marcas: lista };
}

/** Quita acentos, mayúsculas y signos del final ("Contestar hoy." = "contestar hoy"). */
export function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-MX")
    .replace(/[\s.,;:!¡?¿…]+$/u, "")
    .replace(/\s+/g, " ")
    .trim();
}

const SIN_ACCION = new Set(["", "ninguna", "ninguna accion", "no aplica", "sin accion", "n/a", "na", "-"]);

/** La acción sugerida de un resumen, o null si Clara dijo "ninguna". */
export function accionValida(texto: string | null | undefined): string | null {
  if (!texto) return null;
  const limpio = texto.trim().replace(/[\s.]+$/u, "");
  return SIN_ACCION.has(normalizar(limpio)) ? null : limpio;
}

/** "Laura Méndez <laura@x.mx>" → nombre y correo; "laura@x.mx" → los dos iguales. */
export function partirRemitente(remitente: string | null | undefined): { clave: string; nombre: string; correo: string | null } | null {
  const texto = (remitente ?? "").trim();
  if (!texto) return null;
  const conAngulos = texto.match(/^(.*?)\s*<([^>]+)>\s*$/);
  const correo = (conAngulos ? conAngulos[2] : /^[^\s@]+@[^\s@]+$/.test(texto) ? texto : "").trim().toLowerCase() || null;
  const nombre = (conAngulos ? conAngulos[1] : texto).replace(/^["']|["']$/g, "").trim() || correo || texto;
  return { clave: correo ?? normalizar(nombre), nombre, correo };
}

/* ---------- El cálculo (puro) ---------- */

export type FilaMensaje = { creado_en: string; rol: string; conversacion_id: string; agente?: string | null };
export type FilaConversacion = { id: string; agente: string; participantes?: string[] | null };
export type FilaResumen = { remitente: string | null; accion_sugerida: string | null; creado_en: string };

export type EntradaEstadisticas = {
  periodo: Periodo;
  /** Hoy, en la hora de México. */
  hoy: Dia;
  mensajes: readonly FilaMensaje[];
  conversaciones: readonly FilaConversacion[];
  resumenes: readonly FilaResumen[];
  plan: { id: IdPlan; nombre: string; limite: number };
  /** Mensajes usados este mes (uso_mensual). */
  usados: number;
  /** Agentes de su equipo: salen en "Por agente" aunque no hayan tenido movimiento. */
  activos?: readonly IdAgente[];
  recortado?: boolean;
  zona?: string;
  /** Cuántas filas entran en cada lista. */
  tope?: number;
};

const puntoVacio = (dia: Dia): PuntoDia => ({ dia, mensajes: 0, conversaciones: 0, correos: 0, acciones: 0, uso: 0 });

function sumar(serie: PuntoDia[], m: IdMetrica) {
  return serie.reduce((t, p) => t + p[m], 0);
}

/**
 * Junta las filas en lo que muestra la vista. Cómo se cuenta:
 * - Mensajes: todos los del chat (tuyos y de tus agentes).
 * - Conversaciones: las que tuvieron al menos un mensaje ese día (en el
 *   total, cada una cuenta una vez aunque haya tenido movimiento varios días).
 * - Correos resumidos: cada resumen de Clara. Acciones sugeridas: los que
 *   traen una acción (no "ninguna").
 * - Uso: tus mensajes (cada uno cuenta para el plan; las respuestas no).
 * - Por agente: la respuesta cuenta para el agente que la escribió (en un
 *   grupo, el de esa intervención); tu mensaje, para el agente de la
 *   conversación.
 */
export function calcularEstadisticas(e: EntradaEstadisticas): DatosEstadisticas {
  const zona = e.zona ?? ZONA;
  const tope = e.tope ?? 8;
  const { actual, anterior } = rangos(e.periodo, e.hoy);
  const serie = actual.dias.map(puntoVacio);
  const serieAnterior = anterior.dias.map(puntoVacio);
  const indiceActual = new Map(actual.dias.map((d, i) => [d, i]));
  const indiceAnterior = new Map(anterior.dias.map((d, i) => [d, i]));

  const agenteDe = new Map(e.conversaciones.map((c) => [c.id, c.agente]));
  const convDia = [actual.dias.map(() => new Set<string>()), anterior.dias.map(() => new Set<string>())];
  const convTotal = [new Set<string>(), new Set<string>()];
  const porAgente = new Map<IdAgente, { mensajes: number; convs: Set<string> }>();
  const porHora = Array.from({ length: 24 }, () => 0);

  // Día y hora de cada instante. México tiene desfases de horas enteras:
  // basta con calcularlo una vez por hora UTC ("2026-11-04T16")
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

  // Ubica un instante en el periodo actual (0), el anterior (1) o fuera (-1), y su hora
  const ubicar = (fecha: string): [number, number, number] => {
    const [dia, hora] = enZona(fecha);
    const i = indiceActual.get(dia);
    if (i !== undefined) return [0, i, hora];
    const j = indiceAnterior.get(dia);
    return j !== undefined ? [1, j, hora] : [-1, -1, hora];
  };

  let hayMensajes = false;
  for (const m of e.mensajes) {
    const [cual, i, hora] = ubicar(m.creado_en);
    if (cual < 0) continue;
    hayMensajes = true;
    const punto = (cual === 0 ? serie : serieAnterior)[i];
    punto.mensajes += 1;
    if (m.rol === "user") punto.uso += 1;
    convDia[cual][i].add(m.conversacion_id);
    convTotal[cual].add(m.conversacion_id);
    if (cual !== 0) continue;
    porHora[hora] += 1;
    const quien = m.rol === "assistant" && esIdAgente(m.agente) ? m.agente : agenteDe.get(m.conversacion_id);
    if (esIdAgente(quien)) {
      const fila = porAgente.get(quien) ?? { mensajes: 0, convs: new Set<string>() };
      fila.mensajes += 1;
      fila.convs.add(m.conversacion_id);
      porAgente.set(quien, fila);
    }
  }
  convDia[0].forEach((s, i) => (serie[i].conversaciones = s.size));
  convDia[1].forEach((s, i) => (serieAnterior[i].conversaciones = s.size));

  let hayCorreos = false;
  const acciones = new Map<string, FilaAccionEst>();
  const remitentes = new Map<string, FilaRemitenteEst>();
  for (const r of e.resumenes) {
    const [cual, i] = ubicar(r.creado_en);
    if (cual < 0) continue;
    hayCorreos = true;
    const punto = (cual === 0 ? serie : serieAnterior)[i];
    punto.correos += 1;
    const accion = accionValida(r.accion_sugerida);
    if (accion) punto.acciones += 1;
    if (cual !== 0) continue;
    if (accion) {
      const clave = normalizar(accion);
      const fila = acciones.get(clave) ?? { texto: accion, total: 0 };
      fila.total += 1;
      acciones.set(clave, fila);
    }
    const quien = partirRemitente(r.remitente);
    if (quien) {
      const fila = remitentes.get(quien.clave) ?? { ...quien, total: 0 };
      fila.total += 1;
      remitentes.set(quien.clave, fila);
    }
  }

  const total = (serieX: PuntoDia[], cual: 0 | 1): Record<IdMetrica, number | null> => ({
    mensajes: hayMensajes ? sumar(serieX, "mensajes") : null,
    conversaciones: hayMensajes ? convTotal[cual].size : null,
    correos: hayCorreos ? sumar(serieX, "correos") : null,
    acciones: hayCorreos ? sumar(serieX, "acciones") : null,
    uso: hayMensajes || e.usados > 0 ? sumar(serieX, "uso") : null,
  });

  const orden = (a: IdAgente) => IDS_AGENTES.indexOf(a);
  for (const id of e.activos ?? []) if (!porAgente.has(id)) porAgente.set(id, { mensajes: 0, convs: new Set() });

  return {
    periodo: e.periodo,
    actual: { desde: actual.desde, hasta: actual.hasta },
    anterior: { desde: anterior.desde, hasta: anterior.hasta },
    serie,
    serieAnterior,
    totales: total(serie, 0),
    totalesAnteriores: total(serieAnterior, 1),
    porAgente: [...porAgente.entries()]
      .map(([agente, f]) => ({ agente, mensajes: f.mensajes, conversaciones: f.convs.size }))
      .sort((a, b) => b.mensajes - a.mensajes || orden(a.agente) - orden(b.agente)),
    acciones: [...acciones.values()].sort((a, b) => b.total - a.total || a.texto.localeCompare(b.texto, "es-MX")).slice(0, tope),
    remitentes: [...remitentes.values()].sort((a, b) => b.total - a.total || a.nombre.localeCompare(b.nombre, "es-MX")).slice(0, tope),
    porHora,
    plan: { ...e.plan, usados: e.usados, mes: `${e.hoy.slice(0, 7)}-01` },
    recortado: Boolean(e.recortado),
  };
}

/** ¿Hay algo que mostrar? (si no, la vista enseña el estado vacío). */
export function hayDatos(d: DatosEstadisticas) {
  return d.totales.mensajes !== null || d.totales.correos !== null;
}

/* ---------- A dónde lleva cada cosa ---------- */

export type DestinoEstadisticas =
  | { tipo: "periodo"; periodo: Periodo }
  | { tipo: "agente"; agente: IdAgente }
  | { tipo: "chat" }
  /** Correo, filtrado por quién lo mandó (el nombre, como en Pendientes). */
  | { tipo: "correo"; de?: string }
  /** Los correos que esperan algo de ti (una acción sugerida). */
  | { tipo: "pendientes"; accion?: string }
  | { tipo: "hora"; hora: number }
  | { tipo: "plan" };

/**
 * La dirección de cada destino dentro del panel (`base` = "/panel"). Los
 * filtros van en la URL (de, tipo, hora), así el botón de atrás regresa a
 * la vista anterior.
 */
export function enlaceEstadisticas(d: DestinoEstadisticas, base = "/panel"): string {
  const vista = (q: Record<string, string>) => `${base}?${new URLSearchParams(q)}`;
  switch (d.tipo) {
    case "periodo":
      return vista({ vista: "estadisticas", periodo: d.periodo });
    case "agente":
      return `${base}/chat?${new URLSearchParams({ agente: d.agente })}`;
    case "chat":
      return `${base}/chat`;
    case "correo":
      return vista(d.de ? { vista: "correo", de: d.de } : { vista: "correo" });
    case "pendientes":
      return vista({ vista: "pendientes", tipo: "correos" });
    case "hora":
      return vista({ vista: "actividad", hora: String(d.hora) });
    case "plan":
      return "/precios";
  }
}

/* ---------- La consulta (servidor) ---------- */

/** Filas por lectura (lo que Supabase entrega de una vez) y máximo de lecturas por tabla. */
const POR_PAGINA = 1000;
const PAGINAS = 8;

type Pagina<T> = PromiseLike<{ data: T[] | null; error: unknown }>;

/** Lee de mil en mil hasta acabar o llegar al máximo. Con error, se queda con lo que llevaba. */
async function leerPaginas<T>(pedir: (desde: number, hasta: number) => Pagina<T>): Promise<{ filas: T[]; recortado: boolean }> {
  const filas: T[] = [];
  for (let p = 0; p < PAGINAS; p++) {
    const { data, error } = await pedir(p * POR_PAGINA, (p + 1) * POR_PAGINA - 1);
    if (error) {
      console.error("estadísticas: no se pudo leer una página", error);
      return { filas, recortado: false };
    }
    filas.push(...(data ?? []));
    if (!data || data.length < POR_PAGINA) return { filas, recortado: false };
  }
  return { filas, recortado: true };
}

type CuentaEst = Pick<Cuenta, "plan" | "usados" | "activos">;

/**
 * Carga y agrupa las estadísticas de la cuenta para ese periodo.
 * `cuenta` es lo que da cargarCuenta() (src/lib/cuenta.ts): el plan, su
 * límite y el uso del mes (uso_mensual). Se puede pasar la promesa sin
 * esperarla, así todo se lee al mismo tiempo.
 */
export async function cargarEstadisticas(
  supabase: SupabaseClient,
  userId: string,
  periodo: Periodo,
  cuenta: CuentaEst | Promise<CuentaEst>,
  ahora: Date = new Date(),
): Promise<DatosEstadisticas> {
  const hoy = diaLocal(ahora);
  const { anterior } = rangos(periodo, hoy);
  const desde = inicioDia(anterior.desde).toISOString();

  const leerMensajes = leerPaginas<FilaMensaje>((a, b) =>
    supabase
      .from("mensajes")
      .select("creado_en, rol, conversacion_id, agente")
      .eq("owner_id", userId)
      .gte("creado_en", desde)
      // Lo más nuevo primero: si hay que cortar, se corta lo más viejo
      .order("creado_en", { ascending: false })
      .range(a, b),
  );

  // Toda conversación con un mensaje en el periodo se actualizó después de que empezó
  const leerConversaciones = leerPaginas<FilaConversacion>((a, b) =>
    supabase
      .from("conversaciones")
      .select("id, agente, participantes")
      .eq("owner_id", userId)
      .gte("actualizado_en", desde)
      .order("actualizado_en", { ascending: false })
      .range(a, b),
  );

  // resumenes_correo no tiene owner_id: se filtra por los negocios de la persona
  const leerResumenes = (async () => {
    const { data: negocios, error } = await supabase.from("negocios").select("id").eq("owner_id", userId);
    if (error) console.error("estadísticas: no se pudieron leer los negocios", error);
    const ids = (negocios ?? []).map((n) => n.id as string);
    if (!ids.length) return { filas: [] as FilaResumen[], recortado: false };
    return leerPaginas<FilaResumen>((a, b) =>
      supabase
        .from("resumenes_correo")
        .select("remitente, accion_sugerida, creado_en")
        .in("negocio_id", ids)
        .gte("creado_en", desde)
        .order("creado_en", { ascending: false })
        .range(a, b),
    );
  })();

  const [mensajes, conversaciones, resumenes, c] = await Promise.all([leerMensajes, leerConversaciones, leerResumenes, cuenta]);

  return calcularEstadisticas({
    periodo,
    hoy,
    mensajes: mensajes.filas,
    conversaciones: conversaciones.filas,
    resumenes: resumenes.filas,
    plan: { id: c.plan.id, nombre: c.plan.nombre, limite: c.plan.mensajesMes },
    usados: c.usados,
    activos: c.activos,
    recortado: mensajes.recortado || resumenes.recortado,
  });
}
