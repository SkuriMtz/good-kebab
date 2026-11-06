import { createHmac } from "crypto";
import type { Adaptador, IdApp, Tokens } from "@/lib/nucleo-tipos";
import {
  ErrorProveedor,
  argEntero,
  consulta,
  esquema,
  fecha,
  herramienta,
  linea,
  mensajePorEstado,
  pedirJson,
  unir,
  variable,
  type Pedido,
} from "./_comun-1";

/**
 * META: WhatsApp Business, Instagram y Messenger con Facebook Login.
 *
 * - Login: https://www.facebook.com/v27.0/dialog/oauth (Graph API v27.0, la
 *   vigente en la documentación de Meta al 5 nov 2026).
 * - El código se cambia por un token corto y luego por uno de LARGA duración
 *   (~60 días; Meta no da refresh token: al vencer, se vuelve a conectar).
 * - En `extra` se guardan los ids que hacen falta: la página (page_id y su
 *   page_token, que no vence si sale de un token largo), la cuenta de
 *   Instagram profesional ligada (ig_user_id), la cuenta de WhatsApp Business
 *   (waba_id, sacada de debug_token) y su número (phone_number_id).
 * - Cada llamada lleva appsecret_proof (HMAC del token con META_APP_SECRET).
 * - La API de WhatsApp Cloud NO deja leer el historial de chats: los
 *   mensajes entrantes llegan por webhook (otra fase). Aquí solo se leen
 *   números y plantillas.
 */

const VERSION = "v27.0";
const GRAPH = `https://graph.facebook.com/${VERSION}`;
const NOMBRE = "Meta";
const SESENTA_DIAS = 60 * 24 * 60 * 60;

/** Permisos por app (documentación de Meta: Conversations API, WhatsApp Cloud API). */
export const PERMISOS_META: Partial<Record<IdApp, string[]>> = {
  whatsapp_business: ["whatsapp_business_management", "whatsapp_business_messaging", "business_management"],
  messenger: ["pages_show_list", "pages_messaging", "pages_manage_metadata", "pages_read_engagement", "business_management"],
  instagram: ["instagram_basic", "instagram_manage_messages", "pages_show_list", "pages_manage_metadata", "business_management"],
};

/** El permiso sin el cual la app no sirve (para saber qué apps quedaron concedidas). */
const PERMISO_CLAVE: Partial<Record<IdApp, string>> = {
  whatsapp_business: "whatsapp_business_management",
  messenger: "pages_messaging",
  instagram: "instagram_manage_messages",
};

export function permisosMeta(apps: IdApp[]): string[] {
  const propias = apps.filter((a) => PERMISOS_META[a]);
  const lista = (propias.length ? propias : (Object.keys(PERMISOS_META) as IdApp[])).flatMap((a) => PERMISOS_META[a] ?? []);
  return Array.from(new Set(lista));
}

const prueba = (token: string) => createHmac("sha256", variable("META_APP_SECRET")).update(token).digest("hex");

/** Mensajes de error de Graph: el código 190 es token vencido o revocado. */
function interpretarGraph(_estado: number, cuerpo: unknown): string | { mensaje: string; status: number } | undefined {
  const e = (cuerpo as { error?: { code?: number } } | null)?.error;
  if (e?.code === 190 || e?.code === 102) return { mensaje: mensajePorEstado(NOMBRE, 401), status: 401 };
  if (e?.code === 10 || e?.code === 200 || (typeof e?.code === "number" && e.code >= 200 && e.code < 300))
    return "Meta no dio permiso para ver esto. Puede faltar la revisión de la app en Meta o un permiso al conectar.";
  if (e?.code === 4 || e?.code === 17 || e?.code === 32 || e?.code === 613) return { mensaje: mensajePorEstado(NOMBRE, 429), status: 429 };
  return undefined;
}

/** GET a Graph con el token en el encabezado y su appsecret_proof. */
function graph<T>(ruta: string, token: string, params: Record<string, string | number | undefined> = {}, extra: Pedido = {}) {
  const url = `${GRAPH}${ruta}${consulta({ ...params, appsecret_proof: prueba(token) })}`;
  return pedirJson<T>(NOMBRE, url, { encabezados: { Authorization: `Bearer ${token}` }, interpretar: interpretarGraph, ...extra });
}

type Pagina = { id: string; name?: string; access_token?: string; instagram_business_account?: { id: string; username?: string } };

