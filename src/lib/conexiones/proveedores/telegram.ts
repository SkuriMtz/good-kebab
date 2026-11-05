import type { Adaptador } from "@/lib/nucleo-tipos";
import { ErrorProveedor, argEntero, esquema, fecha, herramienta, linea, pedirJson, unir } from "./_comun-1";

/**
 * TELEGRAM: el bot del negocio. La llave es el token que da BotFather
 * ("123456:ABC…"); se guarda cifrado y nunca sale en logs ni errores (va en
 * la ruta de la URL de la Bot API, por eso los errores no la mencionan).
 *
 * - validarLlave: getMe.
 * - Mensajes recientes: getUpdates SIN offset (no confirma ni borra nada) y
 *   sin allowed_updates (para no cambiar la configuración del bot). Telegram
 *   guarda los mensajes sin leer hasta 24 horas. Si el bot tiene webhook,
 *   Telegram no deja usar getUpdates (409) y se dice así.
 */

const NOMBRE = "Telegram";
const FORMA_TOKEN = /^\d{5,15}:[A-Za-z0-9_-]{30,64}$/;

type Usuario = { id: number; first_name?: string; last_name?: string; username?: string; is_bot?: boolean };
type Mensaje = {
  date?: number;
  text?: string;
  caption?: string;
  from?: Usuario;
  chat?: { id: number; type?: string; title?: string; first_name?: string; username?: string };
  photo?: unknown;
  voice?: unknown;
  audio?: unknown;
  video?: unknown;
  document?: { file_name?: string };
  sticker?: unknown;
  location?: unknown;
  contact?: unknown;
};
type Update = { update_id: number; message?: Mensaje; edited_message?: Mensaje; channel_post?: Mensaje; business_message?: Mensaje };
type Respuesta<T> = { ok: boolean; result?: T; error_code?: number; description?: string };

function bot<T>(token: string, metodo: string, params: Record<string, string> = {}, senal?: AbortSignal) {
  const q = new URLSearchParams(params).toString();
  return pedirJson<Respuesta<T>>(NOMBRE, `https://api.telegram.org/bot${token}/${metodo}${q ? `?${q}` : ""}`, {
    senal,
    interpretar: (estado) => {
      if (estado === 401 || estado === 404) return "Telegram no reconoció el token del bot. Cópialo de nuevo desde BotFather.";
      if (estado === 409)
        return "Tu bot tiene un webhook activo, así que Telegram no deja leer los mensajes guardados desde aquí; esos mensajes llegan por el webhook.";
      return undefined;
    },
  });
}

const nombreDe = (u?: Usuario) => (u ? unir([u.first_name, u.last_name].filter(Boolean).join(" "), u.username ? `@${u.username}` : "") : "");

function contenido(m: Mensaje): string {
  if (m.text) return linea(m.text, 300);
  const tipo = m.photo
    ? "foto"
    : m.voice
      ? "nota de voz"
      : m.audio
        ? "audio"
        : m.video
          ? "video"
          : m.document
            ? `documento ${linea(m.document.file_name, 60)}`.trim()
            : m.sticker
              ? "sticker"
              : m.location
                ? "ubicación"
                : m.contact
                  ? "contacto"
                  : "mensaje sin texto";
  return `(${tipo})${m.caption ? ` ${linea(m.caption, 200)}` : ""}`;
}

export const adaptador: Adaptador = {
  proveedor: "telegram",
  autenticacion: "llave",
  variables: [],

  async validarLlave(llave) {
    const token = llave.trim();
    if (!FORMA_TOKEN.test(token))
      throw new ErrorProveedor("Ese no parece un token de bot de Telegram. Debe verse como 123456789:ABC… (cópialo de BotFather).");
    const r = await bot<Usuario>(token, "getMe");
    if (!r.ok || !r.result?.is_bot) throw new ErrorProveedor("Telegram no reconoció el token del bot. Cópialo de nuevo desde BotFather.");
    const extra: Record<string, string> = { bot_id: String(r.result.id) };
    if (r.result.username) extra.usuario = r.result.username;
    if (r.result.first_name) extra.nombre = r.result.first_name;
    return { access_token: token, extra };
  },

  async cuenta(t) {
    if (t.extra?.usuario) return `@${t.extra.usuario}`;
    const r = await bot<Usuario>(t.access_token, "getMe");
    return r.result?.username ? `@${r.result.username}` : r.result?.first_name || "Bot de Telegram";
  },

  herramientas: [
    herramienta({
      nombre: "telegram_mensajes_recientes",
      descripcion:
        "Lee los mensajes recientes que le han escrito al bot de Telegram del negocio (Telegram los guarda hasta 24 horas). No marca nada como leído. Solo lectura.",
      app: "telegram",
      agentes: ["lola"],
      proveedor: NOMBRE,
      esquema: esquema({
        limite: { type: "integer", minimum: 1, maximum: 50, description: "Cuántos mensajes (los más recientes). Por defecto 20." },
      }),
      async ejecutar(args, ctx) {
        const t = await ctx.token();
        const r = await bot<Update[]>(t.access_token, "getUpdates", { limit: "100", timeout: "0" }, ctx.senal);
        if (!r.ok) throw new ErrorProveedor("Telegram no dejó leer los mensajes del bot en este momento.");
        const limite = argEntero(args, "limite", 20, 1, 50);
        const mensajes = (r.result ?? [])
          .map((u) => u.message ?? u.edited_message ?? u.business_message ?? u.channel_post)
          .filter((m): m is Mensaje => !!m)
          .slice(-limite);
        if (!mensajes.length) return "No hay mensajes nuevos para el bot en las últimas 24 horas.";
        return [
          `Mensajes recientes al bot (${mensajes.length}, del más viejo al más nuevo):`,
          ...mensajes.map((m) => {
            const chat = m.chat?.type && m.chat.type !== "private" ? ` en "${linea(m.chat.title, 60)}"` : "";
            return `- ${unir(fecha(m.date), (nombreDe(m.from) || "Alguien") + chat)}: ${contenido(m)}`;
          }),
        ].join("\n");
      },
    }),
  ],
};
