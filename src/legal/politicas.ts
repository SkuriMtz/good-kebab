/**
 * Los documentos legales de Atendel, en el orden del Centro de privacidad
 * (/privacy), del selector «Políticas» y del menú. Solo lo que no cambia con
 * el idioma: los nombres y textos van en el diccionario (t(idioma).legal) y
 * los documentos, en src/legal/documentos.ts (solo del servidor). Se puede
 * usar en el navegador.
 */
export const POLITICAS = [
  { id: "privacidad", href: "/privacidad", icono: "candado" },
  { id: "acceso", href: "/acceso-a-tus-datos", icono: "enlace" },
  { id: "preguntas", href: "/preguntas-privacidad", icono: "ayuda" },
  { id: "terminos", href: "/terminos", icono: "documento" },
  { id: "cookies", href: "/cookies", icono: "ajustes" },
  { id: "tratamiento", href: "/tratamiento-de-datos", icono: "escudo" },
  { id: "uso", href: "/uso-aceptable", icono: "mano" },
  { id: "reembolsos", href: "/reembolsos", icono: "facturacion" },
  { id: "ia", href: "/inteligencia-artificial", icono: "agentes" },
  { id: "servicio", href: "/nivel-de-servicio", icono: "reloj" },
  { id: "proveedores", href: "/proveedores", icono: "negocio" },
] as const;
export type Politica = (typeof POLITICAS)[number]["id"];

/** El Centro de privacidad. */
export const CENTRO_PRIVACIDAD = "/privacy";
