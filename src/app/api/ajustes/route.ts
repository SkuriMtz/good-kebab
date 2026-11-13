import { NextRequest, NextResponse } from "next/server";
import { limpiarAjustes } from "@/lib/ajustes";
import { limpiarOrganizacion } from "@/lib/organizacion-chats";
import { createClient } from "@/lib/supabase/server";

/**
 * PUT { ajustes } → guarda los ajustes de la cuenta (tabla ajustes_cuenta).
 * Con la sesión de la persona (RLS: solo los suyos). Lo que llega se limpia
 * campo por campo; lo desconocido se ignora.
 */

export const dynamic = "force-dynamic";

const error = (mensaje: string, status: number) => NextResponse.json({ error: mensaje }, { status });

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return error("Tu sesión terminó. Vuelve a entrar.", 401);
  if (Number(request.headers.get("content-length") ?? "0") > 40_000) return error("Los ajustes son demasiado largos.", 413);

  let cuerpo: { ajustes?: unknown };
  try {
    cuerpo = await request.json();
  } catch {
    return error("No pudimos leer los ajustes.", 400);
  }
  const datos = limpiarAjustes(cuerpo?.ajustes);
  // Cómo acomoda sus conversaciones vive en la misma fila (PUT /api/chats/organizacion): se conserva
  const { data: fila } = await supabase.from("ajustes_cuenta").select("datos").eq("owner_id", user.id).maybeSingle();
  const previos = fila?.datos && typeof fila.datos === "object" && !Array.isArray(fila.datos) ? (fila.datos as Record<string, unknown>) : {};
  const conOrganizacion = "organizacion" in previos ? { ...datos, organizacion: limpiarOrganizacion(previos.organizacion) } : datos;
  const { error: e } = await supabase.from("ajustes_cuenta").upsert({ owner_id: user.id, datos: conOrganizacion, actualizado_en: new Date().toISOString() });
  if (e) return error("No se pudieron guardar tus ajustes. Intenta de nuevo.", 500);
  return NextResponse.json({ ajustes: datos }, { headers: { "Cache-Control": "private, no-store" } });
}
