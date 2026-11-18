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

  const audio = await hablar(texto, antes || undefined);
  if (!audio) return respuestaError("No pude hablar en este momento.", 502);
  await anotarVoz(supabase, costoHablar(texto), "hablar");
  return new Response(audio, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}
