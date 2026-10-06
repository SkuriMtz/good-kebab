import * as THREE from "three";

/**
 * La escena 3D de la PORTADA del inicio: un "horizonte" de partículas.
 *
 * Un campo de partículas sobre un plano que se pierde a lo lejos, en el
 * tercio de abajo de la pantalla, con un oleaje muy lento. Es atmósfera, no
 * protagonista: el título y el halo quedan arriba, en el cielo limpio, y los
 * personajes flotan sobre este mar (como las mascotas sobre el horizonte de
 * una portada de producto). Reglas de las lecciones:
 * - Brillo bajo (lección 7): opacidad por partícula 0.5–0.8, multiplicada por
 *   la distancia; sin bloom, sin mezcla aditiva, pocos blancos (≈5 %).
 * - Fondo fijo (lección 8): el canvas no se mueve; la portada lo recorta.
 * - Nada de figuras que cruzan ni de círculos con hueco (lección 10): solo
 *   un plano que ondula.
 * - Texto siempre legible (lección 11): no hay partículas sueltas en el cielo.
 *
 * Los colores salen de los tokens del modo actual (no hay hex aquí):
 *   --c-destacada (violeta), --c-enlace (azul cielo / azul de Primer) y
 *   --c-texto (los pocos blancos fríos; en claro, tinta).
 * Al cambiar de modo se vuelven a leer. El canvas es transparente: el fondo
 * es el de la portada (#000 en oscuro, gris cálido en claro).
 *
 * Todo el oleaje vive en el shader (una sola llamada de dibujo, instancias).
 * Cada partícula es un punto suave de 1.6 a 3.2 px; lo cercano se desvanece
 * para que el campo se lea como una franja de horizonte y no como un muro.
 */

const VERTEX = /* glsl */ `
attribute vec2 aSuelo;   // lugar en el plano (x, z)
attribute vec4 aSemilla; // azar propio: x fase, y giro, z opacidad, w color

uniform float uTiempo;
uniform float uAltoPx;
uniform float uTam;
uniform float uLejos;
uniform float uAncho;
uniform float uOpacidad;
uniform vec3 uVioleta;
uniform vec3 uCielo;
uniform vec3 uFrio;

varying vec2 vLocal;
varying vec3 vColor;
varying float vAlfa;

// El oleaje: tres ondas lentas que se cruzan (nunca un patrón que se repite a la vista)
float ola(vec2 p, float t) {
  return 0.20 * sin(p.x * 0.33 + t * 0.22)
       + 0.16 * sin(p.y * 0.47 - t * 0.17 + p.x * 0.12)
       + 0.07 * sin((p.x - p.y) * 1.1 + t * 0.31);
}

void main() {
  vec2 s = aSuelo;
  float t = uTiempo;
  float y = ola(s, t);
  vec3 p = vec3(s.x, y, s.y);

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float dist = max(-mv.z, 0.01);
  // Tamaño en pantalla entre ~1.6 y ~3.2 px: las cercanas no se vuelven manchas
  float tam = min(uTam, 3.2 * dist / uAltoPx);
  float px = tam * uAltoPx / dist;
  // Si es más chica que 1.6 px, crece el cuadro y baja la opacidad (sin parpadeo)
  float crece = max(1.0, 1.6 / max(px, 0.01));
  mv.xy += position.xy * tam * crece;
  gl_Position = projectionMatrix * mv;
  vLocal = position.xy;

  // Color: valles violeta, crestas azul cielo y muy pocos blancos fríos
  float cresta = smoothstep(-0.18, 0.3, y);
  vec3 c = mix(uVioleta, uCielo, cresta);
  c = mix(c, uFrio, step(0.95, aSemilla.w) * 0.85);
  vColor = c;

  // Opacidad: 0.5–0.8 por partícula, se apaga a lo lejos, en las orillas y muy cerca
  float base = 0.5 + 0.3 * aSemilla.z;
  float lejos = 1.0 - smoothstep(uLejos * 0.45, uLejos, -s.y);
  float lados = 1.0 - smoothstep(uAncho * 0.55, uAncho, abs(s.x));
  // Lo cercano se desvanece: el campo se lee como una franja de horizonte, no como un muro
  float cerca = smoothstep(3.0, 7.5, dist);
  vAlfa = base * lejos * lados * cerca * uOpacidad / (crece * crece) * (0.55 + 0.45 * cresta);
}
`;

