import { NextResponse } from "next/server";
import { DATOS_LEGALES } from "@/lib/legal";
import { LIMITES_ACCESO, MENSAJES_ACCESO, type RespuestaAcepto } from "@/lib/acceso";
import { COOKIE_ACEPTA, leerCuerpoJson, opcionesCookie, SEGUNDOS_ACEPTA } from "@/lib/acceso-servidor";

/**
 * POST /api/acceso/acepto — antes del alta con Google.
 *
 * Cuerpo: { acepta: true } (acepta Términos y Aviso de privacidad y declara
 * ser mayor de 18). Pone la cookie atendel_acepta (solo la lee el servidor,
 * 30 min) con la versión de los textos. /auth/callback la lee: si la cuenta
 * es nueva, registra los consentimientos y la borra.
 * Respuestas: 200 { ok: true } · 400 { error, campo: "acepta" } · 413 { error }
 */

export const dynamic = "force-dynamic";

const responder = (cuerpo: RespuestaAcepto, status = 200) => NextResponse.json(cuerpo, { status });

export async function POST(request: Request) {
  const leido = await leerCuerpoJson(request, LIMITES_ACCESO.cuerpoAcepto);
  if (!leido.ok) return responder({ error: leido.status === 413 ? MENSAJES_ACCESO.grande : MENSAJES_ACCESO.cuerpo }, leido.status);
  if (leido.cuerpo.acepta !== true) return responder({ error: MENSAJES_ACCESO.acepta, campo: "acepta" }, 400);

  const res = responder({ ok: true });
  res.cookies.set(COOKIE_ACEPTA, DATOS_LEGALES.actualizado, opcionesCookie(SEGUNDOS_ACEPTA));
  return res;
}
