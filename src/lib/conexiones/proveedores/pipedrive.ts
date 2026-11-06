import type { Adaptador, Tokens } from "@/lib/nucleo-tipos";
import {
  ErrorProveedor,
  argEntero,
  argTexto,
  basico,
  consulta,
  esquema,
  expiraEn,
  formulario,
  herramienta,
  linea,
  pedir,
  pedirJson,
  pedirToken,
  sinRenovacion,
  unir,
  variable,
} from "./_comun-1";

/**
 * PIPEDRIVE (OAuth 2; pipedrive.readme.io / developers.pipedrive.com, nov 2026):
 * - Autorizar: https://oauth.pipedrive.com/oauth/authorize. Los permisos se
 *   eligen en la app del Developer Hub: "Contacts: read only" y
 *   "Deals: read only" (más el acceso básico, que incluye users/me).
 * - Token: POST https://oauth.pipedrive.com/oauth/token con Basic; la
 *   respuesta trae `api_domain` (https://<empresa>.pipedrive.com). El access
 *   token dura ~1 hora y se renueva con el refresh token.
 * - Revocar: POST https://oauth.pipedrive.com/oauth/revoke.
 * - API v2: /api/v2/persons(/search) y /api/v2/deals(/search).
 */

const NOMBRE = "Pipedrive";
const OAUTH = "https://oauth.pipedrive.com/oauth";
const DOMINIO = /^https:\/\/[a-z0-9-]+\.pipedrive\.com$/;

const credenciales = () => ({ id: variable("PIPEDRIVE_CLIENT_ID"), secreto: variable("PIPEDRIVE_CLIENT_SECRET") });

type RespuestaToken = { access_token: string; refresh_token?: string; expires_in?: number; api_domain?: string; scope?: string };

function aTokens(r: RespuestaToken, anterior?: Tokens): Tokens {
  const extra = { ...(anterior?.extra ?? {}) };
  if (r.api_domain) {
    if (!DOMINIO.test(r.api_domain)) throw new ErrorProveedor("Pipedrive regresó un dominio que no se reconoce.");
    extra.api = r.api_domain;
  }
  if (r.scope) extra.scopes = r.scope.replace(/,/g, " ");
  return { access_token: r.access_token, refresh_token: r.refresh_token ?? anterior?.refresh_token, expira_en: expiraEn(r.expires_in), extra };
}

function api<T>(t: Tokens, ruta: string, params: Record<string, string | number | undefined> = {}, senal?: AbortSignal) {
  const base = t.extra?.api && DOMINIO.test(t.extra.api) ? t.extra.api : "https://api.pipedrive.com";
  return pedirJson<T>(NOMBRE, `${base}${ruta}${consulta(params)}`, { encabezados: { Authorization: `Bearer ${t.access_token}` }, senal });
}

type Persona = { id: number; name?: string; emails?: { value?: string }[]; phones?: { value?: string }[]; email?: { value?: string }[]; phone?: { value?: string }[]; org_id?: number; organization?: { name?: string } };
type Trato = { id: number; title?: string; value?: number; currency?: string; status?: string; stage_id?: number; expected_close_date?: string; person?: { name?: string }; organization?: { name?: string } };

const primero = (v?: { value?: string }[]) => v?.find((x) => x.value)?.value ?? "";