const FRAGMENT = /* glsl */ `
varying vec2 vLocal;
varying vec3 vColor;
varying float vAlfa;

void main() {
  // Punto suave, sin borde duro
  float a = (1.0 - smoothstep(0.3, 1.0, length(vLocal))) * vAlfa;
  if (a < 0.004) discard;
  gl_FragColor = vec4(vColor, a);
}
`;

export type Horizonte = { destruir: () => void };

/** Lee un color de un token (hex o rgb/rgba) del modo actual. */
function colorDeToken(nombre: string, respaldo: THREE.Color) {
  const valor = getComputedStyle(document.documentElement).getPropertyValue(nombre).trim();
  const rgb = valor.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/);
  if (rgb) return new THREE.Color(+rgb[1] / 255, +rgb[2] / 255, +rgb[3] / 255);
  if (/^#[0-9a-f]{3,8}$/i.test(valor)) return new THREE.Color(valor.slice(0, 7));
  return respaldo;
}

export function crearHorizonte(
  canvas: HTMLCanvasElement,
  opciones: {
    movil: boolean;
    zona: Element | null;
    /** El último elemento del texto de la portada: el horizonte cae debajo de él. */
    fin?: Element | null;
  },
): Horizonte | null {
  const { movil, zona, fin } = opciones;
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, premultipliedAlpha: true });
  } catch {
    return null;
  }
  renderer.setClearColor(0x000000, 0);

  const escena = new THREE.Scene();
  const camara = new THREE.PerspectiveCamera(40, 1, 0.1, 80);

  // ---------- El campo: una rejilla con un poco de azar (sin moiré) ----------
  const COLS = movil ? 84 : 150;
  const FILAS = movil ? 52 : 72;
  const ANCHO = 15; // de -15 a 15
  const LEJOS = 34; // z de -1 a -34
  const n = COLS * FILAS;
  const suelo = new Float32Array(n * 2);
  const semilla = new Float32Array(n * 4);
  for (let f = 0; f < FILAS; f++) {
    // Filas más juntas cerca y más separadas lejos: densidad pareja en pantalla
    const k = (f + Math.random() * 0.6) / FILAS;
    const z = -1 - Math.pow(k, 1.35) * LEJOS;
    for (let c = 0; c < COLS; c++) {
      const i = f * COLS + c;
      const x = ((c + Math.random() * 0.7) / COLS) * 2 * ANCHO - ANCHO;
      suelo[i * 2] = x;
      suelo[i * 2 + 1] = z;
      semilla.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);
    }
  }
  const cuadro = new THREE.PlaneGeometry(2, 2);
  const geo = new THREE.InstancedBufferGeometry();
  geo.index = cuadro.index;
  geo.setAttribute("position", cuadro.getAttribute("position"));
  geo.setAttribute("aSuelo", new THREE.InstancedBufferAttribute(suelo, 2));
  geo.setAttribute("aSemilla", new THREE.InstancedBufferAttribute(semilla, 4));
  geo.instanceCount = n;

  const uniforms = {
    uTiempo: { value: 0 },
    uAltoPx: { value: 1000 },
    uTam: { value: movil ? 0.032 : 0.028 },
    uLejos: { value: LEJOS },
    uAncho: { value: ANCHO },
    uOpacidad: { value: 1 },
    uVioleta: { value: new THREE.Color(0.55, 0.58, 0.98) },
    uCielo: { value: new THREE.Color(0.55, 0.84, 1) },
    uFrio: { value: new THREE.Color(1, 1, 1) },
  };
  const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.NormalBlending,
  });
  const campo = new THREE.Mesh(geo, material);
  campo.frustumCulled = false;
  escena.add(campo);

  // ---------- Colores del modo actual ----------
  const leerColores = () => {
    const claro = document.documentElement.dataset.tema === "claro";
    uniforms.uVioleta.value = colorDeToken("--c-destacada", uniforms.uVioleta.value);
    uniforms.uCielo.value = colorDeToken("--c-enlace", uniforms.uCielo.value);
    uniforms.uFrio.value = colorDeToken("--c-texto", uniforms.uFrio.value);
    // En claro las partículas son tinta sobre gris cálido: un poco más presentes
    uniforms.uOpacidad.value = claro ? 0.6 : 0.5;
  };
  leerColores();
  const vigia = new MutationObserver(() => {
    leerColores();
    if (!corriendo) dibujar();
  });
  vigia.observe(document.documentElement, { attributes: true, attributeFilter: ["data-tema"] });

  // ---------- Medidas ----------
  let w = 1;
  let h = 1;
  // Fracción de media pantalla bajo el centro donde cae el horizonte
  let bajo = 0.5;
  const medir = () => {
    w = window.innerWidth;
    h = window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, movil ? 1.5 : 2));
    renderer.setSize(w, h, false);
    camara.aspect = w / h;
    // En celular el horizonte baja un poco más: arriba va todo el texto
    camara.fov = w < 768 ? 46 : 40;
    camara.updateProjectionMatrix();
    uniforms.uAltoPx.value = (camara.projectionMatrix.elements[5] * h) / 2;
    // El horizonte va debajo del texto (en coordenadas de la página, con la
    // página arriba): nunca pasa detrás de la línea en Mono ni del formulario.
    // Se mide al cargar y al cambiar de tamaño, no con el scroll: el fondo es fijo.
    const r = fin?.getBoundingClientRect();
    const y = r ? r.bottom + window.scrollY + 48 : h * 0.75;
    bajo = Math.min(0.86, Math.max(0.3, (y - h / 2) / (h / 2)));
  };
  medir();

  // ---------- Cada cuadro ----------
  // La cámara mira un poco hacia arriba: el horizonte cae en el tercio de abajo.
  // El cursor la mueve apenas (con retraso), para dar profundidad.
  const cursor = { x: 0, y: 0, sx: 0, sy: 0 };
  const alMover = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    cursor.x = (e.clientX / w) * 2 - 1;
    cursor.y = (e.clientY / h) * 2 - 1;
  };
  const inicio = performance.now();
  const dibujar = () => {
    const t = (performance.now() - inicio) / 1000;
    cursor.sx += (cursor.x - cursor.sx) * 0.03;
    cursor.sy += (cursor.y - cursor.sy) * 0.03;
    uniforms.uTiempo.value = t;
    const mitad = Math.tan(THREE.MathUtils.degToRad(camara.fov / 2));
    camara.position.set(cursor.sx * 0.35, 1.05 - cursor.sy * 0.08, 4);
    camara.lookAt(cursor.sx * 0.2, 1.05 - cursor.sy * 0.08 + bajo * mitad * 10, -6);
    renderer.render(escena, camara);
  };

  // Solo dibuja mientras la portada se ve (el canvas fijo está siempre "en pantalla")
  let raf = 0;
  let corriendo = false;
  const ciclo = () => {
    raf = requestAnimationFrame(ciclo);
    dibujar();
  };
  const arrancar = () => {
    if (corriendo) return;
    corriendo = true;
    raf = requestAnimationFrame(ciclo);
  };
  const parar = () => {
    corriendo = false;
    cancelAnimationFrame(raf);
  };
  const observador = zona
    ? new IntersectionObserver(([e]) => (e.isIntersecting && !document.hidden ? arrancar() : parar()))
    : null;
  if (observador && zona) observador.observe(zona);
  else arrancar();
  const alCambiarVisibilidad = () => {
    if (document.hidden) parar();
    else if (!zona || zona.getBoundingClientRect().bottom > 0) arrancar();
  };
  document.addEventListener("visibilitychange", alCambiarVisibilidad);

  const alRedimensionar = () => {
    medir();
    if (!corriendo) dibujar();
  };
  window.addEventListener("resize", alRedimensionar);
  window.addEventListener("pointermove", alMover, { passive: true });
  dibujar();

  return {
    destruir() {
      parar();
      observador?.disconnect();
      vigia.disconnect();
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
      window.removeEventListener("resize", alRedimensionar);
      window.removeEventListener("pointermove", alMover);
      geo.dispose();
      cuadro.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
}
