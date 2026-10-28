/**
 * El inicio, escena por escena, igual que los videos de referencia
 * (medidas en diseno/capturas/dala/MEDIDAS.md, a 1212×750).
 *
 * - Las 8 escenas tienen el mismo nombre en la página y en el fondo de
 *   figuras: <FondoFiguras escena="caos" />.
 * - En computadora la página mide lo mismo que la del video: 10 090 px a
 *   750 de alto de ventana (1345.3vh). Cada bloque empieza donde el video se
 *   detiene en esa escena (los "reposos"), así que con el mismo scroll todo
 *   queda en el mismo lugar.
 * - El fondo cambia de figura donde el video la cambia: cuando el borde de
 *   arriba del bloque de la escena cruza una línea de la pantalla (CAMBIOS).
 *   Así funciona igual en celular, donde los bloques miden otra cosa.
 * - La barra enciende sus enlaces donde el video enciende los suyos.
 */

export const ESCENAS_INICIO = ["portada", "decisiones", "caos", "foco", "globo", "equipo", "planes", "cierre"] as const;
export type EscenaInicio = (typeof ESCENAS_INICIO)[number];

export const esEscenaInicio = (s: unknown): s is EscenaInicio =>
  typeof s === "string" && (ESCENAS_INICIO as readonly string[]).includes(s);

/** Alto de la ventana con el que se midió el video. */
export const ALTO_VIDEO = 750;

/**
 * Dónde empieza cada bloque en el video (su scroll en reposo, en px a 750
 * de alto) y dónde termina la página. Los altos de los bloques en CSS
 * (src/estilos/inicio.css) salen de aquí: (siguiente − este) / 7.5 vh.
 */
export const REPOSOS = {
  portada: 0,
  decisiones: 1235,
  caos: 2023,
  foco: 5571,
  globo: 6830,
  equipo: 7770,
  planes: 8485,
  cierre: 9340,
  fin: 10090,
} as const;

/**
 * Cuándo cambia la figura del fondo: cuando el borde de arriba del bloque
 * de la escena llega a `linea` (fracción del alto de la pantalla, desde
 * arriba). Sale de los cambios del video:
 * - decisiones a 40 px de scroll: en cuanto se empieza a bajar (el cerebro gira y se va a la izquierda);
 * - caos a 1260: al salir del reposo de decisiones (el cerebro se hunde en polvo);
 * - foco a 4510: al salir del reposo del polvo; el foco se forma en el siguiente tramo;
 * - globo a 5640, equipo a 7050, planes a 7800 y cierre a 8560: donde el video empieza a deshacer la figura anterior.
 */
export const CAMBIOS: { escena: Exclude<EscenaInicio, "portada">; linea: number }[] = [
  { escena: "decisiones", linea: (REPOSOS.decisiones - 40) / ALTO_VIDEO },
  { escena: "caos", linea: (REPOSOS.caos - 1260) / ALTO_VIDEO },
  { escena: "foco", linea: (REPOSOS.foco - 4510) / ALTO_VIDEO },
  { escena: "globo", linea: (REPOSOS.globo - 5640) / ALTO_VIDEO },
  { escena: "equipo", linea: (REPOSOS.equipo - 7050) / ALTO_VIDEO },
  { escena: "planes", linea: (REPOSOS.planes - 7800) / ALTO_VIDEO },
  { escena: "cierre", linea: (REPOSOS.cierre - 8560) / ALTO_VIDEO },
];

export type EnlaceActivo = "" | "agentes" | "precios";

/**
 * El enlace encendido de la barra (como "MANIFESTO" y "TEAM" del video):
 * "Agentes" se enciende cuando el primer grupo del caos llega arriba (2400)
 * y "Precios" al pasar del equipo a los planes (8100).
 */
export const ENLACES: { enlace: Exclude<EnlaceActivo, "">; bloque: EscenaInicio; linea: number }[] = [
  { enlace: "agentes", bloque: "caos", linea: (REPOSOS.caos - 2400) / ALTO_VIDEO },
  { enlace: "precios", bloque: "planes", linea: (REPOSOS.planes - 8100) / ALTO_VIDEO },
];

/** Aviso que pide abrir la lista de espera (lo escucha DialogoLista). */
export const EVENTO_LISTA = "atendel:lista";
