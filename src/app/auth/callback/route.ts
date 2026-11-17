import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hashIp, ipDe } from "@/lib/seguridad";
import { borrarCookie, COOKIE_ACEPTA, COOKIE_ALTA, prepararCuenta } from "@/lib/acceso-servidor";

/**
 * Callback de autenticación (Google o el enlace del correo). Después de que
 * el usuario inicia sesión, Supabase lo redirige aquí con un "code" que se
 * intercambia por su sesión real.
 *
 * Luego prepararCuenta(): asegura su fila en negocios (con "Mi negocio", ya no
 * con el correo) y, si la cuenta es nueva:
 * - alta con Google: si trae la cookie atendel_acepta (/api/acceso/acepto),
 *   registra los consentimientos;
 * - alta con el enlace del correo: si este navegador dejó datos del alta
 *   (cookie atendel_alta), los aplica igual que /api/acceso/verificar.
 * Las dos cookies se borran al terminar.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      await prepararCuenta({
        sesion: supabase,
        usuario: data.user,
        ipHash: hashIp(ipDe(request)),
        cookieAlta: request.cookies.get(COOKIE_ALTA)?.value ?? null,
        cookieAcepta: request.cookies.get(COOKIE_ACEPTA)?.value ?? null,
      });

      const res = NextResponse.redirect(`${origin}/panel/chat`);
      if (request.cookies.has(COOKIE_ACEPTA)) borrarCookie(res, COOKIE_ACEPTA);
      if (request.cookies.has(COOKIE_ALTA)) borrarCookie(res, COOKIE_ALTA);
      return res;
    }
  }

  // Si algo falló (link vencido, abierto en otro navegador, etc.)
  return NextResponse.redirect(`${origin}/entrar?error=login`);
}
