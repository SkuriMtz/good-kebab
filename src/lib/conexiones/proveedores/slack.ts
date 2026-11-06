import type { Adaptador, Tokens } from "@/lib/nucleo-tipos";
import { ErrorOAuth } from "../oauth";
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
  mensajePorEstado,
  pedirJson,
  sinRenovacion,
  unir,
  variable,
} from "./_comun-1";

/**
 * SLACK (OAuth v2 con permisos DE USUARIO; docs.slack.dev, nov 2026):
 * - Autorizar: https://slack.com/oauth/v2/authorize con user_scope
 *   channels:history, channels:read y search:read (sin permisos de bot).
 * - Token: POST https://slack.com/api/oauth.v2.access; el token de usuario
 *   (xoxp-) viene en authed_user. Si la app tiene "token rotation", también
 *   trae refresh_token y expires_in, y se renueva con grant_type=refresh_token.
 * - Revocar: auth.revoke. Cuenta: auth.test.
 * - Slack responde 200 con {ok:false, error} cuando algo falla.
 * - search.messages es un método "legacy" (Slack recomienda su Real-time
 *   Search API para apps del Marketplace), pero sigue vigente con token de
 *   usuario y search:read.
 * - Para apps fuera del Marketplace, conversations.history da como máximo
 *   15 mensajes y 1 consulta por minuto (cambio de Slack de 2025).
 */

const NOMBRE = "Slack";
const API = "https://slack.com/api";
export const USER_SCOPES_SLACK = ["channels:history", "channels:read", "search:read"];

type Base = { ok: boolean; error?: string };

function interpretarSlack(error?: string): string {
  if (!error) return "Slack no dejó hacer la consulta en este momento.";
  if (["not_authed", "invalid_auth", "token_revoked", "token_expired", "account_inactive"].includes(error)) return mensajePorEstado(NOMBRE, 401);
  if (error === "missing_scope") return "A la conexión con Slack le falta un permiso. Vuelve a conectarla y acepta todos los permisos.";
  if (error === "channel_not_found" || error === "not_in_channel") return "No encontré ese canal (o no tienes acceso a él).";
  if (error === "ratelimited") return mensajePorEstado(NOMBRE, 429);
  return "Slack no dejó hacer la consulta en este momento.";
}

async function api<T extends Base>(token: string, metodo: string, params: Record<string, string | number | boolean | undefined> = {}, senal?: AbortSignal) {
  const r = await pedirJson<T>(NOMBRE, `${API}/${metodo}${consulta(params)}`, { encabezados: { Authorization: `Bearer ${token}` }, senal });
  if (!r.ok) {
    const auth = ["not_authed", "invalid_auth", "token_revoked", "token_expired", "account_inactive"].includes(r.error ?? "");
    throw new ErrorProveedor(interpretarSlack(r.error), auth ? 401 : r.error === "ratelimited" ? 429 : 0);
  }
  return r;
}

type RespuestaOAuth = Base & {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  team?: { id?: string; name?: string };
  authed_user?: { id?: string; scope?: string; access_token?: string; refresh_token?: string; expires_in?: number };
};

async function oauth(campos: Record<string, string | undefined>): Promise<RespuestaOAuth> {
  const r = await pedirJson<RespuestaOAuth>(NOMBRE, `${API}/oauth.v2.access`, {
    metodo: "POST",
    encabezados: { "Content-Type": "application/x-www-form-urlencoded" },
    cuerpo: formulario(campos),
  });
  if (!r.ok) {
    const corto = r.error && /^[a-z_]{3,40}$/.test(r.error) ? ` (${r.error})` : "";
    const vencido = ["invalid_refresh_token", "invalid_grant", "token_revoked", "invalid_code"].includes(r.error ?? "");
    throw new ErrorOAuth(vencido ? "invalid_grant" : "rechazo", `Slack no aceptó la conexión${corto}. Intenta conectar de nuevo.`);
  }
  return r;
}

function aTokens(r: RespuestaOAuth, anterior?: Tokens): Tokens {
  const u = r.authed_user;
  const access = u?.access_token ?? r.access_token;
  if (!access) throw new ErrorProveedor("Slack no regresó el permiso de acceso. Intenta conectar de nuevo.");
  const extra = { ...(anterior?.extra ?? {}) };
  if (r.team?.id) extra.team_id = r.team.id;
  if (r.team?.name) extra.team = r.team.name;
  if (u?.id) extra.user_id = u.id;
  if (u?.scope) extra.scopes = u.scope.split(",").join(" ");
  return {
    access_token: access,
    refresh_token: u?.refresh_token ?? r.refresh_token ?? anterior?.refresh_token,
    expira_en: expiraEn(u?.expires_in ?? r.expires_in),
    extra,
  };
}

type Canal = { id: string; name?: string; is_archived?: boolean; num_members?: number; topic?: { value?: string } };

async function canales(token: string, senal?: AbortSignal): Promise<Canal[]> {
  const r = await api<Base & { channels?: Canal[] }>(token, "conversations.list", { types: "public_channel", exclude_archived: true, limit: 200 }, senal);
  return r.channels ?? [];
}

const quien = (m: { user?: string; username?: string; bot_profile?: { name?: string } }) => m.username || m.bot_profile?.name || m.user || "alguien";

