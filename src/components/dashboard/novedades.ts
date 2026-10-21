import type { Novedad } from "./tipos";

/**
 * Novedades de Atendel: cambios reales del producto, con la fecha en que
 * llegaron (sacadas del historial del proyecto). No se inventan: cuando
 * algo nuevo salga, se agrega arriba.
 */
export const NOVEDADES: Novedad[] = [
  {
    id: "panel",
    fecha: "2026-10-08",
    titulo: "Tu panel, en una sola pantalla",
    texto: "Lo que hizo tu equipo, lo que espera tu visto bueno y tu plan, juntos.",
  },
  {
    id: "grupos",
    fecha: "2026-10-03",
    titulo: "Chats en grupo con tus agentes",
    texto: "Junta a dos o más agentes en una conversación y cada uno responde en lo suyo.",
  },
  {
    id: "tema",
    fecha: "2026-10-03",
    titulo: "Modo claro y oscuro",
    texto: "Cámbialo desde el menú de tu perfil, arriba a la derecha.",
  },
  {
    id: "equipo",
    fecha: "2026-10-02",
    titulo: "Elige a tu equipo",
    texto: "Con Atendel Max decides qué agentes trabajan contigo.",
  },
  {
    id: "clara",
    fecha: "2026-09-30",
    titulo: "Clara resume tus correos",
    texto: "Pega un correo o conecta tu Gmail (solo lectura) y te dice qué conviene hacer.",
  },
];
