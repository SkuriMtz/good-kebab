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

export type Proveedor = "google" | "microsoft" | "notion";
export type IdApp =
  // Fase 1: reales (si su proveedor está configurado)
  | "gmail"
  | "google_calendar"
  | "google_drive"
  | "google_sheets"
  | "outlook"
  | "outlook_calendar"
  | "onedrive"
  | "notion"
  // En camino (fase 2/3): "Avísame" se guarda en apps_interes
  | "whatsapp_business"
  | "instagram"
  | "messenger"
  | "telegram"
  | "calendly"
  | "excel"
  | "dropbox"
  | "mercado_pago"
  | "stripe"
  | "clip"
  | "shopify"
  | "tienda_nube"
  | "google_business"
  | "cfdi";

export type CategoriaApp = "mensajes" | "correo" | "agenda" | "documentos" | "pagos" | "resenas" | "facturacion";

/**
 * Estado de una app para la persona:
 * - conectada: hay conexión válida (con la cuenta).
 * - desconectada: el proveedor está configurado; falta que la persona conecte.
 * - sin_configurar: faltan variables en Vercel (la lista va en `falta`).
 * - en_camino: fase 2/3; se puede pedir "Avísame".
 * - error: la conexión existe pero falló (token revocado, etc.).
 */
export type EstadoApp = "conectada" | "desconectada" | "sin_configurar" | "en_camino" | "error";

export type AppConectable = {
  id: IdApp;
  nombre: string;
  categoria: CategoriaApp;
  proveedor: Proveedor | null;
  /** Qué agente(s) la usan. */
  agentes: IdAgente[];
  /** Qué puede hacer la IA con ella, en una línea (p. ej. "Leer tus correos"). */
  puede: string;
  fase: 1 | 2 | 3;
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
  drivePicker: "/api/conexiones/google/picker", // POST {archivos:[{id,nombre,mime}]} → Documento[] (los vuelve documentos)
} as const;