/** Busca página, Instagram y WhatsApp de la cuenta. Todo es "mejor esfuerzo": si algo no está, se queda vacío. */
async function datosDeLaCuenta(token: string): Promise<Record<string, string>> {
  const extra: Record<string, string> = {};
  const [yo, paginas, depuracion] = await Promise.allSettled([
    graph<{ id: string; name?: string }>("/me", token, { fields: "id,name" }),
    graph<{ data?: Pagina[] }>("/me/accounts", token, { fields: "id,name,access_token,instagram_business_account{id,username}", limit: 50 }),
    pedirJson<{ data?: { scopes?: string[]; granular_scopes?: { scope: string; target_ids?: string[] }[] } }>(
      NOMBRE,
      `${GRAPH}/debug_token${consulta({ input_token: token, access_token: `${variable("META_APP_ID")}|${variable("META_APP_SECRET")}` })}`,
    ),
  ]);
  if (yo.status === "fulfilled" && yo.value.name) extra.nombre = yo.value.name;
  if (paginas.status === "fulfilled") {
    const lista = (paginas.value.data ?? []).filter((p) => p.id && p.access_token);
    const elegida = lista.find((p) => p.instagram_business_account?.id) ?? lista[0];
    if (elegida) {
      extra.page_id = elegida.id;
      extra.page_token = elegida.access_token!;
      if (elegida.name) extra.page_name = elegida.name;
      if (elegida.instagram_business_account?.id) {
        extra.ig_user_id = elegida.instagram_business_account.id;
        if (elegida.instagram_business_account.username) extra.ig_username = elegida.instagram_business_account.username;
      }
      extra.paginas = String(lista.length);
    }
  }
  if (depuracion.status === "fulfilled") {
    // Qué permisos concedió de verdad: el marco solo activa las apps cubiertas (extra.apps)
    const concedidos = depuracion.value.data?.scopes;
    if (Array.isArray(concedidos)) {
      extra.scopes = concedidos.join(" ");
      extra.apps = (Object.keys(PERMISO_CLAVE) as IdApp[]).filter((a) => concedidos.includes(PERMISO_CLAVE[a]!)).join(",");
    }
    const alcances = depuracion.value.data?.granular_scopes ?? [];
    const waba = alcances.find((s) => s.scope === "whatsapp_business_management")?.target_ids?.[0];
    if (waba && /^\d+$/.test(waba)) {
      extra.waba_id = waba;
      try {
        const numeros = await graph<{ data?: { id: string; display_phone_number?: string }[] }>(`/${waba}/phone_numbers`, token, {
          fields: "id,display_phone_number",
        });
        const n = numeros.data?.[0];
        if (n?.id) {
          extra.phone_number_id = n.id;
          if (n.display_phone_number) extra.telefono = n.display_phone_number;
        }
      } catch {
        // Sin número todavía: la herramienta lo dice.
      }
    }
  }
  return extra;
}

/* ---------------- Herramientas ---------------- */

type Participante = { id?: string; name?: string; username?: string };
type Conversacion = {
  id: string;
  updated_time?: string;
  participants?: { data?: Participante[] };
  messages?: { data?: { message?: string; created_time?: string; from?: Participante }[] };
};

async function conversaciones(t: Tokens, plataforma: "messenger" | "instagram", args: Record<string, unknown>, senal: AbortSignal) {
  const pagina = t.extra?.page_id;
  const tokenPagina = t.extra?.page_token;
  if (!pagina || !tokenPagina) throw new ErrorProveedor("No encontré una página de Facebook en tu conexión de Meta. Vuelve a conectar y elige tu página.");
  if (plataforma === "instagram" && !t.extra?.ig_user_id)
    throw new ErrorProveedor("Tu página de Facebook no tiene una cuenta profesional de Instagram ligada. Lígala en Meta y vuelve a conectar.");
  const limite = argEntero(args, "limite", 5, 1, 10);
  const porConversacion = argEntero(args, "mensajes", 5, 1, 10);
  const datos = await graph<{ data?: Conversacion[] }>(
    `/${pagina}/conversations`,
    tokenPagina,
    { platform: plataforma, fields: `participants,updated_time,messages.limit(${porConversacion}){message,from,created_time}`, limit: limite },
    { senal },
  );
  const lista = datos.data ?? [];
  if (!lista.length) return `No hay conversaciones recientes en ${plataforma === "instagram" ? "Instagram" : "Messenger"}.`;
  const propio = plataforma === "instagram" ? t.extra?.ig_user_id : pagina;
  return lista
    .map((c) => {
      const otros = (c.participants?.data ?? []).filter((p) => p.id !== propio);
      const quien = otros.map((p) => p.name || (p.username ? `@${p.username}` : "")).filter(Boolean).join(", ") || "una persona";
      const mensajes = [...(c.messages?.data ?? [])]
        .reverse()
        .map((m) => {
          const de = m.from?.id === propio ? "Tu negocio" : m.from?.name || (m.from?.username ? `@${m.from.username}` : "Cliente");
          return `- ${unir(de, fecha(m.created_time))}: ${linea(m.message, 300) || "(sin texto: foto, audio o adjunto)"}`;
        });
      return [`Conversación con ${quien} (última actividad: ${fecha(c.updated_time) || "sin fecha"})`, ...mensajes].join("\n");
    })
    .join("\n\n");
}

