import { fechaMx } from "../http";
import { ErrorOAuth } from "../oauth";
import { ErrorProveedor, argTexto, pedirJson } from "./_comun-1";

/**
 * Piezas comunes de los adaptadores de pagos en México y contabilidad
 * (PayPal, Conekta, Openpay, Square, Facturama, Alegra, Holded y QuickBooks).
 * Se apoyan en _comun-1 (pedir con errores amables, herramienta, esquema) y
 * agregan lo que comparten estos ocho:
 * - `dinero`: montos legibles con su moneda ("$1,234.50 MXN");
 * - `partirLlave`: llaves de dos partes ("clientId:secret", "usuario:contraseña");
 * - `pedirToken3`: POST de tokens (formulario o JSON) que, al renovar, traduce
 *   el rechazo del proveedor a ErrorOAuth("invalid_grant");
 * - fechas y argumentos de rango.
 * Nada de esto escribe en los logs ni pone llaves en los mensajes.
 */

/** "$1,234.50 MXN". Con `centavos`, el valor viene en la unidad mínima (Conekta, Square). */
export function dinero(valor: unknown, moneda?: string | null, o: { centavos?: boolean } = {}): string {
  const n = typeof valor === "number" ? valor : typeof valor === "string" && valor.trim() !== "" ? Number(valor) : NaN;
  if (!Number.isFinite(n)) return "";
  const v = o.centavos ? n / 100 : n;
  const m = (typeof moneda === "string" && /^[A-Za-z]{3}$/.test(moneda) ? moneda : "MXN").toUpperCase();
  return `${v < 0 ? "-" : ""}$${Math.abs(v).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${m}`;
}

/** Fecha y hora de México. Acepta ISO, ms o segundos (epoch de Conekta). */
export function fecha3(valor: unknown, soloDia = false): string {
  if (typeof valor === "number" && valor > 0 && valor < 1e12) return fechaMx(valor * 1000, soloDia);
  return fechaMx(valor, soloDia);
}

/**
 * Llave de dos partes separadas por ":" (se parte en los PRIMEROS dos puntos:
 * la contraseña puede traer más). Si no viene así, un error que solo dice el
 * formato esperado, nunca lo que se pegó.
 */
export function partirLlave(llave: string, nombre: string, formato: string): [string, string] {
  const t = llave.trim();
  const i = t.indexOf(":");
  const a = i > 0 ? t.slice(0, i).trim() : "";
  const b = i > 0 ? t.slice(i + 1).trim() : "";
  if (!a || !b) throw new ErrorProveedor(`Pega tu llave de ${nombre} así: ${formato}.`);
  return [a, b];
}

/** "Basic …" con dos partes. */
export const basic3 = (a: string, b: string) => `Basic ${Buffer.from(`${a}:${b}`).toString("base64")}`;

/** AAAA-MM-DD en la Ciudad de México, `dias` atrás de `ahora`. */
export function diaMx(diasAtras = 0, ahora = Date.now()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(new Date(ahora - diasAtras * 86_400_000));
}

const SOLO_DIA = /^\d{4}-\d{2}-\d{2}$/;

/** Un argumento de fecha AAAA-MM-DD (vacío si no viene). */
export function argDia(args: Record<string, unknown>, nombre: string): string {
  const v = argTexto(args, nombre, 10);
  if (!v) return "";
  if (!SOLO_DIA.test(v) || Number.isNaN(new Date(`${v}T12:00:00Z`).getTime())) throw new ErrorProveedor(`"${nombre}" tiene que ser una fecha AAAA-MM-DD.`);
  return v;
}

/** Inicio (00:00) o fin (23:59:59) de un día de México en ISO con desfase. */
export const isoMx = (dia: string, fin = false) => `${dia}T${fin ? "23:59:59" : "00:00:00"}-06:00`;

/** Texto de búsqueda en minúsculas y sin acentos, para filtrar del lado de Atendel. */
export const sinAcentos = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** Un código de error corto y seguro de una respuesta de tokens (invalid_grant, UNAUTHORIZED…). */
function codigoOAuth(c: unknown): string {
  const o = (c ?? {}) as { error?: unknown; type?: unknown; errors?: { code?: unknown }[] };
  const v = typeof o.error === "string" ? o.error : Array.isArray(o.errors) && typeof o.errors[0]?.code === "string" ? o.errors[0].code : typeof o.type === "string" ? o.type : "";
  return /^[A-Za-z_.]{3,60}$/.test(v) ? v : "";
}

/**
 * POST a un endpoint de tokens (código, refresh o client credentials).
 * - `renovando`: si el proveedor responde 400/401 (o invalid_grant), el
 *   permiso ya no sirve → ErrorOAuth("invalid_grant") y el marco marca la
 *   conexión para volver a conectar.
 * - Sin respuesta → "red"; otro rechazo → "rechazo".
 * El mensaje solo lleva el código estándar, nunca el token ni la llave.
 */
export async function pedirToken3<T extends { access_token?: string }>(
  nombre: string,
  url: string,
  p: { cuerpo: string | URLSearchParams; encabezados: Record<string, string>; renovando?: boolean },
): Promise<T> {
  let caduco = false;
  let datos: T;
  try {
    datos = await pedirJson<T>(nombre, url, {
      metodo: "POST",
      cuerpo: p.cuerpo,
      encabezados: { Accept: "application/json", ...p.encabezados },
      interpretar: (estado, c) => {
        const codigo = codigoOAuth(c);
        caduco = codigo === "invalid_grant" || (!!p.renovando && (estado === 400 || estado === 401));
        return `${nombre} no aceptó ${p.renovando ? "renovar el permiso" : "la conexión"}${codigo ? ` (${codigo})` : ""}. Vuelve a conectar.`;
      },
    });
  } catch (e) {
    const status = e instanceof ErrorProveedor ? e.status : 0;
    throw new ErrorOAuth(caduco ? "invalid_grant" : status ? "rechazo" : "red", e instanceof Error ? e.message : `No pude hablar con ${nombre}.`);
  }
  if (!datos || typeof datos.access_token !== "string" || !datos.access_token) {
    throw new ErrorOAuth("rechazo", `${nombre} no regresó el permiso de acceso. Intenta conectar de nuevo.`);
  }
  return datos;
}

/** Mensaje para una llave que el proveedor no reconoció (sin repetir la llave). */
export const llaveRechazada = (nombre: string, donde: string) =>
  new ErrorProveedor(`${nombre} no reconoció esa llave. Revisa que la copiaste completa (${donde}).`, 401);
