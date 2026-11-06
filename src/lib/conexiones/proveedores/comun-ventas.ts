import { argNumero, argTexto, ErrorArgs, linea, recortar } from "../http";
import { ErrorApi } from "../oauth";

/**
 * Piezas comunes de los adaptadores de pagos, ventas y facturación (Stripe,
 * Mercado Pago, Mercado Libre, Shopify, Tiendanube y Facturapi):
 * - `dinero`: montos con formato de México ("$1,234.50 MXN").
 * - `consultar`: corre una herramienta con tope de tiempo y errores amables.
 * - `argDias`, `argLimite`, `argOpcion`: argumentos que se repiten.
 * Nunca se registra una respuesta, un token ni una llave.
 */

const NUMERO_MX = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const ENTERO_MX = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 0 });

/** Monedas sin centavos en Stripe (el monto ya viene en unidades). */
const SIN_DECIMALES = new Set(["bif", "clp", "djf", "gnf", "jpy", "kmf", "krw", "mga", "pyg", "rwf", "ugx", "vnd", "vuv", "xaf", "xof", "xpf"]);

/** "$1,234.50 MXN" (o "1,234.50 USD" en otra moneda). Sin dato, "monto no disponible". */
export function dinero(monto: unknown, moneda: unknown = "MXN"): string {
  const n = typeof monto === "number" ? monto : typeof monto === "string" && monto.trim() ? Number(monto) : NaN;
  if (!Number.isFinite(n)) return "monto no disponible";
  const m = (typeof moneda === "string" && /^[a-z]{3}$/i.test(moneda) ? moneda : "MXN").toUpperCase();
  const signo = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  return m === "MXN" ? `${signo}$${NUMERO_MX.format(abs)} MXN` : `${signo}${NUMERO_MX.format(abs)} ${m}`;
}

/** Stripe manda los montos en la unidad menor (centavos). */
export function desdeCentavos(monto: unknown, moneda: unknown): number {
  const n = Number(monto);
  if (!Number.isFinite(n)) return NaN;
  return typeof moneda === "string" && SIN_DECIMALES.has(moneda.toLowerCase()) ? n : n / 100;
}

/** Suma por moneda → "$12,300.00 MXN + 40.00 USD". */
export function totales(porMoneda: Map<string, number>): string {
  if (!porMoneda.size) return dinero(0);
  return Array.from(porMoneda.entries())
    .map(([m, v]) => dinero(v, m))
    .join(" + ");
}

export function sumar(mapa: Map<string, number>, moneda: unknown, monto: number) {
  if (!Number.isFinite(monto)) return;
  const m = (typeof moneda === "string" && moneda ? moneda : "MXN").toUpperCase();
  mapa.set(m, (mapa.get(m) ?? 0) + monto);
}

export const entero = (n: unknown) => (Number.isFinite(Number(n)) ? ENTERO_MX.format(Number(n)) : "0");

/* ---------------- Argumentos ---------------- */

export const argDias = (args: Record<string, unknown>, max = 90, omision = 30) => argNumero(args, "dias", { min: 1, max, omision });
export const argLimite = (args: Record<string, unknown>, max = 50, omision = 20) => argNumero(args, "limite", { min: 1, max, omision });

/** Un texto que solo puede ser uno de `opciones` (o vacío → `omision`). */
export function argOpcion<T extends string>(args: Record<string, unknown>, nombre: string, opciones: readonly T[], omision: T): T {
  const v = argTexto(args, nombre, { max: 40 }).toLowerCase();
  if (!v) return omision;
  if (!(opciones as readonly string[]).includes(v)) throw new ErrorArgs(`"${nombre}" tiene que ser uno de: ${opciones.join(", ")}.`);
  return v as T;
}

/** Hace N días, en ISO (UTC). */
export const haceDias = (dias: number, ahora = Date.now()) => new Date(ahora - dias * 86_400_000);

export const propDias = (max: number, omision = 30) => ({ type: "integer", minimum: 1, maximum: max, description: `Cuántos días hacia atrás (por omisión ${omision}).` });
export const propLimite = (max = 50, omision = 20) => ({ type: "integer", minimum: 1, maximum: max, description: `Cuántos resultados como máximo (por omisión ${omision}).` });

/* ---------------- Ejecutar con tope de tiempo y errores amables ---------------- */

/** Lo más que espera una herramienta a su proveedor. */
export const TOPE_MS = 15_000;

/** La señal del chat más un tope propio: lo que pase primero corta la consulta. */
export const conTope = (senal: AbortSignal, ms = TOPE_MS) => AbortSignal.any([senal, AbortSignal.timeout(ms)]);

/**
 * Corre la consulta y deja el texto en máximo 4000 caracteres. Los errores
 * salen como ErrorArgs con un mensaje que el modelo puede repetir tal cual,
 * salvo el 401: ese sigue de largo para que el ciclo renueve el token y
 * reintente (o marque la conexión como vencida).
 */
export async function consultar(nombreApp: string, senal: AbortSignal, fn: (senal: AbortSignal) => Promise<string>): Promise<string> {
  const s = conTope(senal);
  try {
    // recortar() agrega "… (recortado)" (12 caracteres más): así el total queda en 4000
    return recortar(await fn(s), 4000 - 12);
  } catch (e) {
    if (e instanceof ErrorArgs) throw e;
    if (e instanceof ErrorApi) {
      if (e.status === 401) throw e;
      if (e.status === 403) throw new ErrorArgs(`${nombreApp} no dio permiso para ver esto. Revisa en ${nombreApp} que la conexión de Atendel tenga permiso de lectura para esta información.`);
      if (e.status === 404) throw new ErrorArgs(`${nombreApp} no encontró lo que se buscó.`);
      if (e.status === 429) throw new ErrorArgs(`${nombreApp} está recibiendo muchas consultas. Intenta de nuevo en un minuto.`);
      if (e.status >= 500) throw new ErrorArgs(`${nombreApp} no está respondiendo bien ahora. Intenta más tarde.`);
      throw new ErrorArgs(`${nombreApp} no aceptó la consulta (${linea(e.message, 160)}).`);
    }
    const nombre = e instanceof Error ? e.name : "";
    if (nombre === "AbortError" || nombre === "TimeoutError" || s.aborted) throw new ErrorArgs(`${nombreApp} tardó demasiado en responder. Intenta de nuevo.`);
    throw new ErrorArgs(`No se pudo consultar ${nombreApp} en este momento.`);
  }
}

/** Para validar llaves y leer la cuenta (fuera del chat): solo un tope de tiempo. */
export const senalCorta = (ms = 10_000) => AbortSignal.timeout(ms);
