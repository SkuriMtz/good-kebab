/**
 * Limpia un renglón que escribió la IA para el informe: una sola línea, sin
 * enlaces, correos, teléfonos ni marcas de Markdown (para que no pueda armar
 * un enlace ni un formato raro), y cortada.
 */
export function limpiarRenglon(texto: unknown, max: number): string {
  if (typeof texto !== "string") return "";
  const limpio = texto
    .replace(/\b(?:https?:\/\/|www\.)\S+/gi, "")
    .replace(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,24}/gi, "")
    .replace(/\+?\d[\d\s().-]{7,}\d/g, "")
    .replace(/[[\]()<>*_`#|]/g, "")
    .replace(/^\s*[-•]\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
  return limpio.length > max ? `${limpio.slice(0, max - 1)}…` : limpio;
}
