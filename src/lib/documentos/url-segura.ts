import "server-only";
import { promises as dns } from "node:dns";
import http from "node:http";
import https from "node:https";
import { isIP, type LookupFunction } from "node:net";
import zlib from "node:zlib";
import { normalizarTexto } from "./trocear";

/**
 * DESCARGAR UN LINK SIN ABRIRLE LA PUERTA A LA RED INTERNA (SSRF)
 *
 * Cuando la persona agrega un link, el servidor lo descarga. Sin cuidado,
 * alguien podría pedir "http://169.254.169.254/" (los datos internos de la
 * nube), "http://localhost:5432" o una IP privada y usar al servidor para
 * asomarse adentro. Aquí:
 * - Solo http y https, sin usuario:contraseña y solo en los puertos 80 y 443.
 * - Se resuelve el DNS (dns.promises.lookup con all) y se BLOQUEA si
 *   CUALQUIER dirección es loopback, privada, link-local (incluido
 *   169.254.169.254), CGNAT, 0.0.0.0, multicast, reservada, ::1, fc00::/7,
 *   fe80::/10 o una IPv4 metida en IPv6.
 * - La conexión va EXACTAMENTE a las direcciones revisadas (no se vuelve a
 *   resolver el DNS), así un DNS que cambia de respuesta no se cuela.
 * - Redirecciones a mano (máximo 3), revisando cada salto igual.
 * - 10 s en total, 2 MB como máximo (también ya descomprimido) y solo
 *   text/html, text/plain o application/pdf.
 */

export const MAX_BYTES_LINK = 2 * 1024 * 1024;
export const TIEMPO_LINK_MS = 10_000;
export const MAX_REDIRECCIONES = 3;
export const TIPOS_LINK = ["text/html", "text/plain", "application/pdf"] as const;
export type TipoLink = (typeof TIPOS_LINK)[number];

export class ErrorUrl extends Error {
  status: number;
  constructor(mensaje: string, status = 400) {
    super(mensaje);
    this.name = "ErrorUrl";
    this.status = status;
  }
}

const PRIVADA = "Ese link apunta a una dirección privada o interna. Solo se pueden agregar páginas públicas de internet.";

/* ---------------- Direcciones IP ---------------- */

function ipv4ANumero(ip: string): number | null {
  const partes = ip.split(".");
  if (partes.length !== 4 || !partes.every((p) => /^\d{1,3}$/.test(p) && Number(p) <= 255)) return null;
  return partes.reduce((n, p) => n * 256 + Number(p), 0);
}

/** Rangos IPv4 que no son internet pública: [base, prefijo]. */
const IPV4_BLOQUEADAS: [string, number][] = [
  ["0.0.0.0", 8], // "esta red" (incluye 0.0.0.0)
  ["10.0.0.0", 8], // privada
  ["100.64.0.0", 10], // CGNAT
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local (incluye 169.254.169.254, metadatos de la nube)
  ["172.16.0.0", 12], // privada
  ["192.0.0.0", 24], // asignaciones del IETF
  ["192.0.2.0", 24], // documentación
  ["192.88.99.0", 24], // 6to4 relay
  ["192.168.0.0", 16], // privada
  ["198.18.0.0", 15], // pruebas de red
  ["198.51.100.0", 24], // documentación
  ["203.0.113.0", 24], // documentación
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reservada (incluye 255.255.255.255)
];
const RANGOS_IPV4 = IPV4_BLOQUEADAS.map(([base, prefijo]) => {
  const mascara = prefijo === 0 ? 0 : (0xffffffff << (32 - prefijo)) >>> 0;
  return { red: (ipv4ANumero(base)! & mascara) >>> 0, mascara };
});

function ipv4Bloqueada(n: number): boolean {
  return RANGOS_IPV4.some((r) => ((n & r.mascara) >>> 0) === r.red);
}

