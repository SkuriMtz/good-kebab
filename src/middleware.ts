import { NextRequest, NextResponse } from "next/server";

/**
 * SEGURIDAD — CORS (Cross-Origin Resource Sharing)
 *
 * Por defecto, cualquier sitio web podría intentar llamar a tu API desde
 * JavaScript. Este middleware restringe eso: solo los orígenes (dominios)
 * que tú apruebes explícitamente en ALLOWED_ORIGINS pueden hacer peticiones
 * a /api/*. Cualquier otro origen recibe una respuesta rechazada.
 *
 * En desarrollo, agrega http://localhost:3000. En producción, agrega tu
 * dominio real (ej. https://tuapp.com) en la variable de entorno
 * ALLOWED_ORIGINS (separados por coma) — nunca uses "*" para una API que
 * maneja datos de negocios reales.
 */
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? "http://localhost:3000")
  .split(",")
  .map((o) => o.trim());

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin");
  const isApiRoute = request.nextUrl.pathname.startsWith("/api/");

  if (!isApiRoute) {
    return NextResponse.next();
  }

  const isAllowedOrigin = origin ? ALLOWED_ORIGINS.includes(origin) : true; // same-origin requests (sin header Origin) se permiten

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
    return NextResponse.json(
      { error: "Origen no permitido" },
      { status: 403 }
    );
  }

  const response = NextResponse.next();
  if (origin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
