import type { Adaptador, Tokens } from "@/lib/nucleo-tipos";
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
  pedirJson,
  pedirToken,
  unir,
  variable,
} from "./_comun-1";

/**
 * HUBSPOT (OAuth; developers.hubspot.com, nov 2026):
 * - Autorizar: https://app.hubspot.com/oauth/authorize con scope
 *   "oauth crm.objects.contacts.read crm.objects.deals.read".
 * - Token, introspección y revocación con la versión 2026-09 de la API de
 *   OAuth (la v1 se retira el 16 feb 2027):
 *   POST https://api.hubapi.com/oauth/2026-09/token,
 *   /oauth/2026-09/token/introspect (correo y portal de la cuenta) y
 *   /oauth/2026-09/token/revoke (borra el refresh token).
 *   El access token dura 30 minutos.
 * - CRM: POST /crm/v3/objects/contacts/search y /crm/v3/objects/deals/search.
 */

const NOMBRE = "HubSpot";
const API = "https://api.hubapi.com";
const OAUTH = `${API}/oauth/2026-09`;
export const SCOPES_HUBSPOT = ["oauth", "crm.objects.contacts.read", "crm.objects.deals.read"];

type RespuestaToken = { access_token: string; refresh_token?: string; expires_in?: number };

const credenciales = () => ({ id: variable("HUBSPOT_CLIENT_ID"), secreto: variable("HUBSPOT_CLIENT_SECRET") });

async function introspeccion(token: string): Promise<Record<string, string>> {
  const { id, secreto } = credenciales();
  const r = await pedirJson<{ active?: boolean; user?: string; hub_domain?: string; hub_id?: number }>(NOMBRE, `${OAUTH}/token/introspect`, {
    metodo: "POST",
    encabezados: { "Content-Type": "application/x-www-form-urlencoded" },
    cuerpo: formulario({ client_id: id, client_secret: secreto, token_type_hint: "access_token", token }),
  });
  const extra: Record<string, string> = {};
  if (r.user) extra.correo = r.user;
  if (r.hub_domain) extra.portal = r.hub_domain;
  if (r.hub_id) extra.hub_id = String(r.hub_id);
  return extra;
}

const aTokens = (r: RespuestaToken, extra?: Record<string, string>, anterior?: Tokens): Tokens => ({
  access_token: r.access_token,
  refresh_token: r.refresh_token ?? anterior?.refresh_token,
  expira_en: expiraEn(r.expires_in),
  extra: extra ?? anterior?.extra,
});

type Objeto = { id: string; properties?: Record<string, string | null> };

async function buscarCrm(t: Tokens, objeto: "contacts" | "deals", args: Record<string, unknown>, propiedades: string[], orden: string, senal: AbortSignal) {
  const q = argTexto(args, "buscar", 200);
  const r = await pedirJson<{ total?: number; results?: Objeto[] }>(NOMBRE, `${API}/crm/v3/objects/${objeto}/search`, {
    metodo: "POST",
    encabezados: { Authorization: `Bearer ${t.access_token}`, "Content-Type": "application/json" },
    cuerpo: JSON.stringify({
      ...(q ? { query: q } : {}),
      limit: argEntero(args, "limite", 20, 1, 50),
      properties: propiedades,
      sorts: [{ propertyName: orden, direction: "DESCENDING" }],
    }),
    senal,
    interpretar: (estado) =>
      estado === 403 ? "A la conexión con HubSpot le falta un permiso. Vuelve a conectarla y acepta todos los permisos." : undefined,
  });
  return { q, total: r.total ?? 0, lista: r.results ?? [] };
}

const dinero = (monto?: string | null, moneda?: string | null) => {
  const n = Number(monto);
  if (!monto || !Number.isFinite(n)) return "";
  return `$${n.toLocaleString("es-MX", { maximumFractionDigits: 2 })}${moneda ? ` ${moneda}` : ""}`;
};