/** "2001:db8::1" → 8 números de 16 bits; null si no es IPv6 válida. */
function hextetos(ip: string): number[] | null {
  let s = ip.toLowerCase().replace(/^\[|\]$/g, "");
  const zona = s.indexOf("%");
  if (zona >= 0) s = s.slice(0, zona);
  const conV4 = /^(.*:)(\d+\.\d+\.\d+\.\d+)$/.exec(s);
  if (conV4) {
    const n = ipv4ANumero(conV4[2]);
    if (n === null) return null;
    s = `${conV4[1]}${((n >>> 16) & 0xffff).toString(16)}:${(n & 0xffff).toString(16)}`;
  }
  const mitades = s.split("::");
  if (mitades.length > 2) return null;
  const izq = mitades[0] ? mitades[0].split(":") : [];
  const der = mitades.length === 2 && mitades[1] ? mitades[1].split(":") : [];
  const relleno = mitades.length === 2 ? 8 - izq.length - der.length : 0;
  if (relleno < 0 || (mitades.length === 2 && relleno < 1)) return null;
  const todos = [...izq, ...Array<string>(relleno).fill("0"), ...der];
  if (todos.length !== 8 || !todos.every((h) => /^[0-9a-f]{1,4}$/.test(h))) return null;
  return todos.map((h) => parseInt(h, 16));
}

function ipv6Bloqueada(h: number[]): boolean {
  const ceros = (desde: number, hasta: number) => h.slice(desde, hasta).every((x) => x === 0);
  const v4 = (alto: number, bajo: number) => ((alto << 16) >>> 0) + bajo;
  if (ceros(0, 6)) return true; // ::, ::1 y las IPv4 "compatibles" (::a.b.c.d)
  if (ceros(0, 5) && h[5] === 0xffff) return true; // IPv4 mapeada (::ffff:a.b.c.d): siempre bloqueada
  if (h[0] === 0x64 && h[1] === 0xff9b) return ceros(2, 6) ? ipv4Bloqueada(v4(h[6], h[7])) : true; // NAT64
  if (h[0] === 0x2002) return ipv4Bloqueada(v4(h[1], h[2])); // 6to4
  if (h[0] === 0x2001 && h[1] === 0) return true; // Teredo
  if (h[0] === 0x2001 && h[1] === 0x0db8) return true; // documentación
  if (h[0] === 0x0100 && ceros(1, 4)) return true; // descarte
  if ((h[0] & 0xfe00) === 0xfc00) return true; // fc00::/7, privadas (ULA)
  if ((h[0] & 0xffc0) === 0xfe80) return true; // fe80::/10, link-local
  if ((h[0] & 0xffc0) === 0xfec0) return true; // fec0::/10, site-local (vieja)
  if ((h[0] & 0xff00) === 0xff00) return true; // multicast
  return false;
}

/** ¿Esta IP NO es de internet pública? (también true si no es una IP válida). */
export function ipBloqueada(ip: string): boolean {
  const limpia = ip.replace(/^\[|\]$/g, "");
  const tipo = isIP(limpia.split("%")[0]);
  if (tipo === 4) {
    const n = ipv4ANumero(limpia);
    return n === null || ipv4Bloqueada(n);
  }
  if (tipo === 6) {
    const h = hextetos(limpia);
    return !h || ipv6Bloqueada(h);
  }
  return true;
}

/* ---------------- La URL y su destino ---------------- */

