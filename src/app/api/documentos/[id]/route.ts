import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { faltaMigracion, MENSAJES } from "@/lib/documentos/procesar";

/**
 * BORRAR UN DOCUMENTO
 *
 * DELETE /api/documentos/{id} → { ok: true }
 * Borra el archivo de Storage (si lo hay) y luego el documento; sus
 * fragmentos se borran solos (on delete cascade). Con la sesión de la
 * persona: RLS solo deja borrar lo suyo.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const error = (mensaje: string, status: number) => NextResponse.json({ error: mensaje }, { status });

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return error("Tu sesión terminó. Vuelve a entrar.", 401);
  if (!UUID.test(params.id)) return error("Ese documento no existe.", 404);

  const { data: doc, error: errLeer } = await supabase
    .from("documentos")
    .select("id, ruta")
    .eq("id", params.id)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (faltaMigracion(errLeer)) return error(MENSAJES.baseDeDatos, 503);
  if (errLeer) return error("No pudimos borrar el documento. Intenta de nuevo.", 500);
  if (!doc) return error("Ese documento no existe.", 404);

  // Primero el archivo: si falla, el documento se queda para poder reintentar
  if (doc.ruta) {
    const { error: errArchivo } = await supabase.storage.from("documentos").remove([doc.ruta as string]);
    if (errArchivo) return error("No pudimos borrar el archivo. Intenta de nuevo.", 502);
  }
  const { error: errBorrar } = await supabase.from("documentos").delete().eq("id", doc.id).eq("owner_id", user.id);
  if (errBorrar) return error("No pudimos borrar el documento. Intenta de nuevo.", 500);
  return NextResponse.json({ ok: true });
}
