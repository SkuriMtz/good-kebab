import { IDS_AGENTES, type IdAgente } from "./agentes";

/**
 * Los planes de Atendel. Los límites de mensajes y los precios son
 * provisionales: cámbialos aquí y se actualizan en toda la app.
 */

export type IdPlan = "free" | "one" | "max";

export type Plan = {
  id: IdPlan;
  nombre: string;
  /** Qué tan completo es: Gratis, Medio o Completo. */
  nivel: string;
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
    nivel: "Gratis",
    precio: "Gratis",
    resumen: "Para conocer Atendel con tu agente de correo.",
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
    nivel: "Medio",
    precio: null,
    resumen: "Tu correo y tu atención a clientes.",
    incluye: [
      "Clara, tu agente de correo",
      "Lola, tu agente de atención: WhatsApp y citas",
      "Chats en grupo con tus agentes",
      "600 mensajes al mes en el chat",
    ],
    mensajesMes: 600,
    agentes: ["clara", "lola"],
    modelo: "claude-opus-5-5",
    esfuerzo: "low",
  },
  {
    id: "max",
    nombre: "Atendel Max",
    nivel: "Completo",
    precio: null,
    resumen: "Todo el equipo, para el negocio que no para.",
    incluye: [
      "Los 4 agentes: Atención, Correo, Clientes y Oficina",
      "Eliges quién está en tu equipo",
      "Chats en grupo con tus agentes",
      "3,000 mensajes al mes en el chat",
      "Respuestas más elaboradas",
    ],
    mensajesMes: 3000,
    agentes: IDS_AGENTES,
    modelo: "claude-opus-5-5",
    esfuerzo: "medium",
  },
];

export const PLAN_POR_ID = Object.fromEntries(PLANES.map((p) => [p.id, p])) as Record<IdPlan, Plan>;

/** El plan más sencillo que incluye a ese agente (para decir "Con Atendel One"). */
export function planMinimo(agente: IdAgente): Plan {
  return PLANES.find((p) => p.agentes.includes(agente)) ?? PLAN_POR_ID.max;
}

export function planDe(valor: unknown): Plan {
  return valor === "one" || valor === "max" ? PLAN_POR_ID[valor] : PLAN_POR_ID.free;
}

/** Primer día del mes actual (como lo guarda la base de datos). */
export function mesActual() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
}
