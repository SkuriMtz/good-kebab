import type { MetadataRoute } from "next";
import { IDS_AGENTES } from "@/lib/agentes";
import { legalesCompletos } from "@/lib/legal";
import { SITIO } from "@/lib/sitio";

/** /sitemap.xml: solo las páginas públicas del sitio (sin el panel ni las de trabajo). */
export default function sitemap(): MetadataRoute.Sitemap {
  const paginas: { ruta: string; prioridad: number; frecuencia: "weekly" | "monthly" }[] = [
    { ruta: "", prioridad: 1, frecuencia: "weekly" },
    { ruta: "/precios", prioridad: 0.9, frecuencia: "weekly" },
    { ruta: "/agentes", prioridad: 0.8, frecuencia: "monthly" },
    ...IDS_AGENTES.map((a) => ({ ruta: `/agentes/${a}`, prioridad: 0.7, frecuencia: "monthly" as const })),
    { ruta: "/para-quien-es", prioridad: 0.7, frecuencia: "monthly" },
    { ruta: "/preguntas", prioridad: 0.6, frecuencia: "monthly" },
    { ruta: "/pruebalo", prioridad: 0.6, frecuencia: "monthly" },
    { ruta: "/lista", prioridad: 0.5, frecuencia: "monthly" },
    { ruta: "/contacto", prioridad: 0.5, frecuencia: "monthly" },
    { ruta: "/apps", prioridad: 0.6, frecuencia: "monthly" },
    { ruta: "/cuando-sale", prioridad: 0.5, frecuencia: "monthly" },
    ...(legalesCompletos()
      ? [
          { ruta: "/privacidad", prioridad: 0.3, frecuencia: "monthly" as const },
          { ruta: "/terminos", prioridad: 0.3, frecuencia: "monthly" as const },
          { ruta: "/cookies", prioridad: 0.3, frecuencia: "monthly" as const },
          { ruta: "/privacy", prioridad: 0.4, frecuencia: "monthly" as const },
          { ruta: "/preguntas-privacidad", prioridad: 0.3, frecuencia: "monthly" as const },
          { ruta: "/tratamiento-de-datos", prioridad: 0.3, frecuencia: "monthly" as const },
          { ruta: "/uso-aceptable", prioridad: 0.3, frecuencia: "monthly" as const },
          { ruta: "/reembolsos", prioridad: 0.3, frecuencia: "monthly" as const },
          { ruta: "/inteligencia-artificial", prioridad: 0.3, frecuencia: "monthly" as const },
          { ruta: "/nivel-de-servicio", prioridad: 0.3, frecuencia: "monthly" as const },
          { ruta: "/proveedores", prioridad: 0.3, frecuencia: "monthly" as const },
        ]
      : []),
  ];
  return paginas.map((p) => ({ url: `${SITIO}${p.ruta}`, changeFrequency: p.frecuencia, priority: p.prioridad }));
}
