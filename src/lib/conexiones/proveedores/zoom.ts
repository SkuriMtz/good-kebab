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
  unir,
  variable,
} from "./_comun-1";

/**
 * ZOOM (OAuth "General app" de usuario; developers.zoom.us, nov 2026):
 * - Autorizar: https://zoom.us/oauth/authorize. Los permisos (scopes
 *   granulares) se eligen en la app del Marketplace, no en la URL:
 *   `meeting:read:list_meetings` y `user:read:user`.
 * - Token: POST https://zoom.us/oauth/token con Basic. El access token dura
 *   1 hora; cada renovación regresa un refresh token nuevo (dura 90 días).
 * - Revocar: POST https://zoom.us/oauth/revoke.
 * - API: https://api.zoom.us/v2 (users/me y users/me/meetings?type=upcoming).
 */

const NOMBRE = "Zoom";
const API = "https://api.zoom.us/v2";
export const SCOPES_ZOOM = ["meeting:read:list_meetings", "user:read:user"];

type RespuestaToken = { access_token: string; refresh_token?: string; expires_in?: number };

const credenciales = () => ({ id: variable("ZOOM_CLIENT_ID"), secreto: variable("ZOOM_CLIENT_SECRET") });

const aTokens = (r: RespuestaToken, anterior?: Tokens): Tokens => ({
  access_token: r.access_token,
  refresh_token: r.refresh_token ?? anterior?.refresh_token,
  expira_en: expiraEn(r.expires_in),
  extra: anterior?.extra,
});

function api<T>(token: string, ruta: string, senal?: AbortSignal) {
  return pedirJson<T>(NOMBRE, `${API}${ruta}`, { encabezados: { Authorization: `Bearer ${token}` }, senal });
}

type Reunion = { id?: number; topic?: string; start_time?: string; duration?: number; type?: number; join_url?: string; agenda?: string };

export const adaptador: Adaptador = {
  proveedor: "zoom",
  autenticacion: "oauth",
  variables: ["ZOOM_CLIENT_ID", "ZOOM_CLIENT_SECRET"],

  urlAutorizacion({ state, redirectUri }) {
    return `https://zoom.us/oauth/authorize${consulta({ response_type: "code", client_id: credenciales().id, redirect_uri: redirectUri, state })}`;
  },

  async intercambiar({ code, redirectUri }) {
    const { id, secreto } = credenciales();
    const r = await pedirToken<RespuestaToken>(
      NOMBRE,
      "https://zoom.us/oauth/token",
      formulario({ grant_type: "authorization_code", code, redirect_uri: redirectUri }),
      { Authorization: basico(id, secreto) },
    );
    return aTokens(r);
  },

  async renovar(t) {
    if (!t.refresh_token) throw new ErrorProveedor("La conexión con Zoom venció. Vuelve a conectarla.", 401);
    const { id, secreto } = credenciales();
    const r = await pedirToken<RespuestaToken>(
      NOMBRE,
      "https://zoom.us/oauth/token",
      formulario({ grant_type: "refresh_token", refresh_token: t.refresh_token }),
      { Authorization: basico(id, secreto) },
    );
    return aTokens(r, t);
  },

  async revocar(t) {
    const { id, secreto } = credenciales();
    await pedirJson(NOMBRE, "https://zoom.us/oauth/revoke", {
      metodo: "POST",
      encabezados: { Authorization: basico(id, secreto), "Content-Type": "application/x-www-form-urlencoded" },
      cuerpo: formulario({ token: t.access_token }),
    }).catch(() => undefined);
  },

  async cuenta(t) {
    const yo = await api<{ email?: string; display_name?: string; first_name?: string; last_name?: string }>(t.access_token, "/users/me");
    return yo.email || yo.display_name || unir(yo.first_name, yo.last_name) || "Cuenta de Zoom";
  },

  herramientas: [
    herramienta({
      nombre: "zoom_proximas_reuniones",
      descripcion: "Lista las próximas reuniones de Zoom de la cuenta (fecha, hora, duración, tema y enlace). Solo lectura.",
      app: "zoom",
      agentes: ["lola"],
      proveedor: NOMBRE,
      esquema: esquema({
        limite: { type: "integer", minimum: 1, maximum: 30, description: "Cuántas reuniones como máximo. Por defecto 10." },
      }),
      async ejecutar(args, ctx) {
        const t = await ctx.token();
        const datos = await api<{ meetings?: Reunion[] }>(
          t.access_token,
          `/users/me/meetings${consulta({ type: "upcoming", page_size: argEntero(args, "limite", 10, 1, 30) })}`,
          ctx.senal,
        );
        const lista = (datos.meetings ?? []).sort((a, b) => (a.start_time ?? "9").localeCompare(b.start_time ?? "9"));
        if (!lista.length) return "No hay reuniones de Zoom próximas.";
        return [
          `Próximas reuniones de Zoom (${lista.length}):`,
          ...lista.map(
            (m) =>
              `- ${unir(
                fecha(m.start_time) || "recurrente sin hora fija",
                m.duration ? `${m.duration} min` : "",
                linea(m.topic, 100) || "Sin tema",
                m.agenda ? linea(m.agenda, 120) : "",
                m.join_url,
              )}`,
          ),
        ].join("\n");
      },
    }),
  ],
};
