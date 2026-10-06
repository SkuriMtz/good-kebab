import * as THREE from "three";

/**
 * La escena de la portada del inicio: "los mensajes sin contestar".
 *
 * Arriba de todo, las partículas están dispersas y lejanas, como mensajes
 * que nadie ha contestado (WhatsApp de noche, correos, recordatorios). Al
 * bajar, cada una viaja en línea recta hacia su lugar y se ordenan detrás
 * del halo en renglones, como una bandeja ya atendida: un renglón corto (quién
 * escribió) y uno o dos largos (qué pidió).
 *
 * Reglas que cuida (CLAUDE.md, lecciones 7, 8, 10 y 11):
 * - Brillo bajo: opacidad de 0.5 a 0.8 por partícula, sin bloom, sin mezcla
 *   aditiva (funciona igual sobre negro y sobre el gris cálido del modo claro).
 * - El canvas es fijo; solo cambia el estado de la escena con el scroll.
 * - Cada partícula sale de un punto que está sobre su mismo rayo desde el
 *   centro: el viaje es corto, hacia adentro, y nadie cruza la pantalla.
 * - Pocas partículas (unas 600 en computadora, 300 en celular).
 * Los colores no se escriben aquí: se leen de los tokens del modo activo.
 */

export type Campo = { destruir: () => void; recolorear: () => void };

/**
 * Los tokens de color que usa la escena (cambian con el modo). En oscuro, el
 * tercero es el blanco del texto (pocos puntos); en claro sería gris oscuro y
 * ensuciaría el gris cálido, así que ahí se usa el violeta de la acción.
 */
const TOKENS_OSCURO = ["--c-destacada", "--c-enlace", "--c-texto"] as const;
const TOKENS_CLARO = ["--c-destacada", "--c-enlace", "--c-accion"] as const;

function azar(a: number, b: number) {
  return a + Math.random() * (b - a);
}

const VERTEX = /* glsl */ `
attribute vec3 aOrden;     // su lugar en los renglones
attribute vec3 aSuelta;    // su lugar en el campo disperso
attribute float aTono;     // 0, 1 o 2: cuál de los tres colores
attribute float aAlfa;     // 0.5 a 0.8
attribute float aTam;
attribute vec3 aSemilla;   // fases y retraso propio
attribute float aPolvo;    // 1 = polvo lejano que nunca se ordena

uniform float uOrden;      // 0 disperso → 1 ordenado (ligado al scroll)
uniform float uTiempo;
uniform float uAltoPx;     // píxeles por unidad a 1 unidad de distancia
uniform float uFoco;       // distancia de la cámara al plano de los renglones
uniform float uOpacidad;   // opacidad general del modo
uniform float uColumna;    // ancho (en NDC) de la columna del texto que se despeja
uniform vec3 uColores[3];

varying vec3 vColor;
varying float vAlfa;
varying float vSuave;

void main() {
  // Retraso propio: las de afuera llegan un poco después (se asientan de adentro hacia afuera)
  float k = clamp((uOrden - aSemilla.z * 0.35) / 0.65, 0.0, 1.0);
  float t = 1.0 - pow(1.0 - k, 3.0); // sale rápido y se asienta suave
  t *= (1.0 - aPolvo);

  vec3 p = mix(aSuelta, aOrden, t);
  // Mientras está suelta, respira un poco; ya en su renglón, casi quieta
  float vida = mix(0.05, 0.006, t);
  p += vida * vec3(
    sin(uTiempo * 0.31 + aSemilla.x * 6.2831),
    cos(uTiempo * 0.27 + aSemilla.y * 6.2831),
    0.0
  );

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float dist = max(-mv.z, 0.01);
  gl_Position = projectionMatrix * mv;

  // Desenfoque por distancia al plano de los renglones: lo lejano, más grande y más tenue
  float blur = clamp(abs(dist - uFoco) / (uFoco * 0.6), 0.0, 1.0);
  float px = aTam * uAltoPx / dist * (1.0 + blur * 1.2);
  gl_PointSize = clamp(px, 1.0, 14.0);
  vSuave = mix(0.18, 0.5, blur);

  vec3 c = aTono < 0.5 ? uColores[0] : (aTono < 1.5 ? uColores[1] : uColores[2]);
  vColor = c;
  // El polvo se apaga mientras el resto se ordena: al final quedan muy pocas sueltas
  float polvo = mix(1.0, 1.0 - 0.75 * uOrden, aPolvo);
  // Mientras están sueltas, las que caen sobre la columna del texto se apagan:
  // el título y el formulario siempre se leen limpios (lección 11)
  float x = abs(gl_Position.x / gl_Position.w);
  float despeja = mix(0.3, 1.0, smoothstep(uColumna * 0.6, uColumna, x));
  vAlfa = aAlfa * uOpacidad * polvo * mix(despeja, 1.0, t) / (1.0 + blur * 1.1);
}
`;

