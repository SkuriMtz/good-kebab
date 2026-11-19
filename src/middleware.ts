import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/config";

/**
 * SEGURIDAD — CORS (Cross-Origin Resource Sharing)
 *
 * Por defecto, cualquier sitio web podría intentar llamar a tu API desde
 * JavaScript. Este middleware restringe eso: solo la propia app y los
 * orígenes (dominios) que apruebes en ALLOWED_ORIGINS pueden hacer
 * peticiones a /api/*. Cualquier otro origen recibe una respuesta rechazada.
 *
 * Nunca uses "*" para una API que maneja datos de negocios reales.
 */
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? "http://localhost:3000")
  .split(",")
  .map((o) => o.trim());

/**
 * SEGURIDAD — Content-Security-Policy con nonce (uno nuevo en cada petición).
 *
 * El nonce es un valor al azar que solo conoce esta respuesta. Los scripts de
 * la página llevan ese valor y el navegador solo ejecuta los que lo traen:
 * así ya no hace falta permitir 'unsafe-inline' en script-src.
 * 'strict-dynamic' deja que un script con nonce cargue otros (Next.js y el
 * Google Picker).
 */
const SUPABASE_ORIGEN = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hatuwlxervgzajazwjvz.supabase.co").origin;
  } catch {
    return "https://hatuwlxervgzajazwjvz.supabase.co";
  }
})();

// Cloudflare Turnstile (¿es una persona?) en el alta: solo si está configurado
const TURNSTILE = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? " https://challenges.cloudflare.com" : "";

