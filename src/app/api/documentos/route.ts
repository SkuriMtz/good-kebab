import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { MAX_BYTES_DOCUMENTO, type Documento } from "@/lib/nucleo-tipos";
import {
  COLUMNAS_DOCUMENTO,
  ErrorDocumento,
  MENSAJES,
  crearDocumento,
  faltaMigracion,
  indexarTexto,
  marcarError,
  nombreSeguro,
  revisarLimiteDocumentos,
} from "@/lib/documentos/procesar";
import { MIME_POR_TIPO, TIPO_POR_EXTENSION, extraerTexto, revisarArchivo, type TipoArchivo } from "@/lib/documentos/extraer";
import { ErrorUrl, decodificarTexto, descargarSegura, htmlATexto, revisarFormaUrl } from "@/lib/documentos/url-segura";

/**
 * DOCUMENTOS DEL NEGOCIO (Tu negocio > Documentos)
 *
 * GET → Documento[] (del más nuevo al más viejo).
 * POST, de tres formas → Documento (201; su estado es "listo" o "error"):
 *  1. multipart/form-data con el campo "archivo" (PDF, DOCX, TXT o MD).
 *     Ojo: Vercel corta el cuerpo de una petición en ~4.5 MB; para archivos
 *     más grandes (hasta 10 MB) usa la forma 2.
 *  2. JSON { ruta, nombre }: el navegador ya subió el archivo a Storage
 *     (bucket "documentos", ruta "{su id}/{uuid}.{pdf|docx|txt|md}") con
 *     el cliente de Supabase y su sesión; aquí se revisa y se procesa.
 *  3. JSON { url }: un link público (página, texto o PDF), con protección
 *     contra SSRF (src/lib/documentos/url-segura.ts).
 * Si la petición no se puede atender (tipo de archivo, tamaño, límite del
 * plan, link inválido) responde { error } con un mensaje para la persona.
 *
 * Todo con la sesión de la persona: RLS y las políticas de Storage solo
 * dejan tocar lo suyo. Nunca la service role.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Un documento que lleva más de esto "procesando" se quedó a medias (la función se cortó). */
const MINUTOS_COLGADO = 10;
const BUCKET = "documentos";

const error = (mensaje: string, status: number) => NextResponse.json({ error: mensaje }, { status });

function responderError(e: unknown) {
  if (e instanceof ErrorDocumento || e instanceof ErrorUrl) return error(e.message, e.status);
  console.error("[api/documentos]", e);
  return error("Algo salió mal con el documento. Intenta de nuevo.", 500);
}