/** Revisa la forma de la URL (sin red). Regresa la URL lista o lanza ErrorUrl. */
export function revisarFormaUrl(texto: string, base?: URL): URL {
  let url: URL;
  try {
    url = new URL(texto.trim(), base);
  } catch {
    throw new ErrorUrl("Ese link no es válido. Cópialo completo, empezando con https://");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new ErrorUrl("Solo se pueden agregar links que empiecen con http:// o https://");
  if (url.username || url.password) throw new ErrorUrl("El link no puede llevar usuario ni contraseña.");
  if (url.port && url.port !== "80" && url.port !== "443") throw new ErrorUrl("Solo se pueden agregar páginas en los puertos normales de internet.");
  const host = url.hostname.replace(/^\[|\]$/g, "").replace(/\.$/, "").toLowerCase();
  if (!host) throw new ErrorUrl("Ese link no es válido.");
  if (isIP(host)) {
    if (ipBloqueada(host)) throw new ErrorUrl(PRIVADA);
  } else if (host === "localhost" || /\.(localhost|local|internal|home\.arpa)$/.test(host) || !host.includes(".")) {
    throw new ErrorUrl(PRIVADA);
  }
  if (url.href.length > 2000) throw new ErrorUrl("Ese link es demasiado largo.");
  url.hash = "";
  return url;
}

type Direccion = { address: string; family: number };

/** Resuelve el DNS y revisa TODAS las direcciones. Lanza ErrorUrl si alguna es interna. */
export async function revisarDestino(url: URL): Promise<Direccion[]> {
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const familia = isIP(host);
  if (familia) {
    if (ipBloqueada(host)) throw new ErrorUrl(PRIVADA);
    return [{ address: host, family: familia }];
  }
  let direcciones: Direccion[];
  try {
    direcciones = await dns.lookup(host, { all: true, verbatim: true });
  } catch {
    throw new ErrorUrl("No encontramos esa página. Revisa que el link esté bien escrito.");
  }
  if (!direcciones.length) throw new ErrorUrl("No encontramos esa página. Revisa que el link esté bien escrito.");
  if (direcciones.some((d) => ipBloqueada(d.address))) throw new ErrorUrl(PRIVADA);
  return direcciones;
}

/** Un lookup que solo entrega las direcciones ya revisadas (no vuelve a preguntar al DNS). */
function lookupFijo(direcciones: Direccion[]): LookupFunction {
  return (_host, opciones, callback) => {
    const familia = typeof opciones === "object" && opciones ? opciones.family : undefined;
    const lista = direcciones.filter((d) => !familia || familia === d.family);
    if (!lista.length) {
      const e = Object.assign(new Error("Sin direcciones para esa familia"), { code: "ENOTFOUND" });
      (callback as (err: NodeJS.ErrnoException | null, a: string, f: number) => void)(e, "", 0);
      return;
    }
    if (typeof opciones === "object" && opciones && opciones.all) {
      (callback as unknown as (err: null, a: Direccion[]) => void)(null, lista);
    } else {
      (callback as (err: null, a: string, f: number) => void)(null, lista[0].address, lista[0].family);
    }
  };
}

/* ---------------- La descarga ---------------- */

export type Descarga = {
  /** La URL final (después de las redirecciones). */
  url: string;
  tipo: TipoLink;
  charset: string | null;
  bytes: Uint8Array;
};

type Opciones = { maxBytes?: number; timeoutMs?: number; maxRedirecciones?: number };

function pedir(url: URL, direcciones: Direccion[], senal: AbortSignal): Promise<http.IncomingMessage> {
  const modulo = url.protocol === "https:" ? https : http;
  return new Promise((resolver, rechazar) => {
    const req = modulo.request(
      url,
      {
        method: "GET",
        agent: false,
        lookup: lookupFijo(direcciones),
        signal: senal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Atendel/1.0; lector de documentos)",
          Accept: "text/html,text/plain,application/pdf;q=0.9,*/*;q=0.1",
          "Accept-Encoding": "gzip, deflate, br",
          "Accept-Language": "es-MX,es;q=0.9,en;q=0.5",
        },
      },
      resolver,
    );
    req.on("error", rechazar);
    req.end();
  });
}

