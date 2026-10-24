/**
 * Modo claro / oscuro / como el sistema.
 * - El sitio abre en modo oscuro (oscuro primero). Si la persona eligió el
 *   claro, o "como el sistema", se recuerda para la próxima visita.
 * - "Sistema" sigue al teléfono o la computadora (prefers-color-scheme) y
 *   cambia solo si el sistema cambia mientras la página está abierta.
 * - Un script en <head> (layout.tsx) pone data-tema en <html> antes de pintar.
 * - Los colores viven en variables CSS (globals.css), así que todo lo que use
 *   los colores del sistema de diseño se adapta solo.
 */

/** Lo que se pinta. */
export type Tema = "claro" | "oscuro";
/** Lo que la persona eligió. */
export type PreferenciaTema = Tema | "sistema";

export const CLAVE_TEMA = "atendel-tema-v5";
export const EVENTO_TEMA = "atendel:tema";

/**
 * Color de la barra del navegador en cada modo: el fondo de las páginas
 * (#0d1117 en oscuro; en claro, el gris cálido del sitio público, muy cerca
 * del #f5f5f7 del dashboard).
 */
export const COLOR_BARRA: Record<Tema, string> = { claro: "#f7f6f3", oscuro: "#0d1117" };

/** Script que corre antes de pintar la página (evita el parpadeo). */
export const SCRIPT_TEMA = `(function(){var d=document.documentElement;d.classList.add('js');var p;try{p=localStorage.getItem('${CLAVE_TEMA}')}catch(e){}var t=p==='claro'?'claro':p==='sistema'&&window.matchMedia&&matchMedia('(prefers-color-scheme: light)').matches?'claro':'oscuro';d.dataset.tema=t;d.dataset.preferencia=p==='claro'||p==='sistema'?p:'oscuro';var m=document.querySelector('meta[name="theme-color"]');if(m){m.setAttribute('content',t==='claro'?'${COLOR_BARRA.claro}':'${COLOR_BARRA.oscuro}')}})()`;

export function temaActual(): Tema {
  return document.documentElement.dataset.tema === "claro" ? "claro" : "oscuro";
}

export function preferenciaActual(): PreferenciaTema {
  const p = document.documentElement.dataset.preferencia;
  return p === "claro" || p === "sistema" ? p : "oscuro";
}

const sistemaClaro = () => window.matchMedia("(prefers-color-scheme: light)").matches;
const resolver = (p: PreferenciaTema): Tema => (p === "sistema" ? (sistemaClaro() ? "claro" : "oscuro") : p);

/** Pinta un modo (con el fundido cruzado) sin cambiar la preferencia guardada. */
function pintar(tema: Tema) {
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
  window.dispatchEvent(new CustomEvent(EVENTO_TEMA, { detail: tema }));
}

let escuchaSistema: MediaQueryList | null = null;
const alCambiarSistema = () => {
  if (preferenciaActual() === "sistema") pintar(sistemaClaro() ? "claro" : "oscuro");
};

/** Con "sistema", sigue los cambios del sistema mientras la página está abierta. */
export function seguirSistema() {
  if (escuchaSistema || typeof window === "undefined") return;
  escuchaSistema = window.matchMedia("(prefers-color-scheme: light)");
  escuchaSistema.addEventListener("change", alCambiarSistema);
}

/**
 * Cambia el modo y lo recuerda para la próxima visita. El cambio es un
 * fundido cruzado de toda la página (View Transitions, solo opacidad, 0.4 s;
 * ver globals.css). Sin soporte o con movimiento reducido, cambia al instante.
 * Acepta "sistema": pinta lo que diga el sistema y lo sigue.
 */
export function ponerTema(preferencia: PreferenciaTema) {
  document.documentElement.dataset.preferencia = preferencia;
  try {
    localStorage.setItem(CLAVE_TEMA, preferencia);
  } catch {
    // Sin almacenamiento (modo privado): igual cambia, solo no se recuerda
  }
  if (preferencia === "sistema") seguirSistema();
  const tema = resolver(preferencia);
  if (document.documentElement.dataset.tema === tema) window.dispatchEvent(new CustomEvent(EVENTO_TEMA, { detail: tema }));
  else pintar(tema);
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
