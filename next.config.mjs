/**
 * SEGURIDAD — Cabeceras HTTP (security headers)
 * Estas cabeceras se aplican a TODAS las respuestas de la app.
 * Cada una bloquea una familia distinta de ataques comunes:
 *
 * - Content-Security-Policy: la pone src/middleware.ts (con nonce por petición).
 * - X-Frame-Options: evita que tu sitio se pueda incrustar en un <iframe> de
 *   otro sitio (protege contra "clickjacking").
 * - X-Content-Type-Options: evita que el navegador intente "adivinar" el tipo
 *   de un archivo (protege contra ataques de MIME-sniffing).
 * - Referrer-Policy: limita cuánta información de la URL actual se manda a
 *   otros sitios cuando el usuario hace clic en un link saliente.
 * - Permissions-Policy: desactiva por defecto el acceso a cámara, micrófono,
 *   geolocalización, etc. — solo se activan donde explícitamente se necesiten.
 * - Strict-Transport-Security (HSTS): obliga al navegador a usar siempre
 *   HTTPS con este dominio, nunca HTTP sin cifrar.
 */
// La Content-Security-Policy ya NO está aquí: la arma src/middleware.ts en cada
// petición, con un nonce nuevo (así no hace falta 'unsafe-inline' en scripts).

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // No decir qué tecnología usa el servidor (cabecera X-Powered-By)
  poweredByHeader: false,
  async headers() {
    return [
      {
        // Aplica a todas las rutas de la app
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // Las respuestas de la API son de cada quien: ninguna caché las guarda
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
      {
        // El trabajador de las notificaciones: el navegador siempre revisa si hay uno nuevo
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }],
      },
    ];
  },
};

export default nextConfig;
