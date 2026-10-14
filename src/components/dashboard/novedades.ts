import type { Novedad } from "./tipos";

/**
 * Lo nuevo en Atendel, con la fecha real en que salió cada cosa (según el
 * historial del proyecto). Lo usan el panel y la demostración.
 */
export const NOVEDADES: Novedad[] = [
  { id: "n1", fecha: "8 oct", titulo: "Tu panel nuevo", texto: "El resumen del día, la actividad de tu equipo y tus agentes en un solo lugar." },
  { id: "n2", fecha: "3 oct", titulo: "Chats en grupo", texto: "Junta a varios agentes en una conversación y menciónalos con @." },
  { id: "n3", fecha: "3 oct", titulo: "Llegan Víctor e Iris", texto: "Clientes y Oficina se suman al equipo con Atendel Max." },
  { id: "n4", fecha: "30 sep", titulo: "Clara resume tus correos", texto: "Pega un correo o conecta tu Gmail, solo de lectura." },
];
