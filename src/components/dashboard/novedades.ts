import type { Novedad } from "./tipos";

/**
 * Novedades de Atendel (columna derecha, como "Latest changes"). Son cambios
 * reales del producto, con la fecha en que llegaron (ver el historial de git).
 * Cuando salga algo nuevo, se agrega arriba.
 */
export const NOVEDADES: Novedad[] = [
  {
    fecha: "8 oct",
    titulo: "Tu panel nuevo",
    detalle: "Lo que espera tu visto bueno va primero, y la actividad de tus agentes queda en una sola línea de tiempo.",
  },
  {
    fecha: "3 oct",
    titulo: "Chats en grupo con tus agentes",
    detalle: "Junta a varios agentes en un chat y menciónalos con @.",
  },
  {
    fecha: "3 oct",
    titulo: "Modo claro y oscuro",
    detalle: "Cámbialo desde el menú de tu cuenta.",
  },
  {
    fecha: "30 sep",
    titulo: "Clara resume los correos que pegues",
    detalle: "Pega un correo y te dice de qué trata y qué conviene hacer.",
  },
];
