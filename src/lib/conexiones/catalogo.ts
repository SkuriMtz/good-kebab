import type { AppConectable, Autenticacion, CategoriaApp, IdApp, Proveedor } from "@/lib/nucleo-tipos";
import type { IdAgente } from "@/lib/agentes";

/**
 * CATÁLOGO DE APPS CONECTABLES (las 30 IdApp del contrato v2).
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
const INTUIT = "Intuit pide llenar el perfil y el cuestionario de la app para darte las llaves de producción; mientras, solo funciona con empresas de prueba (sandbox).";
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
  app("whatsapp_business", "WhatsApp Business", "mensajes", "meta", "oauth", ["lola"], "Ver tus números y plantillas de WhatsApp Business (los mensajes llegarán cuando se active el webhook). Solo lectura.", {
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
  // v3 · Ventas, CRM, formularios y reseñas (E)
  app("zoho_crm", "Zoho CRM", "clientes", "zoho", "oauth", ["victor"], "Buscar tus contactos y tratos en Zoho CRM. Solo lectura."),
  app("pipedrive", "Pipedrive", "clientes", "pipedrive", "oauth", ["victor"], "Buscar tus personas y tratos en Pipedrive. Solo lectura."),
  app("kommo", "Kommo", "clientes", "kommo", "oauth", ["victor"], "Buscar tus leads y contactos en Kommo. Solo lectura."),
  app("google_forms", "Google Forms", "clientes", "google", "oauth", ["victor"], "Leer las respuestas de los formularios de Google que le indiques. Solo lectura."),
  app("typeform", "Typeform", "clientes", "typeform", "oauth", ["victor"], "Ver tus formularios de Typeform y leer sus respuestas. Solo lectura."),
  app("mailchimp", "Mailchimp", "clientes", "mailchimp", "oauth", ["victor"], "Ver tus audiencias y cómo les fue a tus campañas enviadas. Solo lectura."),
  app("facebook_resenas", "Reseñas de Facebook", "resenas", "meta", "oauth", ["victor"], "Leer las recomendaciones y reseñas de tu página de Facebook. Solo lectura.", { requiereAprobacion: META }),
  // v3 · Reservas y citas (E). Las que no tienen API pública quedan en camino (fase 2), sin inventar.
  app("acuity", "Acuity Scheduling", "reservas", "acuity", "llave", ["lola"], "Ver tus citas, las de un cliente y tus servicios en Acuity. Solo lectura."),
  app("simplybook", "SimplyBook.me", "reservas", "simplybook", "llave", ["lola"], "Ver tus reservas, las de un cliente y tus servicios en SimplyBook.me. Solo lectura."),
  app("setmore", "Setmore", "reservas", null, null, ["lola"], "Aún no tiene conexión pública: Setmore da su API solo a cuentas Pro que aprueba por correo.", { fase: 2 }),
  app("agendapro", "AgendaPro", "reservas", null, null, ["lola"], "Aún no tiene conexión pública: AgendaPro no publica la documentación de su API.", { fase: 2 }),
  app("fresha", "Fresha", "reservas", null, null, ["lola"], "Aún no tiene conexión pública: Fresha no ofrece una API para conectar tu cuenta.", { fase: 2 }),
  app("booksy", "Booksy", "reservas", null, null, ["lola"], "Aún no tiene conexión pública: Booksy abre su API solo a socios aprobados.", { fase: 2 }),
  app("doctoralia", "Doctoralia", "reservas", null, null, ["lola"], "Aún no tiene conexión pública: la API de Doctoralia es solo para empresas de software médico.", { fase: 2 }),
  // Pagos y ventas
  app("stripe", "Stripe", "pagos", "stripe", "llave", ["iris", "victor"], "Ver tus cobros y pagos con tarjeta. Solo lectura."),
  app("mercado_pago", "Mercado Pago", "pagos", "mercadopago", "oauth", ["iris"], "Ver los pagos que recibes y los pendientes. Solo lectura."),
  app("mercado_libre", "Mercado Libre", "pagos", "mercadolibre", "oauth", ["iris", "victor"], "Ver tus ventas y preguntas de compradores en Mercado Libre. Solo lectura."),
  app("shopify", "Shopify", "pagos", "shopify", "oauth", ["iris", "victor"], "Ver los pedidos, el inventario y los clientes de tu tienda en línea. Solo lectura.", {
    requiereAprobacion: SHOPIFY,
  }),
  app("tienda_nube", "Tiendanube", "pagos", "tiendanube", "oauth", ["iris", "victor"], "Ver los pedidos y productos de tu tienda en línea. Solo lectura."),
  app("clip", "Clip", "pagos", null, null, ["clara", "victor"], "Ver las ventas que cobras con tu terminal Clip.", { fase: 2 }),
  // v3 · Pagos en México (G)
  app("paypal", "PayPal", "pagos", "paypal", "llave", ["iris"], "Ver tus movimientos recientes de PayPal (cobros, reembolsos y comisiones) y tu saldo. Solo lectura."),
  app("conekta", "Conekta", "pagos", "conekta", "llave", ["iris"], "Ver tus órdenes y cargos recientes de Conekta (tarjeta, OXXO y SPEI). Solo lectura."),
  app("openpay", "Openpay", "pagos", "openpay", "llave", ["iris", "victor"], "Ver tus cargos recientes y los clientes que tienes en Openpay. Solo lectura."),
  app("square", "Square", "pagos", "square", "oauth", ["iris", "victor", "lola"], "Ver tus pagos, tus clientes y las citas de Square Appointments. Solo lectura."),
  // Contabilidad (Zoho Books va con el mismo OAuth de Zoho que Zoho CRM)
  app("zoho_books", "Zoho Books", "contabilidad", "zoho", "oauth", ["clara", "iris"], "Ver tus facturas y clientes de Zoho Books. Solo lectura."),
  // v3 · Contabilidad y facturas (G)
  app("facturama", "Facturama", "contabilidad", "facturama", "llave", ["iris", "victor"], "Ver tus facturas (CFDI) emitidas y buscarlas por RFC o cliente. Solo lectura: no timbra ni cancela."),
  app("alegra", "Alegra", "contabilidad", "alegra", "llave", ["iris", "victor"], "Ver tus facturas, los cobros que registras y tus contactos de Alegra. Solo lectura."),
  app("holded", "Holded", "contabilidad", "holded", "llave", ["iris", "victor"], "Ver tus facturas, presupuestos, pedidos y contactos de Holded. Solo lectura."),
  app("quickbooks", "QuickBooks", "contabilidad", "quickbooks", "oauth", ["iris", "victor"], "Ver tus facturas, los pagos que recibes y tus clientes de QuickBooks. Solo lectura.", {
    requiereAprobacion: INTUIT,
  }),
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
  // v3 (E): reservas y CRM
  "acuity",
  "simplybook",
  "zoho",
  "pipedrive",
  "kommo",
  "typeform",
  "mailchimp",
  // v3 (G): pagos en México y contabilidad
  "paypal",
  "conekta",
  "openpay",
  "square",
  "facturama",
  "alegra",
  "holded",
  "quickbooks",
];

export const esProveedor = (v: unknown): v is Proveedor => typeof v === "string" && (PROVEEDORES as readonly string[]).includes(v);

/** Las apps que se conectan de verdad (fase 1) de un proveedor. */
export const appsDeProveedor = (p: Proveedor): IdApp[] => CATALOGO.filter((a) => a.fase === 1 && a.proveedor === p).map((a) => a.id);

/** La llave con la que se cifran los tokens: sin ella no se guarda ninguna conexión. */
export const VARIABLE_LLAVE = "ATENDEL_LLAVE_CIFRADO";

/** Drive usa el permiso `drive.file`: sin el Picker no hay forma de elegir archivos. */
export const VARIABLES_PICKER = ["NEXT_PUBLIC_GOOGLE_API_KEY", "NEXT_PUBLIC_GOOGLE_APP_ID"] as const;
