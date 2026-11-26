import type { Viewport } from "next";
import { PaginaInicio } from "@/components/inicio-dala/PaginaInicio";

/** La barra del navegador del celular, del color del fondo del inicio (negro puro u #fafafa). */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
  ],
};

/** El inicio (todo su contenido vive en PaginaInicio: /vista-zapia lo usa también, con otra variante). */
export default async function Inicio() {
  return <PaginaInicio />;
}
