import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
// Los valores del sistema de diseño (colores, tipografía, espacios, radios), tal cual vienen
import "../../diseno/variables.css";
import "./globals.css";
import { SCRIPT_TEMA } from "@/lib/tema";

// Una sola tipografía, servida desde nuestro propio dominio (la política de
// seguridad no permite cargar fuentes de otros sitios). Inter sustituye a la
// del sistema de diseño: 400 para títulos, 200 para párrafos, 600 para menús.
// Este archivo trae el corte "Display" de Inter, que se usa solo en tamaños grandes.
const sans = localFont({
  src: "../../node_modules/@fontsource-variable/inter/files/inter-latin-opsz-normal.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  variable: "--font-sans",
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
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={sans.variable} suppressHydrationWarning>
      <head>
        {/* Pone el modo claro u oscuro antes de pintar (sin parpadeo) */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