function leerCuerpo(res: http.IncomingMessage, maxBytes: number): Promise<Uint8Array> {
  const codificacion = String(res.headers["content-encoding"] ?? "identity").toLowerCase().trim();
  let flujo: NodeJS.ReadableStream = res;
  if (codificacion === "gzip" || codificacion === "x-gzip") flujo = res.pipe(zlib.createGunzip());
  else if (codificacion === "deflate") flujo = res.pipe(zlib.createInflate());
  else if (codificacion === "br") flujo = res.pipe(zlib.createBrotliDecompress());
  else if (codificacion !== "identity" && codificacion !== "") {
    res.destroy();
    return Promise.reject(new ErrorUrl("La página mandó un formato que no se puede leer."));
  }
  return new Promise((resolver, rechazar) => {
    const partes: Buffer[] = [];
    let total = 0;
    flujo.on("data", (parte: Buffer) => {
      total += parte.length;
      if (total > maxBytes) {
        res.destroy();
        rechazar(new ErrorUrl(`La página es demasiado grande (más de ${Math.round(maxBytes / 1024 / 1024)} MB).`, 413));
        return;
      }
      partes.push(parte);
    });
    flujo.on("end", () => resolver(new Uint8Array(Buffer.concat(partes))));
    flujo.on("error", () => rechazar(new ErrorUrl("No se pudo leer la página. Intenta de nuevo.")));
    res.on("error", () => rechazar(new ErrorUrl("Se cortó la conexión con la página. Intenta de nuevo.")));
  });
}

/**
 * Descarga un link público con todas las protecciones de arriba.
 * Lanza ErrorUrl con un mensaje para la persona si algo no se puede.
 */
export async function descargarSegura(texto: string, opciones: Opciones = {}): Promise<Descarga> {
  const maxBytes = opciones.maxBytes ?? MAX_BYTES_LINK;
  const timeoutMs = opciones.timeoutMs ?? TIEMPO_LINK_MS;
  const maxRedirecciones = opciones.maxRedirecciones ?? MAX_REDIRECCIONES;

  const control = new AbortController();
  const reloj = setTimeout(() => control.abort(), timeoutMs);
  try {
    let url = revisarFormaUrl(texto);
    for (let salto = 0; ; salto++) {
      const direcciones = await revisarDestino(url);
      if (control.signal.aborted) throw new ErrorUrl("El link tardó demasiado en responder.", 504);
      const res = await pedir(url, direcciones, control.signal);
      const estado = res.statusCode ?? 0;

      if ([301, 302, 303, 307, 308].includes(estado)) {
        res.resume();
        const destino = res.headers.location;
        if (!destino) throw new ErrorUrl("La página redirige a ninguna parte.");
        if (salto >= maxRedirecciones) throw new ErrorUrl("El link redirige demasiadas veces.");
        url = revisarFormaUrl(destino, url);
        continue;
      }
      if (estado < 200 || estado >= 300) {
        res.resume();
        throw new ErrorUrl(
          estado === 401 || estado === 403
            ? "Esa página es privada o pide iniciar sesión. Comparte un link público o sube el archivo."
            : estado === 404
              ? "Esa página no existe (error 404). Revisa el link."
              : `La página respondió con un error (${estado}). Intenta más tarde.`,
        );
      }

      const [mime, ...parametros] = String(res.headers["content-type"] ?? "").toLowerCase().split(";");
      const tipo = TIPOS_LINK.find((t) => t === mime.trim());
      if (!tipo) {
        res.resume();
        throw new ErrorUrl("Ese link no es una página web, un texto ni un PDF. Si es otro tipo de archivo, descárgalo y súbelo.", 415);
      }
      const largo = Number(res.headers["content-length"] ?? 0);
      if (largo > maxBytes) {
        res.destroy();
        throw new ErrorUrl(`La página es demasiado grande (más de ${Math.round(maxBytes / 1024 / 1024)} MB).`, 413);
      }
      const charset = parametros.map((p) => /^\s*charset\s*=\s*"?([\w.:-]+)"?\s*$/.exec(p)?.[1]).find(Boolean) ?? null;
      const bytes = await leerCuerpo(res, maxBytes);
      return { url: url.href, tipo, charset, bytes };
    }
  } catch (e) {
    if (control.signal.aborted) throw new ErrorUrl(`El link tardó demasiado en responder (más de ${Math.round(timeoutMs / 1000)} segundos).`, 504);
    if (e instanceof ErrorUrl) throw e;
    const codigo = (e as NodeJS.ErrnoException)?.code ?? "";
    if (/CERT|SSL|TLS/i.test(codigo)) throw new ErrorUrl("La página tiene un certificado de seguridad inválido.");
    throw new ErrorUrl("No pudimos abrir ese link. Revisa que la página exista y sea pública.", 502);
  } finally {
    clearTimeout(reloj);
  }
}

