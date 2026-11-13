import { IDS_AGENTES, type IdAgente } from "./agentes";

/**
 * Los planes de Atendel. One y Max traen lo mismo (los 4 agentes, el mismo
 * modelo y las mismas funciones); lo único que cambia es cuánto uso traen:
 * Max, 5 veces el de One. Free es para probar, con Clara.
 *
 * El uso es un límite como el de Claude, no un número de mensajes: se mide
 * lo que de verdad cuesta cada respuesta de la IA (tokens de entrada y de
 * salida por el precio de su modelo, ver src/lib/uso.ts). Un mensaje corto
 * gasta poco; uno largo, una conversación larga, documentos o apps
 * consultadas gastan más. Hay dos ventanas, como en Claude: una sesión de
 * 5 horas (empieza con tu primer mensaje) y la semana (se reinicia el lunes).
 * Los límites y los precios son provisionales: cámbialos aquí.
 */

export type IdPlan = "free" | "one" | "max";

/** Cuánto se puede gastar en cada ventana, en micro-dólares de costo real (1,000,000 = 1 USD). */
export type LimiteUso = { sesion: number; semana: number };

export type Plan = {
  id: IdPlan;
  nombre: string;
  /** Qué tan completo es: Gratis o Completo. */
  nivel: string;
  /** null = todavía sin precio publicado */
  precio: string | null;
  resumen: string;
  incluye: string[];
  /** El límite de uso de la IA en el chat (por sesión de 5 horas y por semana). */
  limite: LimiteUso;
  /** Cómo se dice su uso en las páginas: "Para probar", "Uso estándar", "5 veces el uso de One". */
  uso: string;
  /** Agentes que se pueden usar con este plan. */
  agentes: readonly IdAgente[];
  /** Modelo de Claude que contesta en este plan. */
  modelo: "claude-haiku-4-5" | "claude-opus-5-5";
  /** Qué tanto piensa la IA antes de responder (más = respuestas más elaboradas). Solo aplica a Opus. */
  esfuerzo: "low" | "medium";
};

/** Las horas de la sesión, como en Claude. */
export const HORAS_SESION = 5;

/**
 * Los límites, en micro-dólares de costo de la IA. Con un mensaje típico
 * sin caché (~$0.01 en Free con Haiku; ~$0.05 a $0.10 en One y Max con
 * Opus), y más mensajes cuando la caché ayuda (mensajes seguidos):
 *   Free: sesión $0.12 (~12 mensajes), semana $0.30 (~30 a 40).
 *   One:  sesión $4 (~40 a 80 mensajes), semana $18 (~180 a 360; ~200 a 400 con caché).
 *   Max:  5 veces One: sesión $20, semana $90.
 * Lo más que puede costar la IA de una cuenta al mes (usándola al tope cada
 * semana, sin ayuda de la caché): Free ~$1.30, One ~$78, Max ~$390 USD.
 */
const ONE: LimiteUso = { sesion: 4_000_000, semana: 18_000_000 };
const VECES_MAX = 5;

export const PLANES: Plan[] = [
  {
    id: "free",
    nombre: "Atendel Free",
    nivel: "Gratis",
    precio: "Gratis",
    resumen: "Para conocer Atendel con tu agente de correo.",
    incluye: ["Clara, tu agente de correo", "Uso para probarlo", "Resúmenes de correo"],
    limite: { sesion: 120_000, semana: 300_000 },
    uso: "Para probar",
    agentes: ["clara"],
    // El plan gratis usa el modelo más económico
    modelo: "claude-haiku-4-5",
    esfuerzo: "low",
  },
  {
    id: "one",
    nombre: "Atendel One",
    nivel: "Completo",
    precio: null,
    resumen: "Todo el equipo, para tu día a día.",
    incluye: [
      "Los 4 agentes: Atención, Correo, Clientes y Oficina",
      "Eliges quién está en tu equipo",
      "Chats en grupo con tus agentes",
      "Respuestas más elaboradas",
      "Uso para el día a día",
    ],
    limite: ONE,
    uso: "Uso estándar",
    agentes: IDS_AGENTES,
    modelo: "claude-opus-5-5",
    esfuerzo: "medium",
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
      "Respuestas más elaboradas",
      "5 veces el uso de One",
    ],
    limite: { sesion: ONE.sesion * VECES_MAX, semana: ONE.semana * VECES_MAX },
    uso: "5 veces el uso de One",
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
