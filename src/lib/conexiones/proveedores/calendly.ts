import type { Adaptador, Tokens } from "@/lib/nucleo-tipos";
import {
  ErrorProveedor,
  argEntero,
  basico,
  consulta,
  esquema,
  expiraEn,
  fecha,
  formulario,
  herramienta,
  linea,
  pedirJson,
  pedirToken,
  sinRenovacion,
  unir,
  variable,
} from "./_comun-1";

/**
 * CALENDLY (OAuth 2.0; documentación de developer.calendly.com, nov 2026):
 * - Autorizar: https://auth.calendly.com/oauth/authorize con PKCE S256
 *   OBLIGATORIO para toda app y scopes separados por espacio.
 * - Token: POST https://auth.calendly.com/oauth/token con Basic
 *   (client_id:client_secret). El access token dura 2 horas; el refresh
 *   token es de UN solo uso (cada renovación regresa uno nuevo).
 * - Revocar: POST https://auth.calendly.com/oauth/revoke.
 * - API: https://api.calendly.com (users/me, scheduled_events, event_types).
 */

const NOMBRE = "Calendly";
const AUTH = "https://auth.calendly.com/oauth";
const API = "https://api.calendly.com";
export const SCOPES_CALENDLY = ["users:read", "scheduled_events:read", "event_types:read"];

type RespuestaToken = { access_token: string; refresh_token?: string; expires_in?: number; owner?: string; organization?: string };

const credenciales = () => ({ id: variable("CALENDLY_CLIENT_ID"), secreto: variable("CALENDLY_CLIENT_SECRET") });

function aTokens(r: RespuestaToken, anterior?: Tokens): Tokens {
  const extra = { ...(anterior?.extra ?? {}) };
  if (r.owner) extra.usuario = r.owner;
  if (r.organization) extra.organizacion = r.organization;
  return { access_token: r.access_token, refresh_token: r.refresh_token ?? anterior?.refresh_token, expira_en: expiraEn(r.expires_in), extra };
}

function api<T>(token: string, ruta: string, senal?: AbortSignal) {
  return pedirJson<T>(NOMBRE, `${API}${ruta}`, { encabezados: { Authorization: `Bearer ${token}` }, senal });
}

async function usuarioDe(t: Tokens, senal?: AbortSignal): Promise<string> {
  if (t.extra?.usuario) return t.extra.usuario;
  const yo = await api<{ resource?: { uri?: string } }>(t.access_token, "/users/me", senal);
  if (!yo.resource?.uri) throw new ErrorProveedor("Calendly no dijo cuál es tu usuario. Vuelve a conectar Calendly.");
  return yo.resource.uri;
}

const uuidDe = (uri: string) => uri.split("/").pop() ?? "";

type Evento = {
  uri: string;
  name?: string;
  status?: string;
  start_time?: string;
  end_time?: string;
  location?: { type?: string; location?: string; join_url?: string };
  invitees_counter?: { active?: number };
};
type Invitado = { name?: string; email?: string; status?: string };

