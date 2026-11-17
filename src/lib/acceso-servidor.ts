import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./supabase/config";
import { clienteServicio } from "./supabase/servicio";
import { DATOS_LEGALES } from "./legal";
import { normalizarCorreo } from "./lista";
import { esCuentaNueva, hoyEnMexico, validarAlta, versionValida, type DatosAlta, type UsuarioAcceso } from "./acceso";

/**
 * ACCESO SIN CONTRASEÑAS: las piezas de servidor que usan las rutas de
 * /api/acceso y /auth/callback. Nada de aquí llega al navegador.
 *
 * - hashCorreo(): el correo nunca se guarda ni se registra; solo su hash
 *   (con la llave del servidor si existe, igual que hashIp).
 * - clienteDeRuta(): Supabase con las cookies de la petición; las cookies que
 *   Supabase quiere poner (sesión, verificador PKCE) se pasan a la respuesta,
 *   con `secure` en producción, como el middleware.
 * - Cookies propias:
 *   · atendel_alta: amarra los datos del alta (tabla altas_pendientes) al
 *     navegador que los mandó. Sin ella, quien sepa un correo ajeno podría
 *     dejar datos y un "acepto" a nombre de otra persona.
 *   · atendel_acepta: el "acepto" del alta con Google (30 min).
 * - prepararCuenta(): después de entrar, asegura la fila de negocios y, si la
 *   cuenta es nueva, aplica los datos del alta y registra los consentimientos.
 */

export const COOKIE_ALTA = "atendel_alta";
export const COOKIE_ACEPTA = "atendel_acepta";
/** Lo que vive la cookie del alta: lo mismo que la fila pendiente. */
export const SEGUNDOS_ALTA = 24 * 3600;
export const SEGUNDOS_ACEPTA = 30 * 60;

const esProduccion = () => process.env.NODE_ENV === "production";

/** Opciones de una cookie propia: solo el servidor la lee, por HTTPS en producción. */
export function opcionesCookie(maxAge: number) {
  return { httpOnly: true, secure: esProduccion(), sameSite: "lax" as const, path: "/", maxAge };
}

/** Borra una cookie propia en la respuesta. */
export function borrarCookie(res: NextResponse, nombre: string) {
  res.cookies.set(nombre, "", opcionesCookie(0));
}

/** El correo en hash (64 hex). Sirve para contar intentos y como clave del alta pendiente, sin guardar el correo. */
export function hashCorreo(correo: string): string {
  const c = normalizarCorreo(correo);
  const llave = process.env.ATENDEL_LLAVE_CIFRADO;
  return (llave ? createHmac("sha256", llave).update(`correo|${c}`) : createHash("sha256").update(`atendel-correo|${c}`)).digest("hex");
}

/** Un secreto al azar para la cookie del alta (y su hash, que es lo que se guarda). */
export function nuevoSecretoAlta(): { secreto: string; hash: string } {
  const secreto = randomBytes(32).toString("base64url");
  return { secreto, hash: hashSecreto(secreto) };
}

const hashSecreto = (s: string) => createHash("sha256").update(`atendel-alta|${s}`).digest("hex");

/** ¿La cookie corresponde al hash guardado? Comparación en tiempo constante. */
export function secretoCoincide(cookie: string | null | undefined, hashGuardado: unknown): boolean {
  if (!cookie || cookie.length > 100 || typeof hashGuardado !== "string" || !/^[0-9a-f]{64}$/.test(hashGuardado)) return false;
  const a = Buffer.from(hashSecreto(cookie), "hex");
  const b = Buffer.from(hashGuardado, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Lee el cuerpo JSON con un tope de bytes, sin fiarse de content-length
 * (puede faltar o mentir): se corta en cuanto pasa el tope.
 */
export async function leerCuerpoJson(request: Request, max: number): Promise<{ ok: true; cuerpo: Record<string, unknown> } | { ok: false; status: 400 | 413 }> {
  const declarado = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declarado) && declarado > max) return { ok: false, status: 413 };
  if (!request.body) return { ok: false, status: 400 };
  const lector = request.body.getReader();
  const trozos: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await lector.read();
      if (done) break;
      total += value.byteLength;
      if (total > max) {
        await lector.cancel().catch(() => undefined);
        return { ok: false, status: 413 };
      }
      trozos.push(value);
    }
  } catch {
    return { ok: false, status: 400 };
  }
  const bytes = new Uint8Array(total);
  let i = 0;
  for (const t of trozos) {
    bytes.set(t, i);
    i += t.byteLength;
  }
  try {
    const datos: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    if (!datos || typeof datos !== "object" || Array.isArray(datos)) return { ok: false, status: 400 };
    return { ok: true, cuerpo: datos as Record<string, unknown> };
  } catch {
    return { ok: false, status: 400 };
  }
}

