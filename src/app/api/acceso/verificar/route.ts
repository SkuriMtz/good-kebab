import { NextRequest, NextResponse } from "next/server";
import { hashIp, ipDe, pasarLimite, registrarEvento } from "@/lib/seguridad";
import { LIMITES_ACCESO, MENSAJES_ACCESO, respuestaVerificar, validarPeticionVerificar, verificarCodigo, type RespuestaVerificar } from "@/lib/acceso";
import { borrarCookie, clienteDeRuta, COOKIE_ALTA, hashCorreo, leerCuerpoJson, prepararCuenta } from "@/lib/acceso-servidor";

/**
 * POST /api/acceso/verificar — revisa el código de 6 dígitos y abre la sesión.
 *
 * Cuerpo (≤ 1 KB): { correo, codigo }
 * Respuestas:
 *   200 { ok: true, destino: "/panel" }   ← con las cookies de sesión puestas
 *   400 { error, campo }                  ← formato, o "El código no es correcto o ya venció."
 *   413 { error }
 *   429 { error }                         ← 5 intentos por correo cada 15 min, 20 por conexión por hora
 *   503 { error }
 *
 * Al entrar: asegura su fila en negocios y, si la cuenta es nueva y dejó datos
 * del alta desde este navegador, los aplica y registra los consentimientos.
 * Si el límite no se puede revisar (la base no responde), NO deja pasar:
 * aquí se adivinan códigos.
 */

export const dynamic = "force-dynamic";

const responder = (cuerpo: RespuestaVerificar, status = 200) => NextResponse.json(cuerpo, { status });

export async function POST(request: NextRequest) {
  const leido = await leerCuerpoJson(request, LIMITES_ACCESO.cuerpoVerificar);
  if (!leido.ok) return responder({ error: leido.status === 413 ? MENSAJES_ACCESO.grande : MENSAJES_ACCESO.cuerpo }, leido.status);

  const revision = validarPeticionVerificar(leido.cuerpo);
  if (revision.tipo === "error") return responder({ error: revision.error, campo: revision.campo }, 400);
  const { correo, codigo } = revision.valor;

  const ipHash = hashIp(ipDe(request));
  const porIp = await pasarLimite(`codigo:ip:${ipHash}`, 20, 3600, false);
  const porCorreo = porIp && (await pasarLimite(`codigo:correo:${hashCorreo(correo)}`, 5, 900, false));
  if (!porIp || !porCorreo) {
    await registrarEvento("limite_codigo", request, porIp ? "por correo" : "por conexión");
    return responder({ error: MENSAJES_ACCESO.limiteIntentos }, 429);
  }

  const { supabase, ponerCookies } = clienteDeRuta(request);
  const resultado = await verificarCodigo(supabase.auth, { correo, codigo });

  if (resultado.tipo !== "ok") {
    if (resultado.tipo === "invalido") await registrarEvento("codigo_invalido", request);
    else console.error("[api/acceso/verificar] Supabase no revisó el código", { code: resultado.aviso.code, status: resultado.aviso.status });
    const { status, cuerpo } = respuestaVerificar(resultado);
    return responder(cuerpo, status);
  }

  await prepararCuenta({ sesion: supabase, usuario: resultado.usuario, ipHash, cookieAlta: request.cookies.get(COOKIE_ALTA)?.value ?? null });

  const { status, cuerpo } = respuestaVerificar(resultado);
  const res = ponerCookies(responder(cuerpo, status));
  if (request.cookies.has(COOKIE_ALTA)) borrarCookie(res, COOKIE_ALTA);
  return res;
}
