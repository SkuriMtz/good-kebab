import type { MetadataRoute } from "next";

/** Permite "agregar a pantalla de inicio" y abrir Atendel como app, sin barra del navegador. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Atendel",
    short_name: "Atendel",
    description: "Agentes de IA para clínicas, consultorios y estéticas.",
    start_url: "/panel",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    lang: "es",
    // Los íconos se agregan cuando el logo esté decidido
    icons: [],
  };
}
