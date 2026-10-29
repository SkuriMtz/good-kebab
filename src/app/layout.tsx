import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
// Los valores de la guía de estilo (colores, tipografía, espacios, radios) tal cual vienen.
// globals.css los asigna a su papel en cada modo (oscuro y claro).
import "../../diseno/github/variables.css";
import "./globals.css";
// Un archivo por grupo de trabajo (ver diseno/plan.md, "Reparto de archivos").
// Van después de globals.css para poder afinar sobre la base, nunca para inventar valores.
import "../estilos/portada.css";
import "../estilos/chat.css";
import "../estilos/agentes.css";
import "../estilos/informativas.css";
import "../estilos/conversion.css";
import "../estilos/estructura.css";
import "../estilos/tema-claro.css";
import "../estilos/dashboard.css";
import "../estilos/landing.css";
import "../estilos/inicio.css";
import "../estilos/transiciones.css";
import { headers } from "next/headers";
import { metadatosInicio } from "@/lib/seo";
import { SCRIPT_TEMA } from "@/lib/tema";
import { TransicionPaginas } from "@/components/TransicionPaginas";
import { IdiomaProvider } from "@/i18n/Idioma";
import { idiomaServidor } from "@/i18n/servidor";
import type { Idioma } from "@/i18n";

/*
 * Tipografías servidas desde nuestro propio dominio (la política de seguridad
 * solo permite fuentes de 'self'). Geist y Geist Mono, archivos variables de
 * Vercel (licencia SIL OFL 1.1, ver src/fonts/Geist-OFL.txt). Lección 14 del
 * dueño: una letra más elegante y moderna en todo el sitio.
 * - Geist: eje de peso 100–900 (usamos 400, 450, 500, 600).
 * - Geist Mono: eje de peso 100–900, para etiquetas, horas y cifras.
 */
const geist = localFont({
  src: "../fonts/GeistVF.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  variable: "--font-geist-sans",
  fallback: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
});

const geistMono = localFont({
  src: "../fonts/GeistMonoVF.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  variable: "--font-geist-mono",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
});

/** Título y descripción del sitio en el idioma de la persona (cookie atendel-idioma). */
export function generateMetadata(): Metadata {
  return {
    ...metadatosInicio(idiomaActual()),
    applicationName: "Atendel",
    appleWebApp: { capable: true, title: "Atendel", statusBarStyle: "black-translucent" },
  };
}

/**
 * El idioma de la página: el que eligió la persona (inglés si no eligió).
 * El panel y /pruebalo siguen en español: el middleware los marca con
 * x-idioma-fijo.
 */
function idiomaActual(): Idioma {
  return headers().get("x-idioma-fijo") === "es" ? "es" : idiomaServidor();
}

export const viewport: Viewport = {
  themeColor: "#0d1117",
  colorScheme: "dark light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/*
 * Las clases de las fuentes van en <html> y en <body>: así el valor de
 * --font-geist-sans que pone next/font le gana al nombre genérico que trae
 * diseno/github/variables.css (que no apunta a ningún archivo).
 */
const FUENTES = `${geist.variable} ${geistMono.variable}`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const idioma = idiomaActual();
  return (
    <html lang={idioma} className={FUENTES} suppressHydrationWarning>
      <head>
        {/* Pone el modo claro u oscuro antes de pintar (sin parpadeo) */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className={`${FUENTES} font-sans`}>
        <IdiomaProvider idioma={idioma}>
          {children}
          <TransicionPaginas />
        </IdiomaProvider>
      </body>
    </html>
  );
}
