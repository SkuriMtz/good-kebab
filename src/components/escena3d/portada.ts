import * as THREE from "three";
import { colorCss } from "@/lib/tema";
import { crearGeometria, crearMaterial, type Lugar, type Propio } from "./material";

/**
 * La escena de la portada del inicio: el logo de Atendel (las cuatro esferas,
 * una por agente, acomodadas dos por dos como en la marca) hecho de los mismos
 * tetraedros de alambre diminutos de la escena 3D, muy tenue, detrás del halo.
 *
 * - Al cargar, el polvo de cada esfera se junta en su lugar (1.8 s, cada
 *   partícula cerca de su propia esfera: nada cruza la pantalla, lección 10).
 * - Después solo gira lento: un vaivén de ±0.5 rad cada 48 s, con una leve
 *   inclinación; con mouse, un parallax pequeño y amortiguado.
 * - Canvas FIJO (lección 8): la página se mueve encima y la figura se queda.
 *   Al bajar se apaga poco a poco; fuera de la portada no se dibuja.
 * - Brillo bajo (lección 7): opacidades 0.5–0.8 por partícula multiplicadas
 *   por una opacidad general baja; pocos blancos; sin bloom.
 * - Modo oscuro: suma de luz sobre #000. Modo claro: tinta violeta y gris
 *   sobre el gris cálido de la portada (mezcla normal, no aditiva).
 * Los colores se leen de los tokens CSS (globals.css), no van escritos aquí.
 */

export type MotorPortada = { destruir: () => void };

type Tono = "oscuro" | "claro";
type RGB = [number, number, number];

const R = 0.52; // radio de cada esfera (como en figuras.ts → logo)
const SEP = 0.62; // distancia del centro del logo al centro de cada esfera
const CENTROS: [number, number][] = [
  [-SEP, SEP], // Lola (arriba a la izquierda, como en la marca)
  [SEP, SEP], // Clara
  [-SEP, -SEP], // Víctor
  [SEP, -SEP], // Iris
];
const AGENTES = ["--agente-lola", "--agente-clara", "--agente-victor", "--agente-iris"];
const ENTRADA = 1.8; // segundos que tarda el logo en juntarse
const PERIODO = 48; // segundos de un vaivén completo

function rgb(variable: string): RGB {
  // THREE.Color entiende "#rrggbb" y "rgba(…)" (ignora el alfa). El shader
  // escribe el color tal cual, así que se piden los valores en sRGB.
  const c = new THREE.Color().setStyle(colorCss(`var(${variable})`));
  const s = { r: 0, g: 0, b: 0 };
  c.getRGB(s, THREE.SRGBColorSpace);
  return [s.r, s.g, s.b];
}
const mezcla = (a: RGB, b: RGB, k: number): RGB => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const por = (a: RGB, k: number): RGB => [a[0] * k, a[1] * k, a[2] * k];

/** Las dos paletas (una por modo), sacadas de los tokens. */
function paletas() {
  const agentes = AGENTES.map(rgb);
  const halo = rgb("--color-halo"); // lavanda del halo
  const violeta = rgb("--color-violeta-atendel");
  const cielo = rgb("--color-sky");
  const blanco = rgb("--color-snow");
  const hondo = rgb("--color-violeta-atendel-hondo");
  const tinta = rgb("--primer-texto");
  const azul = rgb("--primer-azul");
  return { agentes, halo, violeta, cielo, blanco, hondo, tinta, azul };
}

/**
 * El color de cada partícula según su esfera y el modo. El agente se nota
 * apenas (las cuatro esferas se distinguen, como en el logo), pero manda la
 * paleta de la portada: lavanda del halo, violeta y azul cielo, pocos blancos.
 */
function colorDe(k: number, azar: number, tono: Tono, p: ReturnType<typeof paletas>): RGB {
  const agente = p.agentes[k];
  if (tono === "oscuro") {
    if (azar < 0.03) return por(p.blanco, 0.7);
    const frio = azar < 0.55 ? p.halo : azar < 0.8 ? p.violeta : p.cielo;
    return por(mezcla(agente, frio, 0.58), 0.62 + azar * 0.2);
  }
  // Claro: tinta (no luz) sobre el gris cálido. Violeta y lavanda, algo de azul
  // de Primer, casi nada de gris: el shader oscurece según la luz (0.25–0.9),
  // así que se aclara antes para que no se vuelva gris sucio (lección 9).
  const frio = azar < 0.55 ? p.violeta : azar < 0.8 ? p.halo : azar < 0.96 ? p.azul : p.tinta;
  const c = por(mezcla(agente, frio, 0.62), 1.3);
  return [Math.min(1, c[0]), Math.min(1, c[1]), Math.min(1, c[2])];
}

