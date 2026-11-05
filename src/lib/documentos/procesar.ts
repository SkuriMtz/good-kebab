import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cargarCuenta } from "@/lib/cuenta";
import { MAX_DOCUMENTOS_POR_PLAN, type Documento, type TipoDocumento } from "@/lib/nucleo-tipos";
import { normalizarTexto, trocear } from "./trocear";

/**
 * PROCESAR DOCUMENTOS: texto → fragmentos → base de datos
 *
 * Lo usan la API de documentos (archivos y links) y las integraciones
 * (Drive y Notion) para guardar un documento con su texto ya extraído:
 *
 *   const doc = await guardarDocumentoDesdeTexto(supabase, user.id, { nombre, tipo: "drive", url, texto });
 *
 * - Siempre con el cliente con sesión de la persona: RLS decide qué puede
 *   tocar y el `owner_id` es siempre el suyo. Nunca la service role.
 * - Revisa el límite de documentos de su plan (MAX_DOCUMENTOS_POR_PLAN);
 *   la base de datos lo vuelve a revisar con un trigger.
 * - Si algo falla después de crear el documento, queda con estado "error"
 *   y un mensaje amable (la persona lo ve en la lista y puede borrarlo).
 * - Si el límite se alcanzó o la base de datos no está lista, lanza
 *   ErrorDocumento (con `status` para la respuesta HTTP) y no crea nada.
 */

/** Tope de texto que se guarda por documento. */
export const MAX_CARACTERES_DOCUMENTO = 300_000;
const LOTE_FRAGMENTOS = 100;
/** Columnas que forman un `Documento` del contrato. */
export const COLUMNAS_DOCUMENTO = "id, nombre, tipo, estado, error, caracteres, url, creado_en";
const MAX_NOMBRE = 200;
const MAX_ERROR = 500;

export const MENSAJES = {
  sinTexto:
    "No encontramos texto en este documento. Si es un escaneo o una foto, por ahora no se puede leer: sube una versión con texto (PDF de texto, Word o TXT).",
  guardar: "No pudimos guardar el texto del documento. Bórralo y vuelve a subirlo en un momento.",
  baseDeDatos: "La sección de documentos todavía no está lista en la base de datos (falta la migración 0006). Avísale a quien administra Atendel.",
} as const;

export class ErrorDocumento extends Error {
  status: number;
  constructor(mensaje: string, status = 400) {
    super(mensaje);
    this.name = "ErrorDocumento";
    this.status = status;
  }
}

type ErrorSupabase = { code?: string; message?: string } | null | undefined;

/** ¿Falta la tabla o la función (la migración 0006 no se ha corrido)? */
export function faltaMigracion(error: ErrorSupabase) {
  return !!error && ["42P01", "PGRST205", "42883", "PGRST202"].includes(error.code ?? "");
}

/** ¿El trigger de la base de datos dijo que se llegó al límite del plan? */
function esLimite(error: ErrorSupabase) {
  return !!error && error.code === "P0001" && /l[ií]mite/i.test(error.message ?? "");
}

/** Un nombre que se puede mostrar: una línea, sin caracteres raros y con tope. */
export function nombreSeguro(nombre: string | null | undefined, respaldo = "Documento"): string {
  const limpio = normalizarTexto(nombre ?? "").replace(/\s+/g, " ").trim();
  const final = limpio || respaldo;
  return final.length > MAX_NOMBRE ? `${final.slice(0, MAX_NOMBRE - 1)}…` : final;
}

const mensajeCorto = (mensaje: string) => (mensaje.length > MAX_ERROR ? `${mensaje.slice(0, MAX_ERROR - 1)}…` : mensaje);

/**
 * Revisa que la persona todavía pueda agregar documentos según su plan.
 * Lanza ErrorDocumento(403) si ya llegó al límite.
 */
export async function revisarLimiteDocumentos(supabase: SupabaseClient, userId: string): Promise<void> {
  const [cuenta, { count, error }] = await Promise.all([
    cargarCuenta(supabase, userId),
    supabase.from("documentos").select("id", { count: "exact", head: true }).eq("owner_id", userId),
  ]);
  if (faltaMigracion(error)) throw new ErrorDocumento(MENSAJES.baseDeDatos, 503);
  if (error) throw new ErrorDocumento("No pudimos revisar tus documentos. Intenta de nuevo.", 500);
  const maximo = MAX_DOCUMENTOS_POR_PLAN[cuenta.plan.id];
  if ((count ?? 0) >= maximo) {
    throw new ErrorDocumento(
      `Llegaste al límite de ${maximo} documentos de ${cuenta.plan.nombre}. Borra alguno para agregar otro.`,
      403,
    );
  }
}

