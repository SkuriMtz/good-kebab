import { NextResponse, type NextRequest } from "next/server";
import { escuchar, vozDisponible } from "@/lib/elevenlabs";
import { costoEscuchar, MAX_AUDIO_BYTES, MIN_AUDIO_BYTES } from "@/lib/platica";
import { anotarVoz, preferenciasDeVoz, puedeUsarVoz, respuestaError } from "@/lib/platica-servidor";
import { createClient } from "@/lib/supabase/server";

/*
 * POST /api/platica/escuchar: lo que el dueño dijo en el modo plática (el
 * audio que grabó su navegador) → texto. El texto regresa al navegador, que lo
 * manda al chat de siempre (con todas sus reglas). El audio no se guarda.
 */
export const maxDuration = 60;

/** Los formatos que graban los navegadores (Chrome/Firefox: webm u ogg; Safari: mp4). */
const TIPOS: Record<string, string> = {
  "audio/webm": "voz.webm",
  "audio/ogg": "voz.ogg",
  "audio/mp4": "voz.mp4",
  "audio/x-m4a": "voz.m4a",
  "audio/aac": "voz.aac",
  "audio/mpeg": "voz.mp3",
  "audio/wav": "voz.wav",
};

/** Lee el cuerpo con tope (sin confiar en el content-length, que puede no venir). null si se pasa. */
async function leerConTope(request: NextRequest, max: number): Promise<Uint8Array<ArrayBuffer> | null> {
  if (!request.body) return new Uint8Array(new ArrayBuffer(0));
  const lector = request.body.getReader();
  const partes: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await lector.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) {
      await lector.cancel().catch(() => undefined);
      return null;
    }
    partes.push(value);
  }
  const todo = new Uint8Array(new ArrayBuffer(total));
  let i = 0;
  for (const p of partes) {
    todo.set(p, i);
    i += p.byteLength;
  }
  return todo;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return respuestaError("Entra con tu cuenta para usar esto.", 401);
  if (!vozDisponible()) return respuestaError("La voz no está disponible ahora.", 503);

  const tipo = (request.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  const nombre = TIPOS[tipo];
  if (!nombre) return respuestaError("Ese audio no se puede escuchar.", 415);
  if (Number(request.headers.get("content-length") ?? "0") > MAX_AUDIO_BYTES) return respuestaError("Fue demasiado largo. Dilo en partes.", 413);

  const bloqueo = await puedeUsarVoz(supabase, user.id, "escuchar");
  if (bloqueo) return bloqueo;

  const audio = await leerConTope(request, MAX_AUDIO_BYTES).catch(() => null);
  if (!audio) return respuestaError("Fue demasiado largo. Dilo en partes.", 413);
  if (audio.byteLength < MIN_AUDIO_BYTES) return NextResponse.json({ texto: "" }, { headers: { "Cache-Control": "no-store" } });

  const { codigo } = await preferenciasDeVoz(supabase, user.id);
  const r = await escuchar(new Blob([audio], { type: tipo }), nombre, codigo);
  if (!r) return respuestaError("No te pude escuchar en este momento. Intenta otra vez.", 502);
  await anotarVoz(supabase, costoEscuchar(r.segundos), "escuchar");
  return NextResponse.json({ texto: r.texto.slice(0, 4000) }, { headers: { "Cache-Control": "no-store" } });
}
