import type { Adaptador, Tokens } from "@/lib/nucleo-tipos";
import { ErrorProveedor, argEntero, argTexto, consulta, esquema, expiraEn, fecha, herramienta, linea, pedir, pedirJson, sinRenovacion, unir, variable } from "./_comun-1";
import { ErrorOAuth } from "../oauth";

/**
 * KOMMO (OAuth 2; developers.kommo.com, nov 2026):
 * - Autorizar: https://www.kommo.com/oauth?client_id=…&state=…&mode=post_message.
 *   Al volver llegan `code`, `state` y `referer` (<subdominio>.kommo.com, la
 *   cuenta que eligió la persona). La tarjeta además pide el subdominio antes
 *   de conectar (DATO_CONECTAR → `subdomain`) por si Kommo no manda referer.
 * - Token: POST https://<subdominio>.kommo.com/oauth2/access_token (JSON).
 *   El access token dura 24 horas y el refresh token 3 meses (cada renovación
 *   da uno nuevo). Solo se habla con *.kommo.com.
 * - API v4: /api/v4/account, /api/v4/leads (con sus embudos) y /api/v4/contacts.
 */

const NOMBRE = "Kommo";
const SUBDOMINIO = /^[a-z0-9][a-z0-9-]{0,62}$/;

const credenciales = () => ({ id: variable("KOMMO_CLIENT_ID"), secreto: variable("KOMMO_CLIENT_SECRET") });

