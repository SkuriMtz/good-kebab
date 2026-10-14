import type { IdAgente } from "@/lib/agentes";
import type { DiaActividad } from "./tipos";

/*
 * Cuentas de la gráfica de actividad (la cuadrícula de días). Funciones
 * puras: las usan la demostración y el panel real por igual.
 * Las fechas van como texto AAAA-MM-DD y se leen en UTC para que el día
 * no se corra con la zona horaria de quien mira.
 */

export type Filtro = IdAgente | "todos";

const DIA_MS = 86_400_000;

export const aFecha = (iso: string) => new Date(`${iso}T00:00:00Z`);
export const aIso = (d: Date) => d.toISOString().slice(0, 10);
export const sumarDias = (iso: string, n: number) => aIso(new Date(aFecha(iso).getTime() + n * DIA_MS));

/** Lunes = 0 … domingo = 6 (la semana empieza en lunes, como en México). */
export const diaSemana = (iso: string) => (aFecha(iso).getUTCDay() + 6) % 7;

export function totalDia(d: DiaActividad, filtro: Filtro) {
  if (filtro !== "todos") return d.porAgente[filtro] ?? 0;
  let t = 0;
  for (const v of Object.values(d.porAgente)) t += v ?? 0;
  return t;
}

export function totalRango(dias: DiaActividad[], filtro: Filtro) {
  return dias.reduce((s, d) => s + totalDia(d, filtro), 0);
}

/** Los últimos `n` días como números (del más viejo a hoy). */
export function serie(dias: DiaActividad[], filtro: Filtro, n: number) {
  return dias.slice(-n).map((d) => totalDia(d, filtro));
}

/** Suma de los últimos `n` días y de los `n` anteriores (para el cambio). */
export function periodo(dias: DiaActividad[], filtro: Filtro, n: number) {
  const actual = totalRango(dias.slice(-n), filtro);
  const previos = dias.slice(-2 * n, -n);
  return { actual, anterior: previos.length === n ? totalRango(previos, filtro) : undefined };
}

/**
 * Acomoda los días en columnas de semana (lunes a domingo). La primera
 * columna se rellena con huecos antes del primer día; la última termina en hoy.
 */
export function columnas(dias: DiaActividad[]): (DiaActividad | null)[][] {
  if (!dias.length) return [];
  const cols: (DiaActividad | null)[][] = [];
  let col: (DiaActividad | null)[] = Array.from({ length: diaSemana(dias[0].fecha) }, () => null);
  for (const d of dias) {
    col.push(d);
    if (col.length === 7) {
      cols.push(col);
      col = [];
    }
  }
  if (col.length) cols.push([...col, ...Array.from({ length: 7 - col.length }, () => null)]);
  return cols;
}

/**
 * Cinco niveles de intensidad (0 = nada). Los cortes salen de los días con
 * actividad: así una semana floja no se ve igual que un día sin nada.
 */
export function cortes(valores: number[]) {
  const con = valores.filter((v) => v > 0).sort((a, b) => a - b);
  if (!con.length) return [1, 1, 1];
  const q = (p: number) => con[Math.min(con.length - 1, Math.floor(p * con.length))];
  return [q(0.25), q(0.5), q(0.75)];
}

export function nivel(v: number, c: number[]): 0 | 1 | 2 | 3 | 4 {
  if (v <= 0) return 0;
  if (v <= c[0]) return 1;
  if (v <= c[1]) return 2;
  if (v <= c[2]) return 3;
  return 4;
}

/** Días consecutivos desde `desde` hasta `hasta` (incluidos), con las cuentas que haya. */
export function rellenar(desde: string, hasta: string, cuentas: Map<string, Partial<Record<IdAgente, number>>>): DiaActividad[] {
  const dias: DiaActividad[] = [];
  for (let f = desde; f <= hasta; f = sumarDias(f, 1)) dias.push({ fecha: f, porAgente: cuentas.get(f) ?? {} });
  return dias;
}

const fmtNumero = new Intl.NumberFormat("es-MX");
export const numero = (n: number) => fmtNumero.format(n);

const fmtDiaLargo = new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const fmtMesCorto = new Intl.DateTimeFormat("es-MX", { month: "short", timeZone: "UTC" });
const fmtMesLargo = new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric", timeZone: "UTC" });

/** "jueves 8 de octubre" */
export const diaLargo = (iso: string) => fmtDiaLargo.format(aFecha(iso)).replace(",", "");
/** "oct" (sin punto) */
export const mesCorto = (iso: string) => fmtMesCorto.format(aFecha(iso)).replace(".", "");
/** "octubre de 2026" */
export const mesLargo = (iso: string) => fmtMesLargo.format(aFecha(iso));

/** Cambio entre dos periodos, en texto corto ("+12%"); sin base, nada. */
export function cambio(actual: number, anterior?: number) {
  if (anterior === undefined || anterior === 0) return null;
  const p = Math.round(((actual - anterior) / anterior) * 100);
  return { porcentaje: p, texto: `${p > 0 ? "+" : p < 0 ? "−" : ""}${Math.abs(p)}%` };
}
