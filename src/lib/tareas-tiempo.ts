/**
 * El reloj de las Tareas (migración 0020): cuándo le toca otra vez a una
 * tarea, en la zona horaria del dueño, y cómo se dice en palabras ("Cada
 * martes a las 15:00"). Sirve en el servidor y en el navegador.
 */

export type TipoTarea = "una_vez" | "diaria" | "semanal" | "mensual";
export type Frecuencia = {
  tipo: TipoTarea;
  /** Días de la semana (0 = domingo … 6 = sábado), para "semanal". */
  dias: number[];
  /** Día del mes (1 a 31) o -1 = el último, para "mensual". */
  dia_mes: number | null;
  /** AAAA-MM-DD, para "una_vez". */
  fecha: string | null;
  /** HH:MM (24 h). */
  hora: string;
  zona: string;
};

export const NOMBRES_DIA = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

/** Qué hora marca el reloj en esa zona (para pasar de hora local a UTC). */
function desfase(zona: string, instante: number): number {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: zona, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" })
      .formatToParts(new Date(instante))
      .map((x) => [x.type, x.value]),
  );
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - instante;
}

/** Una fecha y hora en la zona del dueño → el instante en UTC (con horario de verano, si lo hay). */
function aUtc(y: number, m: number, d: number, hh: number, mm: number, zona: string): number {
  const ingenuo = Date.UTC(y, m, d, hh, mm);
  const primero = ingenuo - desfase(zona, ingenuo);
  return ingenuo - desfase(zona, primero);
}

/** La fecha de hoy en esa zona: [año, mes (0-11), día]. */
function hoyEn(zona: string, instante: number): [number, number, number] {
  const f = new Intl.DateTimeFormat("en-CA", { timeZone: zona, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(instante));
  const [y, m, d] = f.split("-").map(Number);
  return [y, m - 1, d];
}

export function zonaValida(zona: unknown): string {
  if (typeof zona !== "string" || !zona) return "America/Mexico_City";
  try {
    new Intl.DateTimeFormat("es-MX", { timeZone: zona });
    return zona;
  } catch {
    return "America/Mexico_City";
  }
}

/** ¿La frecuencia está bien? Regresa un error en palabras o null. */
export function errorFrecuencia(f: Frecuencia): string | null {
  if (!HORA.test(f.hora)) return "La hora debe ser HH:MM (24 horas), por ejemplo 15:00.";
  if (f.tipo === "una_vez" && !(f.fecha && FECHA.test(f.fecha))) return "Falta la fecha (AAAA-MM-DD).";
  if (f.tipo === "semanal" && (!f.dias.length || f.dias.some((d) => !Number.isInteger(d) || d < 0 || d > 6))) return "Faltan los días de la semana.";
  if (f.tipo === "mensual" && !(f.dia_mes === -1 || (Number.isInteger(f.dia_mes) && (f.dia_mes as number) >= 1 && (f.dia_mes as number) <= 31))) return "Falta el día del mes (1 a 31, o el último).";
  return null;
}

/** La siguiente vez después de `desde` (UTC, ISO), o null si ya no toca (una vez, en el pasado). */
export function siguienteVez(f: Frecuencia, desde = Date.now()): string | null {
  if (errorFrecuencia(f)) return null;
  const zona = zonaValida(f.zona);
  const [hh, mm] = f.hora.split(":").map(Number);
  if (f.tipo === "una_vez") {
    const [y, m, d] = (f.fecha as string).split("-").map(Number);
    const t = aUtc(y, m - 1, d, hh, mm, zona);
    return t > desde ? new Date(t).toISOString() : null;
  }
  const [y0, m0, d0] = hoyEn(zona, desde);
  for (let i = 0; i < 400; i++) {
    const dia = new Date(Date.UTC(y0, m0, d0 + i));
    const y = dia.getUTCFullYear();
    const m = dia.getUTCMonth();
    const d = dia.getUTCDate();
    const ultimo = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    const toca =
      f.tipo === "diaria" ||
      (f.tipo === "semanal" && f.dias.includes(dia.getUTCDay())) ||
      (f.tipo === "mensual" && (f.dia_mes === -1 ? d === ultimo : d === Math.min(f.dia_mes as number, ultimo)));
    if (!toca) continue;
    const t = aUtc(y, m, d, hh, mm, zona);
    if (t > desde) return new Date(t).toISOString();
  }
  return null;
}

/** En palabras: "Cada martes y jueves a las 15:00", "El último día de cada mes a las 9:00". */
export function frecuenciaEnPalabras(f: Pick<Frecuencia, "tipo" | "dias" | "dia_mes" | "fecha" | "hora">): string {
  const hora = `a las ${f.hora.replace(/^0(\d)/, "$1")}`;
  if (f.tipo === "diaria") return `Todos los días ${hora}`;
  if (f.tipo === "semanal") {
    const dias = [...f.dias].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map((d) => NOMBRES_DIA[d]);
    const lista = dias.length > 1 ? `${dias.slice(0, -1).join(", ")} y ${dias.at(-1)}` : dias[0];
    return `Cada ${lista} ${hora}`;
  }
  if (f.tipo === "mensual") return f.dia_mes === -1 ? `El último día de cada mes ${hora}` : `El día ${f.dia_mes} de cada mes ${hora}`;
  if (f.fecha) {
    const t = new Date(`${f.fecha}T12:00:00Z`);
    return `El ${new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(t)} ${hora}`;
  }
  return `Una vez ${hora}`;
}

/** "el martes 18 de noviembre, 15:00" en la zona del dueño. */
export function cuandoEnPalabras(iso: string, zona: string): string {
  return new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit", hourCycle: "h23", timeZone: zonaValida(zona) }).format(new Date(iso));
}
