import type { MetadataRoute } from "next";

/**
 * Atendel como app: se instala en el celular o la compu (ícono propio, pantalla
 * completa, sin barra del navegador) y manda notificaciones (public/sw.js).
 * Los íconos salen de src/app/icon.svg; para cambiar el logo, se cambia ahí y
 * se vuelven a hacer los PNG de public/iconos y src/app/apple-icon.png.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/panel",
    name: "Atendel",
    short_name: "Atendel",
    description: "Agentes de IA para negocios que atienden personas.",
    start_url: "/panel",
    scope: "/",
    display: "standalone",
    background_color: "#0d1117",
    theme_color: "#0d1117",
    lang: "es",
    icons: [
      { src: "/iconos/icono-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/iconos/icono-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/iconos/icono-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Necesita tu OK", url: "/panel?vista=pendientes", icons: [{ src: "/iconos/icono-192.png", sizes: "192x192", type: "image/png" }] },
      { name: "Avisos", url: "/panel?avisos=1", icons: [{ src: "/iconos/icono-192.png", sizes: "192x192", type: "image/png" }] },
    ],
  };
}
