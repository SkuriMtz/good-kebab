import { NextResponse, type NextRequest } from "next/server";
import type { Documento } from "@/lib/nucleo-tipos";
import { ErrorArgs } from "@/lib/conexiones/http";
import { leerArchivoDrive } from "@/lib/conexiones/proveedores/google";
import { cuerpoJson, errorJson, preparar } from "@/lib/conexiones/rutas";
import { appsDeFila, ErrorConexion, leerFila, obtenerToken } from "@/lib/conexiones/tokens";
import { ErrorDocumento, guardarDocumentoDesdeTexto } from "@/lib/documentos/procesar";

/**
 * POST /api/conexiones/google/picker  {archivos: [{id, nombre, mime}]} → Documento[]
 *
 * Los archivos que la persona eligió en el Google Picker se descargan con su
 * token (los Docs, Hojas y Presentaciones se exportan a texto; PDF, Word y
 * texto se descargan y se extraen) y se vuelven Documentos del negocio con
 * guardarDocumentoDesdeTexto (respeta el límite del plan).
 * Con el permiso drive.file, Google solo deja abrir lo que se eligió en el
 * Picker. Si alguno falla, la cabecera X-Archivos-Fallidos dice cuántos.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_ARCHIVOS = 10;
const ID = /^[A-Za-z0-9_-]{10,200}$/;

export async function POST(request: NextRequest, { params }: { params: { proveedor: string } }) {
  if (params.proveedor !== "google") return errorJson("No existe.", 404);
  const r = await preparar(params);
  if ("fallo" in r) return r.fallo;
  const { supabase, user } = r;
  const cuerpo = await cuerpoJson(request);
  const lista = Array.isArray(cuerpo?.archivos) ? (cuerpo.archivos as unknown[]) : null;
  if (!lista || !lista.length) return errorJson("Elige al menos un archivo.", 400);
  if (lista.length > MAX_ARCHIVOS) return errorJson(`Elige máximo ${MAX_ARCHIVOS} archivos a la vez.`, 400);
  const archivos = lista.map((a) => (a && typeof a === "object" ? (a as { id?: unknown }).id : null));
  if (!archivos.every((id): id is string => typeof id === "string" && ID.test(id))) return errorJson("Algún archivo no es válido.", 400);

  const fila = await leerFila(supabase, user.id, "google").catch(() => null);
  if (!fila || !appsDeFila(fila).includes("google_drive")) return errorJson("Conecta Google Drive primero en Tu negocio → Apps.", 400);
  let token: string;
  try {
    token = (await obtenerToken(supabase, user.id, "google")).access_token;
  } catch (e) {
    return errorJson(e instanceof ErrorConexion ? e.message : "No se pudo usar tu conexión con Google.", e instanceof ErrorConexion && e.codigo === "temporal" ? 502 : 401);
  }

  const docs: Documento[] = [];
  let fallidos = 0;
  let primerError: string | null = null;
  for (const id of Array.from(new Set(archivos))) {
    try {
      const a = await leerArchivoDrive(id, token, AbortSignal.timeout(20_000));
      docs.push(await guardarDocumentoDesdeTexto(supabase, user.id, { nombre: a.nombre, tipo: "drive", url: a.url, texto: a.texto }));
    } catch (e) {
      // El límite del plan o la base de datos: ya no tiene caso seguir
      if (e instanceof ErrorDocumento) {
        if (!docs.length) return errorJson(e.message, e.status);
        fallidos += 1;
        break;
      }
      fallidos += 1;
      primerError ??= e instanceof ErrorArgs ? e.message : "No se pudo leer uno de los archivos de Drive.";
    }
  }
  if (!docs.length) return errorJson(primerError ?? "No se pudo leer ningún archivo de Drive.", 422);
  return NextResponse.json(docs, { headers: { "Cache-Control": "no-store", "X-Archivos-Fallidos": String(fallidos) } });
}
