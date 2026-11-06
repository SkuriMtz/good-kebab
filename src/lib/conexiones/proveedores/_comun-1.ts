import type { IdAgente } from "@/lib/agentes";
import type { Herramienta, IdApp, Tokens } from "@/lib/nucleo-tipos";
import { ErrorArgs } from "../http";
import { ErrorOAuth } from "../oauth";

/**
 * Piezas comunes de los adaptadores de Meta, Telegram, Calendly, Zoom,
 * Dropbox, Slack, Trello, Airtable y HubSpot.
 *
 * - `pedir`: fetch con tiempo máximo y la señal del chat, sin caché de Next,
 *   y con errores AMABLES: nunca llevan la URL, el token ni lo que respondió
 *   el proveedor (solo el estado HTTP traducido a palabras).
 * - `herramienta`: envuelve una herramienta de solo lectura para que su
 *   resultado salga en texto compacto recortado a 4000 caracteres y para que
 *   cualquier error inesperado se vuelva un mensaje amable.
 * Nada de esto escribe en los logs.
 *
 * Con el marco de D:
 * - ErrorProveedor es un ErrorArgs (el ciclo le pasa su mensaje al modelo tal
 *   cual) y lleva `status`: con 401 el marco renueva el token y reintenta.
 * - `pedirToken` lanza ErrorOAuth: "invalid_grant" hace que el marco marque
 *   la conexión como vencida; "rechazo" y "red" se reintentan después.
 */

export const MAX_RESULTADO = 4000;
const TIEMPO_MAX_MS = 15_000;

/** Error con un mensaje que se puede mostrar a la persona (y al modelo) tal cual. `status` es el HTTP (0 si no aplica). */
export class ErrorProveedor extends ErrorArgs {
  readonly status: number;
  constructor(mensaje: string, status = 0) {
    super(mensaje);
    this.name = "ErrorProveedor";
    this.status = status;
  }
}

/* ---------------- Texto ---------------- */

/** Recorta el resultado de una herramienta (y lo marca si se recortó). */
export function recortar(texto: string, max = MAX_RESULTADO): string {
  const t = texto.trim();
  if (t.length <= max) return t;
  const marca = "\n… (recortado)";
  return t.slice(0, max - marca.length).trimEnd() + marca;
}

/** Un valor en una sola línea, sin espacios de más y con largo máximo. */
export function linea(v: unknown, max = 200): string {
  if (v === null || v === undefined) return "";
  const s = String(v).replace(/\s+/g, " ").trim();
  return s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s;
}

/** Junta las partes no vacías con " · ". */
export function unir(...partes: unknown[]): string {
  return partes
    .map((p) => (typeof p === "string" ? p.trim() : p === null || p === undefined ? "" : String(p)))
    .filter(Boolean)
    .join(" · ");
}

