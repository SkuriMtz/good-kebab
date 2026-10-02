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

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (pathname.startsWith("/api/")) return cors(request);

  // Si Supabase manda el código de inicio de sesión a la página principal
  // (pasa cuando la URL de retorno no está en su lista), lo pasamos al callback.
  if (pathname === "/") {
    if (!searchParams.has("code")) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    return NextResponse.redirect(url);
  }

  return sesion(request);
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

  const response = NextResponse.next();
  if (origin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }
  return response;
}

/**
 * SESIÓN — Renueva la sesión de Supabase (que caduca cada hora) y la guarda
 * en cookies, y protege las páginas: sin sesión no se entra al panel.
 */
async function sesion(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
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
  if (pathname === "/entrar" && user) return redirigir("/panel");

  return response;
}

export const config = {
  matcher: ["/", "/api/:path*", "/panel/:path*", "/entrar"],
};
