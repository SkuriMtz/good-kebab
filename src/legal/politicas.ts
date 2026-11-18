import type { Idioma } from "@/i18n";

/**
 * Los documentos legales de Atendel, en el orden del Centro de privacidad
 * (/privacy), del selector «Políticas» y del menú. Sin los textos (eso va en
 * src/legal/documentos.ts, solo del servidor), así esto se puede usar en el
 * navegador. `soloEs`: todavía sin versión en inglés.
 */
export const POLITICAS = [
  {
    id: "privacidad",
    href: "/privacidad",
    icono: "candado",
    nombre: { es: "Aviso de privacidad", en: "Privacy notice" },
    resumen: { es: "Qué datos tratamos, para qué y cómo ejerces tus derechos.", en: "What data we process, why, and how to exercise your rights." },
  },
  {
    id: "preguntas",
    href: "/preguntas-privacidad",
    icono: "ayuda",
    soloEs: true,
    nombre: { es: "Preguntas frecuentes", en: "Frequently asked questions" },
    resumen: { es: "Respuestas cortas sobre privacidad, seguridad y condiciones.", en: "Short answers about privacy, security and terms." },
  },
  {
    id: "terminos",
    href: "/terminos",
    icono: "documento",
    nombre: { es: "Términos y condiciones", en: "Terms and conditions" },
    resumen: { es: "Las reglas para usar Atendel: tu cuenta, los planes y la responsabilidad.", en: "The rules for using Atendel: your account, the plans and liability." },
  },
  {
    id: "cookies",
    href: "/cookies",
    icono: "ajustes",
    nombre: { es: "Política de cookies", en: "Cookie policy" },
    resumen: { es: "Las cookies que usamos (solo las necesarias) y para qué sirve cada una.", en: "The cookies we use (only the necessary ones) and what each one does." },
  },
  {
    id: "tratamiento",
    href: "/tratamiento-de-datos",
    icono: "escudo",
    soloEs: true,
    nombre: { es: "Tratamiento de datos (DPA)", en: "Data processing agreement (DPA)" },
    resumen: { es: "Cómo tratamos los datos de tus clientes por cuenta de tu negocio.", en: "How we process your clients' data on behalf of your business." },
  },
  {
    id: "uso",
    href: "/uso-aceptable",
    icono: "mano",
    soloEs: true,
    nombre: { es: "Uso aceptable", en: "Acceptable use" },
    resumen: { es: "Lo que se puede y lo que no se puede hacer con Atendel.", en: "What you can and can't do with Atendel." },
  },
  {
    id: "reembolsos",
    href: "/reembolsos",
    icono: "facturacion",
    soloEs: true,
    nombre: { es: "Cancelaciones y reembolsos", en: "Cancellations and refunds" },
    resumen: { es: "Cómo cancelar Free, One o Max y cuándo procede un reembolso.", en: "How to cancel Free, One or Max and when a refund applies." },
  },
  {
    id: "ia",
    href: "/inteligencia-artificial",
    icono: "agentes",
    soloEs: true,
    nombre: { es: "Inteligencia artificial", en: "Artificial intelligence" },
    resumen: { es: "Cómo usa Atendel la IA, sus límites y lo que siempre decides tú.", en: "How Atendel uses AI, its limits and what you always decide." },
  },
  {
    id: "servicio",
    href: "/nivel-de-servicio",
    icono: "reloj",
    soloEs: true,
    nombre: { es: "Nivel de servicio (SLA)", en: "Service level (SLA)" },
    resumen: { es: "Disponibilidad, mantenimientos, soporte y cómo te avisamos de fallas.", en: "Availability, maintenance, support and how we tell you about outages." },
  },
  {
    id: "proveedores",
    href: "/proveedores",
    icono: "negocio",
    soloEs: true,
    nombre: { es: "Proveedores y subencargados", en: "Providers and subprocessors" },
    resumen: { es: "Quién nos ayuda a darte el servicio y dónde se guardan los datos.", en: "Who helps us provide the service and where data is stored." },
  },
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
    soloEs: "",
    soloEsCorto: "",
    centro: "Centro de privacidad",
    centroTitulo: "Centro de privacidad de Atendel",
    centroDescripcion: "Todos los documentos legales de Atendel en un solo lugar: privacidad, términos, cookies, tratamiento de datos, IA y más.",
    buscar: "Buscar en los documentos…",
    buscarAria: "Buscar en los documentos legales",
    secciones: "secciones",
    preguntas: "preguntas",
    resultados: "resultados",
    sinResultados: "No encontramos nada con esas palabras. Prueba con otras o escríbenos.",
    verTodo: "Ver todos los documentos",
    producto: "Atendel",
    agentes: "Agentes",
    precios: "Precios",
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
    soloEs: "This document is available in Spanish only for now. An English version is coming soon.",
    soloEsCorto: "Spanish only",
    centro: "Privacy Center",
    centroTitulo: "Atendel Privacy Center",
    centroDescripcion: "All of Atendel's legal documents in one place: privacy, terms, cookies, data processing, AI and more.",
    buscar: "Search the documents…",
    buscarAria: "Search the legal documents",
    secciones: "sections",
    preguntas: "questions",
    resultados: "results",
    sinResultados: "We couldn't find anything with those words. Try others or write to us.",
    verTodo: "See all documents",
    producto: "Atendel",
    agentes: "Agents",
    precios: "Pricing",
  },
} satisfies Record<Idioma, Record<string, string>>;
/** El Centro de privacidad. */
export const CENTRO_PRIVACIDAD = "/privacy";

export type EtiquetasLegales = (typeof ETIQUETAS_LEGALES)["es"];
