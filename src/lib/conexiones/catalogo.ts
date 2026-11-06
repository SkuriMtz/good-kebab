import type { AppConectable, Autenticacion, CategoriaApp, IdApp, Proveedor } from "@/lib/nucleo-tipos";
import type { IdAgente } from "@/lib/agentes";

/**
 * CATÁLOGO DE APPS CONECTABLES (las 32 IdApp del contrato v2).
 *
 * - Fase 1: se conectan de verdad. Cada una se activa cuando su proveedor
 *   tiene sus variables en Vercel (OAuth) o cuando la persona pega SU llave
 *   en la tarjeta (se guarda cifrada).
 * - Fase 2: "clip", en camino (no tiene API pública para leer cobros);
 *   la tarjeta ofrece "Avísame" (tabla apps_interes).
 *
 * `puede` dice, en una línea y sin exagerar, qué hace la IA con la app. En
 * esta fase todo es SOLO LECTURA: ningún agente escribe, manda ni borra.
 * `requiereAprobacion`: el proveedor pide revisar o aprobar la app antes de
 * que funcione con cualquier cuenta.
 *
 * Solo datos (sin claves): se puede importar en el navegador. Lo que depende
 * de Vercel (configurado, faltantes) vive en registro.ts, solo servidor.
 */

const META = "Meta pide revisar la app (App Review) y verificar tu negocio antes de que funcione con cualquier cuenta; mientras, solo con las cuentas de prueba de la app.";
const SHOPIFY = "Para ver nombres y correos de clientes en cualquier tienda, Shopify tiene que aprobar a Atendel para «datos protegidos de clientes»; mientras, solo se ven en tiendas de desarrollo.";
const PERFIL_GOOGLE = "Google tiene que aprobar el acceso a la API de Perfil de Negocio (se pide con un formulario de Google) antes de poder leer reseñas.";

function app(
  id: IdApp,
  nombre: string,
  categoria: CategoriaApp,
  proveedor: Proveedor | null,
  autenticacion: Autenticacion | null,
  agentes: IdAgente[],
  puede: string,
  extra: { fase?: 1 | 2 | 3; requiereAprobacion?: string } = {},
): AppConectable {
  return { id, nombre, categoria, proveedor, autenticacion, agentes, puede, fase: extra.fase ?? 1, ...(extra.requiereAprobacion ? { requiereAprobacion: extra.requiereAprobacion } : {}) };
}