/** El logo (destino) y el polvo de donde sale (origen), con el mismo número de puntos. */
function nubes(n: number, tono: Tono, p: ReturnType<typeof paletas>, azares: Float32Array) {
  const logo: Lugar = { pos: new Float32Array(n * 3), normal: new Float32Array(n * 3), color: new Float32Array(n * 3), alfa: new Float32Array(n) };
  const polvo: Lugar = { pos: new Float32Array(n * 3), normal: new Float32Array(n * 3), color: new Float32Array(n * 3), alfa: new Float32Array(n) };
  const porEsfera = Math.floor(n / 4);
  const dorado = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const k = Math.min(3, Math.floor(i / porEsfera));
    const m = i - k * porEsfera;
    const [cx, cy] = CENTROS[k];
    // Espiral de Fibonacci: puntos parejos sobre la superficie, sin huecos
    const y = 1 - ((m + 0.5) / porEsfera) * 2;
    const rr = Math.sqrt(Math.max(0, 1 - y * y));
    const a = m * dorado + k * 1.7;
    const nx = Math.cos(a) * rr;
    const nz = Math.sin(a) * rr;
    const az = azares[i * 2];
    const c = colorDe(k, az, tono, p);
    const alfa = 0.5 + azares[i * 2 + 1] * 0.3; // 0.5 a 0.8 (lección 7)
    // Esfera LLENA (no cascarón): puntos parejos en todo el volumen. Vista de
    // frente se lee como una esfera sólida y tenue, más densa al centro y
    // suave en la orilla: sin aro ni "agujero" (lección 10).
    const rr2 = R * Math.cbrt(0.08 + azares[i * 2 + 1] * 0.92);
    logo.pos.set([cx + nx * rr2, cy + y * rr2, nz * rr2], i * 3);
    logo.normal.set([nx, y, nz], i * 3);
    logo.color.set(c, i * 3);
    logo.alfa[i] = alfa;
    // El polvo: un volumen lleno alrededor de SU esfera (sin cascarón ni hueco)
    const d = 0.35 + Math.cbrt(azares[i * 2 + 1]) * 0.9;
    polvo.pos.set([cx + nx * R * (1 + d), cy + y * R * (1 + d), nz * R * (1 + d)], i * 3);
    polvo.color.set(c, i * 3);
    polvo.alfa[i] = alfa * 0.4;
  }
  return { logo, polvo };
}