export const adaptador: Adaptador = {
  proveedor: "hubspot",
  autenticacion: "oauth",
  variables: ["HUBSPOT_CLIENT_ID", "HUBSPOT_CLIENT_SECRET"],

  urlAutorizacion({ state, redirectUri }) {
    return `https://app.hubspot.com/oauth/authorize${consulta({
      client_id: credenciales().id,
      redirect_uri: redirectUri,
      scope: SCOPES_HUBSPOT.join(" "),
      state,
    })}`;
  },

  async intercambiar({ code, redirectUri }) {
    const { id, secreto } = credenciales();
    const r = await pedirToken<RespuestaToken>(
      NOMBRE,
      `${OAUTH}/token`,
      formulario({ grant_type: "authorization_code", code, redirect_uri: redirectUri, client_id: id, client_secret: secreto }),
    );
    let extra: Record<string, string> = {};
    try {
      extra = await introspeccion(r.access_token);
    } catch {
      // Sin correo ni portal: la tarjeta dirá "Cuenta de HubSpot".
    }
    return aTokens(r, extra);
  },

  async renovar(t) {
    if (!t.refresh_token) throw new ErrorProveedor("La conexión con HubSpot venció. Vuelve a conectarla.", 401);
    const { id, secreto } = credenciales();
    const r = await pedirToken<RespuestaToken>(
      NOMBRE,
      `${OAUTH}/token`,
      formulario({ grant_type: "refresh_token", refresh_token: t.refresh_token, client_id: id, client_secret: secreto }),
    );
    return aTokens(r, undefined, t);
  },

  async revocar(t) {
    if (!t.refresh_token) return;
    const { id, secreto } = credenciales();
    await pedirJson(NOMBRE, `${OAUTH}/token/revoke`, {
      metodo: "POST",
      encabezados: { "Content-Type": "application/x-www-form-urlencoded" },
      cuerpo: formulario({ client_id: id, client_secret: secreto, token: t.refresh_token, token_type_hint: "refresh_token" }),
    }).catch(() => undefined);
  },

  async cuenta(t) {
    const extra = t.extra?.correo ? t.extra : await introspeccion(t.access_token);
    return unir(extra.correo, extra.portal) || "Cuenta de HubSpot";
  },

  herramientas: [
    herramienta({
      nombre: "hubspot_contactos",
      descripcion:
        "Busca contactos en el CRM de HubSpot (nombre, correo, teléfono, empresa y etapa). Sin texto, regresa los modificados más recientemente. Solo lectura.",
      app: "hubspot",
      agentes: ["victor"],
      proveedor: NOMBRE,
      esquema: esquema({
        buscar: { type: "string", description: "Nombre, correo, teléfono o empresa a buscar." },
        limite: { type: "integer", minimum: 1, maximum: 50, description: "Cuántos contactos. Por defecto 20." },
      }),
      async ejecutar(args, ctx) {
        const t = await ctx.token();
        const { q, total, lista } = await buscarCrm(
          t,
          "contacts",
          args,
          ["firstname", "lastname", "email", "phone", "company", "lifecyclestage", "lastmodifieddate"],
          "lastmodifieddate",
          ctx.senal,
        );
        if (!lista.length) return q ? `No encontré contactos en HubSpot con "${q}".` : "No hay contactos en HubSpot.";
        return [
          `Contactos de HubSpot${q ? ` con "${q}"` : ""} (${lista.length} de ${total}):`,
          ...lista.map((c) => {
            const p = c.properties ?? {};
            return `- ${unir(linea([p.firstname, p.lastname].filter(Boolean).join(" "), 80) || "Sin nombre", p.email, p.phone, linea(p.company, 60), p.lifecyclestage, p.lastmodifieddate ? `modificado ${fecha(p.lastmodifieddate)}` : "")}`;
          }),
        ].join("\n");
      },
    }),
    herramienta({
      nombre: "hubspot_negocios",
      descripcion:
        "Busca negocios (deals) en el CRM de HubSpot: nombre, monto, etapa y fecha de cierre. Sin texto, regresa los modificados más recientemente. Solo lectura.",
      app: "hubspot",
      agentes: ["victor"],
      proveedor: NOMBRE,
      esquema: esquema({
        buscar: { type: "string", description: "Texto a buscar en el nombre del negocio." },
        limite: { type: "integer", minimum: 1, maximum: 50, description: "Cuántos negocios. Por defecto 20." },
      }),
      async ejecutar(args, ctx) {
        const t = await ctx.token();
        const { q, total, lista } = await buscarCrm(
          t,
          "deals",
          args,
          ["dealname", "amount", "deal_currency_code", "dealstage", "pipeline", "closedate", "hs_lastmodifieddate"],
          "hs_lastmodifieddate",
          ctx.senal,
        );
        if (!lista.length) return q ? `No encontré negocios en HubSpot con "${q}".` : "No hay negocios en HubSpot.";
        return [
          `Negocios de HubSpot${q ? ` con "${q}"` : ""} (${lista.length} de ${total}):`,
          ...lista.map((d) => {
            const p = d.properties ?? {};
            return `- ${unir(linea(p.dealname, 100) || "Sin nombre", dinero(p.amount, p.deal_currency_code), p.dealstage ? `etapa ${p.dealstage}` : "", p.closedate ? `cierre ${fecha(p.closedate)}` : "")}`;
          }),
        ].join("\n");
      },
    }),
  ],
};