/**
 * Supabase para una ruta de la API, con las cookies de la petición. Lo que
 * Supabase guarda (la sesión al verificar, el verificador PKCE del enlace del
 * correo) queda pendiente y `ponerCookies(res)` lo pasa a la respuesta.
 */
export function clienteDeRuta(request: NextRequest) {
  const pendientes: { name: string; value: string; options: CookieOptions }[] = [];
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(lista: { name: string; value: string; options: CookieOptions }[]) {
        pendientes.push(...lista);
      },
    },
  });
  const ponerCookies = <T extends NextResponse>(res: T): T => {
    for (const { name, value, options } of pendientes) {
      // En producción, la cookie de sesión solo viaja por HTTPS (igual que el middleware)
      res.cookies.set(name, value, esProduccion() ? { ...options, secure: true, sameSite: options.sameSite ?? "lax" } : options);
    }
    return res;
  };
  return { supabase, ponerCookies };
}

/**
 * Cloudflare Turnstile: "ok" si el token es bueno, "no" si no, "falla" si
 * Cloudflare no respondió. Solo se llama si existe TURNSTILE_SECRET.
 */
export async function verificarTurnstile(secreto: string, token: string | null, ip: string): Promise<"ok" | "no" | "falla"> {
  if (!token) return "no";
  const cuerpo = new URLSearchParams({ secret: secreto, response: token });
  if (ip !== "sin-ip") cuerpo.set("remoteip", ip);
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: cuerpo,
      signal: AbortSignal.timeout(6000),
      cache: "no-store",
    });
    if (!res.ok) return "falla";
    const datos = (await res.json().catch(() => null)) as { success?: unknown } | null;
    return datos?.success === true ? "ok" : "no";
  } catch {
    return "falla";
  }
}

/** Espera a que pasen al menos `minimo` ms desde `inicio` (más un poco al azar). */
export async function esperarMinimo(inicio: number, minimo: number, azar = 300): Promise<void> {
  const falta = minimo + Math.floor(Math.random() * azar) - (Date.now() - inicio);
  if (falta > 0) await new Promise((r) => setTimeout(r, falta));
}

/** Para los logs: solo code y message, nunca el objeto entero ni datos de personas. */
const log = (donde: string, e: { code?: string; message?: string } | null | undefined) =>
  console.error(`[acceso] ${donde}`, { code: e?.code ?? null, message: e?.message?.slice(0, 200) ?? null });

/** Guarda (o reemplaza) los datos del alta mientras llega el código. */
export async function guardarAltaPendiente(p: { correo: string; datos: DatosAlta; ipHash: string; secretoHash: string }): Promise<boolean> {
  const admin = clienteServicio();
  if (!admin) return false;
  const { error } = await admin.from("altas_pendientes").upsert(
    {
      correo_hash: hashCorreo(p.correo),
      datos: p.datos,
      acepta_version: DATOS_LEGALES.actualizado,
      secreto_hash: p.secretoHash,
      ip_hash: p.ipHash,
      creado_en: new Date().toISOString(),
    },
    { onConflict: "correo_hash" },
  );
  if (error) log("guardar alta pendiente", error);
  return !error;
}

type AltaPendiente = { datos: DatosAlta; version: string; aceptadoEn: string; ipHash: string | null };

/** La fila pendiente de ese correo, si es de este navegador (cookie) y no ha vencido. */
async function leerAltaPendiente(admin: SupabaseClient, correoHash: string, cookie: string, ahora: number): Promise<AltaPendiente | null> {
  const { data, error } = await admin
    .from("altas_pendientes")
    .select("datos, acepta_version, secreto_hash, ip_hash, creado_en")
    .eq("correo_hash", correoHash)
    .maybeSingle();
  if (error) {
    log("leer alta pendiente", error);
    return null;
  }
  if (!data) return null;
  const creado = Date.parse(String(data.creado_en));
  if (!Number.isFinite(creado) || ahora - creado > SEGUNDOS_ALTA * 1000) return null;
  if (!secretoCoincide(cookie, data.secreto_hash)) return null;
  if (!versionValida(data.acepta_version)) return null;
  // Se vuelve a validar: lo que sale de la base también es dato de fuera
  const datos = validarAlta(data.datos, hoyEnMexico(new Date(ahora)));
  return {
    datos: datos.ok ? datos.valor : {},
    version: data.acepta_version,
    aceptadoEn: new Date(creado).toISOString(),
    ipHash: typeof data.ip_hash === "string" ? data.ip_hash : null,
  };
}