/**
 * Crea el documento con estado "procesando". `id` y `ruta` se pasan cuando
 * hay archivo en Storage (la ruta es `{userId}/{id}.{ext}`).
 */
export async function crearDocumento(
  supabase: SupabaseClient,
  userId: string,
  datos: { id?: string; nombre: string; tipo: TipoDocumento; url?: string | null; ruta?: string | null },
): Promise<Documento> {
  const { data, error } = await supabase
    .from("documentos")
    .insert({
      ...(datos.id ? { id: datos.id } : {}),
      owner_id: userId,
      nombre: nombreSeguro(datos.nombre),
      tipo: datos.tipo,
      estado: "procesando",
      url: datos.url ?? null,
      ruta: datos.ruta ?? null,
    })
    .select(COLUMNAS_DOCUMENTO)
    .single();
  if (faltaMigracion(error)) throw new ErrorDocumento(MENSAJES.baseDeDatos, 503);
  if (esLimite(error)) throw new ErrorDocumento(error?.message ?? "Llegaste al límite de documentos de tu plan.", 403);
  if (error?.code === "23505") throw new ErrorDocumento("Ese archivo ya está en tus documentos.", 409);
  if (error || !data) throw new ErrorDocumento("No pudimos guardar el documento. Intenta de nuevo.", 500);
  return data as Documento;
}

/** Deja el documento en estado "error" con un mensaje para la persona. */
export async function marcarError(supabase: SupabaseClient, documentoId: string, mensaje: string): Promise<Documento | null> {
  const { data } = await supabase
    .from("documentos")
    .update({ estado: "error", error: mensajeCorto(mensaje), caracteres: 0 })
    .eq("id", documentoId)
    .select(COLUMNAS_DOCUMENTO)
    .maybeSingle();
  return (data as Documento | null) ?? null;
}

/**
 * Trocea el texto y guarda los fragmentos del documento (reemplaza los que
 * tuviera). Al final el documento queda "listo" con sus caracteres, o en
 * "error" con un mensaje amable. Nunca lanza: siempre regresa el documento.
 */
export async function indexarTexto(
  supabase: SupabaseClient,
  userId: string,
  documentoId: string,
  texto: string,
): Promise<Documento> {
  const respaldo = async (mensaje: string): Promise<Documento> => {
    const doc = await marcarError(supabase, documentoId, mensaje);
    if (doc) return doc;
    throw new ErrorDocumento(mensaje, 500);
  };

  const limpio = normalizarTexto(texto).slice(0, MAX_CARACTERES_DOCUMENTO).trim();
  if (!limpio) return respaldo(MENSAJES.sinTexto);
  const fragmentos = trocear(limpio);
  if (!fragmentos.length) return respaldo(MENSAJES.sinTexto);

  // Si se vuelve a procesar, se reemplazan los fragmentos anteriores
  const { error: errBorrar } = await supabase.from("fragmentos_doc").delete().eq("documento_id", documentoId);
  if (errBorrar) return respaldo(MENSAJES.guardar);

  for (let i = 0; i < fragmentos.length; i += LOTE_FRAGMENTOS) {
    const filas = fragmentos.slice(i, i + LOTE_FRAGMENTOS).map((t, j) => ({
      documento_id: documentoId,
      owner_id: userId,
      orden: i + j,
      texto: t,
    }));
    const { error } = await supabase.from("fragmentos_doc").insert(filas);
    if (error) {
      await supabase.from("fragmentos_doc").delete().eq("documento_id", documentoId);
      return respaldo(MENSAJES.guardar);
    }
  }

  const { data, error } = await supabase
    .from("documentos")
    .update({ estado: "listo", error: null, caracteres: limpio.length })
    .eq("id", documentoId)
    .select(COLUMNAS_DOCUMENTO)
    .single();
  if (error || !data) return respaldo(MENSAJES.guardar);
  return data as Documento;
}

/**
 * Guarda un documento a partir de su texto: revisa el límite del plan, lo
 * crea, lo trocea y guarda los fragmentos. Para Drive, Notion y links.
 * Lanza ErrorDocumento si no se pudo ni crear (límite, base de datos);
 * si falla después, regresa el documento con estado "error".
 */
export async function guardarDocumentoDesdeTexto(
  supabase: SupabaseClient,
  userId: string,
  datos: { nombre: string; tipo: TipoDocumento; url?: string | null; texto: string },
): Promise<Documento> {
  await revisarLimiteDocumentos(supabase, userId);
  const doc = await crearDocumento(supabase, userId, { nombre: datos.nombre, tipo: datos.tipo, url: datos.url ?? null });
  return indexarTexto(supabase, userId, doc.id, datos.texto);
}