/** "miempresa", "miempresa.kommo.com" o "https://miempresa.kommo.com/…" → "miempresa" (o null). */
export function subdominioKommo(v: string | undefined | null): string | null {
  const s = (v ?? "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/\.kommo\.com$/, "");
  return SUBDOMINIO.test(s) ? s : null;
}

type RespuestaToken = { access_token: string; refresh_token?: string; expires_in?: number; error?: string };

async function token(sub: string, cuerpo: Record<string, string>): Promise<RespuestaToken> {
  const r = await pedirJson<RespuestaToken & { hint?: string; title?: string }>(NOMBRE, `https://${sub}.kommo.com/oauth2/access_token`, {
    metodo: "POST",
    encabezados: { "Content-Type": "application/json", Accept: "application/json" },
    cuerpo: JSON.stringify(cuerpo),
    interpretar: () => "Kommo no aceptó la conexión. Intenta conectar de nuevo.",
  }).catch((e: unknown) => {
    const status = e instanceof ErrorProveedor ? e.status : 0;
    // 400/401 al renovar: el refresh token venció (3 meses) o se revocó
    throw new ErrorOAuth(status === 400 || status === 401 ? "invalid_grant" : status ? "rechazo" : "red", e instanceof Error ? e.message : "Kommo no respondió.");
  });
  if (!r.access_token) throw new ErrorOAuth("rechazo", "Kommo no regresó el permiso de acceso. Intenta conectar de nuevo.");
  return r;
}

const aTokens = (r: RespuestaToken, sub: string, anterior?: Tokens): Tokens => ({
  access_token: r.access_token,
  refresh_token: r.refresh_token ?? anterior?.refresh_token,
  expira_en: expiraEn(r.expires_in),
  extra: { ...(anterior?.extra ?? {}), subdominio: sub },
});

function subDe(t: Tokens) {
  const s = subdominioKommo(t.extra?.subdominio);
  if (!s) throw new ErrorProveedor("Falta el subdominio de tu cuenta de Kommo. Vuelve a conectar.");
  return s;
}

/** Kommo responde 204 sin cuerpo cuando no hay resultados. */
async function api<T>(t: Tokens, ruta: string, params: Record<string, string | number | undefined> = {}, senal?: AbortSignal): Promise<T | null> {
  const r = await pedir(NOMBRE, `https://${subDe(t)}.kommo.com${ruta}${consulta(params)}`, { encabezados: { Authorization: `Bearer ${t.access_token}` }, senal });
  if (r.status === 204) return null;
  try {
    return (await r.json()) as T;
  } catch {
    throw new ErrorProveedor("Kommo respondió algo que no entendí. Intenta de nuevo en un momento.");
  }
}

type Lead = { id: number; name?: string; price?: number; status_id?: number; pipeline_id?: number; updated_at?: number; closest_task_at?: number; _embedded?: { contacts?: { id: number }[] } };
type Contacto = { id: number; name?: string; custom_fields_values?: { field_code?: string; values?: { value?: string }[] }[] | null; updated_at?: number };

const campo = (c: Contacto, codigo: string) => c.custom_fields_values?.find((f) => f.field_code === codigo)?.values?.[0]?.value ?? "";

export const adaptador: Adaptador = {
  proveedor: "kommo",
  autenticacion: "oauth",
  variables: ["KOMMO_CLIENT_ID", "KOMMO_CLIENT_SECRET"],

  urlAutorizacion({ state }) {
    return `https://www.kommo.com/oauth${consulta({ client_id: credenciales().id, state, mode: "post_message" })}`;
  },

  async intercambiar({ code, redirectUri, query }) {
    // Primero la cuenta que eligió en Kommo (referer); si no viene, la que escribió en la tarjeta
    const sub = subdominioKommo(query?.referer) ?? subdominioKommo(query?.subdomain);
    if (!sub) throw new ErrorProveedor("No supe cuál es tu cuenta de Kommo. Escribe su subdominio e intenta de nuevo.");
    const { id, secreto } = credenciales();
    const r = await token(sub, { client_id: id, client_secret: secreto, grant_type: "authorization_code", code, redirect_uri: redirectUri });
    const t = aTokens(r, sub);
    t.extra!.redirect_uri = redirectUri;
    return t;
  },

  async renovar(t) {
    if (!t.refresh_token) throw sinRenovacion(NOMBRE);
    const { id, secreto } = credenciales();
    const sub = subDe(t);
    // Kommo pide el redirect_uri también al renovar: el mismo callback de siempre
    const redirect = t.extra?.redirect_uri ?? "";
    const r = await token(sub, { client_id: id, client_secret: secreto, grant_type: "refresh_token", refresh_token: t.refresh_token, ...(redirect ? { redirect_uri: redirect } : {}) });
    return aTokens(r, sub, t);
  },

  async cuenta(t) {
    const r = await api<{ name?: string; subdomain?: string }>(t, "/api/v4/account");
    return unir(r?.name, `${r?.subdomain ?? t.extra?.subdominio}.kommo.com`) || "Cuenta de Kommo";
  },

  herramientas: [
    herramienta({
      nombre: "kommo_leads",
      descripcion: "Busca leads (oportunidades) en Kommo: nombre, valor, embudo y etapa, y última actualización. Sin texto, regresa los más recientes. Solo lectura.",
      app: "kommo",
      agentes: ["victor"],
      proveedor: NOMBRE,
      esquema: esquema({
        buscar: { type: "string", description: "Texto a buscar (nombre del lead, contacto, teléfono o correo)." },
        limite: { type: "integer", minimum: 1, maximum: 50, description: "Cuántos leads. Por defecto 20." },
      }),
      async ejecutar(args, ctx) {
        const t = await ctx.token();
        const q = argTexto(args, "buscar", 100);
        const [leads, embudos] = await Promise.all([
          api<{ _embedded?: { leads?: Lead[] } }>(t, "/api/v4/leads", { query: q || undefined, limit: argEntero(args, "limite", 20, 1, 50), "order[updated_at]": "desc" }, ctx.senal),
          api<{ _embedded?: { pipelines?: { id: number; name?: string; _embedded?: { statuses?: { id: number; name?: string }[] } }[] } }>(t, "/api/v4/leads/pipelines", {}, ctx.senal).catch(() => null),
        ]);
        const lista = leads?._embedded?.leads ?? [];
        if (!lista.length) return q ? `No encontré leads en Kommo con "${q}".` : "No hay leads en Kommo.";
        const etapas = new Map<number, string>();
        for (const p of embudos?._embedded?.pipelines ?? []) for (const s of p._embedded?.statuses ?? []) etapas.set(s.id, `${linea(p.name, 40)} › ${linea(s.name, 40)}`);
        return [
          `Leads de Kommo${q ? ` con "${q}"` : ""} (${lista.length}):`,
          ...lista.map((l) => `- ${unir(linea(l.name, 100) || `Lead ${l.id}`, l.price ? `$${l.price.toLocaleString("es-MX")}` : "", (l.status_id && etapas.get(l.status_id)) || "", l.updated_at ? `actualizado ${fecha(l.updated_at)}` : "")}`),
        ].join("\n");
      },
    }),
    herramienta({
      nombre: "kommo_contactos",
      descripcion: "Busca contactos en Kommo (nombre, teléfono y correo). Sin texto, regresa los más recientes. Solo lectura.",
      app: "kommo",
      agentes: ["victor"],
      proveedor: NOMBRE,
      esquema: esquema({
        buscar: { type: "string", description: "Nombre, teléfono o correo a buscar." },
        limite: { type: "integer", minimum: 1, maximum: 50, description: "Cuántos contactos. Por defecto 20." },
      }),
      async ejecutar(args, ctx) {
        const q = argTexto(args, "buscar", 100);
        const r = await api<{ _embedded?: { contacts?: Contacto[] } }>(
          await ctx.token(),
          "/api/v4/contacts",
          { query: q || undefined, limit: argEntero(args, "limite", 20, 1, 50), "order[updated_at]": "desc" },
          ctx.senal,
        );
        const lista = r?._embedded?.contacts ?? [];
        if (!lista.length) return q ? `No encontré contactos en Kommo con "${q}".` : "No hay contactos en Kommo.";
        return [`Contactos de Kommo${q ? ` con "${q}"` : ""} (${lista.length}):`, ...lista.map((c) => `- ${unir(linea(c.name, 80), linea(campo(c, "PHONE"), 30), linea(campo(c, "EMAIL"), 80))}`)].join("\n");
      },
    }),
  ],
};

/** Con el nombre del proveedor, como lo importa el registro. */
export { adaptador as kommo };
