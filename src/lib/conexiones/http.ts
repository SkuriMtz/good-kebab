import type { Proveedor } from "@/lib/nucleo-tipos";
import { ErrorApi } from "./oauth";

/**
 * Apoyo para las herramientas de SOLO LECTURA de cualquier proveedor
 * (también para los adaptadores de otros trabajadores):
 * - `pedirJson` / `pedirTexto` / `pedirBytes`: GET (o POST de búsqueda) con el
 *   token, la señal de corte y sin caché. Si la respuesta no es 2xx lanzan
 *   ErrorApi con su `status` (401 → el ciclo renueva el token y reintenta).
 * - `argTexto` / `argNumero`: leen los argumentos que manda el modelo; si
 *   algo no cuadra lanzan ErrorArgs (el modelo recibe el porqué).
 * - `recortar`, `linea`, `sinHtml`, `fechaMx`: dejan el texto listo.
 * Nunca se registra una respuesta ni un token.
 */

type Pedido = {
  token: string;
  senal: AbortSignal;
  proveedor: Proveedor;
  metodo?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  cuerpo?: unknown;
  headers?: Record<string, string>;
  /** Esquema de autorización (Bearer por omisión). */
  esquema?: string;
};

async function pedir(url: string, p: Pedido): Promise<Response> {
  const res = await fetch(url, {
    method: p.metodo ?? "GET",
    headers: {
      Authorization: `${p.esquema ?? "Bearer"} ${p.token}`,
      Accept: "application/json",
      ...(p.cuerpo !== undefined ? { "Content-Type": "application/json" } : {}),
      ...p.headers,
    },
    body: p.cuerpo !== undefined ? JSON.stringify(p.cuerpo) : undefined,
    cache: "no-store",
    signal: p.senal,
  });
  if (!res.ok) {
    // Del cuerpo solo se toma un mensaje corto (sin tokens) para entender el error
    let detalle = "";
    try {
      const d = (await res.json()) as { error?: { message?: unknown } | string; message?: unknown };
      const m = typeof d.error === "object" ? d.error?.message : d.message ?? d.error;
      detalle = typeof m === "string" ? m.slice(0, 200) : "";
    } catch {
      /* sin cuerpo legible */
    }
    throw new ErrorApi(res.status, p.proveedor, detalle || `El API respondió ${res.status}`);
  }
  return res;
}

export async function pedirJson<T = Record<string, unknown>>(url: string, p: Pedido): Promise<T> {
  const res = await pedir(url, p);
  // Borrar o mandar a veces regresa 202/204 sin cuerpo
  const texto = await res.text();
  if (!texto.trim()) return {} as T;
  try {
    return JSON.parse(texto) as T;
  } catch {
    throw new ErrorApi(502, p.proveedor, "El API respondió algo que no se entendió.");
  }
}

/* ---------------- Fecha y hora local (para HACER cosas en calendarios) ---------------- */

const FECHA_HORA = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

/** Cuánto le falta a una zona para UTC en ese momento (ms). */
function desfaseDe(zona: string, momento: Date): number {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: zona, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" })
      .formatToParts(momento)
      .map((x) => [x.type, x.value]),
  );
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - momento.getTime();
}

/** "AAAA-MM-DDTHH:MM" en la hora de la zona → el instante real. Lanza ErrorArgs si no se entiende. */
export function horaLocal(texto: string, zona: string): Date {
  const m = FECHA_HORA.exec(texto.trim());
  if (!m) throw new ErrorArgs(`No entendí la fecha y hora "${linea(texto, 40)}". Usa AAAA-MM-DDTHH:MM (por ejemplo 2026-11-20T10:00).`);
  const [a, mes, d, h, min] = m.slice(1).map(Number);
  if (mes < 1 || mes > 12 || d < 1 || d > 31 || h > 23 || min > 59) throw new ErrorArgs(`La fecha "${texto}" no existe.`);
  const comoUtc = Date.UTC(a, mes - 1, d, h, min);
  // Dos pasadas por si cambia el horario ese día
  let t = comoUtc - desfaseDe(zona, new Date(comoUtc));
  t = comoUtc - desfaseDe(zona, new Date(t));
  return new Date(t);
}

/** Un instante en palabras, en la zona de la cuenta ("vie 20 nov, 10:00"). */
export function enZona(d: Date, zona: string, conDia = true): string {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: zona,
    ...(conDia ? { weekday: "short", day: "numeric", month: "short" } : {}),
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(d);
}

