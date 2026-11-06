import { createHash, randomBytes, timingSafeEqual } from "crypto";
import type { IdApp, Proveedor } from "@/lib/nucleo-tipos";

/**
 * Piezas comunes del OAuth propio (Google, Microsoft y Notion):
 * - `state` y PKCE aleatorios;
 * - la lista de orígenes permitidos para armar el redirect_uri;
 * - la forma del cookie de corta vida que guarda state, app y verifier;
 * - los errores con los que hablan los adaptadores.
 * Sin "server-only" a propósito (se prueba con un script local), pero solo
 * lo importan rutas y librerías del servidor.
 */

export const NOMBRE_PROVEEDOR: Record<Proveedor, string> = {
  google: "Google",
  microsoft: "Microsoft",
  notion: "Notion",
  meta: "Meta",
  telegram: "Telegram",
  calendly: "Calendly",
  zoom: "Zoom",
  dropbox: "Dropbox",
  slack: "Slack",
  trello: "Trello",
  airtable: "Airtable",
  hubspot: "HubSpot",
  stripe: "Stripe",
  mercadopago: "Mercado Pago",
  mercadolibre: "Mercado Libre",
  shopify: "Shopify",
  tiendanube: "Tiendanube",
  facturapi: "Facturapi",
  acuity: "Acuity Scheduling",
  simplybook: "SimplyBook.me",
  setmore: "Setmore",
  agendapro: "AgendaPro",
  paypal: "PayPal",
  conekta: "Conekta",
  openpay: "Openpay",
  square: "Square",
  facturama: "Facturama",
  alegra: "Alegra",
  holded: "Holded",
  zoho: "Zoho",
  quickbooks: "QuickBooks",
  pipedrive: "Pipedrive",
  kommo: "Kommo",
  typeform: "Typeform",
  mailchimp: "Mailchimp",
};

/* ---------------- Aleatorios y PKCE ---------------- */

export const aleatorio = (bytes = 32) => randomBytes(bytes).toString("base64url");

