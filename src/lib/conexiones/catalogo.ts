import type { AppConectable, IdApp, Proveedor } from "@/lib/nucleo-tipos";

/**
 * CATÁLOGO DE APPS CONECTABLES (todas las IdApp del contrato).
 *
 * - Fase 1 (reales): Gmail, Google Calendar, Drive, Sheets, Outlook, Outlook
 *   Calendar, OneDrive y Notion. Funcionan en cuanto su proveedor tenga sus
 *   variables en Vercel (ver `configurado`).
 * - Fase 2 y 3: "En camino". La tarjeta ofrece "Avísame" (tabla apps_interes).
 *
 * `puede` dice, en una línea y sin exagerar, qué hace la IA con la app. En
 * esta fase todo es SOLO LECTURA: ningún agente escribe, manda ni borra.
 *
 * Este archivo no tiene claves y se puede importar en el navegador (para los
 * nombres y categorías). `configurado()` solo sirve en el servidor: en el
 * navegador las variables secretas no existen y diría que falta todo.
 */

export const CATALOGO: readonly AppConectable[] = [
  // ---------- Fase 1: reales ----------
  {
    id: "gmail",
    nombre: "Gmail",
    categoria: "correo",
    proveedor: "google",
    agentes: ["clara"],
    puede: "Buscar y leer tus correos para resumirlos y proponerte respuestas. Solo lectura.",
    fase: 1,
  },
  {
    id: "google_calendar",
    nombre: "Google Calendar",
    categoria: "agenda",
    proveedor: "google",
    agentes: ["lola"],
    puede: "Ver tu agenda para decirte qué citas tienes y qué horas quedan libres. Solo lectura.",
    fase: 1,
  },
  {
    id: "google_drive",
    nombre: "Google Drive",
    categoria: "documentos",
    proveedor: "google",
    agentes: ["iris"],
    puede: "Leer solo los archivos que tú elijas de tu Drive (Docs, PDF y texto). Solo lectura.",
    fase: 1,
  },
  {
    id: "google_sheets",
    nombre: "Google Sheets",
    categoria: "documentos",
    proveedor: "google",
    agentes: ["iris"],
    puede: "Leer las hojas de cálculo que le indiques para resumirlas o sacar cuentas. Solo lectura.",
    fase: 1,
  },
  {
    id: "outlook",
    nombre: "Outlook",
    categoria: "correo",
    proveedor: "microsoft",
    agentes: ["clara"],
    puede: "Buscar y leer tus correos de Outlook o Hotmail para resumirlos. Solo lectura.",
    fase: 1,
  },
  {
    id: "outlook_calendar",
    nombre: "Calendario de Outlook",
    categoria: "agenda",
    proveedor: "microsoft",
    agentes: ["lola"],
    puede: "Ver tu calendario de Outlook para decirte qué citas tienes. Solo lectura.",
    fase: 1,
  },
  {
    id: "onedrive",
    nombre: "OneDrive",
    categoria: "documentos",
    proveedor: "microsoft",
    agentes: ["iris"],
    puede: "Buscar y leer tus archivos de OneDrive (Word, PDF y texto). Solo lectura.",
    fase: 1,
  },
  {
    id: "notion",
    nombre: "Notion",
    categoria: "documentos",
    proveedor: "notion",
    agentes: ["iris"],
    puede: "Buscar y leer las páginas de Notion que compartas con Atendel. Solo lectura.",
    fase: 1,
  },

  // ---------- Fase 2: mensajes y documentos ----------
  {
    id: "whatsapp_business",
    nombre: "WhatsApp Business",
    categoria: "mensajes",
    proveedor: null,
    agentes: ["lola"],
    puede: "Contestar a tus clientes por WhatsApp con tu visto bueno.",
    fase: 2,
  },
  {
    id: "instagram",
    nombre: "Instagram",
    categoria: "mensajes",
    proveedor: null,
    agentes: ["lola", "victor"],
    puede: "Leer y contestar los mensajes directos de tu cuenta de negocio.",
    fase: 2,
  },
  {
    id: "messenger",
    nombre: "Messenger",
    categoria: "mensajes",
    proveedor: null,
    agentes: ["lola", "victor"],
    puede: "Leer y contestar los mensajes de tu página de Facebook.",
    fase: 2,
  },
  {
    id: "telegram",
    nombre: "Telegram",
    categoria: "mensajes",
    proveedor: null,
    agentes: ["lola"],
    puede: "Contestar las preguntas de tus clientes desde el bot de tu negocio.",
    fase: 2,
  },
  {
    id: "excel",
    nombre: "Excel",
    categoria: "documentos",
    proveedor: "microsoft",
    agentes: ["iris"],
    puede: "Leer tus hojas de Excel guardadas en OneDrive.",
    fase: 2,
  },
  {
    id: "dropbox",
    nombre: "Dropbox",
    categoria: "documentos",
    proveedor: null,
    agentes: ["iris"],
    puede: "Leer los archivos que elijas de tu Dropbox.",
    fase: 2,
  },

  // ---------- Fase 3: agenda, pagos, ventas, reseñas y facturas ----------
  {
    id: "calendly",
    nombre: "Calendly",
    categoria: "agenda",
    proveedor: null,
    agentes: ["lola"],
    puede: "Ver las citas que tus clientes agendan en Calendly.",
    fase: 3,
  },
  {
    id: "mercado_pago",
    nombre: "Mercado Pago",
    categoria: "pagos",
    proveedor: null,
    agentes: ["clara", "victor"],
    puede: "Ver los pagos que recibes y avisarte de los pendientes.",
    fase: 3,
  },
  {
    id: "stripe",
    nombre: "Stripe",
    categoria: "pagos",
    proveedor: null,
    agentes: ["clara", "victor"],
    puede: "Ver tus cobros y pagos con tarjeta.",
    fase: 3,
  },
  {
    id: "clip",
    nombre: "Clip",
    categoria: "pagos",
    proveedor: null,
    agentes: ["clara", "victor"],
    puede: "Ver las ventas que cobras con tu terminal Clip.",
    fase: 3,
  },
  {
    id: "shopify",
    nombre: "Shopify",
    categoria: "pagos",
    proveedor: null,
    agentes: ["victor"],
    puede: "Ver los pedidos y clientes de tu tienda en línea.",
    fase: 3,
  },
  {
    id: "tienda_nube",
    nombre: "Tiendanube",
    categoria: "pagos",
    proveedor: null,
    agentes: ["victor"],
    puede: "Ver los pedidos y clientes de tu tienda en línea.",
    fase: 3,
  },
  {
    id: "google_business",
    nombre: "Perfil de Negocio de Google",
    categoria: "resenas",
    proveedor: "google",
    agentes: ["victor"],
    puede: "Leer tus reseñas de Google y proponerte cómo contestarlas.",
    fase: 3,
  },
  {
    id: "cfdi",
    nombre: "Facturas CFDI",
    categoria: "facturacion",
    proveedor: null,
    agentes: ["clara", "iris"],
    puede: "Leer tus facturas electrónicas para llevar cobros y pagos.",
    fase: 3,
  },
];

