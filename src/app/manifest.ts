import type { MetadataRoute } from "next";

/** Permite "agregar a pantalla de inicio" y abrir Atendel como app, sin barra del navegador. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Atendel",
    short_name: "Atendel",
    description: "Agentes de IA para clínicas, consultorios y estéticas.",
    start_url: "/panel",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    lang: "es",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