const FRAGMENT = /* glsl */ `
varying vec3 vColor;
varying float vAlfa;
varying float vSuave;

void main() {
  float r = length(gl_PointCoord - 0.5) * 2.0;
  float a = (1.0 - smoothstep(1.0 - vSuave, 1.0, r)) * vAlfa;
  if (a < 0.004) discard;
  gl_FragColor = vec4(vColor, a);
}
`;

/** Lee un token de color del modo activo y lo pasa a THREE.Color (lineal). */
function colorDeToken(nombre: string, fallback: string) {
  const valor = getComputedStyle(document.documentElement).getPropertyValue(nombre).trim() || fallback;
  const c = new THREE.Color();
  try {
    c.setStyle(valor);
  } catch {
    c.setStyle(fallback);
  }
  // El shader escribe directo al canvas (sRGB): sin esto los tonos salen grises y apagados
  return c.convertLinearToSRGB();
}

/**
 * Arma los renglones y el campo disperso para un ancho y alto de vista
 * (en unidades del mundo, a la distancia del plano de los renglones).
 */
function armar(vistaAncho: number, vistaAlto: number, estrecho: boolean) {
  const ancho = vistaAncho * (estrecho ? 0.84 : 0.5);
  const paso = estrecho ? 0.075 : 0.08; // separación entre puntos del renglón
  const interlinea = estrecho ? 0.15 : 0.16;
  const entreMensajes = estrecho ? 0.12 : 0.14;
  const mensajes = 3;

  type Punto = { x: number; y: number; tono: number };
  const puntos: Punto[] = [];
  let y = 0;
  for (let m = 0; m < mensajes; m++) {
    // Renglón corto (quién escribe) y uno o dos largos (qué pidió)
    const largos = m === 1 ? 2 : 1;
    const renglones = [azar(0.22, 0.34), ...Array.from({ length: largos }, (_, i) => (i === largos - 1 ? azar(0.55, 0.9) : azar(0.88, 1)))];
    renglones.forEach((fraccion, r) => {
      const n = Math.max(3, Math.round((ancho * fraccion) / paso));
      for (let i = 0; i < n; i++) {
        puntos.push({ x: -ancho / 2 + i * paso, y, tono: r === 0 ? 0 : 1 });
      }
      y -= interlinea;
    });
    y -= entreMensajes;
  }
  // Centrar el bloque en su origen
  const alto = -y - entreMensajes - interlinea;
  for (const p of puntos) p.y += alto / 2;

  const ordenadas = puntos.length;
  const polvo = estrecho ? 90 : 160;
  const n = ordenadas + polvo;

  const orden = new Float32Array(n * 3);
  const suelta = new Float32Array(n * 3);
  const tono = new Float32Array(n);
  const alfa = new Float32Array(n);
  const tam = new Float32Array(n);
  const semilla = new Float32Array(n * 3);
  const esPolvo = new Float32Array(n);
  const radioMax = Math.hypot(ancho / 2, alto / 2) || 1;

  for (let i = 0; i < n; i++) {
    const polvoso = i >= ordenadas;
    let ox: number;
    let oy: number;
    if (polvoso) {
      ox = azar(-0.5, 0.5) * vistaAncho * 1.1;
      oy = azar(-0.5, 0.5) * vistaAlto * 1.1;
    } else {
      ox = puntos[i].x + azar(-0.006, 0.006);
      oy = puntos[i].y;
    }
    orden.set([ox, oy, 0], i * 3);

    // El lugar suelto: sobre el mismo rayo desde el centro, más afuera y a otra profundidad
    const r = Math.hypot(ox, oy) / radioMax;
    const lejos = azar(1.5, 2.6);
    const z = polvoso ? azar(-7, 2) : azar(-5, 2.5);
    // A más profundidad, más se abre para seguir llenando la pantalla
    const abre = lejos * (1 + Math.max(0, -z) * 0.12);
    suelta.set(
      polvoso
        ? [ox, oy, z]
        : [ox * abre + azar(-0.5, 0.5), oy * abre * (estrecho ? 2.4 : 1.6) + azar(-0.6, 0.6), z],
      i * 3,
    );

    const s = Math.random();
    // La mayoría en el color destacado o el cielo; pocos en el color del texto (pocos blancos)
    tono[i] = polvoso ? (s < 0.6 ? 0 : 1) : puntos[i].tono === 0 ? (s < 0.85 ? 0 : 2) : s < 0.88 ? 1 : 2;
    alfa[i] = azar(0.5, 0.8) * (polvoso ? 0.7 : 1);
    tam[i] = polvoso ? azar(0.018, 0.026) : azar(0.022, 0.03);
    semilla.set([Math.random(), Math.random(), Math.min(1, r * 0.75 + Math.random() * 0.25)], i * 3);
    esPolvo[i] = polvoso ? 1 : 0;
  }
  return { n, orden, suelta, tono, alfa, tam, semilla, esPolvo };
}

