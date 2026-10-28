/**
 * Las 8 escenas del inicio, en orden. El fondo recibe el nombre de la escena
 * (y, si se quiere atar al scroll, qué tanto se ha avanzado hacia la siguiente).
 */
export const ESCENAS_FIGURAS = ["portada", "decisiones", "caos", "foco", "globo", "equipo", "planes", "cierre"] as const;
export type EscenaFiguras = (typeof ESCENAS_FIGURAS)[number];

export const esEscenaFiguras = (s: string | undefined | null): s is EscenaFiguras => !!s && (ESCENAS_FIGURAS as readonly string[]).includes(s);

/**
 * Dónde reposa cada escena en la página del video (scroll en px a 1212×750).
 * Sirve para que el laboratorio repita el scroll del video y para repartir
 * los cambios dentro de cada tramo (fracciones medidas en MEDIDAS.md §8).
 */
export const REPOSO_VIDEO = [0, 1235, 2023, 5571, 6830, 7770, 8485, 9340];

/** Posición continua (0 = portada … 7 = cierre) a partir del scroll del video. */
export function posicionDesdeScrollVideo(scroll: number): number {
  const r = REPOSO_VIDEO;
  if (scroll <= r[0]) return 0;
  for (let i = 0; i < r.length - 1; i++) {
    if (scroll <= r[i + 1]) return i + (scroll - r[i]) / (r[i + 1] - r[i]);
  }
  return r.length - 1;
}
