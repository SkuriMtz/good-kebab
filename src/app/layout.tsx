import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SCRIPT_TEMA } from "@/lib/tema";

// Tipografías servidas desde nuestro propio dominio (la política de seguridad
// no permite cargar fuentes de otros sitios).
// Inter: todo el sitio (400 para leer, 500 para menús y botones, 600–700 para títulos).
const sans = localFont({
  src: "../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  variable: "--font-sans",
});

// Source Serif: solo para las entradillas (el texto que acompaña a un título).
const serif = localFont({
  src: "../../node_modules/@fontsource/source-serif-4/files/source-serif-4-latin-400-normal.woff2",
  weight: "400",
  style: "normal",
  display: "swap",
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: {
    default: "Atendel — Agentes de IA para clínicas y estéticas",
    template: "%s · Atendel",
  },
  description:
    "Atendel lee tus correos, entiende qué necesita cada cliente y te dice qué hacer. Agentes de inteligencia artificial para clínicas, consultorios y estéticas.",
  applicationName: "Atendel",
  appleWebApp: { capable: true, title: "Atendel", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#f6f5f4",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${sans.variable} ${serif.variable}`} suppressHydrationWarning>
      <head>
        {/* Pone el modo claro u oscuro antes de pintar (sin parpadeo) */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
