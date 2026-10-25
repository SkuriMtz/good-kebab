import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/*
 * El sistema de movimiento del sitio público (la landing): fino y sutil,
 * como Apple. Pocas duraciones y dos curvas de salida. Los mismos valores
 * viven como variables CSS en src/estilos/landing.css (--mov-*), para que
 * lo que se mueve con CSS (estados) y con GSAP (entradas) se sienta igual.
 * Solo se animan transform y opacity.
 */

/** Duraciones en segundos. Estados: 150–250 ms. Entradas: 400–700 ms. */
export const DUR = {
  /** Presión de un botón o una fila (= --mov-presion). */
  presion: 0.15,
  /** Hover, foco, aparecer un aviso (= --mov-estado). */
  estado: 0.2,
  /** El resaltado que sigue al mouse en la lista de agentes (= --mov-estado-largo). */
  sigue: 0.25,
  /** Un bloque o un párrafo que entra (= --mov-entrada-corta). */
  entradaCorta: 0.45,
  /** Lo que entra al bajar (= --mov-entrada). */
  entrada: 0.6,
  /** Cada línea de un título que sube de su ranura (= --mov-entrada-larga). */
  titulo: 0.7,
} as const;

/** Curvas de salida: arrancan rápido y frenan suave. Nunca rebotan. */
export const CURVA = {
  /** Estados y fundidos (= --mov-curva-estado, cubic-bezier(0.25, 0.46, 0.45, 0.94)). */
  estado: "power2.out",
  /** Entradas y desplazamientos (= --mov-curva-entrada, cubic-bezier(0.215, 0.61, 0.355, 1)). */
  entrada: "power3.out",
} as const;

/** Escalonado entre piezas que entran juntas (60–80 ms). */
export const ESCALONADO = 0.07;
/** Lo que sube una pieza al entrar, en px. */
export const SUBIDA = 16;
/** Ninguna secuencia de entrada pasa de esto (la portada entra en menos de 1.2 s). */
export const ENTRADA_MAXIMA = 1.15;

export const CON_MOVIMIENTO = "(prefers-reduced-motion: no-preference)";
export const SIN_MOVIMIENTO = "(prefers-reduced-motion: reduce)";

/** ¿La persona pidió "reducir movimiento"? */
export function prefiereQuieto() {
  return typeof window !== "undefined" && window.matchMedia(SIN_MOVIMIENTO).matches;
}

/** Curva power3.out como función (para Lenis, que no entiende nombres de GSAP). */
export const salidaCubica = (t: number) => 1 - Math.pow(1 - t, 3);

let preparado = false;

/**
 * Registra ScrollTrigger, pone los valores por defecto de GSAP y recalcula
 * las posiciones cuando ya cargaron las letras (si no, los disparadores
 * quedan medidos con la letra de respaldo). Al terminar de cargar la página
 * (imágenes incluidas) ScrollTrigger ya se vuelve a medir solo (su evento
 * "load" de fábrica): no se pide otra vez, porque cada medida fuerza a
 * recalcular el diseño de toda la página. Se puede llamar muchas veces:
 * solo hace algo la primera.
 */
export function prepararGsap() {
  if (preparado || typeof window === "undefined") return;
  preparado = true;
  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ duration: DUR.entrada, ease: CURVA.entrada });
  document.fonts?.ready.then(() => ScrollTrigger.refresh()).catch(() => {});
}

/** Espera a que estén las letras, sin detener la entrada más de `maximo` ms. */
export function esperarLetras(maximo = 250): Promise<void> {
  if (typeof document === "undefined" || !document.fonts || document.fonts.status === "loaded") return Promise.resolve();
  return Promise.race([document.fonts.ready.then(() => undefined), new Promise<void>((r) => window.setTimeout(r, maximo))]);
}

/**
 * Lo que entra al bajar en el inicio (ScrollTrigger.batch, una sola vez).
 * Son las filas de la lista de agentes y los encabezados, filas y tarjetas
 * de las secciones que le siguen. Los textos de la portada y de "Tu equipo"
 * entran con Revela (línea por línea).
 */
export const APARECEN_INICIO = [
  "#agentes .m1-lista > li",
  "#en-vivo .encabezado > *",
  "#en-vivo .en-vivo__escenario",
  "#en-vivo .en-vivo__pie",
  "#que-es .contenedor > .etiqueta",
  "#que-es .que-es__frase",
  "#que-es .que-es__texto > p",
  "#que-es .dia__cabeza",
  "#que-es .dia__fila",
  "#como-funciona .pasos__cabeza > *",
  "#como-funciona .paso",
  "#para-quien-es .negocios__cabeza > *",
  "#para-quien-es .pestanas",
  "#seguridad .garantias__cabeza > *",
  "#seguridad .garantia",
  "#precios .encabezado > *",
  "#precios .enlace-flecha",
  "#precios .plan",
  "#precios .planes-nota",
  "#preguntas .faq-doble__lado > *",
  "#preguntas .faq-doble__preguntas > *",
  "#lista .cta-final__centro > *",
].join(", ");
