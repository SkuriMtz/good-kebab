import type { MetadataRoute } from "next";
import { SITIO } from "@/lib/sitio";

/**
 * /robots.txt: los buscadores ven el sitio público; nunca el panel, la API ni
 * las páginas de trabajo (laboratorios y vistas previas).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/panel", "/api/", "/auth/", "/opciones", "/base", "/laboratorio-figuras", "/vista-3d"],
      },
    ],
    sitemap: `${SITIO}/sitemap.xml`,
    host: SITIO,
  };
}