export const adaptador: Adaptador = {
  proveedor: "calendly",
  autenticacion: "oauth",
  variables: ["CALENDLY_CLIENT_ID", "CALENDLY_CLIENT_SECRET"],

  urlAutorizacion({ state, redirectUri, codeChallenge }) {
    if (!codeChallenge) throw new ErrorProveedor("Calendly pide PKCE: falta el code_challenge.");
    return `${AUTH}/authorize${consulta({
      client_id: credenciales().id,
      response_type: "code",
      redirect_uri: redirectUri,
      scope: SCOPES_CALENDLY.join(" "),
      state,
      code_challenge_method: "S256",
      code_challenge: codeChallenge,
    })}`;
  },

  async intercambiar({ code, redirectUri, codeVerifier }) {
    const { id, secreto } = credenciales();
    const r = await pedirToken<RespuestaToken>(
      NOMBRE,
      `${AUTH}/token`,
      formulario({ grant_type: "authorization_code", code, redirect_uri: redirectUri, client_id: id, code_verifier: codeVerifier }),
      { Authorization: basico(id, secreto) },
    );
    return aTokens(r);
  },

  async renovar(t) {
    if (!t.refresh_token) throw sinRenovacion(NOMBRE);
    const { id, secreto } = credenciales();
    const r = await pedirToken<RespuestaToken>(
      NOMBRE,
      `${AUTH}/token`,
      formulario({ grant_type: "refresh_token", refresh_token: t.refresh_token, client_id: id }),
      { Authorization: basico(id, secreto) },
    );
    return aTokens(r, t);
  },

  async revocar(t) {
    const { id, secreto } = credenciales();
    await pedirJson(NOMBRE, `${AUTH}/revoke`, {
      metodo: "POST",
      encabezados: { "Content-Type": "application/x-www-form-urlencoded" },
      cuerpo: formulario({ client_id: id, client_secret: secreto, token: t.refresh_token ?? t.access_token }),
    }).catch(() => undefined);
  },

  async cuenta(t) {
    const yo = await api<{ resource?: { name?: string; email?: string } }>(t.access_token, "/users/me");
    return yo.resource?.email || yo.resource?.name || "Cuenta de Calendly";
  },

  herramientas: [
    herramienta({
      nombre: "calendly_citas",
      descripcion:
        "Lista las próximas citas agendadas en Calendly (fecha, hora, tipo de evento, lugar y quién agendó). Solo lectura.",
      app: "calendly",
      agentes: ["lola"],
      proveedor: NOMBRE,
      esquema: esquema({
        dias: { type: "integer", minimum: 1, maximum: 60, description: "Cuántos días hacia adelante, desde hoy. Por defecto 14." },
        limite: { type: "integer", minimum: 1, maximum: 50, description: "Cuántas citas como máximo. Por defecto 20." },
      }),
      async ejecutar(args, ctx) {
        const t = await ctx.token();
        const usuario = await usuarioDe(t, ctx.senal);
        const dias = argEntero(args, "dias", 14, 1, 60);
        const ahora = new Date();
        const datos = await api<{ collection?: Evento[] }>(
          t.access_token,
          `/scheduled_events${consulta({
            user: usuario,
            status: "active",
            sort: "start_time:asc",
            min_start_time: ahora.toISOString(),
            max_start_time: new Date(ahora.getTime() + dias * 86_400_000).toISOString(),
            count: argEntero(args, "limite", 20, 1, 50),
          })}`,
          ctx.senal,
        );
        const eventos = datos.collection ?? [];
        if (!eventos.length) return `No hay citas agendadas en Calendly en los próximos ${dias} días.`;
        // Quién agendó: solo para las primeras 10 (una consulta por cita).
        const invitados = await Promise.allSettled(
          eventos.slice(0, 10).map((e) =>
            api<{ collection?: Invitado[] }>(t.access_token, `/scheduled_events/${uuidDe(e.uri)}/invitees?status=active&count=5`, ctx.senal),
          ),
        );
        return [
          `Citas en Calendly, próximos ${dias} días (${eventos.length}):`,
          ...eventos.map((e, i) => {
            const r = invitados[i];
            const quien =
              r?.status === "fulfilled"
                ? (r.value.collection ?? []).map((v) => unir(linea(v.name, 60), linea(v.email, 80))).join(", ")
                : "";
            const fin = e.end_time ? fecha(e.end_time).split(", ").pop() : "";
            const lugar = linea(e.location?.location, 80) || (e.location?.join_url ? "videollamada" : linea(e.location?.type, 40));
            return `- ${unir(`${fecha(e.start_time)}${fin ? `–${fin}` : ""}`, linea(e.name, 80), quien ? `con ${quien}` : "", lugar)}`;
          }),
        ].join("\n");
      },
    }),
    herramienta({
      nombre: "calendly_tipos_evento",
      descripcion: "Lista los tipos de cita activos de Calendly (nombre, duración y enlace para agendar). Solo lectura.",
      app: "calendly",
      agentes: ["lola"],
      proveedor: NOMBRE,
      esquema: esquema({}),
      async ejecutar(_args, ctx) {
        const t = await ctx.token();
        const usuario = await usuarioDe(t, ctx.senal);
        const datos = await api<{ collection?: { name?: string; duration?: number; scheduling_url?: string; kind?: string; active?: boolean }[] }>(
          t.access_token,
          `/event_types${consulta({ user: usuario, active: true, count: 50 })}`,
          ctx.senal,
        );
        const tipos = datos.collection ?? [];
        if (!tipos.length) return "No hay tipos de cita activos en Calendly.";
        return [
          `Tipos de cita en Calendly (${tipos.length}):`,
          ...tipos.map((e) => `- ${unir(linea(e.name, 80), e.duration ? `${e.duration} min` : "", e.kind === "group" ? "grupal" : "", e.scheduling_url)}`),
        ].join("\n");
      },
    }),
  ],
};

/** Con el nombre del proveedor, como lo importa el registro. */
export { adaptador as calendly };
