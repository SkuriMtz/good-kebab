import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";
import { burbuja, calendario, caos, cerebro, junta, logo, ordenar, PALETA, type Nube } from "./figuras";
import { crearGeometria, crearMaterial, type Lugar, type Propio } from "./material";

/**
 * La escena 3D (Three.js): un solo canvas FIJO detrás de todo el contenido.
 * El canvas nunca se mueve; la escena reacciona al progreso del scroll:
 *   logo → gira de frente y al centro → la cámara se acerca y la figura se va
 *   a la izquierda deshaciéndose por abajo → explota en caos → las partículas
 *   se juntan al centro con brillo cálido → burbuja de chat → calendario.
 * - Todo va ligado al scroll con GSAP ScrollTrigger (scrub de 1.2 s): si el
 *   usuario sube, todo regresa en reversa.
 * - Los tetraedros grandes flotantes se mueven con el scroll a distintas
 *   velocidades según su profundidad (parallax).
 * - La figura siempre está viva: gira y respira aunque no haya scroll.
 * Todo corre en el reloj de GSAP (el mismo del scroll suave de Lenis).
 */

export type Motor = { destruir: () => void };

const FONDO = 0x05050a;

function azar(a: number, b: number) {
  return a + Math.random() * (b - a);
}

/** El estado de la escena; el timeline del scroll lo va cambiando. */
type Estado = {
  forma: number; // 0 logo · 1 cerebro · 2 caos · 3 junta · 4 burbuja · 5 calendario (con decimales = en camino)
  x: number; // posición de la figura, en fracción de la mitad del ancho (+ = derecha)
  y: number; // en fracción de la mitad del alto (+ = arriba)
  rotX: number;
  rotY: number;
  rotZ: number;
  escala: number;
  camZ: number; // distancia de la cámara
  deshacer: number; // la parte de abajo se deshace
  dispersa: number; // qué tanto se abren las partículas al viajar
  vida: number; // cuánto gira sola la figura
  pantalla: number; // 1 = las partículas llenan la pantalla (caos)
  brillo: number; // opacidad general
};

/** La historia: cómo está la escena en cada punto del scroll (0 = arriba, 1 = abajo). */
const PASOS: [number, Partial<Estado>][] = [
  // 1. Portada: el logo a la derecha, girando lento
  [0, { forma: 0, x: 0.42, y: -0.02, rotX: 0.18, rotY: -0.35, rotZ: 0, escala: 1, camZ: 10, deshacer: 0, dispersa: 0, vida: 1, pantalla: 0, brillo: 0.62 }],
  // 2. Al empezar a bajar: gira hasta quedar de frente y al centro
  [0.08, { x: 0, y: 0, rotX: 0.04, rotY: 0, vida: 0.2 }],
  // 3. Qué es Atendel: el logo se vuelve un cerebro; la cámara se acerca y se va a la izquierda
  [0.18, { forma: 1, x: -0.48, y: 0.04, camZ: 8.2, escala: 0.82, rotY: 0.32, rotX: 0.1, dispersa: 0.08, vida: 0.3 }],
  // …y la parte de abajo del cerebro se empieza a deshacer en partículas
  [0.27, { deshacer: 0.8 }],
  // 4. La figura explota y las partículas se dispersan por toda la pantalla
  [0.36, { forma: 2, x: 0, y: 0, camZ: 10, escala: 1, rotX: 0, rotY: 0, deshacer: 0, dispersa: 0.4, pantalla: 1, vida: 0.15, brillo: 0.36 }],
  // 5. El problema: caos flotando
  [0.56, { rotY: 0.12 }],
  // 6. Se juntan poco a poco al centro, con brillo cálido
  [0.66, { forma: 3, pantalla: 0, dispersa: 0.08, rotY: 0, brillo: 0.22, vida: 0.4 }],
  [0.72, { brillo: 0.22 }],
  // 7. La solución: la burbuja de chat, inclinada, a la izquierda
  [0.82, { forma: 4, x: -0.42, y: 0, rotX: 0.15, rotY: 0.45, rotZ: 0.16, dispersa: 0.08, brillo: 0.46, vida: 0.6 }],
  [0.88, { rotY: 0.35 }],
  // 8. El final: el calendario a la derecha
  [0.97, { forma: 5, x: 0.42, rotX: 0.12, rotY: -0.45, rotZ: 0, dispersa: 0.08, brillo: 0.5 }],
  [1, {}],
];

