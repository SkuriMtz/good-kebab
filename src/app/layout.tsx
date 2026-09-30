import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agente de Correo",
  description: "Resúmenes y acciones automáticas de tu correo, con IA.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
