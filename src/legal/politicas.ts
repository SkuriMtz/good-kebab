/** Las políticas de Atendel (el selector «Políticas» y el pie de las páginas legales). */
export const POLITICAS = [
  { id: "privacidad", href: "/privacidad", nombre: "Aviso de privacidad" },
  { id: "terminos", href: "/terminos", nombre: "Términos y condiciones" },
  { id: "cookies", href: "/cookies", nombre: "Política de cookies" },
] as const;
export type Politica = (typeof POLITICAS)[number]["id"];
