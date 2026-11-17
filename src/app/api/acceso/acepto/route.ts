import { NextResponse } from "next/server";
import { hoyEnMexico, LIMITES_ACCESO, MENSAJES_ACCESO, validarAlta, type RespuestaAcepto } from "@/lib/acceso";
import { COOKIE_ACEPTA, leerCuerpoJson, opcionesCookie, SEGUNDOS_ACEPTA, valorAceptaGoogle } from "@/lib/acceso-servidor";

/**
 * POST /api/acceso/acepto — antes del alta con Google.
 *
 * Cuerpo: { acepta: true, datos } (acepta Términos y Aviso de privacidad y
 * declara ser mayor de 18; los datos del alta son obligatorios menos el
 * resumen). Pone la cookie atendel_acepta (solo la lee el servidor, 30 min)
 * con la versión de los textos y los datos, cifrados. /auth/callback la lee: si la cuenta
 * es nueva, registra los consentimientos y la borra.
 * Respuestas: 200 { ok: true } · 400 { error, campo } · 413 { error }
 */

export const dynamic = "force-dynamic";

const responder = (cuerpo: RespuestaAcepto, status = 200) => NextResponse.json(cuerpo, { status });

export async function POST(request: Request) {
  const leido = await leerCuerpoJson(request, LIMITES_ACCESO.cuerpoAcepto);
  if (!leido.ok) return responder({ error: leido.status === 413 ? MENSAJES_ACCESO.grande : MENSAJES_ACCESO.cuerpo }, leido.status);
  if (leido.cuerpo.acepta !== true) return responder({ error: MENSAJES_ACCESO.acepta, campo: "acepta" }, 400);

  const alta = validarAlta(leido.cuerpo.datos, hoyEnMexico(new Date()), true);
  if (!alta.ok) return responder({ error: alta.error, campo: alta.campo }, 400);

  const res = responder({ ok: true });
  res.cookies.set(COOKIE_ACEPTA, valorAceptaGoogle(alta.valor), opcionesCookie(SEGUNDOS_ACEPTA));
  return res;
}