/** Lo que se puede validar sin la red: correos (hasta 10). */
export function argCorreos(args: Record<string, unknown>, nombre: string, o: { requerido?: boolean } = {}): string[] {
  const crudo = args[nombre];
  const lista = (Array.isArray(crudo) ? crudo : typeof crudo === "string" ? crudo.split(/[,;\s]+/) : []).map((x) => String(x).trim()).filter(Boolean);
  if (!lista.length) {
    if (o.requerido) throw new ErrorArgs(`Falta "${nombre}": a quién (uno o más correos).`);
    return [];
  }
  if (lista.length > 10) throw new ErrorArgs("Son demasiados destinatarios: máximo 10.");
  for (const c of lista) if (!/^[^\s@<>()",;:]{1,64}@[A-Za-z0-9.-]{1,253}\.[A-Za-z]{2,24}$/.test(c)) throw new ErrorArgs(`"${linea(c, 80)}" no parece un correo válido.`);
  return lista;
}

export async function pedirTexto(url: string, p: Pedido, maxBytes = MAX_BYTES_DESCARGA): Promise<string> {
  const { bytes } = await pedirBytes(url, p, maxBytes);
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

/** Lo más que se descarga de un archivo para leerlo. */
export const MAX_BYTES_DESCARGA = 10 * 1024 * 1024;

export async function pedirBytes(url: string, p: Pedido, maxBytes = MAX_BYTES_DESCARGA): Promise<{ bytes: Uint8Array; tipo: string }> {
  const res = await pedir(url, { ...p, headers: { Accept: "*/*", ...p.headers } });
  const largo = Number(res.headers.get("content-length") ?? "0");
  if (largo > maxBytes) throw new ErrorArgs(`El archivo pesa más de ${Math.round(maxBytes / 1024 / 1024)} MB y no se puede leer aquí.`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes.byteLength > maxBytes) throw new ErrorArgs(`El archivo pesa más de ${Math.round(maxBytes / 1024 / 1024)} MB y no se puede leer aquí.`);
  return { bytes, tipo: res.headers.get("content-type") ?? "" };
}

/* ---------------- Argumentos del modelo ---------------- */

/** Un argumento que no sirve: el modelo recibe este texto como error y puede corregir. */
export class ErrorArgs extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ErrorArgs";
  }
}

/** La app no dio permiso para hacer eso (hay que volver a conectarla): con qué app y para qué. */
export class ErrorPermiso extends ErrorArgs {
  constructor(
    mensaje: string,
    readonly app: string,
    readonly que: string,
  ) {
    super(mensaje);
    this.name = "ErrorPermiso";
  }
}

export function argTexto(args: Record<string, unknown>, nombre: string, o: { max?: number; requerido?: boolean; patron?: RegExp } = {}): string {
  const v = args[nombre];
  if (v === undefined || v === null || v === "") {
    if (o.requerido) throw new ErrorArgs(`Falta "${nombre}".`);
    return "";
  }
  if (typeof v !== "string") throw new ErrorArgs(`"${nombre}" tiene que ser texto.`);
  const t = v.trim();
  if (t.length > (o.max ?? 500)) throw new ErrorArgs(`"${nombre}" es demasiado largo.`);
  if (o.requerido && !t) throw new ErrorArgs(`Falta "${nombre}".`);
  if (t && o.patron && !o.patron.test(t)) throw new ErrorArgs(`"${nombre}" no tiene la forma esperada.`);
  return t;
}

export function argNumero(args: Record<string, unknown>, nombre: string, o: { min: number; max: number; omision: number }): number {
  const v = args[nombre];
  if (v === undefined || v === null || v === "") return o.omision;
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  if (!Number.isFinite(n)) throw new ErrorArgs(`"${nombre}" tiene que ser un número.`);
  return Math.min(o.max, Math.max(o.min, Math.round(n)));
}

/* ---------------- Texto ---------------- */

/** Recorta a `max` caracteres, avisando que hay más. */
export function recortar(texto: string, max = 4000): string {
  const t = texto.trim();
  return t.length > max ? `${t.slice(0, max - 1)}… (recortado)` : t;
}

/** Una sola línea limpia (sin saltos ni caracteres de control), con tope. */
export function linea(texto: unknown, max = 200): string {
  const t = String(texto ?? "")
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

/** Lo más que se lee de un HTML: lo de más es basura o un intento de trabar el proceso. */
const MAX_HTML = 300_000;
const BLOQUES_OCULTOS = ["script", "style", "head"] as const;
const CIERRE_BR = /<br\s*\/?>/y;
const CIERRE_BLOQUE = /<\/(?:p|div|tr|li|h[1-6])>/y;
const ENTIDADES_HTML: Record<string, string> = { nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'" };

/**
 * HTML → texto legible (para correos sin parte de texto plano).
 * Un solo recorrido con cursor que siempre avanza (sin regex con retroceso sobre
 * el texto completo): un correo malicioso no puede trabar el proceso.
 */
export function sinHtml(html: string): string {
  const s = String(html ?? "").slice(0, MAX_HTML);
  const bajo = s.replace(/[A-Z]+/g, (m) => m.toLowerCase()); // misma longitud que `s`
  const n = s.length;
  const sinCierre = new Set<string>(); // si un cierre no está una vez, no está más adelante
  let sinMayor = false; // si ya no hay ">" desde aquí, ningún "<" posterior es etiqueta
  let salida = "";
  let i = 0;
  while (i < n) {
    const lt = s.indexOf("<", i);
    if (lt < 0) {
      salida += s.slice(i);
      break;
    }
    salida += s.slice(i, lt);
    i = lt;

    // <script>…</script>, <style>…</style>, <head>…</head>: se quitan con todo y contenido
    let quitado = false;
    for (const nombre of BLOQUES_OCULTOS) {
      if (sinCierre.has(nombre) || !bajo.startsWith(nombre, lt + 1)) continue;
      const cierre = `</${nombre}>`;
      const fin = bajo.indexOf(cierre, lt + 1 + nombre.length);
      if (fin < 0) sinCierre.add(nombre);
      else {
        salida += " ";
        i = fin + cierre.length;
        quitado = true;
      }
      break;
    }
    if (quitado) continue;

    CIERRE_BR.lastIndex = lt;
    if (CIERRE_BR.test(bajo)) {
      salida += "\n";
      i = CIERRE_BR.lastIndex;
      continue;
    }
    CIERRE_BLOQUE.lastIndex = lt;
    if (CIERRE_BLOQUE.test(bajo)) {
      salida += "\n";
      i = CIERRE_BLOQUE.lastIndex;
      continue;
    }

    // Cualquier otra etiqueta: de "<" al primer ">" (con al menos un carácter dentro)
    const mayor = sinMayor ? -1 : s.indexOf(">", lt + 1);
    if (mayor < 0) {
      sinMayor = true;
      salida += "<";
      i = lt + 1;
    } else if (mayor === lt + 1) {
      salida += "<"; // "<>" se queda como texto
      i = lt + 1;
    } else {
      salida += " ";
      i = mayor + 1;
    }
  }
  return salida
    .replace(/&(nbsp|amp|lt|gt|quot|#39);/gi, (_t, e: string) => ENTIDADES_HTML[e.toLowerCase()])
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*/g, "\n\n")
    .trim();
}

const FECHA_MX = new Intl.DateTimeFormat("es-MX", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "America/Mexico_City",
});
const DIA_MX = new Intl.DateTimeFormat("es-MX", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "America/Mexico_City" });

/** Fecha y hora de la Ciudad de México; "" si no se entiende. */
export function fechaMx(valor: unknown, soloDia = false): string {
  if (valor === undefined || valor === null || valor === "") return "";
  const d = new Date(typeof valor === "number" ? valor : String(valor));
  if (Number.isNaN(d.getTime())) return "";
  return (soloDia ? DIA_MX : FECHA_MX).format(d);
}

/* ---------------- Rango de fechas para agendas ---------------- */

const SOLO_DIA = /^\d{4}-\d{2}-\d{2}$/;
/** México (sin horario de verano desde 2022): UTC-6. */
const DESFASE_MX = "-06:00";

function aFecha(texto: string, finDelDia: boolean): Date {
  const iso = SOLO_DIA.test(texto) ? `${texto}T${finDelDia ? "23:59:59" : "00:00:00"}${DESFASE_MX}` : texto;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) throw new ErrorArgs(`No entendí la fecha "${texto}". Usa AAAA-MM-DD.`);
  return d;
}

/** desde/hasta del modelo → rango real (por omisión, hoy y los 7 días siguientes; máximo 62 días). */
export function rangoFechas(desde: string, hasta: string, ahora = new Date()): { desde: Date; hasta: Date } {
  const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(ahora);
  const d = aFecha(desde || hoy, false);
  const h = hasta ? aFecha(hasta, true) : new Date(d.getTime() + 7 * 86_400_000);
  if (h.getTime() <= d.getTime()) throw new ErrorArgs('"hasta" tiene que ser después de "desde".');
  if (h.getTime() - d.getTime() > 62 * 86_400_000) throw new ErrorArgs("El rango es muy largo: pide máximo dos meses.");
  return { desde: d, hasta: h };
}
