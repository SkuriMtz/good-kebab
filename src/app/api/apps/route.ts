import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { estadoApps, leerConexionesPublicas, leerIntereses } from "@/lib/conexiones/estado";

/**
 * GET /api/apps → EstadoAppPersona[]
 *
 * Una fila por app del catálogo con su estado real para la persona:
 * conectada (con su cuenta), desconectada, sin_configurar (con los nombres de
 * las variables que faltan en Vercel), en_camino (con su "Avísame") o error.
 * Nunca lleva tokens: de `conexiones` solo se leen columnas públicas.
 */

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Tu sesión terminó. Vuelve a entrar." }, { status: 401 });

  const [conexiones, intereses] = await Promise.all([leerConexionesPublicas(supabase, user.id), leerIntereses(supabase, user.id)]);
  return NextResponse.json(estadoApps(conexiones, intereses), { headers: { "Cache-Control": "no-store" } });
}