export function crearMotorPortada(
  canvas: HTMLCanvasElement,
  opciones: { movil: boolean; seccion: HTMLElement | null; centro: HTMLElement | null },
): MotorPortada | null {
  const { movil, seccion, centro } = opciones;
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "low-power" });
  } catch {
    return null;
  }
  const temaDe = (): Tono => (document.documentElement.dataset.tema === "claro" ? "claro" : "oscuro");
  let tono = temaDe();

  const escena = new THREE.Scene();
  const camara = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camara.position.set(0, 0, 10);

  // ---------- Partículas ----------
  const N = movil ? 2400 : 6000;
  const azares = new Float32Array(N * 2).map(() => Math.random());
  const propio: Propio = {
    tam: new Float32Array(N).map(() => (movil ? 0.042 : 0.032) + Math.random() * 0.018),
    giro: new Float32Array(N * 4),
    semilla: new Float32Array(N * 4).map(() => Math.random()),
    dir: new Float32Array(N * 3),
  };
  for (let i = 0; i < N; i++) {
    // Retraso de salida ordenado por esfera: Lola, Clara, Víctor, Iris (como se lee el logo)
    propio.semilla[i * 4 + 2] = 0.55 * Math.min(1, Math.floor(i / (N / 4)) / 3) + 0.45 * Math.random();
    propio.giro.set([Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1, (0.25 + Math.random() * 0.6) * (Math.random() < 0.5 ? -1 : 1)], i * 4);
  }
  let pal = paletas();
  let { logo, polvo } = nubes(N, tono, pal, azares);
  const { material, uniforms } = crearMaterial({ deriva: 0.004, dof: 0.3 });
  const geo = crearGeometria(polvo, logo, propio, N);
  const figura = new THREE.Mesh(geo.geo, material);
  figura.frustumCulled = false;
  escena.add(figura);

  /** Pone los colores, la mezcla de luz y el fondo del modo actual. */
  const aplicarTono = () => {
    tono = temaDe();
    pal = paletas();
    ({ logo, polvo } = nubes(N, tono, pal, azares));
    geo.ponerFiguras(polvo, logo);
    material.blending = tono === "oscuro" ? THREE.AdditiveBlending : THREE.NormalBlending;
    material.needsUpdate = true;
    renderer.setClearColor(new THREE.Color().setStyle(colorCss("var(--c-portada)")), 1);
  };
  aplicarTono();

  // ---------- Medidas: el logo va detrás del bloque de texto ----------
  let w = 1;
  let h = 1;
  let escala = 1;
  let cy = 0; // centro vertical del logo, en unidades del mundo
  let altoSeccion = 1;
  const mitadAlto = Math.tan(THREE.MathUtils.degToRad(camara.fov / 2)) * 10;
  const medir = () => {
    w = window.innerWidth;
    h = window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, movil ? 1.5 : 2));
    renderer.setSize(w, h, false);
    camara.aspect = w / h;
    camara.updateProjectionMatrix();
    const mitadAncho = mitadAlto * camara.aspect;
    const ancho = 2 * (SEP + R); // lo que mide el logo de lado
    // Escritorio: 74% del alto. Celular: casi todo el ancho, sin pasar del 52% del alto.
    escala = w < 768 ? Math.min((mitadAncho * 2 * 0.96) / ancho, (mitadAlto * 2 * 0.52) / ancho) : (mitadAlto * 2 * 0.74) / ancho;
    // Centro del bloque de texto, medido como si la página estuviera arriba del todo
    if (centro) {
      const r = centro.getBoundingClientRect();
      const yPx = r.top + window.scrollY + r.height / 2;
      cy = -((yPx / h) * 2 - 1) * mitadAlto;
    }
    altoSeccion = seccion?.offsetHeight ?? h;
    uniforms.uAltoPx.value = (camara.projectionMatrix.elements[5] * h) / 2;
  };
  medir();

  // ---------- Mouse: parallax pequeño y amortiguado (solo con puntero fino) ----------
  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  const fino = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const alMover = (e: PointerEvent) => {
    mouse.x = (e.clientX / w) * 2 - 1;
    mouse.y = (e.clientY / h) * 2 - 1;
  };
  if (fino) window.addEventListener("pointermove", alMover, { passive: true });

  // ---------- Cada cuadro ----------
  const inicio = performance.now();
  let raf = 0;
  let visible = true;
  const cuadro = () => {
    raf = 0;
    const t = (performance.now() - inicio) / 1000;
    mouse.sx += (mouse.x - mouse.sx) * 0.035;
    mouse.sy += (mouse.y - mouse.sy) * 0.035;

    // Entrada: el polvo se junta en las cuatro esferas (la curva la pone el shader)
    uniforms.uMezcla.value = Math.min(1, t / ENTRADA);
    uniforms.uDispersa.value = 0.06;
    uniforms.uTime.value = t;

    // Al bajar, la figura se apaga (la página sigue encima; el canvas no se mueve)
    const avance = Math.min(1, Math.max(0, window.scrollY / Math.max(altoSeccion * 0.9, 1)));
    const base = tono === "oscuro" ? 0.36 : 0.15;
    uniforms.uOpacidad.value = base * (1 - avance * 0.85);

    figura.position.set(0, cy, 0);
    figura.scale.setScalar(escala);
    figura.rotation.set(
      0.14 + Math.sin(t * 0.07) * 0.05 + mouse.sy * 0.05,
      Math.sin((t / PERIODO) * Math.PI * 2) * 0.5 + mouse.sx * 0.1,
      Math.sin(t * 0.045) * 0.03,
    );
    renderer.render(escena, camara);
    if (visible) raf = requestAnimationFrame(cuadro);
  };
  const seguir = () => {
    if (!raf && visible) raf = requestAnimationFrame(cuadro);
  };

  // Fuera de la portada no se dibuja (ahorra batería en celular)
  const io = seccion
    ? new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        seguir();
      })
    : null;
  if (seccion && io) io.observe(seccion);

  // Cambio de modo: data-tema en <html> (src/lib/tema.ts)
  const mo = new MutationObserver(() => {
    if (temaDe() !== tono) {
      aplicarTono();
      seguir();
    }
  });
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-tema"] });

  const alRedimensionar = () => medir();
  window.addEventListener("resize", alRedimensionar);
  seguir();

  return {
    destruir() {
      if (raf) cancelAnimationFrame(raf);
      visible = false;
      io?.disconnect();
      mo.disconnect();
      window.removeEventListener("resize", alRedimensionar);
      window.removeEventListener("pointermove", alMover);
      geo.geo.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
}