/** PKCE (S256): el verifier se queda en el cookie; el challenge va al proveedor. */
export function pkce() {
  const verifier = aleatorio(32);
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

/** Compara sin filtrar el largo ni la posición por tiempos. */
export function iguales(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/* ---------------- ¿Desde qué origen se puede volver? ---------------- */

type Entorno = Record<string, string | undefined>;

const sinEsquema = (v: string | undefined) => (v ?? "").trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "").toLowerCase();

/**
 * El redirect_uri se arma con el origen de la petición, pero solo si es uno
 * de estos:
 * - el de producción: ALLOWED_ORIGINS (el mismo que usa el middleware) y el
 *   dominio de producción que Vercel pone en VERCEL_PROJECT_PRODUCTION_URL;
 * - los *.vercel.app del proyecto: los de este despliegue (VERCEL_URL y
 *   VERCEL_BRANCH_URL) y, si producción vive en <proyecto>.vercel.app, los
 *   <proyecto>-*.vercel.app de las vistas previas;
 * - localhost y 127.0.0.1 solo en desarrollo.
 * Fuera de eso, null: no se manda a nadie al proveedor.
 */
export function origenPermitido(origen: string, env: Entorno = process.env): string | null {
  let url: URL;
  try {
    url = new URL(origen);
  } catch {
    return null;
  }
  const host = url.host.toLowerCase();
  const desarrollo = env.NODE_ENV !== "production";
  if (desarrollo && (url.hostname === "localhost" || url.hostname === "127.0.0.1") && (url.protocol === "http:" || url.protocol === "https:")) {
    return url.origin;
  }
  if (url.protocol !== "https:") return null;

  const exactos = new Set(
    [
      ...(env.ALLOWED_ORIGINS ?? "").split(","),
      env.VERCEL_PROJECT_PRODUCTION_URL,
      env.VERCEL_URL,
      env.VERCEL_BRANCH_URL,
    ]
      .map(sinEsquema)
      .filter(Boolean),
  );
  if (exactos.has(host)) return url.origin;

  const prod = sinEsquema(env.VERCEL_PROJECT_PRODUCTION_URL);
  const proyecto = prod.endsWith(".vercel.app") ? prod.slice(0, -".vercel.app".length) : "";
  if (proyecto && !proyecto.includes(".") && host.endsWith(".vercel.app")) {
    const nombre = host.slice(0, -".vercel.app".length);
    if (!nombre.includes(".") && nombre.startsWith(`${proyecto}-`)) return url.origin;
  }
  return null;
}

/**
 * Parámetros extra de "conectar" que se le pasan al adaptador (p. ej. el
 * `shop` de Shopify): solo nombres sencillos, valores cortos y máximo 5.
 */
export function queryExtra(params: URLSearchParams, quitar: string[] = []): Record<string, string> {
  const q: Record<string, string> = {};
  for (const [k, v] of Array.from(params.entries())) {
    if (quitar.includes(k) || !/^[a-z_]{1,30}$/.test(k) || v.length > 300 || Object.keys(q).length >= 5) continue;
    q[k] = v;
  }
  return q;
}

export const uriCallback = (origen: string, proveedor: Proveedor) => `${origen}/api/conexiones/${proveedor}/callback`;

/* ---------------- El cookie de la ida y vuelta ---------------- */

/** Vive 10 minutos: lo que tarda alguien en aceptar los permisos. */
export const VIDA_COOKIE_S = 600;
export const nombreCookie = (p: Proveedor) => `atendel_oauth_${p}`;
/** Solo se manda a las rutas de ese proveedor. */
export const rutaCookie = (p: Proveedor) => `/api/conexiones/${p}`;

export type EstadoOAuth = {
  state: string;
  /** La app que se pidió conectar. */
  app: IdApp;
  /** Todas las que se pidieron (las que ya tenía más la nueva). */
  apps: IdApp[];
  /** Parámetros extra de "conectar" que el adaptador necesita de vuelta (p. ej. shop). */
  q: Record<string, string>;
  /** PKCE; vacío si el proveedor no lo acepta (Notion). */
  verifier: string;
  redirectUri: string;
  /** La persona que empezó: el callback exige que sea la misma sesión. */
  uid: string;
  /** Vence (ms). */
  exp: number;
};

export function leerEstadoOAuth(texto: string, ahora = Date.now()): EstadoOAuth | null {
  try {
    const e = JSON.parse(texto) as Partial<EstadoOAuth>;
    if (typeof e.state !== "string" || typeof e.app !== "string" || typeof e.uid !== "string") return null;
    if (typeof e.redirectUri !== "string" || typeof e.verifier !== "string" || typeof e.exp !== "number") return null;
    if (!Array.isArray(e.apps) || !e.q || typeof e.q !== "object") return null;
    if (e.exp < ahora) return null;
    return e as EstadoOAuth;
  } catch {
    return null;
  }
}

/* ---------------- Errores ---------------- */

/** Lo que regresa un proveedor al pedir o renovar tokens. */
export class ErrorOAuth extends Error {
  constructor(
    /** invalid_grant = el permiso se revocó o venció: hay que volver a conectar. */
    readonly codigo: "invalid_grant" | "rechazo" | "red",
    mensaje: string,
  ) {
    super(mensaje);
    this.name = "ErrorOAuth";
  }
}

/** Respuesta de un API de las apps (Gmail, Graph, Notion…) que no fue 2xx. */
export class ErrorApi extends Error {
  constructor(
    readonly status: number,
    readonly proveedor: Proveedor,
    mensaje = `El API respondió ${status}`,
  ) {
    super(mensaje);
    this.name = "ErrorApi";
  }
}

/** POST de formulario a un endpoint de tokens; traduce los errores a ErrorOAuth. */
export async function postarTokens(url: string, cuerpo: Record<string, string>, extraHeaders: Record<string, string> = {}, json = false) {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": json ? "application/json" : "application/x-www-form-urlencoded", Accept: "application/json", ...extraHeaders },
      body: json ? JSON.stringify(cuerpo) : new URLSearchParams(cuerpo).toString(),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new ErrorOAuth("red", "No se pudo hablar con el proveedor.");
  }
  const datos = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    // Nunca se registra la respuesta completa: puede traer tokens
    const codigo = datos.error === "invalid_grant" ? "invalid_grant" : "rechazo";
    throw new ErrorOAuth(codigo, typeof datos.error === "string" ? datos.error : `HTTP ${res.status}`);
  }
  return datos;
}

/** Segundos de vida → cuándo vence (ms); sin dato, undefined (no vence o no se sabe). */
export const venceEn = (expiresIn: unknown, ahora = Date.now()) => {
  const s = Number(expiresIn);
  return Number.isFinite(s) && s > 0 ? ahora + s * 1000 : undefined;
};

export const scopesDeTexto = (v: unknown) => (typeof v === "string" ? v.split(/\s+/).filter(Boolean) : []);
