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
import { SCRIPT_TEMA } from "@/lib/tema";

/*
 * Tipografías servidas desde nuestro propio dominio (la política de seguridad
 * solo permite fuentes de 'self'). Archivos variables de github/mona-sans
 * (licencia SIL OFL 1.1, ver src/fonts/OFL.txt):
 * - Mona Sans: eje de peso 200–900 (usamos 400, 425, 440, 460, 480, 500, 600)
 *   y tamaño óptico automático.
 * - Mona Sans Mono: eje de peso 200–900, para etiquetas y sellos de hora.
 */
const monaSans = localFont({
  src: "../fonts/MonaSansVF-opsz-wght.woff2",
  weight: "200 900",
  style: "normal",
  display: "swap",
  variable: "--font-mona-sans",
  fallback: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
});

const monaSansMono = localFont({
  src: "../fonts/MonaSansMonoVF-wght.woff2",
  weight: "200 900",
  style: "normal",
  display: "swap",
  variable: "--font-mona-sans-mono",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
});

export const metadata: Metadata = {
  title: {
    default: "Atendel — Agentes de IA para clínicas y estéticas",
    template: "%s · Atendel",
  },
  description:
    "Atendel lee tus correos, entiende qué necesita cada cliente y te dice qué hacer. Agentes de inteligencia artificial para clínicas, consultorios y estéticas.",
  applicationName: "Atendel",
  appleWebApp: { capable: true, title: "Atendel", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/*
 * Las clases de las fuentes van en <html> y en <body>: así el valor de
 * --font-mona-sans que pone next/font le gana al nombre genérico que trae
 * diseno/github/variables.css (que no apunta a ningún archivo).
 */
const FUENTES = `${monaSans.variable} ${monaSansMono.variable}`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={FUENTES} suppressHydrationWarning>
      <head>
        {/* Pone el modo claro u oscuro antes de pintar (sin parpadeo) */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className={`${FUENTES} font-sans`}>{children}</body>
    </html>
  );
}
