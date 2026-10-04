import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SCRIPT_TEMA } from "@/lib/tema";

// Tipografía: una sola familia para todo el sitio (servida desde nuestro propio
// dominio; la política de seguridad no permite cargar fuentes de otros sitios).
// Inter variable sustituye a Halyard Display: peso 500 en mayúsculas para
// títulos, menús y botones; peso 400 en minúsculas para los textos que explican.
const sans = localFont({
  src: "../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8ead6" },
    { media: "(prefers-color-scheme: dark)", color: "#100904" },
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
    <html lang="es" className={sans.variable} suppressHydrationWarning>
      <head>
        {/* Activa las animaciones de entrada (solo con JavaScript) y pone el modo claro u oscuro antes de pintar */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
