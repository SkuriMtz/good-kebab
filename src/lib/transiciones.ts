/*
 * Transición entre páginas (View Transitions API), sobria y rápida.
 * - Al ir a otra ruta, el navegador toma una foto de la página que sale,
 *   Next pinta la nueva y se cruzan: lo que sale se desvanece en 150 ms y lo
 *   que entra aparece en 300 ms subiendo 8px (src/estilos/transiciones.css).
 * - La barra, el fondo de fragmentos y, en el panel, su barra y su lateral
 *   llevan su propio view-transition-name: son iguales antes y después, así
 *   que se quedan quietos. Solo cambia el contenido.
 * - Los nombres solo existen mientras dura el cambio de página (clase
 *   `vt-pagina` en <html>). Así el cambio claro/oscuro (src/lib/tema.ts),
 *   que también usa View Transitions, sigue siendo un fundido de toda la
 *   página, igual que antes.
 * - Sin View Transitions, o con "reducir movimiento", la ruta cambia sin
 *   esto y queda el fundido de template.tsx.
 */

type TransicionVista = {
  finished: Promise<void>;
  ready: Promise<void>;
  updateCallbackDone: Promise<void>;
  skipTransition: () => void;
};
type DocumentoVT = Document & { startViewTransition?: (cambio: () => Promise<void>) => TransicionVista };

/** En <html> mientras dura el cambio de página. */
const PAGINA = "vt-pagina";
/** En <html> desde que se pinta la página nueva (lo que entra se nombra distinto de lo que sale). */
const NUEVA = "vt-nueva";
/** En <html> si al salir había una ventana abierta (ficha, cajón): la foto de salida es la pantalla tal cual. */
const CAPA = "vt-capa";
/**
 * En <html> si al salir la hoja del celular tapaba la página: lo de atrás
 * no se veía, así que tampoco se asoma mientras la hoja se desvanece.
 */
const TAPADA = "vt-tapada";
const HOJA_ABIERTA = '.hoja-nav[data-abierta="true"]';
/**
 * Mientras Next trae la página nueva, la pantalla se queda en la foto. Si
 * tarda más que esto (una página que pide datos al servidor), se suelta la
 * transición: la pantalla vuelve a responder y la página llega sin ella.
 */
const TOPE_MS = 400;

let enCurso: Promise<void> | null = null;
let esperando: { desde: string; soltar: () => void } | null = null;

/** ¿Este navegador puede hacer la transición (y la persona no pidió "reducir movimiento")? */
export function puedeTransicion() {
  if (typeof document === "undefined") return false;
  return typeof (document as DocumentoVT).startViewTransition === "function" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** ¿Hay un cambio de página en curso? (template.tsx lo lee al montar). */
export function enTransicion() {
  return typeof document !== "undefined" && document.documentElement.classList.contains(PAGINA);
}

/**
 * Se cumple cuando terminó el cambio de página (o de inmediato si no hay).
 * La entrada del texto (Revela, AlBajar) espera a esto: arranca cuando la
 * página ya llegó, no encima de la transición.
 */
export function trasLaTransicion(): Promise<void> {
  return enCurso ?? Promise.resolve();
}

/**
 * Cambia de página con la transición. `desde` es la ruta que se ve ahora;
 * `navegar` hace el cambio de verdad (router.push de Next, o el "atrás" del
 * navegador) y se llama ya con la foto de salida tomada.
 */
export function conTransicion(desde: string, navegar: () => void) {
  const doc = document as DocumentoVT;
  if (!puedeTransicion() || enCurso || !doc.startViewTransition) {
    navegar();
    return;
  }
  const html = document.documentElement;
  html.classList.add(PAGINA);
  if (document.querySelector("dialog[open]")) html.classList.add(CAPA);
  else if (document.querySelector(HOJA_ABIERTA)) html.classList.add(TAPADA);

  let soltar = () => {};
  const pintada = new Promise<void>((r) => {
    soltar = r;
  });
  let vt: TransicionVista;
  try {
    vt = doc.startViewTransition(() => {
      html.classList.remove(CAPA);
      html.classList.add(NUEVA);
      esperando = { desde, soltar };
      navegar();
      const tope = window.setTimeout(() => {
        vt.skipTransition();
        soltar();
      }, TOPE_MS);
      return pintada.then(() => window.clearTimeout(tope));
    });
  } catch {
    html.classList.remove(PAGINA, CAPA, TAPADA);
    navegar();
    return;
  }
  // Si el navegador la salta (otra transición, la pestaña oculta), no es un error
  vt.ready.catch(() => {});
  enCurso = vt.finished
    .catch(() => {})
    .then(() => {
      html.classList.remove(PAGINA, NUEVA, CAPA, TAPADA);
      enCurso = null;
      esperando = null;
    });
}

/** Avisa que React ya pintó `ruta`: si era la que se esperaba, la transición sigue. */
export function rutaPintada(ruta: string) {
  if (esperando && ruta !== esperando.desde) {
    esperando.soltar();
    esperando = null;
  }
}
