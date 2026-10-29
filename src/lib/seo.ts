import type { Metadata } from "next";
import { t, type Idioma } from "@/i18n";

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
export function metadatos(titulo: string, descripcion: string, extra: Metadata = {}, locale: string = BASE_OG.locale): Metadata {
  return {
    title: titulo,
    description: descripcion,
    openGraph: { ...BASE_OG, locale, title: `${titulo} · ${NOMBRE_SITIO}`, description: descripcion },
    twitter: { card: "summary", title: `${titulo} · ${NOMBRE_SITIO}`, description: descripcion },
    ...extra,
  };
}

/** Metadatos de una página pública con sus textos del idioma: `[título, descripción]` de i18n (meta). */
export function metadatosDe(idioma: Idioma, [titulo, descripcion]: string[], extra: Metadata = {}): Metadata {
  return metadatos(titulo, descripcion, extra, t(idioma).meta.locale);
}

/** Los del inicio en el idioma pedido (y los que heredan las páginas que no ponen los suyos). */
export function metadatosInicio(idioma: Idioma): Metadata {
  const m = t(idioma).meta;
  return {
    title: { default: m.tituloInicio, template: `%s · ${NOMBRE_SITIO}` },
    description: m.descripcionInicio,
    openGraph: { ...BASE_OG, locale: m.locale, title: m.tituloInicio, description: m.descripcionInicio },
    twitter: { card: "summary", title: m.tituloInicio, description: m.descripcionInicio },
  };
}

/** Los del inicio en español (los usan las páginas que todavía no cambian de idioma). */
export const TITULO_INICIO = "Atendel — Agentes de IA para negocios que atienden personas";
export const DESCRIPCION_INICIO =
  "Lola contesta tu WhatsApp y agenda citas, Clara ordena tu correo, Víctor trae de regreso a tus clientes e Iris lleva el trabajo de oficina. Agentes de IA para negocios que atienden personas.";
export const OG_INICIO: Metadata["openGraph"] = { ...BASE_OG, title: TITULO_INICIO, description: DESCRIPCION_INICIO };
