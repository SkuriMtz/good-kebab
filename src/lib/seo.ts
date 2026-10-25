import type { Metadata } from "next";

/*
 * Título, descripción y Open Graph básico de cada página pública, en un solo
 * lugar. Next junta los metadatos por llave de primer nivel: si una página
 * solo pone `title`, al compartirla se vería el título del inicio. Por eso
 * cada página pasa los suyos por aquí. Sin imagen para compartir: no hay una
 * aprobada y no se inventa.
 */

export const NOMBRE_SITIO = "Atendel";

const BASE_OG = { type: "website", locale: "es_MX", siteName: NOMBRE_SITIO } as const;

/** Metadatos de una página: `titulo` va con "· Atendel" (la plantilla del layout). */
export function metadatos(titulo: string, descripcion: string, extra: Metadata = {}): Metadata {
  return {
    title: titulo,
    description: descripcion,
    openGraph: { ...BASE_OG, title: `${titulo} · ${NOMBRE_SITIO}`, description: descripcion },
    twitter: { card: "summary", title: `${titulo} · ${NOMBRE_SITIO}`, description: descripcion },
    ...extra,
  };
}

/** Los del inicio (y los que heredan las páginas que no ponen los suyos). */
export const TITULO_INICIO = "Atendel — Agentes de IA para clínicas y estéticas";
export const DESCRIPCION_INICIO =
  "Lola contesta tu WhatsApp y agenda citas, Clara ordena tu correo, Víctor trae de regreso a tus clientes e Iris lleva el trabajo de oficina. Agentes de IA para negocios que atienden personas.";
export const OG_INICIO: Metadata["openGraph"] = { ...BASE_OG, title: TITULO_INICIO, description: DESCRIPCION_INICIO };