export const CATALOGO: readonly AppConectable[] = [
  // Google (un cliente OAuth)
  app("gmail", "Gmail", "correo", "google", "oauth", ["clara"], "Buscar y leer tus correos para resumirlos y proponerte respuestas. Solo lectura."),
  app("google_calendar", "Google Calendar", "agenda", "google", "oauth", ["lola"], "Ver tu agenda para decirte qué citas tienes y qué horas quedan libres. Solo lectura."),
  app("google_drive", "Google Drive", "documentos", "google", "oauth", ["iris"], "Leer solo los archivos que tú elijas de tu Drive (Docs, Hojas, PDF y texto). Solo lectura."),
  app("google_sheets", "Google Sheets", "documentos", "google", "oauth", ["iris"], "Leer las hojas de cálculo que le indiques para resumirlas o sacar cuentas. Solo lectura."),
  app("google_contacts", "Contactos de Google", "clientes", "google", "oauth", ["victor", "lola"], "Buscar los datos de tus clientes en tus contactos. Solo lectura."),
  app("google_business", "Perfil de Negocio de Google", "resenas", "google", "oauth", ["victor"], "Leer tus reseñas de Google para proponerte cómo contestarlas. Solo lectura.", {
    requiereAprobacion: PERFIL_GOOGLE,
  }),
  // Microsoft (Graph)
  app("outlook", "Outlook", "correo", "microsoft", "oauth", ["clara"], "Buscar y leer tus correos de Outlook o Hotmail para resumirlos. Solo lectura."),
  app("outlook_calendar", "Calendario de Outlook", "agenda", "microsoft", "oauth", ["lola"], "Ver tu calendario de Outlook para decirte qué citas tienes. Solo lectura."),
  app("onedrive", "OneDrive", "documentos", "microsoft", "oauth", ["iris"], "Buscar y leer tus archivos de OneDrive (Word, PDF y texto). Solo lectura."),
  app("excel", "Excel", "documentos", "microsoft", "oauth", ["iris"], "Leer tus hojas de Excel guardadas en OneDrive. Solo lectura."),
  app("outlook_contacts", "Contactos de Outlook", "clientes", "microsoft", "oauth", ["victor", "lola"], "Buscar los datos de tus clientes en tus contactos de Outlook. Solo lectura."),
  // Mensajes
  app("whatsapp_business", "WhatsApp Business", "mensajes", "meta", "oauth", ["lola"], "Leer los mensajes de tu WhatsApp Business para ayudarte a contestarlos. Solo lectura.", {
    requiereAprobacion: META,
  }),
  app("instagram", "Instagram", "mensajes", "meta", "oauth", ["lola", "victor"], "Leer los mensajes directos de tu cuenta de negocio. Solo lectura.", { requiereAprobacion: META }),
  app("messenger", "Messenger", "mensajes", "meta", "oauth", ["lola", "victor"], "Leer los mensajes de tu página de Facebook. Solo lectura.", { requiereAprobacion: META }),
  app("telegram", "Telegram", "mensajes", "telegram", "llave", ["lola"], "Leer los mensajes que recibe el bot de tu negocio. Solo lectura."),
  app("slack", "Slack", "mensajes", "slack", "oauth", ["iris"], "Leer los canales de tu equipo para resumir lo que pasó. Solo lectura."),
  // Agenda y reuniones
  app("calendly", "Calendly", "agenda", "calendly", "oauth", ["lola"], "Ver las citas que tus clientes agendan en Calendly. Solo lectura."),
  app("zoom", "Zoom", "agenda", "zoom", "oauth", ["lola"], "Ver tus próximas reuniones de Zoom. Solo lectura."),
  // Documentos, datos y trabajo
  app("notion", "Notion", "documentos", "notion", "oauth", ["iris"], "Buscar y leer las páginas de Notion que compartas con Atendel. Solo lectura."),
  app("dropbox", "Dropbox", "documentos", "dropbox", "oauth", ["iris"], "Buscar y leer tus archivos de Dropbox. Solo lectura."),
  app("airtable", "Airtable", "documentos", "airtable", "llave", ["iris"], "Leer tus bases de Airtable para resumirlas o sacar cuentas. Solo lectura."),
  app("trello", "Trello", "documentos", "trello", "llave", ["iris"], "Ver tus tableros y tarjetas de Trello. Solo lectura."),
  // Clientes (CRM)
  app("hubspot", "HubSpot", "clientes", "hubspot", "oauth", ["victor"], "Ver tus contactos y negocios en HubSpot. Solo lectura."),
  // Pagos y ventas
  app("stripe", "Stripe", "pagos", "stripe", "llave", ["iris", "victor"], "Ver tus cobros y pagos con tarjeta. Solo lectura."),
  app("mercado_pago", "Mercado Pago", "pagos", "mercadopago", "oauth", ["iris"], "Ver los pagos que recibes y los pendientes. Solo lectura."),
  app("mercado_libre", "Mercado Libre", "pagos", "mercadolibre", "oauth", ["iris", "victor"], "Ver tus ventas y preguntas de compradores en Mercado Libre. Solo lectura."),
  app("shopify", "Shopify", "pagos", "shopify", "oauth", ["iris", "victor"], "Ver los pedidos, el inventario y los clientes de tu tienda en línea. Solo lectura.", {
    requiereAprobacion: SHOPIFY,
  }),
  app("tienda_nube", "Tiendanube", "pagos", "tiendanube", "oauth", ["iris", "victor"], "Ver los pedidos y productos de tu tienda en línea. Solo lectura."),
  app("clip", "Clip", "pagos", null, null, ["clara", "victor"], "Ver las ventas que cobras con tu terminal Clip.", { fase: 2 }),
  // Facturación
  app("cfdi", "Facturas CFDI", "facturacion", "facturapi", "llave", ["iris"], "Leer tus facturas electrónicas para llevar cobros y pagos. Solo lectura."),
];

export const APP_POR_ID = Object.fromEntries(CATALOGO.map((a) => [a.id, a])) as Record<IdApp, AppConectable>;

export const esIdApp = (v: unknown): v is IdApp => typeof v === "string" && Object.prototype.hasOwnProperty.call(APP_POR_ID, v);

/** Los proveedores del contrato (en el orden de Proveedor). */
export const PROVEEDORES: readonly Proveedor[] = [
  "google",
  "microsoft",
  "notion",
  "meta",
  "telegram",
  "calendly",
  "zoom",
  "dropbox",
  "slack",
  "trello",
  "airtable",
  "hubspot",
  "stripe",
  "mercadopago",
  "mercadolibre",
  "shopify",
  "tiendanube",
  "facturapi",
];

export const esProveedor = (v: unknown): v is Proveedor => typeof v === "string" && (PROVEEDORES as readonly string[]).includes(v);

/** Las apps que se conectan de verdad (fase 1) de un proveedor. */
export const appsDeProveedor = (p: Proveedor): IdApp[] => CATALOGO.filter((a) => a.fase === 1 && a.proveedor === p).map((a) => a.id);

/** La llave con la que se cifran los tokens: sin ella no se guarda ninguna conexión. */
export const VARIABLE_LLAVE = "ATENDEL_LLAVE_CIFRADO";

/** Drive usa el permiso `drive.file`: sin el Picker no hay forma de elegir archivos. */
export const VARIABLES_PICKER = ["NEXT_PUBLIC_GOOGLE_API_KEY", "NEXT_PUBLIC_GOOGLE_APP_ID"] as const;
