import type { NextRequest } from "next/server";
import { hablar, vozDisponible } from "@/lib/elevenlabs";
import { costoHablar, MAX_FRASE, textoParaVoz } from "@/lib/platica";
import { anotarVoz, puedeUsarVoz, respuestaError } from "@/lib/platica-servidor";
import { createClient } from "@/lib/supabase/server";

/*
 * POST /api/platica/hablar { texto, antes? }: dice una frase de la respuesta
 * de Atendel con la voz natural y regresa el audio (MP3) mientras se genera.
 * Cada frase cuesta según sus letras y se suma al uso del chat.
 */
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return respuestaError("Entra con tu cuenta para usar esto.", 401);
  if (!vozDisponible()) return respuestaError("La voz no está disponible ahora.", 503);

  // El cuerpo es chico: se lee con tope
  const crudo = await request.text().catch(() => "");
  if (crudo.length > 4_000) return respuestaError("Es demasiado texto para decirlo de una vez.", 413);
  let cuerpo: { texto?: unknown; antes?: unknown } = {};
  try {
    cuerpo = JSON.parse(crudo) as typeof cuerpo;
  } catch {
    return respuestaError("Petición inválida.", 400);
  }
  const texto = typeof cuerpo.texto === "string" ? textoParaVoz(cuerpo.texto).replace(/\n/g, " ").trim() : "";
  if (!texto) return respuestaError("No hay nada que decir.", 400);
  if (texto.length > MAX_FRASE) return respuestaError("Es demasiado texto para decirlo de una vez.", 413);
  const antes = typeof cuerpo.antes === "string" ? textoParaVoz(cuerpo.antes).slice(-300) : "";

  const bloqueo = await puedeUsarVoz(supabase, user.id, "hablar");
  if (bloqueo) return bloqueo;

  const r = await hablar(texto, antes || undefined);
  if ("fallo" in r) {
    // Solo el código corto (p. ej. «quota_exceeded»): sirve para saber qué arreglar en ElevenLabs
    const { status, codigo } = r.fallo;
    const porQue =
      status === 401 && /quota|credit/i.test(codigo)
        ? "Se acabaron los créditos de tu cuenta de ElevenLabs."
        : status === 401
          ? "ElevenLabs no aceptó la clave (revisa ELEVENLABS_API_KEY y sus permisos)."
          : status === 402
            ? "Tu plan de ElevenLabs no permite esto."
            : "No pude hablar en este momento.";
    return respuestaError(`${porQue} (código: ${codigo})`, 502, { codigo });
  }
  await anotarVoz(supabase, costoHablar(texto), "hablar");
  return new Response(r.audio, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}
