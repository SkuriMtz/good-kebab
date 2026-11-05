import type { IdAgente } from "./agentes";
import { AGENTE_POR_ID } from "./agentes";

/**
 * Los "Primeros pasos" del panel, con lo que de verdad ya hizo la persona.
 * Puro (sin red): lo usan el servidor (para contar los pendientes) y la
 * barra del panel (el círculo de avance).
 */
export type PasoPanel = { id: "equipo" | "gmail" | "chat" | "grupo"; titulo: string; detalle: string; listo: boolean; href: string };

const nombres = (ids: readonly IdAgente[]) => {
  const n = ids.map((id) => AGENTE_POR_ID[id].nombre);
  if (n.length < 2) return n.join("");
  const ultimo = n[n.length - 1];
  return `${n.slice(0, -1).join(", ")} ${/^[iIíÍ]/.test(ultimo) ? "e" : "y"} ${ultimo}`;
};

export function pasosPanel(d: { activos: readonly IdAgente[]; conGoogle: boolean; conConversaciones: boolean; conGrupo: boolean; conGrupos: boolean }): PasoPanel[] {
  return [
    { id: "equipo", titulo: "Elige a tu equipo", detalle: nombres(d.activos), listo: d.activos.length > 0, href: "/panel/agentes" },
    { id: "gmail", titulo: "Conecta tu Gmail", detalle: "Clara lo lee. Solo lectura.", listo: d.conGoogle, href: "/panel?vista=correo#gmail" },
    { id: "chat", titulo: "Tu primera conversación", detalle: "Pídele algo a un agente.", listo: d.conConversaciones, href: "/panel" },
    ...(d.conGrupos ? [{ id: "grupo" as const, titulo: "Tu primer grupo", detalle: "Junta a dos agentes en un chat.", listo: d.conGrupo, href: "/panel" }] : []),
  ];
}
