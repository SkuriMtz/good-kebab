import { MAX_BYTES_DOCUMENTO, type Adaptador, type Tokens } from "@/lib/nucleo-tipos";
import {
  ErrorProveedor,
  argEntero,
  argTexto,
  consulta,
  esquema,
  expiraEn,
  fecha,
  formulario,
  herramienta,
  linea,
  pedir,
  pedirJson,
  pedirToken,
  unir,
  variable,
} from "./_comun-1";

/**
 * DROPBOX (OAuth 2 con PKCE y acceso "offline"; docs.dropboxapi.com, nov 2026):
 * - Autorizar: https://www.dropbox.com/oauth2/authorize con
 *   token_access_type=offline (da refresh token), code_challenge S256 y
 *   los scopes account_info.read, files.metadata.read y files.content.read.
 * - Token: POST https://api.dropboxapi.com/oauth2/token. Con PKCE se manda
 *   code_verifier + client_id (sin secreto) y así también se renueva; sin
 *   PKCE, con client_secret. El access token dura ~4 horas.
 * - Revocar: POST https://api.dropboxapi.com/2/auth/token/revoke.
 * - Buscar: /2/files/search_v2. Leer: content.dropboxapi.com/2/files/download
 *   (el argumento va en el encabezado Dropbox-API-Arg, con lo que no es
 *   ASCII escapado como \uXXXX). PDF y Word pasan por extraerTexto del núcleo.
 */

const NOMBRE = "Dropbox";
const API = "https://api.dropboxapi.com";
export const SCOPES_DROPBOX = ["account_info.read", "files.metadata.read", "files.content.read"];
const EXT_TEXTO = new Set(["txt", "md", "markdown", "csv", "tsv", "json", "xml", "html", "htm", "log", "ics", "vcf"]);

type RespuestaToken = { access_token: string; refresh_token?: string; expires_in?: number; account_id?: string };

const credenciales = () => ({ id: variable("DROPBOX_APP_KEY"), secreto: variable("DROPBOX_APP_SECRET") });

