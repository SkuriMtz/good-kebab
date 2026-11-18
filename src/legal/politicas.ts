import type { Idioma } from "@/i18n";

/** Las políticas de Atendel (el selector «Políticas» y el pie de las páginas legales). */
export const POLITICAS = [
  { id: "privacidad", href: "/privacidad", nombre: { es: "Aviso de privacidad", en: "Privacy notice" } },
  { id: "terminos", href: "/terminos", nombre: { es: "Términos y condiciones", en: "Terms and conditions" } },
  { id: "cookies", href: "/cookies", nombre: { es: "Política de cookies", en: "Cookie policy" } },
] as const;
export type Politica = (typeof POLITICAS)[number]["id"];

/** Los textos de las páginas legales que no son el documento. */
export const ETIQUETAS_LEGALES = {
  es: {
    saltar: "Saltar al contenido",
    inicio: "Inicio",
    politicas: "Políticas",
    entrar: "Entrar",
    contacto: "Contacto",
    contenido: "Contenido",
    vigente: "Vigente desde",
    tipo: "Tipo",
    idioma: "Idioma",
    pdf: "Descargar PDF",
    nota: "",
    pieAria: "Políticas y contacto",
    locale: "es-MX",
  },
  en: {
    saltar: "Skip to content",
    inicio: "Home",
    politicas: "Policies",
    entrar: "Sign in",
    contacto: "Contact",
    contenido: "Contents",
    vigente: "Effective",
    tipo: "Type",
    idioma: "Language",
    pdf: "Download PDF",
    nota: "This English version is provided for convenience. The Spanish version is the one that governs.",
    pieAria: "Policies and contact",
    locale: "en-US",
  },
} satisfies Record<Idioma, Record<string, string>>;
export type EtiquetasLegales = (typeof ETIQUETAS_LEGALES)["es"];