async function sesion() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET() {
  const { supabase, user } = await sesion();
  if (!user) return error("Tu sesión terminó. Vuelve a entrar.", 401);

  // Los que se quedaron "procesando" (la función se cortó a medias) pasan a error
  const limite = new Date(Date.now() - MINUTOS_COLGADO * 60_000).toISOString();
  await supabase
    .from("documentos")
    .update({ estado: "error", error: "El proceso se interrumpió. Bórralo y vuelve a subirlo." })
    .eq("owner_id", user.id)
    .eq("estado", "procesando")
    .lt("creado_en", limite);

  const { data, error: err } = await supabase
    .from("documentos")
    .select(COLUMNAS_DOCUMENTO)
    .eq("owner_id", user.id)
    .order("creado_en", { ascending: false })
    .limit(200);
  if (faltaMigracion(err)) return error(MENSAJES.baseDeDatos, 503);
  if (err) return error("No pudimos leer tus documentos. Intenta de nuevo.", 500);
  return NextResponse.json((data ?? []) as Documento[], { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const { supabase, user } = await sesion();
  if (!user) return error("Tu sesión terminó. Vuelve a entrar.", 401);

  const tipoContenido = (request.headers.get("content-type") ?? "").toLowerCase();
  try {
    if (tipoContenido.startsWith("multipart/form-data")) return await subirArchivo(request, supabase, user.id);
    if (tipoContenido.startsWith("application/json")) {
      if (Number(request.headers.get("content-length") ?? "0") > 10_000) return error("La petición es demasiado grande.", 413);
      let cuerpo: Record<string, unknown>;
      try {
        const datos = await request.json();
        if (!datos || typeof datos !== "object" || Array.isArray(datos)) throw new Error("forma");
        cuerpo = datos as Record<string, unknown>;
      } catch {
        return error("No pudimos leer la petición. Intenta de nuevo.", 400);
      }
      if (typeof cuerpo.url === "string") return await agregarLink(supabase, user.id, cuerpo.url);
      if (typeof cuerpo.ruta === "string") return await procesarSubido(supabase, user.id, cuerpo.ruta, cuerpo.nombre);
      return error("Manda un archivo o un link.", 400);
    }
    return error("Manda un archivo (multipart) o un link (JSON).", 415);
  } catch (e) {
    return responderError(e);
  }
}

/* ---------------- 1. Archivo en la petición (multipart) ---------------- */

async function subirArchivo(request: NextRequest, supabase: SupabaseClient, userId: string) {
  const megas = Math.round(MAX_BYTES_DOCUMENTO / 1024 / 1024);
  if (Number(request.headers.get("content-length") ?? "0") > MAX_BYTES_DOCUMENTO + 64 * 1024) {
    return error(`El archivo pesa más de ${megas} MB.`, 413);
  }
  let archivo: FormDataEntryValue | null;
  try {
    archivo = (await request.formData()).get("archivo");
  } catch {
    return error("No pudimos leer el archivo. Intenta de nuevo.", 400);
  }
  if (!archivo || typeof archivo === "string") return error('Falta el archivo (campo "archivo").', 400);
  if (archivo.size > MAX_BYTES_DOCUMENTO) return error(`El archivo pesa más de ${megas} MB.`, 413);
  const bytes = new Uint8Array(await archivo.arrayBuffer());
  const tipo = revisarArchivo(archivo.name || "documento", bytes);
  await revisarLimiteDocumentos(supabase, userId);
  const doc = await guardarArchivo(supabase, userId, { id: randomUUID(), nombre: archivo.name, tipo, bytes, yaSubido: false });
  return NextResponse.json(doc, { status: 201 });
}

/* ---------------- 2. Archivo que el navegador ya subió a Storage ---------------- */

async function procesarSubido(supabase: SupabaseClient, userId: string, ruta: string, nombre: unknown) {
  const m = new RegExp(`^${userId}/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\\.([a-z]{2,4})$`).exec(ruta);
  const tipo = m ? (TIPO_POR_EXTENSION[m[2]] as TipoArchivo | undefined) : undefined;
  if (!m || !tipo) return error("Esa ruta de archivo no es válida.", 400);
  const nombreTexto = typeof nombre === "string" && nombre.trim() ? nombre : `Documento.${m[2]}`;

  const borrar = () => supabase.storage.from(BUCKET).remove([ruta]);
  const { data: blob, error: errBajar } = await supabase.storage.from(BUCKET).download(ruta);
  if (errBajar || !blob) return error("No encontramos el archivo subido. Vuelve a subirlo.", 404);
  if (blob.size > MAX_BYTES_DOCUMENTO) {
    await borrar();
    return error(`El archivo pesa más de ${Math.round(MAX_BYTES_DOCUMENTO / 1024 / 1024)} MB.`, 413);
  }
  const bytes = new Uint8Array(await blob.arrayBuffer());
  try {
    revisarArchivo(`archivo.${m[2]}`, bytes);
    await revisarLimiteDocumentos(supabase, userId);
    const doc = await guardarArchivo(supabase, userId, { id: m[1], nombre: nombreTexto, tipo, bytes, yaSubido: true });
    return NextResponse.json(doc, { status: 201 });
  } catch (e) {
    // Si no se pudo ni crear el documento, el archivo no se queda huérfano en Storage
    if (!(e instanceof ErrorDocumento && e.status === 409)) await borrar();
    throw e;
  }
}

/**
 * Crea el documento, sube el archivo (si hace falta), extrae el texto y lo
 * trocea. Si falla la extracción, el documento queda en "error" con el motivo.
 */
async function guardarArchivo(
  supabase: SupabaseClient,
  userId: string,
  datos: { id: string; nombre: string; tipo: TipoArchivo; bytes: Uint8Array; yaSubido: boolean },
): Promise<Documento> {
  const ruta = `${userId}/${datos.id}.${datos.tipo}`;
  const doc = await crearDocumento(supabase, userId, {
    id: datos.id,
    nombre: nombreSeguro(datos.nombre, `Documento.${datos.tipo}`),
    tipo: datos.tipo,
    ruta,
  });
  if (!datos.yaSubido) {
    const { error: errSubir } = await supabase.storage
      .from(BUCKET)
      .upload(ruta, datos.bytes, { contentType: MIME_POR_TIPO[datos.tipo], upsert: false });
    if (errSubir) {
      await supabase.from("documentos").delete().eq("id", doc.id);
      const sinBucket = /bucket not found/i.test(errSubir.message ?? "");
      throw new ErrorDocumento(sinBucket ? MENSAJES.baseDeDatos : "No pudimos guardar el archivo. Intenta de nuevo.", sinBucket ? 503 : 502);
    }
  }
  let texto: string;
  try {
    texto = await extraerTexto(datos.bytes, datos.tipo);
  } catch (e) {
    const mensaje = e instanceof ErrorDocumento ? e.message : "No pudimos leer el archivo. Ábrelo y guárdalo de nuevo.";
    return (await marcarError(supabase, doc.id, mensaje)) ?? { ...doc, estado: "error", error: mensaje };
  }
  return indexarTexto(supabase, userId, doc.id, texto);
}

/* ---------------- 3. Link público ---------------- */

function decodificarRuta(ruta: string) {
  try {
    return decodeURIComponent(ruta);
  } catch {
    return ruta;
  }
}

/** Un nombre para el link: el título de la página o el sitio y la ruta. */
function nombreDeLink(url: URL, titulo: string) {
  if (titulo) return titulo;
  const ruta = decodificarRuta(url.pathname);
  return `${url.hostname}${ruta === "/" ? "" : ruta}`;
}

async function agregarLink(supabase: SupabaseClient, userId: string, texto: string) {
  if (texto.length > 2000) return error("Ese link es demasiado largo.", 400);
  const url = revisarFormaUrl(texto);
  await revisarLimiteDocumentos(supabase, userId);

  const descarga = await descargarSegura(url.href);
  let titulo = "";
  let contenido: string;
  if (descarga.tipo === "application/pdf") {
    contenido = await extraerTexto(descarga.bytes, "pdf");
    titulo = decodificarRuta(new URL(descarga.url).pathname.split("/").pop() ?? "").replace(/\.pdf$/i, "");
  } else if (descarga.tipo === "text/html") {
    ({ titulo, texto: contenido } = htmlATexto(decodificarTexto(descarga.bytes, descarga.charset, true)));
  } else {
    contenido = decodificarTexto(descarga.bytes, descarga.charset, false);
  }
  if (!contenido.trim()) {
    return error(
      "No encontramos texto en esa página (puede que se arme con JavaScript o sea una imagen). Prueba con otra página o sube el contenido como archivo.",
      422,
    );
  }
  const doc = await crearDocumento(supabase, userId, { nombre: nombreDeLink(url, titulo), tipo: "link", url: url.href });
  return NextResponse.json(await indexarTexto(supabase, userId, doc.id, contenido), { status: 201 });
}
