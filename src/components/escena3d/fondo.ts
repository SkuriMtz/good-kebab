import * as THREE from "three";
import { crearGeometria, crearMaterial, type Lugar, type Propio } from "./material";

/**
 * La escena 3D de la PORTADA: un fondo atmosférico muy mínimo.
 *
 * Es la misma partícula de la escena completa (el tetraedro de alambre que
 * gira, material.ts), pero aquí no hay figuras ni historia: unas pocas
 * decenas de tetraedros quietos en el espacio, como una recepción a
 * oscuras, que suben despacio y se mueven apenas con el cursor según su
 * profundidad. Las reglas que la mandan (CLAUDE.md, lecciones 7, 8 y 11):
 * - Brillo bajo: opacidad de cada partícula 0.5–0.8 por una opacidad general
 *   baja, mezcla normal (sin suma de luz, sin bloom) y pocos "blancos".
 * - Fondo fijo: el canvas no se mueve; solo baja el contenido encima.
 * - Pocas partículas y FUERA de la columna del texto: el título siempre limpio.
 * - Los colores salen de los tokens del modo activo (--c-halo, --c-enlace y
 *   --c-texto en oscuro o --c-borde-fuerte en claro), así que funciona igual en oscuro y en claro, y cambia sola
 *   cuando la persona cambia de modo.
 * - Solo se dibuja mientras la portada está en pantalla y la pestaña visible.
 */

export type Fondo = { destruir: () => void };

type Rgb = [number, number, number];

