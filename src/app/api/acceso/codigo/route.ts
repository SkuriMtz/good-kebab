import { NextRequest, NextResponse, after } from "next/server";
import { hashIp, ipDe, pasarLimite, registrarEvento } from "@/lib/seguridad";
import { origenPermitido } from "@/lib/conexiones/oauth";
import { SITIO } from "@/lib/sitio";
import { hoyEnMexico, LIMITES_ACCESO, MENSAJES_ACCESO, pedirCodigo, validarPeticionCodigo, type RespuestaCodigo } from "@/lib/acceso";
import {
  clienteDeRuta,
  COOKIE_ALTA,
  esperarMinimo,
  guardarAltaPendiente,
  hashCorreo,
  leerCuerpoJson,
  nuevoSecretoAlta,
  opcionesCookie,
  SEGUNDOS_ALTA,
  verificarTurnstile,
} from "@/lib/acceso-servidor";

/**
 * POST /api/acceso/codigo — manda el código de 6 dígitos al correo.
 *
 * Cuerpo (≤ 4 KB): { correo, modo: "entrar" | "crear", datos?, acepta?, sitio_web?, turnstile? }
 * Respuestas:
 *   200 { ok: true }              ← SIEMPRE la misma, exista o no la cuenta
 *   400 { error, campo }          ← algo del formulario no sirve
 *   413 { error }                 ← cuerpo demasiado grande
 *   429 { error }                 ← demasiados intentos (10/h por conexión, 5/h por correo)
 *   503 { error }                 ← el servicio no respondió (mensaje genérico)
 *
 * Orden: límite por conexión → campo trampa → validar → Turnstile (si hay
 * TURNSTILE_SECRET) → límite por correo → guardar el alta pendiente ("crear")
 * → pedir el código a Supabase. El límite por correo va DESPUÉS de Turnstile
 * para que un bot no pueda gastar los intentos de otra persona.
 *
 * Contra la enumeración de cuentas: si Supabase dice que el correo no tiene
 * cuenta (o que ya pidió un código hace poco), se responde igual que si todo
 * saliera bien, y toda respuesta de éxito tarda al menos ~1.2 s, para que el
 * tiempo tampoco delate si la cuenta existe.
 */

export const dynamic = "force-dynamic";

/** Lo mínimo que tarda una respuesta de éxito (más 0–300 ms al azar). */
const MINIMO_MS = 1200;

const responder = (cuerpo: RespuestaCodigo, status = 200) => NextResponse.json(cuerpo, { status });

export async function POST(request: NextRequest) {
  const inicio = Date.now();

  const leido = await leerCuerpoJson(request, LIMITES_ACCESO.cuerpoCodigo);
  if (!leido.ok) return responder({ error: leido.status === 413 ? MENSAJES_ACCESO.grande : MENSAJES_ACCESO.cuerpo }, leido.status);

  // 1. Por conexión: 10 por hora
  const ip = ipDe(request);
  const ipHash = hashIp(ip);
  if (!(await pasarLimite(`acceso:ip:${ipHash}`, 10, 3600, true))) {
    await registrarEvento("limite_acceso", request, "por conexión");
    return responder({ error: MENSAJES_ACCESO.limiteCodigo }, 429);
  }

  // 2. Campo trampa y validación (las mismas reglas que el formulario)
  const revision = validarPeticionCodigo(leido.cuerpo, hoyEnMexico());
  if (revision.tipo === "trampa") {
    after(() => registrarEvento("trampa_acceso", request));
    await esperarMinimo(inicio, MINIMO_MS);
    return responder({ ok: true });
  }
  if (revision.tipo === "error") return responder({ error: revision.error, campo: revision.campo }, 400);
  const { correo, modo, datos, turnstile } = revision.valor;

  // 3. ¿Es una persona? (solo si Turnstile está configurado)
  const secretoTurnstile = (process.env.TURNSTILE_SECRET ?? "").trim();
  if (secretoTurnstile) {
    const r = await verificarTurnstile(secretoTurnstile, turnstile, ip);
    if (r === "falla") {
      console.error("[api/acceso/codigo] Turnstile no respondió", { code: "turnstile_falla" });
      return responder({ error: MENSAJES_ACCESO.servicio }, 503);
    }
    if (r === "no") {
      await registrarEvento("turnstile_fallido", request);
      return responder({ error: MENSAJES_ACCESO.turnstile, campo: "turnstile" }, 400);
    }
  }

  // 4. Por correo (en hash): 5 por hora
  if (!(await pasarLimite(`acceso:correo:${hashCorreo(correo)}`, 5, 3600, true))) {
    await registrarEvento("limite_acceso", request, "por correo");
    return responder({ error: MENSAJES_ACCESO.limiteCodigo }, 429);
  }

  // 5. Alta: los datos esperan aquí (24 h) a que llegue el código, amarrados a este navegador
  let secretoAlta: string | null = null;
  if (modo === "crear") {
    const { secreto, hash } = nuevoSecretoAlta();
    if (!(await guardarAltaPendiente({ correo, datos, ipHash, secretoHash: hash }))) return responder({ error: MENSAJES_ACCESO.servicio }, 503);
    secretoAlta = secreto;
  }

  // 6. El código (y el enlace del correo, que vuelve a /auth/callback)
  const origen = origenPermitido(request.nextUrl.origin) ?? SITIO;
  const { supabase, ponerCookies } = clienteDeRuta(request);
  const resultado = await pedirCodigo(supabase.auth, { correo, modo, redirect: `${origen}/auth/callback` });

  if (resultado.aviso) {
    const { tipo, code, status } = resultado.aviso;
    // Solo code y status: el mensaje de Supabase puede traer el correo
    if (tipo === "sin_cuenta") after(() => registrarEvento("acceso_sin_cuenta", request));
    else console.error("[api/acceso/codigo] Supabase no mandó el código", { code, status });
  }
  if (resultado.status !== 200) return responder(resultado.cuerpo, resultado.status);

  await esperarMinimo(inicio, MINIMO_MS);
  const res = ponerCookies(responder(resultado.cuerpo));
  if (secretoAlta) res.cookies.set(COOKIE_ALTA, secretoAlta, opcionesCookie(SEGUNDOS_ALTA));
  return res;
}
