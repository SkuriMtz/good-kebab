import type { Adaptador, Tokens } from "@/lib/nucleo-tipos";
import { ErrorProveedor, argEntero, consulta, esquema, fecha, formulario, herramienta, linea, pedirJson, pedirToken, unir, variable } from "./_comun-1";

/**
 * MAILCHIMP (OAuth 2; mailchimp.com/developer, nov 2026):
 * - Autorizar: https://login.mailchimp.com/oauth2/authorize.
 * - Token: POST https://login.mailchimp.com/oauth2/token. El token NO vence
 *   (no hay refresh token).
 * - Después se pide https://login.mailchimp.com/oauth2/metadata para saber el
 *   centro de datos (`dc`, p. ej. "us21"): la API vive en
 *   https://<dc>.api.mailchimp.com/3.0. Se guarda en extra.dc.
 * - Lee: /lists (audiencias) y /campaigns enviadas con su resumen.
 */

const NOMBRE = "Mailchimp";
const LOGIN = "https://login.mailchimp.com/oauth2";
const DC = /^[a-z]{2,4}\d{1,3}$/;

const credenciales = () => ({ id: variable("MAILCHIMP_CLIENT_ID"), secreto: variable("MAILCHIMP_CLIENT_SECRET") });

function api<T>(t: Tokens, ruta: string, params: Record<string, string | number | undefined> = {}, senal?: AbortSignal) {
  const dc = t.extra?.dc;
  if (!dc || !DC.test(dc)) throw new ErrorProveedor("Falta el centro de datos de tu cuenta de Mailchimp. Vuelve a conectar.");
  return pedirJson<T>(NOMBRE, `https://${dc}.api.mailchimp.com/3.0${ruta}${consulta(params)}`, { encabezados: { Authorization: `Bearer ${t.access_token}` }, senal });
}

const porcentaje = (v?: number) => (typeof v === "number" ? `${(v * 100).toFixed(1)}%` : "");

export const adaptador: Adaptador = {
  proveedor: "mailchimp",
  autenticacion: "oauth",
  variables: ["MAILCHIMP_CLIENT_ID", "MAILCHIMP_CLIENT_SECRET"],

  urlAutorizacion({ state, redirectUri }) {
    return `${LOGIN}/authorize${consulta({ response_type: "code", client_id: credenciales().id, redirect_uri: redirectUri, state })}`;
  },

  async intercambiar({ code, redirectUri }) {
    const { id, secreto } = credenciales();
    const r = await pedirToken<{ access_token: string }>(
      NOMBRE,
      `${LOGIN}/token`,
      formulario({ grant_type: "authorization_code", client_id: id, client_secret: secreto, redirect_uri: redirectUri, code }),
    );
    const meta = await pedirJson<{ dc?: string; accountname?: string; login?: { email?: string; login_email?: string } }>(NOMBRE, `${LOGIN}/metadata`, {
      encabezados: { Authorization: `OAuth ${r.access_token}`, Accept: "application/json" },
    });
    if (!meta.dc || !DC.test(meta.dc)) throw new ErrorProveedor("Mailchimp no dijo el centro de datos de tu cuenta. Intenta conectar de nuevo.");
    const extra: Record<string, string> = { dc: meta.dc };
    if (meta.accountname) extra.cuenta = meta.accountname;
    const correo = meta.login?.login_email ?? meta.login?.email;
    if (correo) extra.correo = correo;
    return { access_token: r.access_token, extra };
  },

  async cuenta(t) {
    return unir(t.extra?.correo, t.extra?.cuenta) || "Cuenta de Mailchimp";
  },

  herramientas: [
    herramienta({
      nombre: "mailchimp_listas",
      descripcion: "Lista las audiencias (listas de contactos) de Mailchimp con cuántos suscritos tienen y sus tasas de apertura y clics. Solo lectura.",
      app: "mailchimp",
      agentes: ["victor"],
      proveedor: NOMBRE,
      esquema: esquema({}),
      async ejecutar(_args, ctx) {
        const r = await api<{ lists?: { id: string; name?: string; stats?: { member_count?: number; unsubscribe_count?: number; open_rate?: number; click_rate?: number; last_sub_date?: string } }[] }>(
          await ctx.token(),
          "/lists",
          { count: 50, fields: "lists.id,lists.name,lists.stats.member_count,lists.stats.unsubscribe_count,lists.stats.open_rate,lists.stats.click_rate,lists.stats.last_sub_date" },
          ctx.senal,
        );
        const lista = r.lists ?? [];
        if (!lista.length) return "No hay audiencias en Mailchimp.";
        return [
          `Audiencias de Mailchimp (${lista.length}):`,
          ...lista.map((l) =>
            `- ${unir(linea(l.name, 80), `${l.stats?.member_count ?? 0} suscritos`, l.stats?.unsubscribe_count ? `${l.stats.unsubscribe_count} bajas` : "", l.stats?.open_rate !== undefined ? `apertura ${l.stats.open_rate.toFixed(1)}%` : "", l.stats?.click_rate !== undefined ? `clics ${l.stats.click_rate.toFixed(1)}%` : "", l.stats?.last_sub_date ? `último alta ${fecha(l.stats.last_sub_date)}` : "")}`,
          ),
        ].join("\n");
      },
    }),
    herramienta({
      nombre: "mailchimp_campanas",
      descripcion: "Lista las últimas campañas enviadas en Mailchimp con su asunto, fecha, envíos, aperturas y clics. Solo lectura.",
      app: "mailchimp",
      agentes: ["victor"],
      proveedor: NOMBRE,
      esquema: esquema({ limite: { type: "integer", minimum: 1, maximum: 30, description: "Cuántas campañas. Por defecto 10." } }),
      async ejecutar(args, ctx) {
        const r = await api<{
          campaigns?: { settings?: { title?: string; subject_line?: string }; send_time?: string; emails_sent?: number; report_summary?: { opens?: number; open_rate?: number; clicks?: number; click_rate?: number } }[];
        }>(
          await ctx.token(),
          "/campaigns",
          {
            status: "sent",
            sort_field: "send_time",
            sort_dir: "DESC",
            count: argEntero(args, "limite", 10, 1, 30),
            fields: "campaigns.settings.title,campaigns.settings.subject_line,campaigns.send_time,campaigns.emails_sent,campaigns.report_summary",
          },
          ctx.senal,
        );
        const lista = r.campaigns ?? [];
        if (!lista.length) return "No hay campañas enviadas en Mailchimp.";
        return [
          `Campañas enviadas en Mailchimp (${lista.length}, de la más reciente):`,
          ...lista.map((c) =>
            `- ${unir(linea(c.settings?.subject_line || c.settings?.title, 120), fecha(c.send_time), c.emails_sent !== undefined ? `${c.emails_sent} enviados` : "", c.report_summary ? `aperturas ${porcentaje(c.report_summary.open_rate)}` : "", c.report_summary ? `clics ${porcentaje(c.report_summary.click_rate)}` : "")}`,
          ),
        ].join("\n");
      },
    }),
  ],
};

/** Con el nombre del proveedor, como lo importa el registro. */
export { adaptador as mailchimp };
