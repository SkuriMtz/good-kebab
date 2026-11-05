import "server-only";
import { ErrorDocumento } from "./procesar";

/**
 * EXTRAER EL TEXTO DE UN ARCHIVO (PDF, Word, TXT o MD)
 *
 * - El tipo se decide por los BYTES del archivo, no por lo que diga el
 *   navegador: PDF empieza con "%PDF-", un DOCX es un zip ("PK\x03\x04")
 *   que adentro tiene word/document.xml, y TXT/MD tienen que ser UTF-8
 *   válido. Además la extensión del nombre tiene que coincidir.
 * - PDF con `unpdf` (pdf.js para servidores, sin binarios) y DOCX con
 *   `mammoth` (extractRawText).
 * - Se lee hasta MAX_CARACTERES_EXTRAIDOS; lo demás se ignora.
 * Los errores son ErrorDocumento con un mensaje para la persona.
 */

export type TipoArchivo = "pdf" | "docx" | "txt" | "md";

/** Texto que se saca como máximo de un archivo (después se recorta a 300k). */
const MAX_CARACTERES_EXTRAIDOS = 320_000;
/** Un DOCX de 10 MB descomprimido no debería pasar de esto (protege contra "zip bombs"). */
const MAX_DOCX_DESCOMPRIMIDO = 120 * 1024 * 1024;
const MAX_ENTRADAS_ZIP = 5000;

export const TIPO_POR_EXTENSION: Record<string, TipoArchivo> = {
  pdf: "pdf",
  docx: "docx",
  txt: "txt",
  md: "md",
  markdown: "md",
};

export const MIME_POR_TIPO: Record<TipoArchivo, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain; charset=utf-8",
  md: "text/markdown; charset=utf-8",
};

const NO_SOPORTADO = "Ese tipo de archivo no se puede leer. Sube un PDF, un Word (.docx), un TXT o un MD.";

/** "Precios 2026.PDF" → "pdf"; sin extensión conocida → null. */
export function tipoPorExtension(nombre: string): TipoArchivo | null {
  const m = /\.([a-z0-9]{1,10})$/i.exec(nombre.trim());
  return m ? TIPO_POR_EXTENSION[m[1].toLowerCase()] ?? null : null;
}

const empiezaCon = (bytes: Uint8Array, firma: number[], desde = 0) => firma.every((b, i) => bytes[desde + i] === b);

/** ¿Es un PDF? "%PDF-" al inicio (se toleran hasta 1 KB de basura antes, como hacen los lectores). */
export function esPdf(bytes: Uint8Array): boolean {
  const firma = [0x25, 0x50, 0x44, 0x46, 0x2d]; // %PDF-
  const hasta = Math.min(bytes.length - firma.length, 1024);
  for (let i = 0; i <= hasta; i++) if (empiezaCon(bytes, firma, i)) return true;
  return false;
}

type EntradaZip = { nombre: string; descomprimido: number };

/** Lee el índice (central directory) de un zip. null si no es un zip válido. */
export function indiceZip(bytes: Uint8Array): EntradaZip[] | null {
  if (!empiezaCon(bytes, [0x50, 0x4b, 0x03, 0x04])) return null;
  const vista = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  // Fin del índice: firma 0x06054b50, en los últimos 22 + 65535 bytes
  let fin = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 22 - 65535); i--) {
    if (vista.getUint32(i, true) === 0x06054b50) {
      fin = i;
      break;
    }
  }
  if (fin < 0) return null;
  const total = vista.getUint16(fin + 10, true);
  let p = vista.getUint32(fin + 16, true);
  if (total > MAX_ENTRADAS_ZIP || p >= bytes.length) return null;
  const decodificar = new TextDecoder();
  const entradas: EntradaZip[] = [];
  for (let n = 0; n < total; n++) {
    if (p + 46 > bytes.length || vista.getUint32(p, true) !== 0x02014b50) return null;
    const descomprimido = vista.getUint32(p + 24, true);
    const largoNombre = vista.getUint16(p + 28, true);
    const largoExtra = vista.getUint16(p + 30, true);
    const largoComentario = vista.getUint16(p + 32, true);
    if (p + 46 + largoNombre > bytes.length) return null;
    entradas.push({ nombre: decodificar.decode(bytes.subarray(p + 46, p + 46 + largoNombre)), descomprimido });
    p += 46 + largoNombre + largoExtra + largoComentario;
  }
  return entradas;
}

/** ¿Es un DOCX? Un zip con word/document.xml adentro. */
export function esDocx(bytes: Uint8Array): boolean {
  const indice = indiceZip(bytes);
  return !!indice && indice.some((e) => e.nombre === "word/document.xml");
}