export const adaptador: Adaptador = {
  proveedor: "slack",
  autenticacion: "oauth",
  variables: ["SLACK_CLIENT_ID", "SLACK_CLIENT_SECRET"],

  urlAutorizacion({ state, redirectUri }) {
    return `https://slack.com/oauth/v2/authorize${consulta({
      client_id: variable("SLACK_CLIENT_ID"),
      user_scope: USER_SCOPES_SLACK.join(","),
      redirect_uri: redirectUri,
      state,
    })}`;
  },

  async intercambiar({ code, redirectUri }) {
    return aTokens(
      await oauth({ client_id: variable("SLACK_CLIENT_ID"), client_secret: variable("SLACK_CLIENT_SECRET"), code, redirect_uri: redirectUri }),
    );
  },

  async renovar(t) {
    if (!t.refresh_token) throw sinRenovacion(NOMBRE);
    return aTokens(
      await oauth({
        client_id: variable("SLACK_CLIENT_ID"),
        client_secret: variable("SLACK_CLIENT_SECRET"),
        grant_type: "refresh_token",
        refresh_token: t.refresh_token,
      }),
      t,
    );
  },

  async revocar(t) {
    await api(t.access_token, "auth.revoke").catch(() => undefined);
  },

  async cuenta(t) {
    const r = await api<Base & { user?: string; team?: string }>(t.access_token, "auth.test");
    return unir(r.user, r.team ? `en ${r.team}` : "") || "Cuenta de Slack";
  },

  herramientas: [
    herramienta({
      nombre: "slack_buscar_mensajes",
      descripcion:
        "Busca mensajes en el Slack del negocio (canales a los que tiene acceso la persona que conectó). Acepta los filtros de Slack como in:#canal o from:@persona. Solo lectura.",
      app: "slack",
      agentes: ["iris"],
      proveedor: NOMBRE,
      esquema: esquema(
        {
          consulta: { type: "string", description: "Qué buscar. Puede llevar filtros de Slack (in:#ventas, from:@ana, after:2026-11-01)." },
          limite: { type: "integer", minimum: 1, maximum: 20, description: "Cuántos mensajes. Por defecto 10." },
        },
        ["consulta"],
      ),
      async ejecutar(args, ctx) {
        const q = argTexto(args, "consulta", 300);
        if (!q) throw new ErrorProveedor("Dime qué quieres buscar en Slack.");
        const t = await ctx.token();
        const r = await api<Base & { messages?: { total?: number; matches?: { text?: string; username?: string; user?: string; ts?: string; channel?: { name?: string } }[] } }>(
          t.access_token,
          "search.messages",
          { query: q, count: argEntero(args, "limite", 10, 1, 20), sort: "timestamp", sort_dir: "desc" },
          ctx.senal,
        );
        const lista = r.messages?.matches ?? [];
        if (!lista.length) return `No encontré mensajes en Slack con "${q}".`;
        return [
          `Mensajes en Slack para "${q}" (${lista.length} de ${r.messages?.total ?? lista.length}):`,
          ...lista.map((m) => `- ${unir(fecha(m.ts), m.channel?.name ? `#${m.channel.name}` : "", quien(m))}: ${linea(m.text, 300)}`),
        ].join("\n");
      },
    }),
    herramienta({
      nombre: "slack_leer_canal",
      descripcion:
        "Lee los mensajes más recientes de un canal público de Slack (por nombre o id). Sin canal, lista los canales públicos disponibles. Máximo 15 mensajes por consulta. Solo lectura.",
      app: "slack",
      agentes: ["iris"],
      proveedor: NOMBRE,
      esquema: esquema({
        canal: { type: "string", description: 'Nombre del canal (p. ej. "general" o "#ventas") o su id (C…). Vacío para ver la lista de canales.' },
        limite: { type: "integer", minimum: 1, maximum: 15, description: "Cuántos mensajes. Por defecto 15." },
      }),
      async ejecutar(args, ctx) {
        const t = await ctx.token();
        const pedido = argTexto(args, "canal", 100).replace(/^#/, "");
        let id = /^[CG][A-Z0-9]{6,}$/.test(pedido) ? pedido : "";
        let nombre = id;
        if (!id) {
          const lista = await canales(t.access_token, ctx.senal);
          if (!pedido) {
            if (!lista.length) return "No hay canales públicos en este Slack.";
            return [
              `Canales públicos de Slack (${lista.length}):`,
              ...lista.map((c) => `- ${unir(`#${c.name}`, c.num_members !== undefined ? `${c.num_members} miembros` : "", linea(c.topic?.value, 100))}`),
            ].join("\n");
          }
          const c = lista.find((x) => x.name?.toLowerCase() === pedido.toLowerCase());
          if (!c) throw new ErrorProveedor(`No encontré el canal #${pedido} en Slack.`);
          id = c.id;
          nombre = c.name ?? pedido;
        }
        const r = await api<Base & { messages?: { text?: string; user?: string; username?: string; ts?: string; bot_profile?: { name?: string }; subtype?: string }[] }>(
          t.access_token,
          "conversations.history",
          { channel: id, limit: argEntero(args, "limite", 15, 1, 15) },
          ctx.senal,
        );
        const mensajes = (r.messages ?? []).filter((m) => !m.subtype || m.subtype === "bot_message" || m.subtype === "thread_broadcast").reverse();
        if (!mensajes.length) return `No hay mensajes recientes en #${nombre}.`;
        return [
          `Últimos mensajes de #${nombre} (${mensajes.length}, del más viejo al más nuevo; los usuarios salen por su id de Slack):`,
          ...mensajes.map((m) => `- ${unir(fecha(m.ts), quien(m))}: ${linea(m.text, 300)}`),
        ].join("\n");
      },
    }),
  ],
};

/** Con el nombre del proveedor, como lo importa el registro. */
export { adaptador as slack };
