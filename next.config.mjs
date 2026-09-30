/**
 * SEGURIDAD — Cabeceras HTTP (security headers)
 * Estas cabeceras se aplican a TODAS las respuestas de la app.
 * Cada una bloquea una familia distinta de ataques comunes:
 *
 * - Content-Security-Policy: evita que se ejecute código/script de un origen
 *   que no sea el tuyo (protege contra inyección de scripts, XSS).
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
const isDev = process.env.NODE_ENV !== "production";

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // En desarrollo, Next.js necesita 'unsafe-eval' para recargar en caliente.
      // En producción NO se incluye.
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' https://*.supabase.co https://api.anthropic.com https://www.googleapis.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
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
  async headers() {
    return [
      {
        // Aplica a todas las rutas de la app
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