function wabaDe(t: Tokens) {
  const waba = t.extra?.waba_id;
  if (!waba) throw new ErrorProveedor("No encontré tu cuenta de WhatsApp Business. Vuelve a conectar Meta y elige tu cuenta de WhatsApp.");
  return waba;
}

const SIN_HISTORIAL =
  "La API de WhatsApp Cloud no permite leer el historial de chats: los mensajes que te mandan llegarán por webhook (en otra fase).";

export const adaptador: Adaptador = {
  proveedor: "meta",
  autenticacion: "oauth",
  variables: ["META_APP_ID", "META_APP_SECRET"],
  requiereAprobacion:
    "Meta debe aprobar la app (revisión de permisos) para usarla con cualquier cuenta; mientras, funciona con cuentas de prueba",

  urlAutorizacion({ state, redirectUri, apps }) {
    return `https://www.facebook.com/${VERSION}/dialog/oauth${consulta({
      client_id: variable("META_APP_ID"),
      redirect_uri: redirectUri,
      state,
      response_type: "code",
      scope: permisosMeta(apps).join(","),
      auth_type: "rerequest",
    })}`;
  },

  async intercambiar({ code, redirectUri }) {
    const id = variable("META_APP_ID");
    const secreto = variable("META_APP_SECRET");
    const interpretar = (_e: number, c: unknown) =>
      (c as { error?: unknown } | null)?.error ? "Meta no aceptó la conexión. Intenta conectar de nuevo." : undefined;
    const corto = await pedirJson<{ access_token?: string }>(
      NOMBRE,
      `${GRAPH}/oauth/access_token${consulta({ client_id: id, redirect_uri: redirectUri, client_secret: secreto, code })}`,
      { interpretar },
    );
    if (!corto.access_token) throw new ErrorProveedor("Meta no regresó el permiso de acceso. Intenta conectar de nuevo.");
    const largo = await pedirJson<{ access_token?: string; expires_in?: number }>(
      NOMBRE,
      `${GRAPH}/oauth/access_token${consulta({ grant_type: "fb_exchange_token", client_id: id, client_secret: secreto, fb_exchange_token: corto.access_token })}`,
      { interpretar },
    );
    const token = largo.access_token || corto.access_token;
    return {
      access_token: token,
      expira_en: Date.now() + (Number(largo.expires_in) > 0 ? Number(largo.expires_in) : SESENTA_DIAS) * 1000,
      extra: await datosDeLaCuenta(token),
    };
  },

  async revocar(t) {
    await pedirJson(NOMBRE, `${GRAPH}/me/permissions${consulta({ appsecret_proof: prueba(t.access_token) })}`, {
      metodo: "DELETE",
      encabezados: { Authorization: `Bearer ${t.access_token}` },
    });
  },

  // Solo el nombre de la persona: el marco revoca la conexión anterior si la cuenta cambia,
  // y en Meta revocar quita TODOS los permisos de la app (también los recién dados).
  async cuenta(t) {
    if (t.extra?.nombre) return t.extra.nombre;
    return (await graph<{ name?: string }>("/me", t.access_token, { fields: "name" })).name || "Cuenta de Meta";
  },

  herramientas: [
    herramienta({
      nombre: "meta_messenger_conversaciones",
      descripcion:
        "Lee las conversaciones recientes de Messenger de la página de Facebook del negocio, con los últimos mensajes de cada una. Solo lectura.",
      app: "messenger",
      agentes: ["lola", "victor"],
      proveedor: "Messenger",
      esquema: esquema({
        limite: { type: "integer", minimum: 1, maximum: 10, description: "Cuántas conversaciones (de la más reciente). Por defecto 5." },
        mensajes: { type: "integer", minimum: 1, maximum: 10, description: "Cuántos mensajes por conversación. Por defecto 5." },
      }),
      async ejecutar(args, ctx) {
        return conversaciones(await ctx.token(), "messenger", args, ctx.senal);
      },
    }),
    herramienta({
      nombre: "meta_instagram_conversaciones",
      descripcion:
        "Lee los mensajes directos recientes de la cuenta profesional de Instagram del negocio, con los últimos mensajes de cada conversación. Solo lectura.",
      app: "instagram",
      agentes: ["lola", "victor"],
      proveedor: "Instagram",
      esquema: esquema({
        limite: { type: "integer", minimum: 1, maximum: 10, description: "Cuántas conversaciones (de la más reciente). Por defecto 5." },
        mensajes: { type: "integer", minimum: 1, maximum: 10, description: "Cuántos mensajes por conversación. Por defecto 5." },
      }),
      async ejecutar(args, ctx) {
        return conversaciones(await ctx.token(), "instagram", args, ctx.senal);
      },
    }),
    herramienta({
      nombre: "meta_whatsapp_numeros",
      descripcion: `Muestra los números de WhatsApp Business del negocio (nombre verificado, calidad y estado). ${SIN_HISTORIAL} Solo lectura.`,
      app: "whatsapp_business",
      agentes: ["lola"],
      proveedor: "WhatsApp Business",
      esquema: esquema({}),
      async ejecutar(_args, ctx) {
        const t = await ctx.token();
        const datos = await graph<{
          data?: { id: string; display_phone_number?: string; verified_name?: string; quality_rating?: string; code_verification_status?: string }[];
        }>(`/${wabaDe(t)}/phone_numbers`, t.access_token, { fields: "id,display_phone_number,verified_name,quality_rating,code_verification_status" }, { senal: ctx.senal });
        const lista = datos.data ?? [];
        if (!lista.length) return `Tu cuenta de WhatsApp Business todavía no tiene números. ${SIN_HISTORIAL}`;
        const filas = lista.map((n) =>
          `- ${unir(n.display_phone_number, n.verified_name, n.quality_rating ? `calidad ${n.quality_rating}` : "", n.code_verification_status ? `verificación ${n.code_verification_status}` : "")}`,
        );
        return [`Números de WhatsApp Business (${lista.length}):`, ...filas, "", SIN_HISTORIAL].join("\n");
      },
    }),
    herramienta({
      nombre: "meta_whatsapp_plantillas",
      descripcion: `Lista las plantillas de mensajes de WhatsApp Business del negocio (nombre, estado, idioma, categoría y texto). ${SIN_HISTORIAL} Solo lectura.`,
      app: "whatsapp_business",
      agentes: ["lola"],
      proveedor: "WhatsApp Business",
      esquema: esquema({
        limite: { type: "integer", minimum: 1, maximum: 50, description: "Cuántas plantillas. Por defecto 20." },
      }),
      async ejecutar(args, ctx) {
        const t = await ctx.token();
        const datos = await graph<{
          data?: { name: string; status?: string; language?: string; category?: string; components?: { type?: string; text?: string }[] }[];
        }>(`/${wabaDe(t)}/message_templates`, t.access_token, { fields: "name,status,language,category,components", limit: argEntero(args, "limite", 20, 1, 50) }, { senal: ctx.senal });
        const lista = datos.data ?? [];
        if (!lista.length) return "Tu cuenta de WhatsApp Business no tiene plantillas de mensajes.";
        return [
          `Plantillas de WhatsApp (${lista.length}):`,
          ...lista.map((p) => {
            const cuerpo = p.components?.find((c) => c.type === "BODY")?.text;
            return `- ${unir(p.name, p.status, p.language, p.category)}${cuerpo ? `: ${linea(cuerpo, 240)}` : ""}`;
          }),
        ].join("\n");
      },
    }),
  ],
};

/** Con el nombre del proveedor, como lo importa el registro. */
export { adaptador as meta };
