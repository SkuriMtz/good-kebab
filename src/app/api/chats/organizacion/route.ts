import { NextRequest, NextResponse } from "next/server";
import { limpiarOrganizacion } from "@/lib/organizacion-chats";
import { createClient } from "@/lib/supabase/server";

/**
 * PUT { organizacion } → guarda cómo acomoda sus conversaciones en el menú
 * (fijadas, archivadas y sus grupos) dentro de ajustes_cuenta.datos, sin
 * tocar los demás ajustes. Con la sesión de la persona (RLS: solo lo suyo);
 * lo que llega se limpia (ids sencillos, hasta 30 grupos de 40 letras).
 */

export const dynamic = "force-dynamic";

const error = (mensaje: string, status: number) => NextResponse.json({ error: mensaje }, { status });

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return error("Tu sesión terminó. Vuelve a entrar.", 401);
  if (Number(request.headers.get("content-length") ?? "0") > 60_000) return error("Es demasiado para guardar.", 413);

  let cuerpo: { organizacion?: unknown };
  try {
    cuerpo = await request.json();
  } catch {
    return error("No pudimos leer los cambios.", 400);
  }
  const organizacion = limpiarOrganizacion(cuerpo?.organizacion);
  const { data: fila } = await supabase.from("ajustes_cuenta").select("datos").eq("owner_id", user.id).maybeSingle();
  const previos = fila?.datos && typeof fila.datos === "object" && !Array.isArray(fila.datos) ? (fila.datos as Record<string, unknown>) : {};
  const { error: e } = await supabase.from("ajustes_cuenta").upsert({ owner_id: user.id, datos: { ...previos, organizacion }, actualizado_en: new Date().toISOString() });
  if (e) return error("No se pudo guardar. Intenta de nuevo.", 500);
  return NextResponse.json({ organizacion }, { headers: { "Cache-Control": "private, no-store" } });
}
