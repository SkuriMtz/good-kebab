"use client";

import { createContext, useContext } from "react";
import {
  CAMPOS_PERFIL,
  MAX_BYTES_DOCUMENTO,
  RUTAS,
  type CampoPerfil,
  type Documento,
  type EstadoAppPersona,
  type IdApp,
  type PerfilNegocio,
  type Proveedor,
} from "@/lib/nucleo-tipos";
import { createClient } from "@/lib/supabase/client";

/* =====================================================================
   De dónde salen los datos de "Tu negocio". La vista y el "+" de la caja
   de chat hablan con una FUENTE con la misma forma:
   - en /panel, la API real del contrato (src/lib/nucleo-tipos.ts: RUTAS);
   - en /pruebalo, el ejemplo de Estudio Luna (negocio/demo.ts), que vive
     en la pestaña (sessionStorage) y no llama a ninguna API.
   ===================================================================== */

export type CambiosPerfil = Partial<Record<CampoPerfil, string>>;

export type FuenteNegocio = {
  /** /pruebalo: datos de ejemplo, sin red. */
  demo: boolean;
  /** "/panel" o "/pruebalo": de aquí salen los enlaces. */
  base: "/panel" | "/pruebalo";
  leerPerfil(): Promise<PerfilNegocio>;
  guardarPerfil(cambios: CambiosPerfil): Promise<PerfilNegocio>;
  listarDocumentos(): Promise<Documento[]>;
  subirArchivo(archivo: File): Promise<Documento>;
  agregarLink(url: string): Promise<Documento>;
  borrarDocumento(id: string): Promise<void>;
  listarApps(): Promise<EstadoAppPersona[]>;
  avisame(app: IdApp, quiere: boolean): Promise<void>;
  desconectar(proveedor: Proveedor, app: IdApp): Promise<void>;
  /** Las apps por llave (Telegram, Stripe…): valida y guarda SU llave, cifrada. La llave nunca regresa. */
  guardarLlave(proveedor: Proveedor, app: IdApp, llave: string): Promise<EstadoAppPersona>;
  /** Guarda como documentos los archivos elegidos en Google Drive (Picker). */
  guardarDeDrive(archivos: { id: string; nombre: string; mime: string }[]): Promise<Documento[]>;
};

/** Un error que se puede mostrar tal cual (y, si es de un campo, junto a ese campo). */
export class ErrorNegocio extends Error {
  campo?: string;
  estado?: number;
  constructor(mensaje: string, extra: { campo?: string; estado?: number } = {}) {
    super(mensaje);
    this.name = "ErrorNegocio";
    this.campo = extra.campo;
    this.estado = extra.estado;
  }
}

export const mensajeDe = (e: unknown, otro = "Algo salió mal. Intenta de nuevo.") => (e instanceof Error && e.message ? e.message : otro);

/* ---------- Lo que se valida también en el navegador ---------- */

export const EXTENSIONES_DOCUMENTO = ["pdf", "docx", "txt", "md"] as const;
export type ExtensionDocumento = (typeof EXTENSIONES_DOCUMENTO)[number];
/** Para el selector de archivos: extensiones y tipos MIME. */
export const ACEPTA_DOCUMENTOS = ".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown";

export const extensionDe = (nombre: string): ExtensionDocumento | null => {
  const ext = nombre.toLowerCase().split(".").pop() ?? "";
  return (EXTENSIONES_DOCUMENTO as readonly string[]).includes(ext) ? (ext as ExtensionDocumento) : null;
};

/** null si el archivo se puede subir; si no, por qué (en español sencillo). */
export function validarArchivo(archivo: File): string | null {
  if (!extensionDe(archivo.name)) return `«${archivo.name}» no se puede leer: sube un PDF, DOCX, TXT o MD.`;
  if (archivo.size === 0) return `«${archivo.name}» está vacío.`;
  if (archivo.size > MAX_BYTES_DOCUMENTO) return `«${archivo.name}» pesa ${megas(archivo.size)}: el máximo es 10 MB.`;
  return null;
}