export const adaptador: Adaptador = {
  proveedor: "pipedrive",
  autenticacion: "oauth",
  variables: ["PIPEDRIVE_CLIENT_ID", "PIPEDRIVE_CLIENT_SECRET"],

  urlAutorizacion({ state, redirectUri }) {
    return `${OAUTH}/authorize${consulta({ client_id: credenciales().id, redirect_uri: redirectUri, state })}`;
  },

  async intercambiar({ code, redirectUri }) {
    const { id, secreto } = credenciales();
    const r = await pedirToken<RespuestaToken>(NOMBRE, `${OAUTH}/token`, formulario({ grant_type: "authorization_code", code, redirect_uri: redirectUri }), {
      Authorization: basico(id, secreto),
    });
    return aTokens(r);
  },

  async renovar(t) {
    if (!t.refresh_token) throw sinRenovacion(NOMBRE);
    const { id, secreto } = credenciales();
    const r = await pedirToken<RespuestaToken>(NOMBRE, `${OAUTH}/token`, formulario({ grant_type: "refresh_token", refresh_token: t.refresh_token }), {
      Authorization: basico(id, secreto),
    });
    return aTokens(r, t);
  },

  async revocar(t) {
    const { id, secreto } = credenciales();
    await pedir(NOMBRE, `${OAUTH}/revoke`, {
      metodo: "POST",
      encabezados: { Authorization: basico(id, secreto), "Content-Type": "application/x-www-form-urlencoded" },
      cuerpo: formulario({ token: t.refresh_token ?? t.access_token, token_type_hint: t.refresh_token ? "refresh_token" : "access_token" }),
    }).catch(() => undefined);
  },

  async cuenta(t) {
    const r = await api<{ data?: { email?: string; name?: string; company_name?: string } }>(t, "/api/v1/users/me");
    return unir(r.data?.email || r.data?.name, r.data?.company_name) || "Cuenta de Pipedrive";
  },

  herramientas: [
    herramienta({
      nombre: "pipedrive_personas",
      descripcion: "Busca personas (contactos) en Pipedrive: nombre, correo, teléfono y organización. Sin texto, regresa las más recientes. Solo lectura.",
      app: "pipedrive",
      agentes: ["victor"],
      proveedor: NOMBRE,
      esquema: esquema({
        buscar: { type: "string", description: "Nombre, correo o teléfono (mínimo 2 letras)." },
        limite: { type: "integer", minimum: 1, maximum: 50, description: "Cuántas personas. Por defecto 20." },
      }),
      async ejecutar(args, ctx) {
        const t = await ctx.token();
        const q = argTexto(args, "buscar", 100);
        const limite = argEntero(args, "limite", 20, 1, 50);
        let personas: Persona[];
        if (q) {
          if (q.length < 2) throw new ErrorProveedor("Para buscar en Pipedrive escribe al menos 2 letras.");
          const r = await api<{ data?: { items?: { item?: Persona }[] } }>(t, "/api/v2/persons/search", { term: q, limit: limite }, ctx.senal);
          personas = (r.data?.items ?? []).map((i) => i.item).filter((p): p is Persona => !!p);
        } else {
          const r = await api<{ data?: Persona[] }>(t, "/api/v2/persons", { limit: limite, sort_by: "update_time", sort_direction: "desc" }, ctx.senal);
          personas = r.data ?? [];
        }
        if (!personas.length) return q ? `No encontré personas en Pipedrive con "${q}".` : "No hay personas en Pipedrive.";
        return [
          `Personas de Pipedrive${q ? ` con "${q}"` : ""} (${personas.length}):`,
          ...personas.map((p) => `- ${unir(linea(p.name, 80), primero(p.emails ?? p.email), primero(p.phones ?? p.phone), linea(p.organization?.name, 60))}`),
        ].join("\n");
      },
    }),
    herramienta({
      nombre: "pipedrive_tratos",
      descripcion: "Busca tratos (deals) en Pipedrive: título, valor, estado, persona, organización y fecha esperada de cierre. Sin texto, regresa los abiertos más recientes. Solo lectura.",
      app: "pipedrive",
      agentes: ["victor"],
      proveedor: NOMBRE,
      esquema: esquema({
        buscar: { type: "string", description: "Texto a buscar en los tratos (mínimo 2 letras)." },
        limite: { type: "integer", minimum: 1, maximum: 50, description: "Cuántos tratos. Por defecto 20." },
      }),
      async ejecutar(args, ctx) {
        const t = await ctx.token();
        const q = argTexto(args, "buscar", 100);
        const limite = argEntero(args, "limite", 20, 1, 50);
        let tratos: Trato[];
        if (q) {
          if (q.length < 2) throw new ErrorProveedor("Para buscar en Pipedrive escribe al menos 2 letras.");
          const r = await api<{ data?: { items?: { item?: Trato }[] } }>(t, "/api/v2/deals/search", { term: q, limit: limite }, ctx.senal);
          tratos = (r.data?.items ?? []).map((i) => i.item).filter((d): d is Trato => !!d);
        } else {
          const r = await api<{ data?: Trato[] }>(t, "/api/v2/deals", { status: "open", limit: limite, sort_by: "update_time", sort_direction: "desc" }, ctx.senal);
          tratos = r.data ?? [];
        }
        if (!tratos.length) return q ? `No encontré tratos en Pipedrive con "${q}".` : "No hay tratos abiertos en Pipedrive.";
        return [
          `Tratos de Pipedrive${q ? ` con "${q}"` : " abiertos"} (${tratos.length}):`,
          ...tratos.map((d) =>
            `- ${unir(linea(d.title, 100), d.value ? `$${d.value.toLocaleString("es-MX")} ${d.currency ?? ""}`.trim() : "", d.status, linea(d.person?.name, 60), linea(d.organization?.name, 60), d.expected_close_date ? `cierre ${d.expected_close_date}` : "")}`,
          ),
        ].join("\n");
      },
    }),
  ],
};

/** Con el nombre del proveedor, como lo importa el registro. */
export { adaptador as pipedrive };
