import type { MetadataRoute } from "next";
import { IDS_AGENTES } from "@/lib/agentes";
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
  ];
  return paginas.map((p) => ({ url: `${SITIO}${p.ruta}`, changeFrequency: p.frecuencia, priority: p.prioridad }));
}
