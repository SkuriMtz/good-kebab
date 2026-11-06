import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { estadoApps, leerIntereses } from "@/lib/conexiones/estado";
import { conexionesVigentes } from "@/lib/conexiones/tokens";

/**
 * GET /api/apps → EstadoAppPersona[]
 *
 * Una fila por app del catálogo con su estado real para la persona:
 * conectada (con su cuenta), desconectada, sin_configurar (con los nombres de
 * las variables que faltan en Vercel), en_camino (con su "Avísame") o error.
 * Nunca lleva tokens: lo que se responde sale solo de columnas públicas (el
 * token se descifra en el servidor solo para ver si una conexión sin
 * renovación ya venció).
 */

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Tu sesión terminó. Vuelve a entrar." }, { status: 401 });

  // Las vencidas sin renovación (p. ej. Meta, ~60 días) salen como error
  const [conexiones, intereses] = await Promise.all([conexionesVigentes(supabase, user.id), leerIntereses(supabase, user.id)]);
  return NextResponse.json(estadoApps(conexiones, intereses), { headers: { "Cache-Control": "no-store" } });
}
