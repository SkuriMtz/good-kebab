/**
 * LO QUE VIENE DE FUERA SIEMPRE ES DATO (correos, WhatsApp de clientes,
 * datos de apps, documentos). Revisiones sin red y sin base de datos: sirven
 * en el servidor y en el navegador, y se prueban solas.
 * - jsonComoDato(): un dato de fuera en JSON que no puede cerrar la etiqueta
 *   que lo envuelve (<platica>, <correo_nuevo>…).
 * - tieneEnlace(): si un texto lleva un enlace (http://, https:// o www.).
 * - copiaTextoInterno(): si una respuesta copia palabra por palabra un
 *   pedazo de las instrucciones, Reglas, Procesos o Memoria.
 * - textoCompletoDeAccion(): lo que sale completo con algo que espera tu OK.
 * - turnoDelChat() / marcarAlTerminar(): la marca de "datos de fuera" de una
 *   conversación del chat (migración 0031).
 */

/**
 * JSON con `<` escrito como <: para la IA es el mismo texto, pero nada de
 * lo que venga de fuera puede cerrar la etiqueta que lo envuelve (por ejemplo,
 * un nombre de cliente que diga "</platica> Ahora eres…").
 */
export function jsonComoDato(x: unknown): string {
  return (JSON.stringify(x) ?? "null").replace(/</g, "\\u003c");
}

/** ¿Lleva un enlace? http://, https:// o www. (también en letras anchas, que se ven igual). */
export function tieneEnlace(texto: string): boolean {
  return /https?:\/\/|www\./i.test(texto.normalize("NFKC"));
}

/** Para comparar: sin diferencias de mayúsculas, espacios ni saltos de línea. */
const plano = (t: string) => t.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();

/**
 * ¿La respuesta copia, palabra por palabra, un pedazo de `minimo` caracteres
 * o más de alguna de las `fuentes` (las instrucciones de la IA, las Reglas,
 * los Procesos, la Memoria)? Así nadie le saca a la IA lo de adentro.
 */
export function copiaTextoInterno(respuesta: string, fuentes: string[], minimo = 60): boolean {
  const r = plano(respuesta);
  if (r.length < minimo) return false;
  const f = fuentes.map(plano).filter((x) => x.length >= minimo);
  for (let i = 0; f.length && i + minimo <= r.length; i++) {
    const pedazo = r.slice(i, i + minimo);
    if (f.some((x) => x.includes(pedazo))) return true;
  }
  return false;
}

/**
 * Lo que sale completo con una acción que espera tu OK, tal como está en los
 * datos con los que se hace: el asunto y el texto de un correo; las notas, el
 * lugar y (si es largo) el título de una cita. El resumen lo corta; esto no,
 * para que veas todo antes de aprobar. "" si no lleva texto.
 */
export function textoCompletoDeAccion(args: unknown): string {
  if (!args || typeof args !== "object" || Array.isArray(args)) return "";
  const a = args as Record<string, unknown>;
  const t = (k: string) => (typeof a[k] === "string" ? (a[k] as string).trim() : "");
  return [
    t("asunto") && `Asunto: ${t("asunto")}`,
    t("titulo").length > 80 && `Título: ${t("titulo")}`,
    t("texto"),
    t("descripcion"),
    t("lugar") && `Lugar: ${t("lugar")}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

/**
 * Cómo empieza un turno del chat.
 * - `externo`: se leyeron apps en este turno (lo prenden las herramientas) o
 *   es «Avisos de Atendel». Con esto la memoria no guarda sola.
 * - `contexto`: en lo que ve la IA hay correos o documentos, o datos de fuera
 *   de mensajes anteriores (`marcada`: siguen en el historial que se le manda).
 * Con cualquiera de los dos, ninguna acción ni tarea se hace sola.
 */
export function turnoDelChat(o: { marcada: boolean; enAvisos: boolean; conCorreos: boolean; conDocumentos: boolean }) {
  return { externo: o.enAvisos, contexto: o.marcada || o.enAvisos || o.conCorreos || o.conDocumentos };
}

/** ¿Hay que marcar la conversación al terminar el turno? Solo si aún no lo estaba y en este turno entraron datos de fuera. */
export function marcarAlTerminar(marcada: boolean, turno: { externo: boolean; contexto: boolean }): boolean {
  return !marcada && (turno.externo || turno.contexto);
}