/** Lee un color de una variable CSS (hex o rgb/rgba) y lo deja de 0 a 1. */
function leerColor(nombre: string): Rgb {
  const v = getComputedStyle(document.documentElement).getPropertyValue(nombre).trim();
  const hex = v.match(/^#([0-9a-f]{6})$/i);
  if (hex) return [0, 2, 4].map((i) => parseInt(hex[1].slice(i, i + 2), 16) / 255) as Rgb;
  const rgb = v.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
  if (rgb) return [Number(rgb[1]) / 255, Number(rgb[2]) / 255, Number(rgb[3]) / 255];
  return [0.55, 0.55, 0.6];
}

function azar(a: number, b: number) {
  return a + Math.random() * (b - a);
}

/** Cada partícula: su lugar en pantalla (de -1 a 1), su profundidad y su ritmo. */
type Punto = { nx: number; ny: number; z: number; sube: number; fase: number; tono: number; brillo: number };

/**
 * Reparte los puntos lejos del texto. En computadora el título, la intro y
 * el formulario ocupan la columna central; en celular el texto ocupa todo el
 * ancho, así que las partículas quedan en las orillas.
 */
function repartir(n: number, estrecho: boolean): Punto[] {
  const puntos: Punto[] = [];
  let intentos = 0;
  while (puntos.length < n && intentos < n * 40) {
    intentos++;
    const nx = azar(-1.05, 1.05);
    const ny = azar(-1, 1);
    const centro = estrecho ? Math.abs(nx) < 0.62 : Math.abs(nx) < 0.4;
    if (centro && Math.random() < 0.94) continue;
    // Más densidad hacia las orillas laterales, como si el halo las empujara afuera
    if (Math.random() > 0.35 + 0.65 * Math.min(1, Math.abs(nx))) continue;
    // Un tono de tres: la mayoría del halo, algunas frías, muy pocas claras
    const r = Math.random();
    puntos.push({
      nx,
      ny,
      z: azar(-5, 3.5),
      sube: azar(0.008, 0.022),
      fase: Math.random() * Math.PI * 2,
      tono: r < 0.62 ? 0 : r < 0.94 ? 1 : 2,
      brillo: azar(0.55, 0.85),
    });
  }
  return puntos;
}

export function crearFondo(canvas: HTMLCanvasElement, opciones: { movil: boolean }): Fondo | null {
  const { movil } = opciones;
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: "low-power" });
  } catch {
    return null;
  }
  // Transparente: debajo queda el fondo de la portada (--c-portada) de cada modo
  renderer.setClearColor(0x000000, 0);

  const escena = new THREE.Scene();
  const camara = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camara.position.set(0, 0, 10);

  const estrecho = window.innerWidth < 768;
  const puntos = repartir(movil ? 40 : 90, estrecho);
  // Unos cuantos grandes y cerca de la cámara: desenfocados, casi invisibles, dan profundidad
  const CERCA = movil ? 2 : 4;
  for (let i = 0; i < CERCA; i++) {
    const p = puntos[i];
    if (!p) break;
    p.z = azar(4.5, 6);
    p.brillo = azar(0.5, 0.55);
  }
  const N = puntos.length;

  const lugar: Lugar = {
    pos: new Float32Array(N * 3),
    normal: new Float32Array(N * 3), // sin normal: polvo suelto, sin luz
    color: new Float32Array(N * 3),
    alfa: new Float32Array(N),
  };
  const propio: Propio = {
    tam: new Float32Array(N),
    giro: new Float32Array(N * 4),
    semilla: new Float32Array(N * 4).map(() => Math.random()),
    dir: new Float32Array(N * 3),
  };
  puntos.forEach((p, i) => {
    lugar.alfa[i] = p.brillo;
    const cerca = i < CERCA;
    propio.tam[i] = cerca ? azar(0.12, 0.18) : movil ? azar(0.05, 0.08) : azar(0.04, 0.075);
    // Giro lento: se nota que son tetraedros, nunca que "bailan"
    propio.giro.set([azar(-1, 1), azar(-1, 1), azar(-1, 1), azar(0.12, 0.38) * (Math.random() < 0.5 ? -1 : 1)], i * 4);
    propio.semilla[i * 4 + 2] = 0;
  });

  const { material, uniforms } = crearMaterial({ deriva: 0.012, dof: 0.9, opacidad: 0.5 });
  // Mezcla normal en los dos modos: en claro, la suma de luz desaparecería sobre el gris cálido
  material.blending = THREE.NormalBlending;
  const geo = crearGeometria(lugar, lugar, propio, N, true);
  const malla = new THREE.Mesh(geo.geo, material);
  malla.frustumCulled = false;
  escena.add(malla);

  /** Pinta cada partícula con los tokens del modo activo. */
  const pintar = () => {
    const claro = document.documentElement.dataset.tema === "claro";
    // La tercera tinta es la "clara": blanco en oscuro; en claro, el gris de los bordes (nunca tinta negra)
    const paleta: Rgb[] = [leerColor("--c-halo"), leerColor("--c-enlace"), leerColor(claro ? "--c-borde-fuerte" : "--c-texto")];
    // En oscuro se apagan un poco (lección 7); en claro la tinta ya es suave sobre el gris
    const k = claro ? 1 : 0.78;
    const col = (malla.geometry.getAttribute("aColA") as THREE.InstancedBufferAttribute).array as Float32Array;
    const colB = (malla.geometry.getAttribute("aColB") as THREE.InstancedBufferAttribute).array as Float32Array;
    puntos.forEach((p, i) => {
      const c = paleta[p.tono];
      col.set([c[0] * k, c[1] * k, c[2] * k], i * 3);
    });
    colB.set(col);
    malla.geometry.getAttribute("aColA").needsUpdate = true;
    malla.geometry.getAttribute("aColB").needsUpdate = true;
    uniforms.uOpacidad.value = 0.5;
    cuadro();
  };

  // ---------- Medidas ----------
  let w = 1;
  let h = 1;
  const medir = () => {
    w = window.innerWidth;
    h = window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, movil ? 1.5 : 2));
    renderer.setSize(w, h, false);
    camara.aspect = w / h;
    camara.updateProjectionMatrix();
    uniforms.uAltoPx.value = (camara.projectionMatrix.elements[5] * h) / 2;
    uniforms.uFoco.value = 10;
  };
  medir();

  // ---------- Cada cuadro ----------
  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  const alMover = (e: PointerEvent) => {
    mouse.x = (e.clientX / w) * 2 - 1;
    mouse.y = (e.clientY / h) * 2 - 1;
  };
  const inicio = performance.now();
  const pos = geo.posicionesA.array as Float32Array;
  const mitadTan = Math.tan(THREE.MathUtils.degToRad(camara.fov / 2));

  function cuadro() {
    const t = (performance.now() - inicio) / 1000;
    // Seguimiento suave del cursor (amortiguado, no pegado al puntero)
    mouse.sx += (mouse.x - mouse.sx) * 0.035;
    mouse.sy += (mouse.y - mouse.sy) * 0.035;
    uniforms.uTime.value = t;
    for (let i = 0; i < N; i++) {
      const p = puntos[i];
      const prof = Math.max(10 - p.z, 0.5);
      const mitadA = mitadTan * prof;
      const mitadW = mitadA * camara.aspect;
      // Suben muy despacio y vuelven a entrar por abajo
      const y = ((((p.ny + 1 + t * p.sube) % 2) + 2) % 2) - 1;
      // Parallax: las cercanas se corren más con el cursor que las lejanas
      const par = (1 - prof / 15.5) * 0.55;
      pos[i * 3] = p.nx * mitadW + Math.sin(t * 0.11 + p.fase) * 0.05 - mouse.sx * par;
      pos[i * 3 + 1] = y * mitadA * 1.06 + mouse.sy * par * 0.6;
      pos[i * 3 + 2] = p.z;
    }
    geo.posicionesA.needsUpdate = true;
    (geo.posicionesB.array as Float32Array).set(pos);
    geo.posicionesB.needsUpdate = true;
    renderer.render(escena, camara);
  }

  // ---------- Solo dibuja cuando se ve ----------
  let visible = true;
  let pestanaVisible = !document.hidden;
  let raf = 0;
  const bucle = () => {
    cuadro();
    raf = requestAnimationFrame(bucle);
  };
  const decidir = () => {
    const correr = visible && pestanaVisible;
    if (correr && !raf) raf = requestAnimationFrame(bucle);
    if (!correr && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };
  const portada = canvas.closest("section") ?? canvas.parentElement;
  const io = portada
    ? new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        decidir();
      })
    : null;
  if (portada && io) io.observe(portada);
  const alCambiarPestana = () => {
    pestanaVisible = !document.hidden;
    decidir();
  };
  const alRedimensionar = () => medir();
  const tema = new MutationObserver(pintar);
  tema.observe(document.documentElement, { attributes: true, attributeFilter: ["data-tema"] });

  pintar();
  window.addEventListener("resize", alRedimensionar);
  window.addEventListener("pointermove", alMover, { passive: true });
  document.addEventListener("visibilitychange", alCambiarPestana);
  decidir();

  return {
    destruir() {
      cancelAnimationFrame(raf);
      raf = 0;
      io?.disconnect();
      tema.disconnect();
      window.removeEventListener("resize", alRedimensionar);
      window.removeEventListener("pointermove", alMover);
      document.removeEventListener("visibilitychange", alCambiarPestana);
      geo.geo.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
}
