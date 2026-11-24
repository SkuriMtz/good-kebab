import type { IdModelo, Plan } from "./planes";
import { pctDe, type EstadoUso } from "./uso-estado";

/**
 * Atendel elige solo con qué modelo contestar (ya no hay selector en el chat):
 * Rápido para el día a día (preguntas, citas, mensajes, recordatorios) y
 * Avanzado para lo pesado (analizar, comparar, Excel, reportes, planes,
 * contratos, propuestas, investigar), si el plan lo trae. En la plática con
 * voz siempre Rápido (tiene que contestar al momento), y si ya va muy usado
 * el límite, Rápido para cuidar lo que queda. Sin llamadas extra: reglas.
 */

/** Trabajo pesado, en español y en inglés (el texto va sin acentos y en minúsculas). */
const PESADO = new RegExp(
  [
    "analiz\\w*",
    "analisis",
    "compar\\w*",
    "excel",
    "xlsx",
    "hoja de calculo",
    "reporte\\w*",
    "informe\\w*",
    "estrategi\\w*",
    "plan de (negocio|marketing|ventas|trabajo|accion|crecimiento)",
    "proyeccion\\w*",
    "presupuest\\w*",
    "finanz\\w*",
    "contrato\\w*",
    "investig\\w*",
    "propuesta\\w*",
    "cotizacion\\w*",
    "formula\\w*",
    "tabla\\w*",
    "pdf",
    "analy[sz]\\w*",
    "compare|comparison",
    "spreadsheet",
    "reports?",
    "strategy",
    "forecast\\w*",
    "budget\\w*",
    "contract\\w*",
    "research\\w*",
    "proposal\\w*",
  ]
    .map((p) => `\\b(?:${p})\\b`)
    .join("|"),
);

/** Un mensaje así de largo casi siempre es un encargo pesado (instrucciones, datos pegados). */
const LARGO = 1200;

export function elegirModelo({ mensaje, plan, uso, voz = false }: { mensaje: string; plan: Pick<Plan, "modelos">; uso?: Pick<EstadoUso, "sesion" | "semana"> | null; voz?: boolean }): IdModelo {
  const base = plan.modelos[0] ?? "rapido";
  if (!plan.modelos.includes("avanzado") || voz) return base;
  // Cuida lo que queda del límite: lo pesado gasta mucho más
  if (uso && (pctDe(uso.sesion) >= 70 || pctDe(uso.semana) >= 80)) return base;
  const texto = mensaje
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
  return texto.length > LARGO || PESADO.test(texto) ? "avanzado" : base;
}
