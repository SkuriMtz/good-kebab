/**
 * Modo claro / oscuro.
 * - El sitio abre en modo oscuro (el diseño es negro). Si la persona eligió
 *   el claro con el botón, se recuerda para la próxima visita.
 * - Un script en <head> (layout.tsx) pone data-tema en <html> antes de pintar.
 * - Los colores viven en variables CSS (globals.css), así que todo lo que use
 *   los colores del sistema de diseño se adapta solo.
 */

export type Tema = "claro" | "oscuro";

export const CLAVE_TEMA = "atendel-tema-v5";
export const EVENTO_TEMA = "atendel:tema";

/** Color de la barra del navegador en cada modo (igual al fondo del sitio). */
const COLOR_BARRA: Record<Tema, string> = { claro: "#ffffff", oscuro: "#000000" };

/** Script que corre antes de pintar la página (evita el parpadeo). */
export const SCRIPT_TEMA = `(function(){document.documentElement.classList.add('js');var t;try{t=localStorage.getItem('${CLAVE_TEMA}')}catch(e){}if(t!=='claro'){t='oscuro'}document.documentElement.dataset.tema=t;if(t==='claro'){var m=document.querySelector('meta[name="theme-color"]');if(m){m.setAttribute('content','${COLOR_BARRA.claro}')}}})()`;

export function temaActual(): Tema {
  return document.documentElement.dataset.tema === "claro" ? "claro" : "oscuro";
}

/**
 * Cambia el modo y lo recuerda para la próxima visita. El cambio es un
 * fundido cruzado de toda la página (View Transitions, solo opacidad, 0.4 s;
 * ver globals.css). Sin soporte o con movimiento reducido, cambia al instante.
 */
export function ponerTema(tema: Tema) {
  const html = document.documentElement;
  if (html.dataset.tema === tema) return;
  const aplicar = () => {
    html.dataset.tema = tema;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", COLOR_BARRA[tema]);
  };
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (doc.startViewTransition && !quieto) doc.startViewTransition(aplicar);
  else aplicar();
  try {
    localStorage.setItem(CLAVE_TEMA, tema);
  } catch {
    // Sin almacenamiento (modo privado): igual cambia, solo no se recuerda
  }
  window.dispatchEvent(new CustomEvent(EVENTO_TEMA, { detail: tema }));
}

/**
 * Para los dibujos en canvas: convierte "var(--color-x)" en el color real del
 * modo actual. Hoy no lo usa nada del sitio; lo necesitan las partículas de
 * componentes-pendientes si algún día regresan.
 */
export function colorCss(valor: string) {
  if (!valor.startsWith("var(")) return valor;
  return getComputedStyle(document.documentElement).getPropertyValue(valor.slice(4, -1)).trim() || "#888";
}