/** El texto de un TXT/MD si es UTF-8 válido y no parece binario; si no, null. */
export function textoUtf8(bytes: Uint8Array): string | null {
  try {
    const texto = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return texto.includes("\u0000") ? null : texto;
  } catch {
    return null;
  }
}

/**
 * Revisa que el archivo sea lo que dice su nombre. Regresa su tipo o lanza
 * ErrorDocumento(415) con un mensaje claro.
 */
export function revisarArchivo(nombre: string, bytes: Uint8Array): TipoArchivo {
  const tipo = tipoPorExtension(nombre);
  if (!tipo) throw new ErrorDocumento(NO_SOPORTADO, 415);
  if (!bytes.length) throw new ErrorDocumento("El archivo está vacío.", 400);
  revisarBytes(bytes, tipo);
  return tipo;
}

function revisarBytes(bytes: Uint8Array, tipo: TipoArchivo) {
  const ok =
    tipo === "pdf" ? esPdf(bytes) : tipo === "docx" ? esDocx(bytes) : !esPdf(bytes) && !indiceZip(bytes) && textoUtf8(bytes) !== null;
  if (ok) return;
  const mensajes: Record<TipoArchivo, string> = {
    pdf: "Ese archivo dice ser PDF pero no lo es por dentro. Ábrelo y guárdalo de nuevo como PDF.",
    docx: "Ese archivo dice ser Word (.docx) pero no lo es por dentro. Si es un .doc viejo, guárdalo como .docx.",
    txt: "Ese archivo de texto no se puede leer: guárdalo como texto UTF-8.",
    md: "Ese archivo de texto no se puede leer: guárdalo como texto UTF-8.",
  };
  throw new ErrorDocumento(mensajes[tipo], 415);
}

async function textoDePdf(bytes: Uint8Array): Promise<string> {
  const { getDocumentProxy } = await import("unpdf");
  let pdf: Awaited<ReturnType<typeof getDocumentProxy>>;
  try {
    // Copia: pdf.js puede quedarse con el buffer que recibe
    pdf = await getDocumentProxy(new Uint8Array(bytes));
  } catch (e) {
    const nombre = (e as { name?: string })?.name ?? "";
    if (nombre === "PasswordException") throw new ErrorDocumento("El PDF tiene contraseña. Quítasela y vuelve a subirlo.", 422);
    throw new ErrorDocumento("No pudimos abrir el PDF: parece dañado. Ábrelo y guárdalo de nuevo como PDF.", 422);
  }
  try {
    const paginas: string[] = [];
    let largo = 0;
    for (let i = 1; i <= pdf.numPages && largo < MAX_CARACTERES_EXTRAIDOS; i++) {
      const pagina = await pdf.getPage(i);
      const contenido = await pagina.getTextContent();
      let texto = "";
      for (const item of contenido.items) {
        if (!("str" in item)) continue;
        texto += item.str + (item.hasEOL ? "\n" : "");
      }
      pagina.cleanup();
      paginas.push(texto.trim());
      largo += texto.length;
    }
    return paginas.join("\n\n");
  } catch {
    throw new ErrorDocumento("No pudimos leer el texto del PDF. Ábrelo y guárdalo de nuevo como PDF.", 422);
  } finally {
    await pdf.loadingTask.destroy().catch(() => undefined);
  }
}

async function textoDeDocx(bytes: Uint8Array): Promise<string> {
  const indice = indiceZip(bytes);
  const total = (indice ?? []).reduce((s, e) => s + e.descomprimido, 0);
  if (!indice || indice.some((e) => e.descomprimido === 0xffffffff) || total > MAX_DOCX_DESCOMPRIMIDO) {
    throw new ErrorDocumento("Ese Word es demasiado grande por dentro para leerlo. Divídelo en partes más chicas.", 413);
  }
  const mammoth = await import("mammoth");
  try {
    const { value } = await mammoth.extractRawText({ buffer: Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength) });
    return value;
  } catch {
    throw new ErrorDocumento("No pudimos leer el Word. Ábrelo y guárdalo de nuevo como .docx.", 422);
  }
}

/**
 * Saca el texto de un archivo. Revisa primero que los bytes sean del tipo
 * que se dice. Lanza ErrorDocumento con un mensaje amable si no se puede.
 */
export async function extraerTexto(bytes: Uint8Array, tipo: TipoArchivo): Promise<string> {
  if (!bytes.length) throw new ErrorDocumento("El archivo está vacío.", 400);
  revisarBytes(bytes, tipo);
  const texto =
    tipo === "pdf" ? await textoDePdf(bytes) : tipo === "docx" ? await textoDeDocx(bytes) : (textoUtf8(bytes) ?? "");
  return texto.slice(0, MAX_CARACTERES_EXTRAIDOS);
}