/** null si el link sirve; si no, por qué. Solo páginas públicas con http o https. */
export function validarLink(texto: string): string | null {
  const t = texto.trim();
  if (!t) return "Escribe el link de una página.";
  let url: URL;
  try {
    url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(t) ? t : `https://${t}`);
  } catch {
    return "Ese link no se ve completo. Ejemplo: https://tusitio.com/precios";
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return "El link debe empezar con https:// o http://";
  if (!url.hostname.includes(".")) return "Ese link no se ve completo. Ejemplo: https://tusitio.com/precios";
  return null;
}

/** El link con https:// si no lo traía. */
export const normalizarLink = (texto: string) => {
  const t = texto.trim();
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(t) ? t : `https://${t}`;
};

const megas = (b: number) => `${(b / (1024 * 1024)).toLocaleString("es-MX", { maximumFractionDigits: 1 })} MB`;

/* ---------- La fuente real: la API del contrato ---------- */

/** Lee la respuesta; si no salió bien, lanza un error que se puede mostrar. */
async function respuesta<T>(res: Response): Promise<T> {
  const datos = (await res.json().catch(() => null)) as unknown;
  if (res.ok) return datos as T;
  const j = (datos ?? {}) as { error?: unknown; campo?: unknown };
  const campo = typeof j.campo === "string" ? j.campo : undefined;
  const texto = typeof j.error === "string" && j.error.trim() ? j.error.trim() : null;
  if (res.status === 401) throw new ErrorNegocio("Tu sesión terminó. Vuelve a entrar.", { estado: 401 });
  if (res.status === 413) throw new ErrorNegocio(texto ?? "El archivo pesa más de 10 MB.", { estado: 413 });
  if (res.status === 429) throw new ErrorNegocio(texto ?? "Vas muy rápido. Intenta de nuevo en un momento.", { estado: 429 });
  throw new ErrorNegocio(texto ?? "Algo salió mal. Intenta de nuevo.", { campo, estado: res.status });
}

/** Hasta aquí el archivo va en la petición (multipart); más grande, primero a Storage. */
const MAX_BYTES_DIRECTO = 4 * 1024 * 1024;
const BUCKET_DOCUMENTOS = "documentos";

