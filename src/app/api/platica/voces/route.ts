import { NextResponse } from "next/server";
import { vocesDeAtendel, vozDisponible } from "@/lib/elevenlabs";
import { respuestaError } from "@/lib/platica-servidor";
import { createClient } from "@/lib/supabase/server";

/*
 * GET /api/platica/voces: las 4 voces para escoger en Apariencia (su id, si
 * es de mujer u hombre y su lugar; el nombre lo pone el navegador según el
 * idioma). Sin la clave de ElevenLabs: 503 (la opción no se muestra).
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return respuestaError("Entra con tu cuenta para usar esto.", 401);
  if (!vozDisponible()) return respuestaError("La voz no está disponible.", 503);
  const r = await vocesDeAtendel();
  if ("fallo" in r) {
    const { status, codigo } = r.fallo;
    const porQue = status === 401 ? "Tu clave de ElevenLabs no tiene permiso para ver las voces (Voices: Read)." : "No pude traer las voces ahora.";
    return respuestaError(`${porQue} (código: ${codigo})`, 502, { codigo });
  }
  return NextResponse.json({ voces: r.voces }, { headers: { "Cache-Control": "private, max-age=600" } });
}
