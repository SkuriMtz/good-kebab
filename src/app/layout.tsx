import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SCRIPT_TEMA } from "@/lib/tema";

// Tipografías (todas servidas desde nuestro propio dominio; la política de
// seguridad no permite cargar fuentes de otros sitios):
// - Fraunces 200 itálica: titulares editoriales (sustituto de Editorial New)
// - Space Grotesk: texto y controles
// - Bebas Neue: etiquetas condensadas tipo créditos de cine (sustituto de Altform)
// - Caveat: frases a mano entre corchetes (sustituto de Wasted Year)
const serif = localFont({
  src: [
    { path: "../../node_modules/@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2", style: "normal" },
    { path: "../../node_modules/@fontsource-variable/fraunces/files/fraunces-latin-wght-italic.woff2", style: "italic" },
  ],
  weight: "100 900",
  display: "swap",
  variable: "--font-serif",
});
const sans = localFont({
  src: "../../node_modules/@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2",
  weight: "300 700",
  style: "normal",
  display: "swap",
  variable: "--font-sans",
});
const cond = localFont({
  src: "../../node_modules/@fontsource/bebas-neue/files/bebas-neue-latin-400-normal.woff2",
  weight: "400",
  display: "swap",
  variable: "--font-cond",
});
const hand = localFont({
  src: "../../node_modules/@fontsource-variable/caveat/files/caveat-latin-wght-normal.woff2",
  weight: "400 700",
  display: "swap",
  variable: "--font-hand",
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf7f3" },
    { media: "(prefers-color-scheme: dark)", color: "#110f0e" },
  ],
  colorScheme: "dark light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${sans.variable} ${serif.variable} ${cond.variable} ${hand.variable}`} suppressHydrationWarning>
      <head>
        {/* Activa las animaciones de entrada (solo con JavaScript) y pone el modo claro u oscuro antes de pintar */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
