import { IDS_AGENTES, type IdAgente } from "./agentes";

/**
 * Los planes de Atendel. One y Max traen lo mismo (los 4 agentes, los dos
 * modelos y las mismas funciones); lo único que cambia es cuánto uso traen:
 * Max, 5 veces el de One. Free es para probar, con Clara y el modelo Rápido.
 *
 * Dos modelos, como el selector de Claude: Rápido (Claude Haiku 5.5, para
 * el día a día, gasta muy poco de la barra) y Avanzado (Claude Opus 5.5,
 * para lo pesado, gasta unas 40 veces más por mensaje).
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

/** Los modelos que se eligen en el chat. */
export type IdModelo = "rapido" | "avanzado";
export type ModeloApi = "claude-haiku-5-5" | "claude-opus-5-5";
export const MODELOS: Record<IdModelo, { id: IdModelo; nombre: string; detalle: string; aviso?: string; api: ModeloApi; esfuerzo: "low" | "medium" }> = {
  rapido: { id: "rapido", nombre: "Rápido", detalle: "Ayuda todos los días", api: "claude-haiku-5-5", esfuerzo: "medium" },
  avanzado: { id: "avanzado", nombre: "Avanzado", detalle: "Resuelve tareas pesadas", aviso: "Gasta más", api: "claude-opus-5-5", esfuerzo: "medium" },
};
export const esIdModelo = (v: unknown): v is IdModelo => v === "rapido" || v === "avanzado";

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
  /** Los modelos que se pueden elegir en el chat (el primero es el de inicio). */
  modelos: readonly IdModelo[];
};

/** Las horas de la sesión, como en Claude. */
export const HORAS_SESION = 5;

/**
 * Los límites, en micro-dólares de costo de la IA, pensados para que One a
 * $25 USD al mes nunca deje pérdida: aunque una cuenta llegue al tope todas
 * las semanas, su IA cuesta como máximo ~$17 al mes. Un mensaje cuesta
 * ~$0.002 a $0.004 con Rápido y ~$0.05 a $0.10 con Avanzado:
 *   Free: sesión $0.04, semana $0.10 (~25 a 50 mensajes con Rápido).
 *   One:  sesión $1, semana $3.90: con Rápido, cientos de mensajes por
 *         semana (60 al día caben de sobra); solo con Avanzado, ~40 a 80.
 *   Max:  5 veces One: sesión $5, semana $19.50.
 * Lo más que puede costar la IA de una cuenta al mes: Free ~$0.45,
 * One ~$17, Max ~$85 USD.
 */
const ONE: LimiteUso = { sesion: 1_000_000, semana: 3_900_000 };
const VECES_MAX = 5;

export const PLANES: Plan[] = [
  {
    id: "free",
    nombre: "Atendel Free",
    nivel: "Gratis",
    precio: "Gratis",
    resumen: "Para conocer Atendel con tu agente de correo.",
    incluye: ["Clara, tu agente de correo", "Uso para probarlo", "Resúmenes de correo"],
    limite: { sesion: 40_000, semana: 100_000 },
    uso: "Para probar",
    agentes: ["clara"],
    modelos: ["rapido"],
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
      "Modelos Rápido y Avanzado",
      "Uso para el día a día",
    ],
    limite: ONE,
    uso: "Uso estándar",
    agentes: IDS_AGENTES,
    modelos: ["rapido", "avanzado"],
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
      "Modelos Rápido y Avanzado",
      "5 veces el uso de One",
    ],
    limite: { sesion: ONE.sesion * VECES_MAX, semana: ONE.semana * VECES_MAX },
    uso: "5 veces el uso de One",
    agentes: IDS_AGENTES,
    modelos: ["rapido", "avanzado"],
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
