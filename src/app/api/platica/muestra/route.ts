import type { NextRequest } from "next/server";
import { IDIOMAS } from "@/lib/ajustes";
import { esVozDeLista, hablar, vocesDeAtendel, vozDisponible } from "@/lib/elevenlabs";
import { respuestaError } from "@/lib/platica-servidor";
import { pasarLimite } from "@/lib/seguridad";
import { createClient } from "@/lib/supabase/server";
import { codigoIdioma, nombresDeVoces, textoDeMuestra } from "@/lib/voces-atendel";

/*
 * POST /api/platica/muestra { voz, idioma }: la muestra de una de las 4
 * voces de Apariencia («Hola, soy Sofía…», en el idioma del panel).
 * - No cuenta en el límite de uso del dueño (lo paga la cuenta de Atendel).
 * - Solo voces de la lista, y con tope por hora.
 * - Cada muestra se genera una vez y se guarda en memoria (y el navegador la
 *   guarda un día): tocarla otra vez no vuelve a costar.
 */
export const maxDuration = 30;

const guardadas = new Map<string, Uint8Array<ArrayBuffer>>();
const MAX_GUARDADAS = 80;

/** Junta todo el audio (la muestra es corta: unos segundos). */
async function juntar(audio: ReadableStream<Uint8Array>): Promise<Uint8Array<ArrayBuffer>> {
  const buf = await new Response(audio).arrayBuffer();
  return new Uint8Array(buf);
}

const comoAudio = (datos: Uint8Array<ArrayBuffer>) =>
  new Response(datos, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "private, max-age=86400", "X-Content-Type-Options": "nosniff" } });

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return respuestaError("Entra con tu cuenta para usar esto.", 401);
  if (!vozDisponible()) return respuestaError("La voz no está disponible.", 503);

  const crudo = await request.text().catch(() => "");
  if (crudo.length > 500) return respuestaError("Petición inválida.", 400);
  let cuerpo: { voz?: unknown; idioma?: unknown } = {};
  try {
    cuerpo = JSON.parse(crudo) as typeof cuerpo;
  } catch {
    return respuestaError("Petición inválida.", 400);
  }
  const voz = typeof cuerpo.voz === "string" ? cuerpo.voz : "";
  const idioma = IDIOMAS.find((i) => i.id === cuerpo.idioma)?.id ?? "es-MX";
  if (!(await esVozDeLista(voz))) return respuestaError("Esa voz no está en la lista.", 400);

  const clave = `${voz}:${idioma}`;
  const ya = guardadas.get(clave);
  if (ya) return comoAudio(ya);

  if (!(await pasarLimite(`platica-muestra:${user.id}`, 40, 3_600, false))) return respuestaError("Escuchaste muchas muestras. Espera un rato.", 429);

  const lista = await vocesDeAtendel();
  const lugar = "voces" in lista ? (lista.voces.find((v) => v.id === voz)?.lugar ?? 0) : 0;
  const nombre = nombresDeVoces(idioma)[lugar];
  const r = await hablar(textoDeMuestra(idioma, nombre), { voz, idioma: codigoIdioma(idioma) });
  if ("fallo" in r) return respuestaError(`No pude hacer la muestra. (código: ${r.fallo.codigo})`, 502, { codigo: r.fallo.codigo });
  const datos = await juntar(r.audio);
  if (guardadas.size >= MAX_GUARDADAS) guardadas.delete(guardadas.keys().next().value as string);
  guardadas.set(clave, datos);
  return comoAudio(datos);
}