export function crearMotor(canvas: HTMLCanvasElement, opciones: { movil: boolean; quieto: boolean }): Motor | null {
  const { movil, quieto } = opciones;
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance" });
  } catch {
    return null;
  }
  renderer.setClearColor(FONDO, 1);
  gsap.registerPlugin(ScrollTrigger);

  const escena = new THREE.Scene();
  const camara = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camara.position.set(0, 0, 10);

  // ---------- Las figuras (todas con el mismo número de puntos) ----------
  const N = movil ? 3000 : 14000;
  const FIGURAS: Nube[] = [logo(N), cerebro(N), caos(N), junta(N), burbuja(N), calendario(N)].map(ordenar);
  const propio: Propio = {
    tam: new Float32Array(N).map(() => (movil ? azar(0.055, 0.085) : azar(0.042, 0.075))),
    giro: new Float32Array(N * 4),
    semilla: new Float32Array(N * 4).map(() => Math.random()),
    dir: new Float32Array(N * 3),
  };
  for (let i = 0; i < N; i++) {
    propio.semilla[i * 4 + 2] = 0.7 * (i / N) + 0.3 * Math.random();
    propio.giro.set([azar(-1, 1), azar(-1, 1), azar(-1, 1), azar(0.3, 1.3) * (Math.random() < 0.5 ? -1 : 1)], i * 4);
    const u = azar(-1, 1);
    const a = azar(0, Math.PI * 2);
    const r = Math.sqrt(1 - u * u) * azar(0.3, 1);
    propio.dir.set([r * Math.cos(a), u * azar(0.3, 1), r * Math.sin(a)], i * 3);
  }
  const { material: matFigura, uniforms: uFigura } = crearMaterial({ deriva: 0.006, dof: 0.35 });
  const fig = crearGeometria(FIGURAS[0], FIGURAS[1], propio, N);
  let tramo = 0; // qué par de figuras está cargado (0 = logo→caos, 1 = caos→junta…)
  const figura = new THREE.Mesh(fig.geo, matFigura);
  figura.frustumCulled = false;
  escena.add(figura);

  // ---------- Tetraedros grandes flotando + polvo fino por toda la pantalla ----------
  const GRANDES = movil ? 12 : 22;
  const NF = GRANDES + (movil ? 70 : 220);
  const coloresF = [PALETA.ambar, PALETA.morado, PALETA.blanco, PALETA.ambar, PALETA.verdeAzul, PALETA.morado];
  const lugarF: Lugar = { pos: new Float32Array(NF * 3), normal: new Float32Array(NF * 3), color: new Float32Array(NF * 3), alfa: new Float32Array(NF) };
  const propioF: Propio = { tam: new Float32Array(NF), giro: new Float32Array(NF * 4), semilla: new Float32Array(NF * 4).map(() => Math.random()), dir: new Float32Array(NF * 3) };
  const flot = Array.from({ length: NF }, (_, i) => {
    if (i >= GRANDES) {
      // Polvo: triangulitos diminutos y tenues repartidos por todo el espacio
      const z = azar(-6, 4);
      const c = coloresF[Math.floor(Math.random() * coloresF.length)];
      const k = azar(0.45, 0.7);
      lugarF.color.set([c[0] * k, c[1] * k, c[2] * k], i * 3);
      lugarF.alfa[i] = azar(0.25, 0.55);
      propioF.tam[i] = azar(0.03, 0.05);
      propioF.giro.set([azar(-1, 1), azar(-1, 1), azar(-1, 1), azar(0.2, 0.8)], i * 4);
      propioF.semilla[i * 4 + 2] = 0;
      return { x: azar(-1.1, 1.1), y: Math.random(), z, vel: 0.15 + ((z + 7) / 14) * 1.1 };
    }
    const cerca = i % 5 === 0;
    const z = cerca ? azar(4.5, 7) : azar(-7, 2.5);
    const c = coloresF[i % coloresF.length];
    lugarF.color.set([c[0] * 0.7, c[1] * 0.7, c[2] * 0.7], i * 3);
    // Tenues: líneas delgadas y semitransparentes
    lugarF.alfa[i] = cerca ? azar(0.1, 0.16) : azar(0.25, 0.45);
    propioF.tam[i] = cerca ? azar(0.35, 0.55) : azar(0.16, 0.34);
    propioF.giro.set([azar(-1, 1), azar(-1, 1), azar(-1, 1), azar(0.12, 0.32) * (Math.random() < 0.5 ? -1 : 1)], i * 4);
    propioF.semilla[i * 4 + 2] = 0;
    // Velocidad de parallax: los cercanos se mueven más rápido que los lejanos
    return { x: azar(-1, 1), y: Math.random(), z, vel: 0.15 + ((z + 7) / 14) * 1.1 };
  });
  const { material: matFlot, uniforms: uFlot } = crearMaterial({ deriva: 0, dof: 1 });
  const flo = crearGeometria(lugarF, lugarF, propioF, NF, true);
  const flotantes = new THREE.Mesh(flo.geo, matFlot);
  flotantes.frustumCulled = false;
  escena.add(flotantes);

  // ---------- La historia, ligada al scroll ----------
  const estado = { ...(PASOS[0][1] as Estado) };
  const linea = gsap.timeline({ paused: true });
  for (let k = 1; k < PASOS.length; k++) {
    const [p0] = PASOS[k - 1];
    const [p1, valores] = PASOS[k];
    if (Object.keys(valores).length) linea.to(estado, { ...valores, duration: p1 - p0, ease: "power3.out" }, p0); // ≈ --ease-smooth-out
  }
  linea.duration(); // fija la duración total (= 1)
  const historia = document.querySelector<HTMLElement>("[data-historia]");
  const disparador = historia
    ? ScrollTrigger.create({ trigger: historia, start: "top top", end: "bottom bottom", scrub: 1.2, animation: linea })
    : null;

  // ---------- Medidas ----------
  let w = 1;
  let h = 1;
  let estrecho = false;
  let escalaBase = 1;
  const medir = () => {
    w = window.innerWidth;
    h = window.innerHeight;
    estrecho = w < 900;
    const dpr = Math.min(window.devicePixelRatio || 1, movil ? 1.5 : 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camara.aspect = w / h;
    camara.updateProjectionMatrix();
    const mitadAlto = Math.tan(THREE.MathUtils.degToRad(camara.fov / 2)) * 10;
    const mitadAncho = mitadAlto * camara.aspect;
    escalaBase = estrecho ? Math.min((mitadAncho * 2 * 0.72) / 2.4, (mitadAlto * 2 * 0.36) / 2.4) : (mitadAlto * 2 * 0.62) / 2.3;
    const altoPx = (camara.projectionMatrix.elements[5] * h) / 2;
    uFigura.uAltoPx.value = altoPx;
    uFlot.uAltoPx.value = altoPx;
  };
  medir();

  // ---------- Cada cuadro ----------
  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  const alMover = (e: PointerEvent) => {
    mouse.x = (e.clientX / w) * 2 - 1;
    mouse.y = (e.clientY / h) * 2 - 1;
  };
  const inicio = performance.now();

  const cuadro = () => {
    const t = quieto ? 0 : (performance.now() - inicio) / 1000;
    mouse.sx += (mouse.x - mouse.sx) * 0.04;
    mouse.sy += (mouse.y - mouse.sy) * 0.04;
    const e = estado;

    // Qué par de figuras toca y cuánto va de una a otra
    const nuevo = Math.min(FIGURAS.length - 2, Math.max(0, Math.floor(e.forma)));
    if (nuevo !== tramo) {
      tramo = nuevo;
      fig.ponerFiguras(FIGURAS[tramo], FIGURAS[tramo + 1]);
    }
    uFigura.uMezcla.value = Math.min(1, Math.max(0, e.forma - tramo));
    uFigura.uDispersa.value = e.dispersa;
    uFigura.uDeshacer.value = e.deshacer;
    uFigura.uOpacidad.value = e.brillo;
    uFigura.uDeriva.value = 0.006 + 0.05 * e.pantalla;
    uFigura.uTime.value = t;
    uFlot.uTime.value = t;

    // La cámara: solo se acerca o se aleja (el canvas no se mueve con la página)
    camara.position.set(mouse.sx * 0.12, -mouse.sy * 0.08, e.camZ);
    camara.lookAt(0, 0, 0);
    uFigura.uFoco.value = e.camZ;
    uFlot.uFoco.value = e.camZ;

    // La figura: su lugar en la pantalla, su tamaño y su giro (siempre viva)
    const mitadAlto = Math.tan(THREE.MathUtils.degToRad(camara.fov / 2)) * 10;
    const mitadAncho = mitadAlto * camara.aspect;
    const xs = estrecho ? 0 : e.x * mitadAncho;
    const ys = estrecho ? e.y * mitadAlto + mitadAlto * 0.32 * (1 - e.pantalla) : e.y * mitadAlto;
    figura.position.set(xs, ys, 0);
    figura.scale.setScalar(escalaBase * e.escala * (1 - e.pantalla) + e.pantalla * (estrecho ? 0.75 : 1));
    figura.rotation.set(
      e.rotX + Math.sin(t * 0.1) * 0.06 * e.vida + mouse.sy * 0.08,
      e.rotY + Math.sin(t * 0.13) * 0.4 * e.vida + mouse.sx * 0.15,
      e.rotZ + Math.sin(t * 0.07) * 0.03,
    );

    // Tetraedros flotantes: suben con el scroll, cada uno a su velocidad; al salir vuelven por abajo
    const posF = flo.posicionesA.array as Float32Array;
    const mundoPorPx = (mitadAlto * 2) / h;
    for (let i = 0; i < NF; i++) {
      const f = flot[i];
      const prof = e.camZ - f.z;
      const mitadA = Math.tan(THREE.MathUtils.degToRad(camara.fov / 2)) * Math.max(prof, 0.5);
      const alto = mitadA * 2 * 1.3;
      const base = (f.y - 0.5) * alto + window.scrollY * mundoPorPx * f.vel;
      const yRel = ((((base + alto / 2) % alto) + alto) % alto) - alto / 2;
      posF[i * 3] = f.x * mitadA * camara.aspect * 1.05 + Math.sin(t * 0.2 + i) * 0.08;
      posF[i * 3 + 1] = yRel + Math.cos(t * 0.17 + i * 1.7) * 0.06;
      posF[i * 3 + 2] = f.z;
    }
    flo.posicionesA.needsUpdate = true;
    (flo.posicionesB.array as Float32Array).set(posF);
    flo.posicionesB.needsUpdate = true;

    renderer.render(escena, camara);
  };

  const alRedimensionar = () => {
    medir();
    if (quieto) cuadro();
  };
  window.addEventListener("resize", alRedimensionar);
  const alBajar = () => cuadro();
  if (quieto) {
    window.addEventListener("scroll", alBajar, { passive: true });
    cuadro();
  } else {
    window.addEventListener("pointermove", alMover, { passive: true });
    gsap.ticker.add(cuadro);
  }

  return {
    destruir() {
      gsap.ticker.remove(cuadro);
      disparador?.kill();
      linea.kill();
      window.removeEventListener("resize", alRedimensionar);
      window.removeEventListener("scroll", alBajar);
      window.removeEventListener("pointermove", alMover);
      fig.geo.dispose();
      flo.geo.dispose();
      matFigura.dispose();
      matFlot.dispose();
      renderer.dispose();
    },
  };
}
