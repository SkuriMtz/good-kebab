/**
 * CONTRATO de la sección "Tu negocio" (perfil, documentos y apps conectadas).
 * Lo comparten tres trabajos en paralelo; cambiarlo es cambiarlo para todos.
 *
 * - Núcleo (C): migración 0006, cifrado, API de perfil y documentos,
 *   extracción, troceo, búsqueda y el contexto del chat.
 * - Integraciones (D): OAuth propio (Google, Microsoft, Notion), adaptadores
 *   y herramientas de SOLO LECTURA para los agentes en el chat.
 * - Interfaz (A): la vista `?vista=negocio&tab=perfil|documentos|apps` en el
 *   panel que ya existe (no se rehace nada más).
 *
 * Variables de entorno (en Vercel; nunca en el código ni pedidas en el chat):
 * - ATENDEL_LLAVE_CIFRADO: 32 bytes en base64 (AES-256-GCM de los tokens).
 * - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET: el cliente OAuth de Google.
 * - NEXT_PUBLIC_GOOGLE_API_KEY, NEXT_PUBLIC_GOOGLE_APP_ID: Google Picker (Drive).
 * - MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET (tenant "common").
 * - NOTION_CLIENT_ID, NOTION_CLIENT_SECRET.
 * Si faltan las de un proveedor, ese proveedor queda en estado "sin_configurar"
 * y la tarjeta dice exactamente qué falta.
 */

import type { IdAgente } from "@/lib/agentes";

/* ---------------- Perfil del negocio (tabla perfil_negocio) ---------------- */

export const CAMPOS_PERFIL = [
  "a_que_se_dedica",
  "servicios_y_precios",
  "horarios",
  "ubicacion",
  "formas_de_pago",
  "politicas",
  "tono",
  "preguntas_frecuentes",
  "algo_mas",
] as const;
export type CampoPerfil = (typeof CAMPOS_PERFIL)[number];
export type PerfilNegocio = Record<CampoPerfil, string> & { actualizado_en: string | null };
/** Largo máximo por campo (también como CHECK en la tabla). */
export const MAX_CAMPO_PERFIL = 2000;

/* ---------------- Documentos (tablas documentos y fragmentos_doc) ---------------- */

export type TipoDocumento = "pdf" | "docx" | "txt" | "md" | "link" | "drive" | "notion";
export type EstadoDocumento = "procesando" | "listo" | "error";
export type Documento = {
  id: string;
  nombre: string;
  tipo: TipoDocumento;
  estado: EstadoDocumento;
  error: string | null;
  caracteres: number;
  url: string | null;
  creado_en: string;
};
export const MAX_BYTES_DOCUMENTO = 10 * 1024 * 1024;
export const MAX_DOCUMENTOS_POR_PLAN = { free: 3, one: 20, max: 100 } as const;

/* ---------------- Apps conectadas (tablas conexiones y apps_interes) ---------------- */

/**
 * v2 (el dueño: "son más apps, no solo esas"): TODAS estas se conectan de
 * verdad en código. Cada una se activa cuando su proveedor está configurado
 * (variables en Vercel) o, si es por llave, cuando la persona pega SU llave
 * en la tarjeta (se guarda cifrada). Las que además piden aprobación del
 * proveedor (Meta, Google Business) lo dicen en `requiereAprobacion`.
 * "clip" queda en_camino: no tiene API pública para leer cobros. Lo mismo
 * para las de v3 sin API pública (si se confirma en su documentación):
 * fresha, booksy y doctoralia → en_camino con "Avísame", sin inventar.
 */
export type Proveedor =
  | "google"
  | "microsoft"
  | "notion"
  | "meta"
  | "telegram"
  | "calendly"
  | "zoom"
  | "dropbox"
  | "slack"
  | "trello"
  | "airtable"
  | "hubspot"
  | "stripe"
  | "mercadopago"
  | "mercadolibre"
  | "shopify"
  | "tiendanube"
  | "facturapi"
  // v3 (el dueño eligió las 4 tandas): reservas, pagos MX, contabilidad, CRM y marketing
  | "acuity"
  | "simplybook"
  | "setmore"
  | "agendapro"
  | "paypal"
  | "conekta"
  | "openpay"
  | "square"
  | "facturama"
  | "alegra"
  | "holded"
  | "zoho"
  | "quickbooks"
  | "pipedrive"
  | "kommo"
  | "typeform"
  | "mailchimp";

export type IdApp =
  // Google (un cliente OAuth)
  | "gmail"
  | "google_calendar"
  | "google_drive"
  | "google_sheets"
  | "google_contacts"
  | "google_business"
  // Microsoft (Graph)
  | "outlook"
  | "outlook_calendar"
  | "onedrive"
  | "excel"
  | "outlook_contacts"
  // Mensajes
  | "whatsapp_business"
  | "instagram"
  | "messenger"
  | "telegram"
  | "slack"
  // Agenda y reuniones
  | "calendly"
  | "zoom"
  // Documentos, datos y trabajo
  | "notion"
  | "dropbox"
  | "airtable"
  | "trello"
  // Clientes (CRM)
  | "hubspot"
  // Pagos y ventas
  | "stripe"
  | "mercado_pago"
  | "mercado_libre"
  | "shopify"
  | "tienda_nube"
  | "clip"
  // Facturación
  | "cfdi"
  // v3 · Reservas y citas
  | "agendapro"
  | "fresha"
  | "booksy"
  | "doctoralia"
  | "acuity"
  | "simplybook"
  | "setmore"
  // v3 · Pagos en México
  | "paypal"
  | "conekta"
  | "openpay"
  | "square"
  // v3 · Contabilidad y facturas
  | "facturama"
  | "alegra"
  | "holded"
  | "zoho_books"
  | "quickbooks"
  // v3 · Ventas, CRM, formularios y reseñas
  | "zoho_crm"
  | "pipedrive"
  | "kommo"
  | "google_forms"
  | "typeform"
  | "mailchimp"
  | "facebook_resenas";