/** Minúsculas y sin acentos, para comparar búsquedas. */
export function normalizar(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

const FORMATO_FECHA = new Intl.DateTimeFormat("es-MX", {
  timeZone: "America/Mexico_City",
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** Fecha legible en hora del centro de México ("mié, 5 nov 2026, 10:30"). Acepta ISO, ms o segundos. */
export function fecha(v: string | number | null | undefined): string {
  if (v === null || v === undefined || v === "") return "";
  let d: Date;
  if (typeof v === "number") d = new Date(v < 1e12 ? v * 1000 : v);
  else if (/^\d+(\.\d+)?$/.test(v)) d = new Date(Number(v) * 1000);
  else d = new Date(v);
  return Number.isNaN(d.getTime()) ? "" : FORMATO_FECHA.format(d);
}

/* ---------------- Argumentos de las herramientas ---------------- */

export function argTexto(args: Record<string, unknown>, clave: string, max = 300): string {
  const v = args?.[clave];
  if (typeof v !== "string" && typeof v !== "number") return "";
  return String(v).trim().slice(0, max);
}

export function argEntero(args: Record<string, unknown>, clave: string, porDefecto: number, min: number, max: number): number {
  const n = Number(args?.[clave]);
  if (!Number.isFinite(n)) return porDefecto;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/* ---------------- Variables de Vercel ---------------- */

/** El valor de una variable del servidor; si falta, un error que solo dice su NOMBRE. */
export function variable(nombre: string): string {
  const v = process.env[nombre]?.trim();
  if (!v) throw new ErrorProveedor(`Falta configurar ${nombre} en Vercel.`);
  return v;
}

/* ---------------- HTTP ---------------- */

export function mensajePorEstado(nombre: string, estado: number): string {
  if (estado === 400) return `${nombre} no aceptó la consulta. Revisa los datos que pediste.`;
  if (estado === 401) return `La conexión con ${nombre} ya no es válida. Vuelve a conectarla en Tu negocio › Apps.`;
  if (estado === 403) return `${nombre} no dio permiso para ver esto. Revisa los permisos de la conexión.`;
  if (estado === 404) return `${nombre} no encontró lo que pediste.`;
  if (estado === 429) return `${nombre} pidió esperar un poco antes de más consultas. Intenta de nuevo en un minuto.`;
  if (estado >= 500) return `${nombre} no respondió bien. Intenta de nuevo en un rato.`;
  return `No pude consultar ${nombre} (error ${estado}).`;
}

export type Pedido = {
  metodo?: "GET" | "POST" | "DELETE";
  encabezados?: Record<string, string>;
  cuerpo?: string | URLSearchParams;
  /** La señal del chat (ctx.senal): si la persona cancela, se corta. */
  senal?: AbortSignal;
  tiempoMs?: number;
  /**
   * Para proveedores que explican el error en el cuerpo (Meta, Telegram,
   * Slack…): recibe el estado y el JSON (si lo hay) y regresa un mensaje
   * amable, o undefined para usar el mensaje por estado.
   */
  interpretar?: (estado: number, cuerpo: unknown) => string | { mensaje: string; status: number } | undefined;
};

/** fetch con tiempo máximo, sin caché y con errores amables. Lanza ErrorProveedor si el estado no es 2xx. */
export async function pedir(nombre: string, url: string, p: Pedido = {}): Promise<Response> {
  const senales = [AbortSignal.timeout(p.tiempoMs ?? TIEMPO_MAX_MS)];
  if (p.senal) senales.push(p.senal);
  let r: Response;
  try {
    r = await fetch(url, {
      method: p.metodo ?? "GET",
      headers: p.encabezados,
      body: p.cuerpo,
      signal: AbortSignal.any(senales),
      cache: "no-store",
    });
  } catch {
    if (p.senal?.aborted) throw new ErrorProveedor(`Se canceló la consulta a ${nombre}.`);
    if (senales[0].aborted) throw new ErrorProveedor(`${nombre} tardó demasiado en responder. Intenta de nuevo en un momento.`);
    throw new ErrorProveedor(`No pude comunicarme con ${nombre}. Intenta de nuevo en un momento.`);
  }
  if (r.ok) return r;
  let mensaje: string | undefined;
  let status = r.status;
  if (p.interpretar) {
    let cuerpo: unknown = null;
    try {
      cuerpo = JSON.parse((await r.text()).slice(0, 20_000));
    } catch {
      cuerpo = null;
    }
    const dicho = p.interpretar(r.status, cuerpo);
    if (typeof dicho === "object") ({ mensaje, status } = dicho);
    else mensaje = dicho;
  } else {
    await r.body?.cancel().catch(() => undefined);
  }
  throw new ErrorProveedor(mensaje ?? mensajePorEstado(nombre, status), status);
}

/** Como `pedir`, pero regresa el JSON. */
export async function pedirJson<T>(nombre: string, url: string, p: Pedido = {}): Promise<T> {
  const r = await pedir(nombre, url, p);
  try {
    return (await r.json()) as T;
  } catch {
    throw new ErrorProveedor(`${nombre} respondió algo que no entendí. Intenta de nuevo en un momento.`);
  }
}

/** Arma un querystring sin los valores vacíos. */
export function consulta(params: Record<string, string | number | boolean | undefined | null>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
  const s = q.toString();
  return s ? `?${s}` : "";
}

/* ---------------- OAuth ---------------- */

export const basico = (id: string, secreto: string) => `Basic ${Buffer.from(`${id}:${secreto}`).toString("base64")}`;

export const formulario = (campos: Record<string, string | undefined>) => {
  const f = new URLSearchParams();
  for (const [k, v] of Object.entries(campos)) if (v !== undefined && v !== "") f.set(k, v);
  return f;
};

export const expiraEn = (segundos: unknown): number | undefined => {
  const s = Number(segundos);
  return Number.isFinite(s) && s > 0 ? Date.now() + s * 1000 : undefined;
};

type RespuestaToken = { access_token?: string; refresh_token?: string; expires_in?: number | string; error?: string };

/**
 * POST al endpoint de tokens (código o refresh). Si el proveedor lo rechaza
 * lanza ErrorOAuth: "invalid_grant" (el permiso venció o se revocó; también
 * si `vencido` lo dice), "red" si no se pudo hablar con él y "rechazo" en lo
 * demás. El mensaje dice solo el código OAuth estándar, nunca el token.
 */
export async function pedirToken<T extends RespuestaToken>(
  nombre: string,
  url: string,
  cuerpo: URLSearchParams,
  encabezados: Record<string, string> = {},
  vencido?: (estado: number, cuerpo: unknown) => boolean,
): Promise<T> {
  let codigo = "";
  let caduco = false;
  let datos: T;
  try {
    datos = await pedirJson<T>(nombre, url, {
      metodo: "POST",
      cuerpo,
      encabezados: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json", ...encabezados },
      interpretar: (estado, c) => {
        const e = (c as RespuestaToken | null)?.error;
        codigo = typeof e === "string" && /^[a-z_]{3,40}$/.test(e) ? e : "";
        caduco = codigo === "invalid_grant" || !!vencido?.(estado, c);
        return `${nombre} no aceptó la conexión${codigo ? ` (${codigo})` : ""}. Intenta conectar de nuevo.`;
      },
    });
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : `No pude hablar con ${nombre}.`;
    const status = e instanceof ErrorProveedor ? e.status : 0;
    throw new ErrorOAuth(caduco ? "invalid_grant" : status ? "rechazo" : "red", mensaje);
  }
  if (!datos?.access_token) throw new ErrorOAuth("rechazo", `${nombre} no regresó el permiso de acceso. Intenta conectar de nuevo.`);
  return datos;
}

/** Para `renovar` sin refresh token: el marco marca la conexión como vencida. */
export const sinRenovacion = (nombre: string) => new ErrorOAuth("invalid_grant", `La conexión con ${nombre} venció. Vuelve a conectarla.`);

/* ---------------- Herramientas ---------------- */

type DefHerramienta = {
  nombre: string;
  descripcion: string;
  app: IdApp;
  agentes: IdAgente[];
  esquema: Record<string, unknown>;
  /** Nombre del proveedor para los mensajes ("Dropbox", "Slack"…). */
  proveedor: string;
  ejecutar(args: Record<string, unknown>, ctx: { token: () => Promise<Tokens>; senal: AbortSignal }): Promise<string>;
};

/**
 * Envuelve una herramienta de solo lectura: el resultado sale recortado y,
 * si algo inesperado falla, el error es amable. Los errores de `ctx.token()`
 * (del marco: conexión vencida, etc.) pasan sin tocarse.
 */
export function herramienta(d: DefHerramienta): Herramienta {
  return {
    nombre: d.nombre,
    descripcion: d.descripcion,
    app: d.app,
    agentes: d.agentes,
    esquema: d.esquema,
    async ejecutar(args, ctx) {
      const delMarco = new WeakSet<object>();
      const token = () =>
        ctx.token().catch((e: unknown) => {
          if (e && typeof e === "object") delMarco.add(e);
          throw e;
        });
      try {
        const texto = await d.ejecutar(args && typeof args === "object" ? args : {}, { token, senal: ctx.senal });
        return recortar(texto || "Sin resultados.");
      } catch (e) {
        if (e instanceof ErrorProveedor) throw e;
        if (e && typeof e === "object" && delMarco.has(e)) throw e;
        throw new ErrorProveedor(`No pude consultar ${d.proveedor} en este momento. Intenta de nuevo en un rato.`);
      }
    },
  };
}

/** Esquema JSON de un objeto con propiedades opcionales (y las requeridas que se digan). */
export function esquema(propiedades: Record<string, Record<string, unknown>>, requeridas: string[] = []): Record<string, unknown> {
  return { type: "object", properties: propiedades, required: requeridas, additionalProperties: false };
}
