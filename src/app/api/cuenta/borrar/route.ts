import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { clienteServicio } from "@/lib/supabase/servicio";
import { pasarLimite, registrarEvento } from "@/lib/seguridad";
import { borrarCarpetaStorage, confirmacionValida } from "@/lib/cuenta-borrar";

/**
 * POST {confirmacion: "BORRAR"} → borra tu cuenta y todo lo tuyo.
 * 1) Los archivos de Storage (no se borran solos), 2) el usuario: sus filas
 * se van por cascada (owner_id → auth.users ON DELETE CASCADE).
 * Primero Storage; solo si salió bien se borra el usuario, para no dejar la
 * cuenta a medias. Si algo falla se puede volver a intentar.
 */

export const dynamic = "force-dynamic";

const BUCKETS = ["documentos", "archivos"] as const;
const error = (mensaje: string, status: number) => NextResponse.json({ error: mensaje }, { status, headers: { "Cache-Control": "private, no-store" } });

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return error("Tu sesión terminó. Vuelve a entrar.", 401);

  if (Number(request.headers.get("content-length") ?? "0") > 1024) return error("La petición es demasiado grande.", 413);
  let texto = "";
  try {
    texto = await request.text();
  } catch {
    return error("No pudimos leer la petición.", 400);
  }
  if (texto.length > 1024) return error("La petición es demasiado grande.", 413);
  let cuerpo: unknown = null;
  try {
    cuerpo = JSON.parse(texto);
  } catch {
    /* queda null */
  }
  if (!confirmacionValida(cuerpo)) return error("Escribe BORRAR para confirmar.", 400);

  if (!(await pasarLimite(`borrar_cuenta:${user.id}`, 3, 3600, false))) return error("Ya lo intentaste varias veces. Espera un rato e inténtalo de nuevo.", 429);

  const admin = clienteServicio();
  if (!admin) return error("Ahora no podemos borrar la cuenta. Intenta más tarde.", 503);

  try {
    for (const bucket of BUCKETS) await borrarCarpetaStorage(admin.storage.from(bucket), user.id);
  } catch (e) {
    console.error("[cuenta/borrar] storage", { message: e instanceof Error ? e.message : "error" });
    return error("No pudimos borrar tus archivos, así que no borramos tu cuenta. Intenta de nuevo.", 500);
  }

  const { error: errUsuario } = await admin.auth.admin.deleteUser(user.id);
  if (errUsuario) {
    console.error("[cuenta/borrar] usuario", { code: errUsuario.code, message: errUsuario.message });
    return error("No pudimos terminar de borrar tu cuenta. Intenta de nuevo.", 500);
  }

  await registrarEvento("cuenta_borrada", request);
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } });
}