function armarCsp(nonce: string): string {
  const esDesarrollo = process.env.NODE_ENV === "development";
  return [
    "default-src 'self'",
    // 'unsafe-eval' solo en desarrollo (recarga en caliente); en producción NO.
    // apis.google.com: el Google Picker (elegir archivos de Drive) se carga de ahí
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${esDesarrollo ? " 'unsafe-eval'" : ""} https://apis.google.com${TURNSTILE}`,
    // El Picker se abre en un iframe de docs.google.com; Turnstile, en uno de challenges.cloudflare.com
    `frame-src 'self' https://docs.google.com https://apis.google.com${TURNSTILE}`,
    "style-src 'self' 'unsafe-inline'",
    // Imágenes: las propias, las de Google (el selector de Drive) y las fotos de las noticias del
    // Tablero (las guarda el servidor en Storage; solo esa carpeta); ninguna otra
    `img-src 'self' data: blob: https://*.googleusercontent.com https://ssl.gstatic.com https://www.gstatic.com ${SUPABASE_ORIGEN}/storage/v1/object/public/noticias/`,
    "font-src 'self'",
    `connect-src 'self' ${SUPABASE_ORIGEN} https://www.googleapis.com${TURNSTILE}`,
    // Sin plugins (Flash, Java…) y todo por HTTPS
    "object-src 'none'",
    "upgrade-insecure-requests",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

/** Nonce al azar: 16 bytes en base64. */
function nuevoNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let texto = "";
  bytes.forEach((b) => (texto += String.fromCharCode(b)));
  return btoa(texto);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // La API solo lleva CORS (sus cabeceras de seguridad vienen de next.config.mjs)
  if (pathname.startsWith("/api/")) return cors(request);

  // Páginas: nonce + CSP en la petición (Next la lee y pone el nonce a sus scripts)
  // y en la respuesta (la lee el navegador).
  const nonce = nuevoNonce();
  const csp = armarCsp(nonce);
  const cabeceras = new Headers(request.headers);
  cabeceras.set("x-nonce", nonce);
  cabeceras.set("Content-Security-Policy", csp);

  const respuesta = await paginas(request, cabeceras);
  respuesta.headers.set("Content-Security-Policy", csp);
  return respuesta;
}

async function paginas(request: NextRequest, cabeceras: Headers) {
  const { pathname, searchParams } = request.nextUrl;

  // Si Supabase manda el código de inicio de sesión a la página principal
  // (pasa cuando la URL de retorno no está en su lista), lo pasamos al callback.
  if (pathname === "/") {
    if (!searchParams.has("code")) return NextResponse.next({ request: { headers: cabeceras } });
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    return NextResponse.redirect(url);
  }

  // /pruebalo sigue en español (lo lee el layout para <html lang>)
  if (pathname.startsWith("/pruebalo")) return NextResponse.next({ request: { headers: idiomaFijo(cabeceras) } });

  // Solo el panel y /entrar usan la sesión de Supabase
  if (pathname.startsWith("/panel") || pathname === "/entrar") return sesion(request, cabeceras);

  // Las demás páginas: solo la CSP, sin llamar a Supabase
  return NextResponse.next({ request: { headers: cabeceras } });
}

/** El panel y /pruebalo siguen en español aunque el sitio público esté en inglés. */
function idiomaFijo(base: Headers) {
  const cabeceras = new Headers(base);
  cabeceras.set("x-idioma-fijo", "es");
  return cabeceras;
}

function cors(request: NextRequest) {
  const origin = request.headers.get("origin");
  // Se permiten: peticiones sin header Origin, peticiones desde la propia
  // app (su mismo dominio, ej. tu-app.vercel.app) y los orígenes aprobados.
  const isAllowedOrigin =
    !origin || origin === request.nextUrl.origin || ALLOWED_ORIGINS.includes(origin);

  // Preflight request (OPTIONS) — el navegador pregunta antes de la llamada real
  if (request.method === "OPTIONS") {
    if (!isAllowedOrigin) {
      return new NextResponse(null, { status: 403 });
    }
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin ?? "",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  if (!isAllowedOrigin) {
    return NextResponse.json({ error: "Origen no permitido" }, { status: 403 });
  }

  // SEGURIDAD — CSRF: un navegador siempre dice de dónde viene la petición
  // (Sec-Fetch-Site). Lo que cambia datos solo se acepta desde la propia app;
  // si viene de otro sitio, se rechaza aunque traiga la cookie de sesión.
  // Meta, la base de datos (pg_net) y otros servidores no mandan esta
  // cabecera, así que a ellos no les afecta (se protegen con firma o llave).
  const sitio = request.headers.get("sec-fetch-site");
  const cambia = !["GET", "HEAD", "OPTIONS"].includes(request.method);
  if (cambia && sitio && sitio !== "same-origin" && sitio !== "none" && !(origin && ALLOWED_ORIGINS.includes(origin))) {
    return NextResponse.json({ error: "Origen no permitido" }, { status: 403 });
  }

  const response = NextResponse.next();
  // La respuesta depende del origen: que ninguna caché la comparta entre sitios
  response.headers.set("Vary", "Origin");
  if (origin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }
  return response;
}

/**
 * SESIÓN — Renueva la sesión de Supabase (que caduca cada hora) y la guarda
 * en cookies, y protege las páginas: sin sesión no se entra al panel.
 */
async function sesion(request: NextRequest, base: Headers) {
  // El panel sigue en español (el layout lo lee para <html lang>)
  const cabeceras = request.nextUrl.pathname.startsWith("/panel") ? idiomaFijo(base) : new Headers(base);
  let response = NextResponse.next({ request: { headers: cabeceras } });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        cabeceras.set("cookie", request.headers.get("cookie") ?? "");
        response = NextResponse.next({ request: { headers: cabeceras } });
        // En producción, la cookie de sesión solo viaja por HTTPS
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, conSeguridad(options)));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const redirigir = (ruta: string) => {
    const url = request.nextUrl.clone();
    url.pathname = ruta;
    url.search = "";
    const r = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => r.cookies.set(c));
    return r;
  };

  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/panel") && !user) return redirigir("/entrar");
  if (pathname === "/entrar" && user) return redirigir("/panel/chat");

  return response;
}

/** Opciones de cookie de sesión: en producción siempre `secure` y `sameSite: lax`. */
function conSeguridad(options: CookieOptions): CookieOptions {
  return process.env.NODE_ENV === "production" ? { ...options, secure: true, sameSite: options.sameSite ?? "lax" } : options;
}

export const config = {
  // Todas las páginas y la API; fuera: archivos estáticos, iconos, manifest, sw.js,
  // robots, sitemap, opengraph-image y cualquier archivo con extensión.
  matcher: [
    "/((?!_next/static|_next/image|favicon|icon|apple-icon|manifest|sw\\.js|robots\\.txt|sitemap\\.xml|opengraph-image|iconos/|.*\\..*).*)",
  ],
};