export const APP_POR_ID = Object.fromEntries(CATALOGO.map((a) => [a.id, a])) as Record<IdApp, AppConectable>;

export const esIdApp = (v: unknown): v is IdApp => typeof v === "string" && Object.prototype.hasOwnProperty.call(APP_POR_ID, v);

export const esProveedor = (v: unknown): v is Proveedor => v === "google" || v === "microsoft" || v === "notion";

/** Las apps reales (fase 1) de un proveedor. */
export const appsDeProveedor = (p: Proveedor): IdApp[] => CATALOGO.filter((a) => a.fase === 1 && a.proveedor === p).map((a) => a.id);

/* ---------------- ¿Está configurado en Vercel? ---------------- */

/** La llave con la que se cifran los tokens: sin ella no se guarda ninguna conexión. */
export const VARIABLE_LLAVE = "ATENDEL_LLAVE_CIFRADO";

/** Variables de cada proveedor (solo los nombres; los valores viven en Vercel). */
export const VARIABLES_PROVEEDOR: Record<Proveedor, readonly string[]> = {
  google: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
  microsoft: ["MICROSOFT_CLIENT_ID", "MICROSOFT_CLIENT_SECRET"],
  notion: ["NOTION_CLIENT_ID", "NOTION_CLIENT_SECRET"],
};

/** Drive usa el permiso `drive.file`: sin el Picker no hay forma de elegir archivos. */
export const VARIABLES_PICKER = ["NEXT_PUBLIC_GOOGLE_API_KEY", "NEXT_PUBLIC_GOOGLE_APP_ID"] as const;

type Entorno = Record<string, string | undefined>;

const tiene = (env: Entorno, nombre: string) => Boolean(env[nombre]?.trim());

/**
 * Revisa que existan las variables de un proveedor (y la llave de cifrado).
 * Devuelve SOLO los nombres que faltan, nunca los valores. Solo servidor.
 */
export function configurado(proveedor: Proveedor, env: Entorno = process.env): { ok: boolean; falta: string[] } {
  const falta = [...VARIABLES_PROVEEDOR[proveedor], VARIABLE_LLAVE].filter((n) => !tiene(env, n));
  return { ok: falta.length === 0, falta };
}

/** Como `configurado`, pero por app: Drive necesita además lo del Picker. */
export function configuradoApp(id: IdApp, env: Entorno = process.env): { ok: boolean; falta: string[] } {
  const app = APP_POR_ID[id];
  if (!app.proveedor) return { ok: false, falta: [] };
  const base = configurado(app.proveedor, env);
  const falta = id === "google_drive" ? [...base.falta, ...VARIABLES_PICKER.filter((n) => !tiene(env, n))] : base.falta;
  return { ok: falta.length === 0, falta };
}
