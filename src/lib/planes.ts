import { IDS_AGENTES, type IdAgente } from "./agentes";

/**
 * Los planes de Atendel. Los límites de mensajes y los precios son
 * provisionales: cámbialos aquí y se actualizan en toda la app.
 */

export type IdPlan = "free" | "one" | "max";

export type Plan = {
  id: IdPlan;
  nombre: string;
  /** null = todavía sin precio publicado */
  precio: string | null;
  resumen: string;
  incluye: string[];
  /** Mensajes al mes con los agentes en el chat. */
  mensajesMes: number;
  /** Agentes que se pueden usar con este plan. */
  agentes: readonly IdAgente[];
  /** Modelo de Claude que contesta en este plan. */
  modelo: "claude-haiku-4-5" | "claude-opus-5-5";
  /** Qué tanto piensa la IA antes de responder (más = respuestas más elaboradas). Solo aplica a Opus. */
  esfuerzo: "low" | "medium";
};

export const PLANES: Plan[] = [
  {
    id: "free",
    nombre: "Atendel Free",
    precio: "Gratis",
    resumen: "Para conocer Atendel con tu correo.",
    incluye: ["Clara, tu agente de correo", "30 mensajes al mes en el chat", "Resúmenes de correo"],
    mensajesMes: 30,
    agentes: ["clara"],
    // El plan gratis usa el modelo más económico
    modelo: "claude-haiku-4-5",
    esfuerzo: "low",
  },
  {
    id: "one",
    nombre: "Atendel One",
    precio: null,
    resumen: "Desbloquea a todo el equipo.",
    incluye: ["Los 4 agentes", "Eliges quién está en tu equipo", "600 mensajes al mes en el chat"],
    mensajesMes: 600,
    agentes: IDS_AGENTES,
    modelo: "claude-opus-5-5",
    esfuerzo: "low",
  },
  {
    id: "max",
    nombre: "Atendel Max",
    precio: null,
    resumen: "Para el negocio que no para.",
    incluye: ["Todo lo de One", "3,000 mensajes al mes en el chat", "Respuestas más elaboradas"],
    mensajesMes: 3000,
    agentes: IDS_AGENTES,
    modelo: "claude-opus-5-5",
    esfuerzo: "medium",
  },
];

export const PLAN_POR_ID = Object.fromEntries(PLANES.map((p) => [p.id, p])) as Record<IdPlan, Plan>;

export function planDe(valor: unknown): Plan {
  return valor === "one" || valor === "max" ? PLAN_POR_ID[valor] : PLAN_POR_ID.free;
}

/** Primer día del mes actual (como lo guarda la base de datos). */
export function mesActual() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
}