/** Términos y Aviso de privacidad, en esa versión. Si ya estaban, no se duplican. */
async function registrarConsentimientos(admin: SupabaseClient, ownerId: string, version: string, aceptadoEn: string, ipHash: string | null): Promise<boolean> {
  const filas = (["terminos", "privacidad"] as const).map((documento) => ({ owner_id: ownerId, documento, version, aceptado_en: aceptadoEn, ip_hash: ipHash }));
  const { error } = await admin.from("consentimientos").upsert(filas, { onConflict: "owner_id,documento,version", ignoreDuplicates: true });
  if (error) log("registrar consentimientos", error);
  return !error;
}

/** Que exista su fila en negocios (con "Mi negocio" si no hay nombre; nunca el correo). */
async function asegurarNegocio(sesion: SupabaseClient, ownerId: string, nombre?: string) {
  const { data, error } = await sesion.from("negocios").select("id").eq("owner_id", ownerId).limit(1).maybeSingle();
  if (error) return log("leer negocio", error);
  if (!data) {
    const { error: e } = await sesion.from("negocios").insert({ owner_id: ownerId, nombre: nombre || "Mi negocio" });
    if (e) log("crear negocio", e);
  } else if (nombre) {
    const { error: e } = await sesion.from("negocios").update({ nombre }).eq("owner_id", ownerId);
    if (e) log("nombrar negocio", e);
  }
}

/**
 * Después de entrar (código o callback de Google/enlace):
 * 1. ¿La cuenta es nueva? (sin perfil del negocio o creada hace < 30 min)
 * 2. Asegura su fila en negocios.
 * 3. Si es nueva y hay alta pendiente de ESTE navegador: perfil_dueno,
 *    nombre del negocio, tipo, consentimientos; y borra lo pendiente.
 * 4. Si es nueva y trae el "acepto" de Google: registra los consentimientos.
 * Nunca truena: entrar ya salió bien y esto no lo debe deshacer.
 */
export async function prepararCuenta(p: {
  sesion: SupabaseClient;
  usuario: UsuarioAcceso;
  ipHash: string;
  cookieAlta?: string | null;
  cookieAcepta?: string | null;
}): Promise<void> {
  try {
    const { sesion, usuario } = p;
    const ahora = Date.now();
    const admin = clienteServicio();

    const perfil = await sesion.from("perfil_negocio").select("owner_id").eq("owner_id", usuario.id).maybeSingle();
    // Si no se pudo leer, ante la duda la cuenta no se trata como nueva
    const nueva = esCuentaNueva(usuario.created_at, perfil.error ? true : Boolean(perfil.data), ahora);

    const correoHash = usuario.email ? hashCorreo(usuario.email) : null;
    const alta = admin && nueva && correoHash && p.cookieAlta ? await leerAltaPendiente(admin, correoHash, p.cookieAlta, ahora) : null;

    await asegurarNegocio(sesion, usuario.id, alta?.datos.negocio);
    if (!admin || !nueva) return;

    if (alta && correoHash) {
      const { nombre, nacimiento, telefono, tipo } = alta.datos;
      if (nombre || nacimiento || telefono) {
        const { error } = await admin
          .from("perfil_dueno")
          .upsert(
            { owner_id: usuario.id, nombre: nombre ?? null, nacimiento: nacimiento ?? null, telefono: telefono ?? null, actualizado_en: new Date(ahora).toISOString() },
            { onConflict: "owner_id" },
          );
        if (error) log("guardar perfil del dueño", error);
      }
      if (tipo) {
        const { error } = await sesion.from("perfil_negocio").upsert({ owner_id: usuario.id, tipo }, { onConflict: "owner_id" });
        if (error) log("guardar tipo de negocio", error);
      }
      const registrado = await registrarConsentimientos(admin, usuario.id, alta.version, alta.aceptadoEn, alta.ipHash ?? p.ipHash);
      // Si el consentimiento no quedó, la fila se queda (vence sola en 24 h) para revisarlo
      if (registrado) {
        const { error } = await admin.from("altas_pendientes").delete().eq("correo_hash", correoHash);
        if (error) log("borrar alta pendiente", error);
      }
      return;
    }

    if (p.cookieAcepta && p.cookieAcepta === DATOS_LEGALES.actualizado) {
      await registrarConsentimientos(admin, usuario.id, DATOS_LEGALES.actualizado, new Date(ahora).toISOString(), p.ipHash);
    }
  } catch (e) {
    log("preparar cuenta", { message: e instanceof Error ? e.message : "error" });
  }
}