/* ---------------- HTML → texto ---------------- */

const ENTIDADES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  aacute: "á", eacute: "é", iacute: "í", oacute: "ó", uacute: "ú", Aacute: "Á", Eacute: "É", Iacute: "Í", Oacute: "Ó", Uacute: "Ú",
  ntilde: "ñ", Ntilde: "Ñ", uuml: "ü", Uuml: "Ü", iexcl: "¡", iquest: "¿", ordf: "ª", ordm: "º", deg: "°",
  copy: "©", reg: "®", trade: "™", euro: "€", cent: "¢", pound: "£", middot: "·", bull: "•", hellip: "…",
  mdash: "—", ndash: "–", laquo: "«", raquo: "»", ldquo: "“", rdquo: "”", lsquo: "‘", rsquo: "’", times: "×", divide: "÷",
};

export function decodificarEntidades(texto: string): string {
  return texto.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (todo, cuerpo: string) => {
    if (cuerpo[0] === "#") {
      const n = cuerpo[1] === "x" || cuerpo[1] === "X" ? parseInt(cuerpo.slice(2), 16) : parseInt(cuerpo.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : " ";
    }
    return ENTIDADES[cuerpo] ?? todo;
  });
}

/** El HTML de una página → su título y su texto (sin script, style, nav ni etiquetas). */
export function htmlATexto(html: string): { titulo: string; texto: string } {
  const tituloCrudo = /<title[^>]*>([\s\S]*?)<\/title\s*>/i.exec(html)?.[1] ?? "";
  const titulo = normalizarTexto(decodificarEntidades(tituloCrudo.replace(/<[^>]*>/g, ""))).replace(/\s+/g, " ").trim();
  let t = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<head\b[\s\S]*?<\/head\s*>/gi, " ");
  for (const etiqueta of ["script", "style", "nav", "noscript", "template", "svg", "iframe", "object", "canvas"]) {
    t = t.replace(new RegExp(`<${etiqueta}\\b[\\s\\S]*?<\\/${etiqueta}\\s*>`, "gi"), " ");
    t = t.replace(new RegExp(`<${etiqueta}\\b[^>]*\\/?>`, "gi"), " "); // sin cierre
  }
  t = t
    .replace(/<li\b[^>]*>/gi, "\n- ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/li\s*>/gi, " ")
    .replace(/<\/(dd|dt|tr)\s*>/gi, "\n")
    .replace(/<\/(p|div|section|article|header|footer|main|aside|h[1-6]|ul|ol|table|blockquote|pre|figure|figcaption|address)\s*>/gi, "\n\n")
    .replace(/<(p|div|section|article|h[1-6]|tr|table|blockquote|pre|address)\b[^>]*>/gi, "\n")
    .replace(/<\/(td|th)\s*>/gi, " · ")
    .replace(/<[^>]*>/g, " ");
  return { titulo, texto: normalizarTexto(decodificarEntidades(t)) };
}

/** Bytes de una página o texto → string, con el charset que dijo el servidor o la página. */
export function decodificarTexto(bytes: Uint8Array, charset: string | null, esHtml: boolean): string {
  let etiqueta = charset;
  if (!etiqueta && esHtml) {
    const inicio = new TextDecoder("latin1").decode(bytes.subarray(0, 4096));
    etiqueta = /<meta[^>]+charset\s*=\s*["']?\s*([\w.:-]+)/i.exec(inicio)?.[1] ?? null;
  }
  try {
    return new TextDecoder(etiqueta ?? "utf-8").decode(bytes);
  } catch {
    return new TextDecoder("utf-8").decode(bytes);
  }
}