/** JSON para un encabezado HTTP: lo que no es ASCII va como \uXXXX (regla de Dropbox). */
export const argEncabezado = (v: unknown) => JSON.stringify(v).replace(/[\u007f-￿]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`);

function rpc<T>(token: string, ruta: string, cuerpo: unknown, senal?: AbortSignal) {
  return pedirJson<T>(NOMBRE, `${API}/2/${ruta}`, {
    metodo: "POST",
    encabezados: { Authorization: `Bearer ${token}`, ...(cuerpo === undefined ? {} : { "Content-Type": "application/json" }) },
    cuerpo: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    senal,
    interpretar: (estado, c) => {
      const resumen = (c as { error_summary?: string } | null)?.error_summary ?? "";
      if (estado === 409 && /not_found/.test(resumen)) return "No encontré ese archivo o carpeta en Dropbox.";
      if (estado === 401) return "La conexión con Dropbox ya no es válida. Vuelve a conectarla en Tu negocio › Apps.";
      return undefined;
    },
  });
}

/** Lee el cuerpo con un tope de bytes (no carga archivos enormes en memoria). */
async function leerConTope(r: Response, max: number): Promise<Uint8Array> {
  const largo = Number(r.headers.get("content-length"));
  if (Number.isFinite(largo) && largo > max) {
    await r.body?.cancel().catch(() => undefined);
    throw new ErrorProveedor("Ese archivo es muy grande para leerlo aquí (máximo 10 MB).");
  }
  if (!r.body) return new Uint8Array(await r.arrayBuffer());
  const partes: Uint8Array[] = [];
  let total = 0;
  const lector = r.body.getReader();
  for (;;) {
    const { done, value } = await lector.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) {
      await lector.cancel().catch(() => undefined);
      throw new ErrorProveedor("Ese archivo es muy grande para leerlo aquí (máximo 10 MB).");
    }
    partes.push(value);
  }
  const bytes = new Uint8Array(total);
  let i = 0;
  for (const p of partes) {
    bytes.set(p, i);
    i += p.byteLength;
  }
  return bytes;
}

async function textoDe(nombre: string, bytes: Uint8Array): Promise<string> {
  const ext = nombre.toLowerCase().split(".").pop() ?? "";
  if (EXT_TEXTO.has(ext)) return new TextDecoder("utf-8").decode(bytes);
  if (ext === "pdf" || ext === "docx") {
    try {
      const { extraerTexto } = await import("@/lib/documentos/extraer");
      return await extraerTexto(bytes, ext);
    } catch (e) {
      // ErrorDocumento del núcleo ya trae un mensaje amable.
      if (e instanceof Error && e.name === "ErrorDocumento") throw new ErrorProveedor(e.message);
      throw new ErrorProveedor("No pude sacar el texto de ese archivo.");
    }
  }
  throw new ErrorProveedor("Ese tipo de archivo no lo puedo leer: solo texto (TXT, MD, CSV…), PDF y Word (.docx).");
}

type Metadatos = { ".tag"?: string; name?: string; path_display?: string; size?: number; server_modified?: string };

const tamano = (b?: number) => (b === undefined ? "" : b < 1024 ? `${b} B` : b < 1048576 ? `${Math.round(b / 1024)} KB` : `${(b / 1048576).toFixed(1)} MB`);

function aTokens(r: RespuestaToken, pkce: boolean, anterior?: Tokens): Tokens {
  const extra = { ...(anterior?.extra ?? {}) };
  if (pkce) extra.pkce = "1";
  if (r.account_id) extra.account_id = r.account_id;
  return { access_token: r.access_token, refresh_token: r.refresh_token ?? anterior?.refresh_token, expira_en: expiraEn(r.expires_in), extra };
}

export const adaptador: Adaptador = {
  proveedor: "dropbox",
  autenticacion: "oauth",
  variables: ["DROPBOX_APP_KEY", "DROPBOX_APP_SECRET"],

  urlAutorizacion({ state, redirectUri, codeChallenge }) {
    return `https://www.dropbox.com/oauth2/authorize${consulta({
      client_id: credenciales().id,
      response_type: "code",
      redirect_uri: redirectUri,
      state,
      token_access_type: "offline",
      scope: SCOPES_DROPBOX.join(" "),
      code_challenge: codeChallenge,
      code_challenge_method: codeChallenge ? "S256" : undefined,
    })}`;
  },

  async intercambiar({ code, redirectUri, codeVerifier }) {
    const { id, secreto } = credenciales();
    const r = await pedirToken<RespuestaToken>(
      NOMBRE,
      `${API}/oauth2/token`,
      formulario({
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        client_id: id,
        ...(codeVerifier ? { code_verifier: codeVerifier } : { client_secret: secreto }),
      }),
    );
    return aTokens(r, !!codeVerifier);
  },

  async renovar(t) {
    if (!t.refresh_token) throw new ErrorProveedor("La conexión con Dropbox venció. Vuelve a conectarla.", 401);
    const { id, secreto } = credenciales();
    const pkce = t.extra?.pkce === "1";
    const r = await pedirToken<RespuestaToken>(
      NOMBRE,
      `${API}/oauth2/token`,
      formulario({ grant_type: "refresh_token", refresh_token: t.refresh_token, client_id: id, client_secret: pkce ? undefined : secreto }),
    );
    return aTokens(r, pkce, t);
  },

  async revocar(t) {
    await pedir(NOMBRE, `${API}/2/auth/token/revoke`, { metodo: "POST", encabezados: { Authorization: `Bearer ${t.access_token}` } }).catch(
      () => undefined,
    );
  },

  async cuenta(t) {
    const c = await rpc<{ email?: string; name?: { display_name?: string } }>(t.access_token, "users/get_current_account", undefined);
    return c.email || c.name?.display_name || "Cuenta de Dropbox";
  },

  herramientas: [
    herramienta({
      nombre: "dropbox_buscar",
      descripcion:
        "Busca archivos y carpetas en el Dropbox del negocio por nombre o contenido. Regresa la ruta de cada uno para poder leerlo con dropbox_leer_archivo. Solo lectura.",
      app: "dropbox",
      agentes: ["iris"],
      proveedor: NOMBRE,
      esquema: esquema(
        {
          consulta: { type: "string", description: "Qué buscar (palabras del nombre o del contenido)." },
          limite: { type: "integer", minimum: 1, maximum: 20, description: "Cuántos resultados. Por defecto 10." },
        },
        ["consulta"],
      ),
      async ejecutar(args, ctx) {
        const q = argTexto(args, "consulta", 200);
        if (!q) throw new ErrorProveedor("Dime qué quieres buscar en Dropbox.");
        const t = await ctx.token();
        const datos = await rpc<{ matches?: { metadata?: { metadata?: Metadatos } }[] }>(
          t.access_token,
          "files/search_v2",
          { query: q, options: { max_results: argEntero(args, "limite", 10, 1, 20), file_status: "active" } },
          ctx.senal,
        );
        const lista = (datos.matches ?? []).map((m) => m.metadata?.metadata).filter((m): m is Metadatos => !!m?.path_display);
        if (!lista.length) return `No encontré nada en Dropbox con "${q}".`;
        return [
          `Resultados en Dropbox para "${q}" (${lista.length}):`,
          ...lista.map((m) =>
            `- ${unir(m[".tag"] === "folder" ? `Carpeta ${linea(m.name, 100)}` : linea(m.name, 100), m.path_display, tamano(m.size), m.server_modified ? `modificado ${fecha(m.server_modified)}` : "")}`,
          ),
        ].join("\n");
      },
    }),
    herramienta({
      nombre: "dropbox_leer_archivo",
      descripcion:
        "Lee el texto de un archivo de Dropbox por su ruta (TXT, MD, CSV, PDF o Word .docx, hasta 10 MB). Usa primero dropbox_buscar para saber la ruta. Solo lectura.",
      app: "dropbox",
      agentes: ["iris"],
      proveedor: NOMBRE,
      esquema: esquema({ ruta: { type: "string", description: 'Ruta del archivo, p. ej. "/Clínica/precios.pdf", o su id ("id:…").' } }, ["ruta"]),
      async ejecutar(args, ctx) {
        const ruta = argTexto(args, "ruta", 1000);
        if (!ruta || !(ruta.startsWith("/") || ruta.startsWith("id:"))) throw new ErrorProveedor('La ruta de Dropbox empieza con "/" (por ejemplo "/Documentos/precios.pdf").');
        const t = await ctx.token();
        const r = await pedir(NOMBRE, "https://content.dropboxapi.com/2/files/download", {
          metodo: "POST",
          encabezados: { Authorization: `Bearer ${t.access_token}`, "Dropbox-API-Arg": argEncabezado({ path: ruta }) },
          senal: ctx.senal,
          tiempoMs: 30_000,
          interpretar: (estado, c) => {
            const resumen = (c as { error_summary?: string } | null)?.error_summary ?? "";
            if (estado === 409 && /not_found/.test(resumen)) return "No encontré ese archivo en Dropbox. Búscalo primero con dropbox_buscar.";
            if (estado === 409 && /not_file|unsupported_file/.test(resumen)) return "Eso no es un archivo que se pueda descargar (¿es una carpeta?).";
            return undefined;
          },
        });
        let meta: Metadatos = {};
        try {
          meta = JSON.parse(r.headers.get("dropbox-api-result") ?? "{}") as Metadatos;
        } catch {
          meta = {};
        }
        const nombre = meta.name || ruta.split("/").pop() || "archivo";
        const bytes = await leerConTope(r, MAX_BYTES_DOCUMENTO);
        const texto = (await textoDe(nombre, bytes)).trim();
        return `Archivo: ${unir(nombre, meta.path_display || ruta, tamano(meta.size ?? bytes.byteLength))}\n\n${texto || "(el archivo no tiene texto)"}`;
      },
    }),
  ],
};
