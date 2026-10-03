/**
 * Modo claro / oscuro.
 * - Al cargar, un script en <head> (layout.tsx) pone data-tema en <html>:
 *   lo que la persona eligió, o si no, lo que usa su sistema.
 * - Los colores viven en variables CSS (globals.css), así que todo lo que
 *   use los colores del sistema de diseño se adapta solo.
 */

export type Tema = "claro" | "oscuro";

export const CLAVE_TEMA = "tema";
export const EVENTO_TEMA = "atendel:tema";

/** Script que corre antes de pintar la página (evita el parpadeo). */
export const SCRIPT_TEMA = `(function(){var d=document.documentElement;d.classList.add('js');var t;try{t=localStorage.getItem('${CLAVE_TEMA}')}catch(e){}if(t!=='claro'&&t!=='oscuro'){t=window.matchMedia('(prefers-color-scheme: light)').matches?'claro':'oscuro'}d.dataset.tema=t})()`;

export function temaActual(): Tema {
  return document.documentElement.dataset.tema === "claro" ? "claro" : "oscuro";
}

export function temaGuardado(): Tema | null {
  try {
    const t = localStorage.getItem(CLAVE_TEMA);
    return t === "claro" || t === "oscuro" ? t : null;
  } catch {
    return null;
  }
}

let fin = 0;

/** Cambia el modo con los colores animados. `guardar` lo recuerda para la próxima visita. */
export function ponerTema(tema: Tema, guardar = true) {
  const html = document.documentElement;
  if (html.dataset.tema === tema) return;
  const animar = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (animar) {
    html.classList.add("tema-cambiando");
    window.clearTimeout(fin);
    fin = window.setTimeout(() => html.classList.remove("tema-cambiando"), 700);
  }
  html.dataset.tema = tema;
  if (guardar) {
    try {
      localStorage.setItem(CLAVE_TEMA, tema);
    } catch {
      // Sin almacenamiento (modo privado): igual cambia, solo no se recuerda
    }
  }
  window.dispatchEvent(new CustomEvent(EVENTO_TEMA, { detail: tema }));
}

/** Para los dibujos en canvas: convierte "var(--color-x)" en el color real del modo actual. */
export function colorCss(valor: string) {
  if (!valor.startsWith("var(")) return valor;
  return getComputedStyle(document.documentElement).getPropertyValue(valor.slice(4, -1)).trim() || "#888";
}