export function crearCampo(
  canvas: HTMLCanvasElement,
  opciones: { movil: boolean; portada: HTMLElement; halo: HTMLElement | null },
): Campo | null {
  const { movil, portada, halo } = opciones;
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, premultipliedAlpha: false, powerPreference: "low-power" });
  } catch {
    return null;
  }
  renderer.setClearColor(0x000000, 0);

  const escena = new THREE.Scene();
  const camara = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  const DIST = 10;
  camara.position.set(0, 0, DIST);

  const uniforms = {
    uOrden: { value: 0 },
    uTiempo: { value: 0 },
    uAltoPx: { value: 1000 },
    uFoco: { value: DIST },
    uOpacidad: { value: 0.7 },
    uColumna: { value: 0.5 },
    uColores: { value: [new THREE.Color(), new THREE.Color(), new THREE.Color()] },
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

  const geo = new THREE.BufferGeometry();
  const puntos = new THREE.Points(geo, material);
  puntos.frustumCulled = false;
  const grupo = new THREE.Group();
  grupo.add(puntos);
  escena.add(grupo);

  const recolorear = () => {
    const claro = document.documentElement.dataset.tema === "claro";
    const respaldo = claro ? ["#8c93fb", "#0969da", "#6e40f0"] : ["#8c93fb", "#8dd6ff", "#ffffff"];
    (claro ? TOKENS_CLARO : TOKENS_OSCURO).forEach((t, i) => uniforms.uColores.value[i].copy(colorDeToken(t, respaldo[i])));
    // En claro los puntos son oscuros sobre gris cálido: un poco más tenues para no ensuciar
    uniforms.uOpacidad.value = claro ? 0.5 : 0.8;
  };
  recolorear();

  // ---------- Medidas ----------
  let w = 1;
  let h = 1;
  let estrechoArmado: boolean | null = null;
  let anchoArmado = 0;
  const medir = () => {
    w = window.innerWidth;
    h = window.innerHeight;
    const estrecho = w < 768;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, movil ? 1.5 : 2));
    renderer.setSize(w, h, false);
    camara.aspect = w / h;
    camara.updateProjectionMatrix();
    uniforms.uAltoPx.value = (camara.projectionMatrix.elements[5] * h) / 2;
    const vistaAlto = 2 * Math.tan(THREE.MathUtils.degToRad(camara.fov / 2)) * DIST;
    const vistaAncho = vistaAlto * camara.aspect;
    // Rearmar solo si cambió el tipo de pantalla o el ancho cambió bastante (no con la barra del celular)
    if (estrechoArmado !== estrecho || Math.abs(w - anchoArmado) > 120) {
      estrechoArmado = estrecho;
      anchoArmado = w;
      const d = armar(vistaAncho, vistaAlto, estrecho);
      geo.setAttribute("position", new THREE.BufferAttribute(d.orden, 3));
      geo.setAttribute("aOrden", new THREE.BufferAttribute(d.orden, 3));
      geo.setAttribute("aSuelta", new THREE.BufferAttribute(d.suelta, 3));
      geo.setAttribute("aTono", new THREE.BufferAttribute(d.tono, 1));
      geo.setAttribute("aAlfa", new THREE.BufferAttribute(d.alfa, 1));
      geo.setAttribute("aTam", new THREE.BufferAttribute(d.tam, 1));
      geo.setAttribute("aSemilla", new THREE.BufferAttribute(d.semilla, 3));
      geo.setAttribute("aPolvo", new THREE.BufferAttribute(d.esPolvo, 1));
      geo.setDrawRange(0, d.n);
    }
    // Los renglones van detrás del halo (≈44% desde arriba; en celular, ≈47%, en el respiro que deja la portada), un poco inclinados hacia atrás
    grupo.position.y = vistaAlto * (estrecho ? 0.03 : 0.06);
    grupo.rotation.x = -0.22;
    // La columna del texto: ~720px de ancho en computadora; en celular casi toda la pantalla
    uniforms.uColumna.value = estrecho ? 0.9 : Math.min(0.95, 720 / w);
  };
  medir();

  // ---------- Scroll y puntero ----------
  // El orden avanza a medida que el contenido deja libre el lugar de los
  // renglones: empieza cuando el final del formulario sube del 72% de la
  // pantalla y termina cuando llega al 32% (en celular, del 80% al 36%, y la
  // portada deja un respiro abajo para que los renglones se vean solos).
  const contenido = portada.querySelector<HTMLElement>(".portada__contenido") ?? portada;
  const objetivo = () => {
    const estrecho = w < 768;
    const desde = estrecho ? 0.8 : 0.72;
    const hasta = estrecho ? 0.36 : 0.32;
    const fondo = (contenido.lastElementChild ?? contenido).getBoundingClientRect().bottom / h;
    return Math.min(1, Math.max(0, (desde - fondo) / (desde - hasta)));
  };
  let orden = objetivo();
  const puntero = { x: 0, y: 0, sx: 0, sy: 0 };
  const finoQuery = window.matchMedia("(pointer: fine)");
  const alMover = (e: PointerEvent) => {
    puntero.x = (e.clientX / w) * 2 - 1;
    puntero.y = (e.clientY / h) * 2 - 1;
  };
  if (finoQuery.matches) window.addEventListener("pointermove", alMover, { passive: true });

  // ---------- Cada cuadro (solo mientras la portada se ve) ----------
  let visible = true;
  let pedido = 0;
  const inicio = performance.now();
  const cuadro = () => {
    pedido = 0;
    const t = (performance.now() - inicio) / 1000;
    // El orden sigue al scroll con un poco de inercia: se asienta, no salta
    orden += (objetivo() - orden) * 0.08;
    uniforms.uOrden.value = orden;
    uniforms.uTiempo.value = t;
    puntero.sx += (puntero.x - puntero.sx) * 0.04;
    puntero.sy += (puntero.y - puntero.sy) * 0.04;
    camara.position.set(puntero.sx * 0.14, -puntero.sy * 0.1, DIST);
    camara.lookAt(0, 0, 0);
    // El halo toma un poco más de presencia cuando los mensajes ya están en orden
    if (halo) halo.style.opacity = `calc(var(--halo-opacidad) * ${(0.78 + 0.22 * orden).toFixed(3)})`;
    renderer.render(escena, camara);
    if (visible) pedido = requestAnimationFrame(cuadro);
  };
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !pedido) pedido = requestAnimationFrame(cuadro);
  });
  io.observe(portada);
  pedido = requestAnimationFrame(cuadro);

  const alRedimensionar = () => medir();
  window.addEventListener("resize", alRedimensionar);

  return {
    recolorear,
    destruir() {
      cancelAnimationFrame(pedido);
      io.disconnect();
      window.removeEventListener("resize", alRedimensionar);
      window.removeEventListener("pointermove", alMover);
      if (halo) halo.style.opacity = "";
      geo.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
}
