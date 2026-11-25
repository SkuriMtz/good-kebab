/**
 * LÍNEAS DE ESTADO EN EL STREAM DEL CHAT (POST /api/chat)
 *
 * Mientras un agente usa una app (p. ej. "Altair está revisando tu correo…"),
 * el servidor mete en el texto del stream un marco:
 *
 *   "\u0001" + texto del estado + "\u0002"
 *
 * Solo si el cliente lo pide (cuerpo `estados: true` o cabecera
 * `X-Atendel-Estados: 1`); sin pedirlo, el stream es el texto de siempre.
 * El texto del modelo nunca trae esos caracteres (el servidor los quita).
 *
 * TU EQUIPO TRABAJANDO: cuando Atendel le encarga algo a un empleado, el
 * stream lleva otro marco con un evento en JSON:
 *
 *   "\u0003" + {"t":"inicio"|"estado"|"listo"|"error", "id", …} + "\u0004"
 *
 * - inicio: { id, agente, titulo, pos } (pos: en qué parte del texto van las tarjetitas)
 * - estado: { id, texto } (lo que está haciendo: «Revisando tu correo…»)
 * - listo / error: { id, resultado } (lo que reportó, o por qué no salió)
 * El marco de error de siempre ("\u0000ERROR:…") no cambia.
 *
 * Sin dependencias: se usa en el navegador y en el servidor.
 */

import type { IdAgente } from "./agentes";

export const INICIO_ESTADO = "\u0001";
export const FIN_ESTADO = "\u0002";

export const INICIO_EQUIPO = "\u0003";
export const FIN_EQUIPO = "\u0004";

/** Quita los caracteres que el stream usa como marcas (el texto del modelo y de los datos nunca los lleva). */
export const sinMarcasStream = (t: string) => t.replace(/[\u0000-\u0004]/g, "");

export const marcoEstado = (texto: string) => `${INICIO_ESTADO}${sinMarcasStream(texto)}${FIN_ESTADO}`;


export type EventoEquipo =
  | { t: "inicio"; id: string; agente: IdAgente; titulo: string; pos: number }
  | { t: "estado"; id: string; texto: string }
  | { t: "listo" | "error"; id: string; resultado: string };

/** Un encargo como se ve en la tarjetita (en vivo o desde el historial). */
export type Encargo = { id: string; agente: IdAgente; titulo: string; estado: "trabajando" | "listo" | "error"; resultado: string; ahora?: string; pos: number };

const AGENTES_OK = new Set(["lola", "clara", "victor", "iris"]);

export const marcoEquipo = (e: EventoEquipo) => `${INICIO_EQUIPO}${JSON.stringify(e).replace(/[\u0000-\u0004]/g, "")}${FIN_EQUIPO}`;

/** Lee un evento del equipo (lo que no tenga la forma exacta, se ignora). */
function leerEvento(json: string): EventoEquipo | null {
  try {
    const e = JSON.parse(json) as Record<string, unknown>;
    const id = typeof e.id === "string" ? e.id.slice(0, 64) : "";
    if (!id) return null;
    if (e.t === "inicio" && typeof e.agente === "string" && AGENTES_OK.has(e.agente) && typeof e.titulo === "string")
      return { t: "inicio", id, agente: e.agente as IdAgente, titulo: e.titulo.slice(0, 120), pos: typeof e.pos === "number" && e.pos >= 0 ? Math.floor(e.pos) : 0 };
    if (e.t === "estado" && typeof e.texto === "string") return { t: "estado", id, texto: e.texto.slice(0, 160) };
    if ((e.t === "listo" || e.t === "error") && typeof e.resultado === "string") return { t: e.t, id, resultado: e.resultado.slice(0, 4000) };
  } catch {
    /* a medio llegar o roto: se ignora */
  }
  return null;
}

/**
 * Separa los marcos del equipo: el resto del stream (texto y estados) y los
 * encargos como van. Un marco a medio llegar se esconde hasta completarse.
 */
export function separarEquipo(acumulado: string): { resto: string; encargos: Encargo[] } {
  let resto = "";
  const porId = new Map<string, Encargo>();
  let desde = 0;
  for (;;) {
    const a = acumulado.indexOf(INICIO_EQUIPO, desde);
    if (a < 0) {
      resto += acumulado.slice(desde);
      break;
    }
    resto += acumulado.slice(desde, a);
    const b = acumulado.indexOf(FIN_EQUIPO, a + 1);
    if (b < 0) break; // a medio llegar
    const e = leerEvento(acumulado.slice(a + 1, b));
    desde = b + 1;
    if (!e) continue;
    if (e.t === "inicio") porId.set(e.id, { id: e.id, agente: e.agente, titulo: e.titulo, estado: "trabajando", resultado: "", pos: e.pos });
    else {
      const x = porId.get(e.id);
      if (!x) continue;
      if (e.t === "estado") x.ahora = e.texto;
      else porId.set(e.id, { ...x, estado: e.t, resultado: e.resultado, ahora: undefined });
    }
  }
  return { resto, encargos: Array.from(porId.values()) };
}

/**
 * Separa el texto acumulado del stream en lo que se muestra y el estado
 * vigente. El estado vale mientras no llegue texto nuevo después de él; un
 * marco a medio llegar se esconde hasta que se complete.
 */
export function separarEstado(acumulado: string): { texto: string; estado: string | null } {
  let texto = "";
  let estado: string | null = null;
  let desde = 0;
  let largoAlEstado = 0;
  for (;;) {
    const a = acumulado.indexOf(INICIO_ESTADO, desde);
    if (a < 0) {
      texto += acumulado.slice(desde);
      break;
    }
    texto += acumulado.slice(desde, a);
    const b = acumulado.indexOf(FIN_ESTADO, a + 1);
    if (b < 0) break; // a medio llegar
    estado = acumulado.slice(a + 1, b) || null;
    largoAlEstado = texto.length;
    desde = b + 1;
  }
  if (estado !== null && texto.slice(largoAlEstado).trim()) estado = null;
  return { texto, estado };
}