export type CategoriaApp = "mensajes" | "correo" | "agenda" | "reservas" | "documentos" | "clientes" | "pagos" | "contabilidad" | "resenas" | "facturacion";

/** Cómo se conecta: OAuth (botón "Conectar") o una llave de la persona (campo en la tarjeta, se guarda cifrada). */
export type Autenticacion = "oauth" | "llave";

/** Lo que se guarda cifrado en conexiones.token_cifrado. */
export type Tokens = {
  access_token: string;
  refresh_token?: string;
  /** Epoch en ms. */
  expira_en?: number;
  /** Datos del proveedor que hagan falta (shop de Shopify, page_id de Meta, workspace de Notion…). */
  extra?: Record<string, string>;
};

/** Una herramienta de SOLO LECTURA que un agente puede usar en el chat. */
export type Herramienta = {
  /** snake_case, única en todo el registro (p. ej. "stripe_pagos_recientes"). */
  nombre: string;
  descripcion: string;
  app: IdApp;
  agentes: IdAgente[];
  /** JSON Schema de los argumentos. */
  esquema: Record<string, unknown>;
  /** Regresa texto plano (se trunca y se marca como DATOS al pasarlo al modelo). */
  ejecutar(args: Record<string, unknown>, ctx: { token: () => Promise<Tokens>; senal: AbortSignal }): Promise<string>;
};

/**
 * Lo que implementa cada proveedor en src/lib/conexiones/proveedores/<proveedor>.ts
 * y se registra en src/lib/conexiones/registro.ts (de D).
 */
export type Adaptador = {
  proveedor: Proveedor;
  autenticacion: Autenticacion;
  /** Variables de Vercel que necesita (solo nombres). Vacío si es por llave. */
  variables: string[];
  /** Si además pide aprobación/revisión del proveedor para usarse con cualquier cuenta. */
  requiereAprobacion?: string;
  // OAuth
  urlAutorizacion?(p: { state: string; redirectUri: string; apps: IdApp[]; codeChallenge?: string; query?: Record<string, string> }): string;
  intercambiar?(p: { code: string; redirectUri: string; codeVerifier?: string; query?: Record<string, string> }): Promise<Tokens>;
  renovar?(t: Tokens): Promise<Tokens>;
  revocar?(t: Tokens): Promise<void>;
  // Llave (Telegram bot token, Stripe restricted key, Facturapi, Trello, Airtable PAT…)
  validarLlave?(llave: string): Promise<Tokens>;
  /** Correo o nombre de la cuenta conectada, para mostrar en la tarjeta. */
  cuenta(t: Tokens): Promise<string>;
  herramientas: Herramienta[];
};

/**
 * Estado de una app para la persona:
 * - conectada: hay conexión válida (con la cuenta).
 * - desconectada: el proveedor está configurado; falta que la persona conecte.
 * - sin_configurar: faltan variables en Vercel (la lista va en `falta`).
 * - en_camino: sin API pública todavía (p. ej. clip); se puede pedir "Avísame".
 * - error: la conexión existe pero falló (token revocado, etc.).
 */
export type EstadoApp = "conectada" | "desconectada" | "sin_configurar" | "en_camino" | "error";

export type AppConectable = {
  id: IdApp;
  nombre: string;
  categoria: CategoriaApp;
  proveedor: Proveedor | null;
  autenticacion: Autenticacion | null;
  /** Qué agente(s) la usan. */
  agentes: IdAgente[];
  /** Qué puede hacer la IA con ella, en una línea (p. ej. "Leer tus correos"). */
  puede: string;
  /** 1 = se conecta de verdad ya (código completo); 2/3 = en_camino. */
  fase: 1 | 2 | 3;
  /** Texto si el proveedor pide aprobación (Meta, Google Business). */
  requiereAprobacion?: string;
};

export type EstadoAppPersona = {
  id: IdApp;
  estado: EstadoApp;
  /** Correo o nombre de la cuenta conectada. */
  cuenta?: string;
  /** Variables que faltan en Vercel (solo nombres). */
  falta?: string[];
  /** La persona ya pidió "Avísame". */
  avisame?: boolean;
  error?: string;
};

/* ---------------- Rutas (las crea quien se indica) ---------------- */

export const RUTAS = {
  // Núcleo (C)
  perfil: "/api/negocio/perfil", // GET → PerfilNegocio · PUT (Partial<Record<CampoPerfil,string>>) → PerfilNegocio
  documentos: "/api/documentos", // GET → Documento[] · POST multipart (archivo) o JSON {url} → Documento
  documento: (id: string) => `/api/documentos/${id}`, // DELETE
  // Integraciones (D)
  apps: "/api/apps", // GET → EstadoAppPersona[]
  avisame: "/api/apps/avisame", // POST {app: IdApp} · DELETE {app}
  conectar: (p: Proveedor, app: IdApp) => `/api/conexiones/${p}/conectar?app=${app}`, // GET → redirige al OAuth
  callback: (p: Proveedor) => `/api/conexiones/${p}/callback`, // GET (OAuth) → redirige a /panel?vista=negocio&tab=apps
  desconectar: (p: Proveedor) => `/api/conexiones/${p}/desconectar`, // POST → revoca y borra
  llave: (p: Proveedor) => `/api/conexiones/${p}/llave`, // POST {llave, app} → valida y guarda cifrada → EstadoAppPersona (nunca regresa la llave)
  drivePicker: "/api/conexiones/google/picker", // POST {archivos:[{id,nombre,mime}]} → Documento[] (los vuelve documentos)
} as const;
