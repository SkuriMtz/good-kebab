import gsap from "gsap";
import * as THREE from "three";
import { logo, PALETA } from "./figuras";
import { crearGeometria, crearMaterial, type Particulas } from "./material";

/**
 * La escena 3D (Three.js), un solo canvas fijo detrás de todo el contenido.
 * Fase 1: las partículas forman el logo de Atendel a la derecha, girando
 * lento, y alrededor flotan tetraedros de alambre grandes a distintas
 * profundidades (los más cercanos, desenfocados) con parallax al bajar.
 * Todo corre en el reloj de GSAP (el mismo que usa el scroll suave de Lenis).
 */

export type Motor = { destruir: () => void };

const FONDO = 0x05050a;
const DIST_CAMARA = 10;

function azar(a: number, b: number) {
  return a + Math.random() * (b - a);
}

export function crearMotor(canvas: HTMLCanvasElement, opciones: { movil: boolean; quieto: boolean }): Motor | null {
  const { movil, quieto } = opciones;
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance" });
  } catch {
    return null;
  }
  renderer.setClearColor(FONDO, 1);

  const escena = new THREE.Scene();
  const camara = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camara.position.set(0, 0, DIST_CAMARA);

  // ---------- La figura: el logo de Atendel ----------
  const N = movil ? 3000 : 14000;
  const nube = logo(N);
  const datosFigura: Particulas = {
    pos: nube.pos,
    normal: nube.normal,
    color: nube.color,
    alfa: nube.alfa,
    tam: new Float32Array(N).map(() => (movil ? azar(0.07, 0.11) : azar(0.055, 0.1))),
    giro: new Float32Array(N * 4),
    semilla: new Float32Array(N * 2).map(() => Math.random()),
  };
  for (let i = 0; i < N; i++) {
    datosFigura.giro.set([azar(-1, 1), azar(-1, 1), azar(-1, 1), azar(0.3, 1.3) * (Math.random() < 0.5 ? -1 : 1)], i * 4);
  }
  const { material: matFigura, uniforms: uFigura } = crearMaterial({ deriva: 0.006, dof: 0.35 });
  const geoFigura = crearGeometria(datosFigura, N);
  const figura = new THREE.Mesh(geoFigura, matFigura);
  figura.frustumCulled = false;
  // El grupo coloca la figura en la pantalla; la figura gira dentro de él
  const soporte = new THREE.Group();
  soporte.add(figura);
  escena.add(soporte);

  // ---------- Tetraedros grandes flotando ----------
  const NF = movil ? 12 : 22;
  const coloresF = [PALETA.ambar, PALETA.morado, PALETA.blanco, PALETA.ambar, PALETA.verdeAzul, PALETA.morado];
  const datosFlot: Particulas = {
    pos: new Float32Array(NF * 3),
    normal: new Float32Array(NF * 3),
    color: new Float32Array(NF * 3),
    alfa: new Float32Array(NF),
    tam: new Float32Array(NF),
    giro: new Float32Array(NF * 4),
    semilla: new Float32Array(NF * 2).map(() => Math.random()),
  };
  // Su lugar "en el mundo": x, y base y profundidad (z). Algunos muy cerca de la cámara.
  const flot = Array.from({ length: NF }, (_, i) => {
    const cerca = i % 5 === 0;
    const z = cerca ? azar(4.5, 7) : azar(-7, 2.5);
    const c = coloresF[i % coloresF.length];
    datosFlot.color.set([c[0] * 0.85, c[1] * 0.85, c[2] * 0.85], i * 3);
    datosFlot.alfa[i] = cerca ? azar(0.3, 0.45) : azar(0.4, 0.75);
    datosFlot.tam[i] = cerca ? azar(0.35, 0.55) : azar(0.16, 0.34);
    datosFlot.giro.set([azar(-1, 1), azar(-1, 1), azar(-1, 1), azar(0.12, 0.32) * (Math.random() < 0.5 ? -1 : 1)], i * 4);
    return { x: azar(-1, 1), y: Math.random(), z };
  });
  const { material: matFlot, uniforms: uFlot } = crearMaterial({ deriva: 0, dof: 1 });
  const geoFlot = crearGeometria(datosFlot, NF, true);
  const flotantes = new THREE.Mesh(geoFlot, matFlot);
  flotantes.frustumCulled = false;
  escena.add(flotantes);
  const attrFlot = geoFlot.getAttribute("aPos") as THREE.InstancedBufferAttribute;

  // ---------- Medidas ----------
  let w = 1;
  let h = 1;
  let mitadAlto = 1; // la mitad del alto visible (en unidades del mundo) en el plano de la figura
  let mitadAncho = 1;
  const medir = () => {
    w = window.innerWidth;
    h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, movil ? 1.5 : 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camara.aspect = w / h;
    camara.updateProjectionMatrix();
    mitadAlto = Math.tan(THREE.MathUtils.degToRad(camara.fov / 2)) * DIST_CAMARA;
    mitadAncho = mitadAlto * camara.aspect;
    const altoPx = (camara.projectionMatrix.elements[5] * h) / 2;
    uFigura.uAltoPx.value = altoPx;
    uFlot.uAltoPx.value = altoPx;
    // La figura: a la derecha en computadora; arriba al centro en celular
    const estrecho = w < 900;
    const escala = estrecho ? Math.min((mitadAncho * 2 * 0.72) / 2.4, (mitadAlto * 2 * 0.36) / 2.4) : (mitadAlto * 2 * 0.62) / 2.3;
    figura.scale.setScalar(escala);
    soporte.userData.x = estrecho ? 0 : mitadAncho * 0.42;
    soporte.userData.y = estrecho ? mitadAlto * 0.38 : -mitadAlto * 0.02;
  };
  medir();

  // ---------- Movimiento ----------
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
    uFigura.uTime.value = t;
    uFlot.uTime.value = t;

    // Al bajar, la cámara baja a media velocidad: lo cercano se mueve más rápido que lo lejano (parallax)
    const mundoPorPx = (mitadAlto * 2) / h;
    const camY = -window.scrollY * mundoPorPx * 0.5;
    camara.position.x = mouse.sx * 0.12;
    camara.position.y = camY - mouse.sy * 0.08;
    camara.lookAt(camara.position.x * 0.5, camY, 0);

    // La figura no se va con el scroll: sigue a la cámara. Gira lento, siempre viva.
    soporte.position.set(soporte.userData.x, camY + soporte.userData.y, 0);
    // Gira lento sobre sí misma (la luz se queda fija, así se ve que es 3D)
    figura.rotation.y = -0.35 + Math.sin(t * 0.13) * 0.4 + mouse.sx * 0.15;
    figura.rotation.x = 0.18 + Math.sin(t * 0.1) * 0.06 + mouse.sy * 0.08;
    figura.rotation.z = Math.sin(t * 0.07) * 0.04;

    // Tetraedros flotantes: se repiten de arriba abajo para no acabarse nunca
    const pos = attrFlot.array as Float32Array;
    for (let i = 0; i < NF; i++) {
      const f = flot[i];
      const prof = DIST_CAMARA - f.z; // distancia a la cámara
      const mitadA = Math.tan(THREE.MathUtils.degToRad(camara.fov / 2)) * prof;
      const alto = mitadA * 2 * 1.3;
      // Cada uno tiene un lugar fijo en el mundo; como la cámara baja, los cercanos se
      // mueven más rápido en pantalla que los lejanos. Al salir por arriba vuelven por abajo.
      const base = (f.y - 0.5) * alto;
      const yRel = ((((base - camY + alto / 2) % alto) + alto) % alto) - alto / 2;
      pos[i * 3] = f.x * mitadA * camara.aspect * 1.05 + Math.sin(t * 0.2 + i) * 0.08;
      pos[i * 3 + 1] = camY + yRel + Math.cos(t * 0.17 + i * 1.7) * 0.06;
      pos[i * 3 + 2] = f.z;
    }
    attrFlot.needsUpdate = true;

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
      window.removeEventListener("resize", alRedimensionar);
      window.removeEventListener("scroll", alBajar);
      window.removeEventListener("pointermove", alMover);
      geoFigura.dispose();
      geoFlot.dispose();
      matFigura.dispose();
      matFlot.dispose();
      renderer.dispose();
    },
  };
}
