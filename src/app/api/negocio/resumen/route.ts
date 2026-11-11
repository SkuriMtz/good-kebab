import { NextRequest, NextResponse } from "next/server";
import { cargarCuenta } from "@/lib/cuenta";
import { periodoDe } from "@/lib/estadisticas";
import { cargarNegocio } from "@/lib/estadisticas-negocio";
import { resumirNegocio } from "@/lib/resumen-negocio";
import { createClient } from "@/lib/supabase/server";

/**
 * RESUMEN DEL NEGOCIO para el panel de información (la columna de la derecha del chat).
 *
 * GET ?periodo=7d|30d|mes → ResumenInfo: las mismas cifras que Estadísticas, recortadas
 * (sin la lista de clientes). Con la sesión de la persona: RLS solo deja leer lo suyo.
 */

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  try {
    const periodo = periodoDe(req.nextUrl.searchParams.get("periodo") ?? undefined);
    const datos = await cargarNegocio(supabase, user.id, periodo, cargarCuenta(supabase, user.id));
    return NextResponse.json(resumirNegocio(datos), { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "No se pudieron leer tus números." }, { status: 500 });
  }
}
