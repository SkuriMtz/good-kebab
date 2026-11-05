import { extraerTexto } from "@/lib/documentos/extraer";
import { ErrorArgs } from "./http";

/**
 * Bytes de un archivo (de Drive u OneDrive) → texto, con la extracción del
 * núcleo (src/lib/documentos/extraer.ts: unpdf para PDF y mammoth para Word,
 * que además revisa que los bytes sean del tipo que dicen).
 * Texto, Markdown, CSV y JSON se leen directo.
 */

export const MIME_PDF = "application/pdf";
export const MIME_DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const esTexto = (mime: string, nombre: string) =>
  mime.startsWith("text/") || mime === "application/json" || mime === "application/csv" || /\.(txt|md|csv|json)$/i.test(nombre);

export async function textoDeBytes(bytes: Uint8Array, mime: string, nombre: string): Promise<string> {
  if (esTexto(mime, nombre)) return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  const tipo = mime === MIME_PDF || /\.pdf$/i.test(nombre) ? "pdf" : mime === MIME_DOCX || /\.docx$/i.test(nombre) ? "docx" : null;
  if (!tipo) throw new ErrorArgs("Ese tipo de archivo no se puede leer como texto (solo Docs, PDF, Word, TXT, MD y CSV).");
  try {
    return await extraerTexto(bytes, tipo);
  } catch (e) {
    // ErrorDocumento trae un mensaje amable para la persona
    throw new ErrorArgs(e instanceof Error && e.message ? e.message : "No se pudo leer el archivo.");
  }
}