/** Sube el archivo al bucket privado en "{tu id}/{uuid}.{ext}" (RLS: solo tu carpeta) y regresa la ruta. */
async function subirAStorage(archivo: File): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new ErrorNegocio("Tu sesión terminó. Vuelve a entrar.", { estado: 401 });
  const ext = extensionDe(archivo.name);
  if (!ext) throw new ErrorNegocio(`«${archivo.name}» no se puede leer: sube un PDF, DOCX, TXT o MD.`);
  const ruta = `${user.id}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET_DOCUMENTOS).upload(ruta, archivo, { contentType: archivo.type || undefined, upsert: false });
  if (error) throw new ErrorNegocio("No se pudo subir el archivo. Revisa tu conexión e intenta de nuevo.");
  return ruta;
}

/** Acepta la lista sola o envuelta ({ documentos: [...] }). */
const lista = <T>(datos: unknown, clave: string): T[] => {
  if (Array.isArray(datos)) return datos as T[];
  const dentro = (datos as Record<string, unknown> | null)?.[clave];
  return Array.isArray(dentro) ? (dentro as T[]) : [];
};

/** El perfil completo (los campos que falten, vacíos). */
export const perfilCompleto = (p: Partial<PerfilNegocio> | null | undefined): PerfilNegocio => {
  const base = Object.fromEntries(CAMPOS_PERFIL.map((c) => [c, typeof p?.[c] === "string" ? (p[c] as string) : ""])) as Record<CampoPerfil, string>;
  return { ...base, actualizado_en: p?.actualizado_en ?? null };
};

const JSON_H = { "Content-Type": "application/json" };

export const fuenteReal: FuenteNegocio = {
  demo: false,
  base: "/panel",
  async leerPerfil() {
    const d = await respuesta<PerfilNegocio | { perfil?: PerfilNegocio }>(await fetch(RUTAS.perfil, { cache: "no-store" }));
    return perfilCompleto(d && "perfil" in d ? d.perfil : (d as PerfilNegocio));
  },
  async guardarPerfil(cambios) {
    const d = await respuesta<PerfilNegocio | { perfil?: PerfilNegocio }>(await fetch(RUTAS.perfil, { method: "PUT", headers: JSON_H, body: JSON.stringify(cambios) }));
    return perfilCompleto(d && "perfil" in d ? d.perfil : (d as PerfilNegocio));
  },
  async listarDocumentos() {
    return lista<Documento>(await respuesta(await fetch(RUTAS.documentos, { cache: "no-store" })), "documentos");
  },
  async subirArchivo(archivo) {
    // Vercel corta el cuerpo de una petición en ~4.5 MB: lo grande va directo a Storage y la API lo procesa
    if (archivo.size > MAX_BYTES_DIRECTO) {
      const d = await respuesta<Documento | { documento: Documento }>(
        await fetch(RUTAS.documentos, { method: "POST", headers: JSON_H, body: JSON.stringify({ ruta: await subirAStorage(archivo), nombre: archivo.name }) }),
      );
      return "documento" in d ? d.documento : d;
    }
    const fd = new FormData();
    fd.append("archivo", archivo, archivo.name);
    const d = await respuesta<Documento | { documento: Documento }>(await fetch(RUTAS.documentos, { method: "POST", body: fd }));
    return "documento" in d ? d.documento : d;
  },
  async agregarLink(url) {
    const d = await respuesta<Documento | { documento: Documento }>(await fetch(RUTAS.documentos, { method: "POST", headers: JSON_H, body: JSON.stringify({ url }) }));
    return "documento" in d ? d.documento : d;
  },
  async borrarDocumento(id) {
    await respuesta(await fetch(RUTAS.documento(id), { method: "DELETE" }));
  },
  async listarApps() {
    return lista<EstadoAppPersona>(await respuesta(await fetch(RUTAS.apps, { cache: "no-store" })), "apps");
  },
  async avisame(app, quiere) {
    await respuesta(await fetch(RUTAS.avisame, { method: quiere ? "POST" : "DELETE", headers: JSON_H, body: JSON.stringify({ app }) }));
  },
  async desconectar(proveedor, app) {
    await respuesta(await fetch(RUTAS.desconectar(proveedor), { method: "POST", headers: JSON_H, body: JSON.stringify({ app }) }));
  },
  async guardarLlave(proveedor, app, llave) {
    const d = await respuesta<EstadoAppPersona | { app?: EstadoAppPersona }>(await fetch(RUTAS.llave(proveedor), { method: "POST", headers: JSON_H, body: JSON.stringify({ llave, app }) }));
    return d && "app" in d && d.app && typeof d.app === "object" ? d.app : (d as EstadoAppPersona);
  },
  async guardarDeDrive(archivos) {
    return lista<Documento>(await respuesta(await fetch(RUTAS.drivePicker, { method: "POST", headers: JSON_H, body: JSON.stringify({ archivos }) })), "documentos");
  },
};

/** La fuente de la vista: la real en /panel; /pruebalo pone la de ejemplo. */
export const ContextoNegocio = createContext<FuenteNegocio>(fuenteReal);
export const useFuenteNegocio = () => useContext(ContextoNegocio);

/** Aviso de que cambiaron los documentos (el "+" del chat subió uno): la lista se vuelve a leer. */
export const EVENTO_DOCUMENTOS = "atendel:documentos";
export const avisarDocumentos = () => window.dispatchEvent(new Event(EVENTO_DOCUMENTOS));
