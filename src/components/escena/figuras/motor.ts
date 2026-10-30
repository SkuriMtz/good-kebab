import { REPOSO_VIDEO } from "./escenas";
import { azar, cerebro, cerebroDeMalla, foco, globo, leerCerebro, marca, mezcla, PALETA, suave, type Color, type Forma } from "./formas";

/**
 * El motor del fondo del inicio (técnica de la versión 7): miles de
 * triangulitos (tetraedros de alambre) dibujados como puntos en WebGL. Cada
 * uno es un resorte que persigue su lugar en la figura de la escena; la
 * posición en la historia (0 = portada … 7 = cierre) decide esos lugares, así
 * que los cambios van atados al scroll: si la persona deja de bajar a la
 * mitad, la figura se queda a la mitad (como en el video).
 *
 * Medidas: todo está pensado para la pantalla del video (1212 × 750) y se
 * escala al tamaño real. Los números salen de diseno/capturas/dala/MEDIDAS.md.
 */

/* ---------------------------------------------------------------------- */
/* Shaders                                                                 */
/* ---------------------------------------------------------------------- */

const VERT = `
attribute vec2 aPos; attribute float aTam; attribute vec4 aCol; attribute vec3 aRot; attribute vec3 aExtra;
uniform vec2 uRes; uniform float uDpr; uniform float uMargen;
varying vec4 vCol; varying vec4 vA; varying vec4 vB; varying vec4 vZ; varying float vTam; varying float vEsc; varying vec3 vExtra;
void main() {
  gl_Position = vec4(aPos.x / uRes.x * 2.0 - 1.0, 1.0 - aPos.y / uRes.y * 2.0, 0.0, 1.0);
  // El punto es más grande que el triangulito: deja lugar al halo y al desenfoque
  float esc = uMargen * (1.0 + aExtra.x * 0.7);
  gl_PointSize = max(aTam * uDpr * esc, 1.0);
  vTam = max(aTam * uDpr, 1.0);
  vEsc = esc;
  vCol = aCol;
  vExtra = aExtra;
  if (aExtra.y > 0.5) {
    // Rombo: un cuadrado girado, apenas aplastado por la perspectiva
    float c = cos(aRot.z), s = sin(aRot.z);
    float k = 0.55 + 0.45 * abs(cos(aRot.x));
    vec2 e1 = vec2(c, s) * 0.8;
    vec2 e2 = vec2(-s, c) * 0.8 * k;
    vA = vec4(e1.x, -e1.y, e2.x, -e2.y);
    vB = vec4(-e1.x, e1.y, -e2.x, e2.y);
    vZ = vec4(0.0);
    return;
  }
  float cx = cos(aRot.x), sx = sin(aRot.x);
  float cy = cos(aRot.y), sy = sin(aRot.y);
  float cz = cos(aRot.z), sz = sin(aRot.z);
  mat3 R = mat3(
    cz * cy, sz * cy, -sy,
    cz * sy * sx - sz * cx, sz * sy * sx + cz * cx, cy * sx,
    cz * sy * cx + sz * sx, sz * sy * cx - cz * sx, cy * cx);
  vec3 v0 = R * vec3(0.0, 0.0, 1.0);
  vec3 v1 = R * vec3(0.0, 0.943, -0.333);
  vec3 v2 = R * vec3(-0.816, -0.471, -0.333);
  vec3 v3 = R * vec3(0.816, -0.471, -0.333);
  vA = vec4(v0.x, -v0.y, v1.x, -v1.y);
  vB = vec4(v2.x, -v2.y, v3.x, -v3.y);
  vZ = vec4(v0.z, v1.z, v2.z, v3.z);
}`;

/*
 * Cada partícula: un tetraedro de alambre (visto de frente es un triángulo hueco:
 * las aristas que van al centro se apagan con `interior`) o un rombo. Lleva un
 * halo suave (mezcla aditiva, sin bloom de pantalla) y, si está fuera de foco,
 * se ve más ancha, más tenue y doble.
 */
const FRAG = `
precision mediump float;
varying vec4 vCol; varying vec4 vA; varying vec4 vB; varying vec4 vZ; varying float vTam; varying float vEsc; varying vec3 vExtra;
uniform float uTrazo; uniform float uClaro; uniform float uHalo;
float seg(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}
// x: cobertura de las líneas, y: distancia a la línea más cercana
vec2 forma(vec2 p, float w, float suav) {
  vec2 a0 = vA.xy, a1 = vA.zw, a2 = vB.xy, a3 = vB.zw;
  if (vExtra.y > 0.5) {
    float d = min(min(seg(p, a0, a1), seg(p, a1, a2)), min(seg(p, a2, a3), seg(p, a3, a0)));
    return vec2(1.0 - smoothstep(w - suav, w + suav, d), d);
  }
  float dB = min(min(seg(p, a1, a2), seg(p, a2, a3)), seg(p, a3, a1));
  float dI = min(min(seg(p, a0, a1), seg(p, a0, a2)), seg(p, a0, a3));
  float luzB = mix(0.45, 1.0, clamp((vZ.y + vZ.z + vZ.w) * 0.17 + 0.5, 0.0, 1.0));
  float cB = (1.0 - smoothstep(w - suav, w + suav, dB)) * luzB;
  float cI = (1.0 - smoothstep(w - suav, w + suav, dI)) * vExtra.z;
  return vec2(max(cB, cI), min(dB, mix(9.0, dI, step(0.05, vExtra.z))));
}
void main() {
  float blur = vExtra.x;
  vec2 p = (gl_PointCoord * 2.0 - 1.0) * vEsc / 0.94;
  float px = 2.0 / (vTam * 0.94);
  float w = uTrazo * px * (1.0 + 1.3 * blur);
  float suav = px * (0.75 + 2.6 * blur);
  vec2 f = forma(p, w, suav);
  float a = f.x;
  // Fuera de foco: doble, como una estela
  if (blur > 0.2) {
    vec2 g = forma(p - vec2(0.3, 0.12) * blur, w, suav);
    a = max(a, g.x * 0.65);
  }
  // Halo suave alrededor de las líneas
  float r = 0.22 + 0.3 * blur;
  float halo = uHalo * exp(-(f.y * f.y) / (r * r));
  a = a + halo * (1.0 - a);
  a *= vCol.a / (1.0 + 0.45 * blur);
  if (a < 0.004) discard;
  vec3 col = vCol.rgb;
  // Modo claro: colores más hondos y lo blanco pasa a gris violáceo (si no, no se vería)
  float blanco = smoothstep(0.62, 0.9, min(min(col.r, col.g), col.b));
  col = mix(col, mix(col * 0.72, vec3(0.36, 0.30, 0.52), blanco), uClaro);
  gl_FragColor = vec4(col * a, a);
}`;

/*
 * Resplandor: cada partícula de la figura deja además una mancha de luz muy
 * tenue y ancha (mezcla aditiva). Donde hay muchas, el interior de la figura se
 * ve con el brillo suave del video (medido: el fondo dentro del cerebro vale
 * ~32 de 255; fuera, ~2). No es un bloom de pantalla: va partícula por partícula.
 */
const VERT_RESPLANDOR = `
attribute vec2 aPos; attribute float aTam; attribute vec4 aCol; attribute vec3 aExtra;
uniform vec2 uRes; uniform float uDpr; uniform float uAncho;
varying vec4 vCol;
void main() {
  gl_Position = vec4(aPos.x / uRes.x * 2.0 - 1.0, 1.0 - aPos.y / uRes.y * 2.0, 0.0, 1.0);
  // Solo las partículas de la figura (en el polvo, aExtra.z es alto)
  float enFigura = 1.0 - smoothstep(0.3, 0.6, aExtra.z);
  gl_PointSize = aCol.a > 0.01 && enFigura > 0.01 ? aTam * uDpr * uAncho : 0.0;
  vCol = vec4(aCol.rgb, aCol.a * enFigura);
}`;
const FRAG_RESPLANDOR = `
precision mediump float;
varying vec4 vCol;
uniform float uFuerza;
void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float a = exp(-dot(p, p) * 3.2) * uFuerza * vCol.a;
  if (a < 0.002) discard;
  gl_FragColor = vec4(vCol.rgb * a, a);
}`;

/* ---------------------------------------------------------------------- */
/* Colocación de una figura en 3D                                          */
/* ---------------------------------------------------------------------- */

export type Colocacion = {
  /** Centro en px del video (1212 × 750). */
  cx: number;
  cy: number;
  /** px del video por unidad de la figura. */
  escala: number;
  /** Giros en grados: hacia los lados (eje vertical), hacia adelante y en el plano de la pantalla. */
  yaw: number;
  pitch: number;
  roll: number;
  /** Ancho de un triangulito en px del video. */
  tam: number;
};
type Llave = [number, Colocacion];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const G = Math.PI / 180;
const C = (cx: number, cy: number, escala: number, yaw: number, pitch: number, roll: number, tam: number): Colocacion => ({ cx, cy, escala, yaw, pitch, roll, tam });

/** Interpola entre colocaciones clave con una curva sin quiebres (Catmull-Rom). */
export function entre(llaves: Llave[], p: number): Colocacion {
  if (p <= llaves[0][0]) return llaves[0][1];
  for (let i = 0; i < llaves.length - 1; i++) {
    const [p0, a] = llaves[i];
    const [p1, b] = llaves[i + 1];
    if (p <= p1) {
      const t = (p - p0) / (p1 - p0);
      const a0 = llaves[Math.max(0, i - 1)][1];
      const b1 = llaves[Math.min(llaves.length - 1, i + 2)][1];
      const cr = (k: keyof Colocacion) => {
        const v0 = a0[k];
        const v1 = a[k];
        const v2 = b[k];
        const v3 = b1[k];
        const t2 = t * t;
        const t3 = t2 * t;
        return 0.5 * (2 * v1 + (-v0 + v2) * t + (2 * v0 - 5 * v1 + 4 * v2 - v3) * t2 + (-v0 + 3 * v1 - 3 * v2 + v3) * t3);
      };
      return { cx: cr("cx"), cy: cr("cy"), escala: cr("escala"), yaw: cr("yaw"), pitch: cr("pitch"), roll: cr("roll"), tam: cr("tam") };
    }
  }
  return llaves[llaves.length - 1][1];
}
function entre2(a: Colocacion, b: Colocacion, t: number): Colocacion {
  return { cx: lerp(a.cx, b.cx, t), cy: lerp(a.cy, b.cy, t), escala: lerp(a.escala, b.escala, t), yaw: lerp(a.yaw, b.yaw, t), pitch: lerp(a.pitch, b.pitch, t), roll: lerp(a.roll, b.roll, t), tam: lerp(a.tam, b.tam, t) };
}

/* ---------------------------------------------------------------------- */
/* El guion (medido en el video)                                           */
/* ---------------------------------------------------------------------- */

/**
 * Cerebro de la portada → decisiones (p = avance del tramo 0 → 1, con el scroll del texto).
 * Hasta p = 0.48 son las poses medidas en el video (giro, escala y lugar del cerebro, cada
 * 0.1 s de 1.0 a 2.8 s), suavizadas; de ahí al reposo, las estimadas. La figura va adelante
 * del texto: a los 2.0 s ya giró 18° cuando el texto apenas bajó 12 px.
 */
export const CEREBRO_A: Llave[] = [
  // Poses del cerebro de malla real ajustadas a la silueta del video (IoU 0.95-0.96 en 2.0, 2.2, 2.5 y 2.8 s)
  [0.0, C(847.5, 378, 335.1, -90, 0, 0, 5.47)],
  [0.01, C(822.5, 376.5, 331.1, -79.5, 0, 0, 5.47)],
  [0.028, C(800, 376, 334, -58, -0.5, 0, 5.49)],
  [0.062, C(773.5, 378, 339.6, -30, -1, 0, 5.52)],
  [0.108, C(732, 377, 342, -24, -2.5, 0, 5.56)],
  [0.165, C(676, 378, 348, -19, -4, 0, 5.62)],
  [0.232, C(618.5, 380, 356, -13.2, -5.5, 0, 5.68)],
  [0.31, C(560, 377, 365, -4, -5, 0, 5.74)],
  [0.391, C(498.5, 374, 372, 5, -4.5, 0, 5.85)],
  [0.477, C(428.5, 372, 379.4, 14.5, -4, 0, 5.95)],
  [0.65, C(335, 377, 400.0, 22, 0, 0, 6.04)],
  [0.82, C(290, 380, 413.6, 28, 5, 0, 6.33)],
  [1.0, C(295, 386, 418.8, 32, 9, 0, 6.44)],
];
/**
 * Cerebro de decisiones → se deshace en el caos (p del tramo 1 → 2). Medido en el video:
 * a los 8.2 s (p 0.22) sigue a la izquierda (centro x ≈ 400) y apenas crece; a los 8.6 s
 * (p 0.7) es una cúpula al centro (x ≈ 545) que se deshace de abajo hacia arriba.
 */
export const CEREBRO_B: Llave[] = [
  [0.0, C(295, 386, 418.8, 32, 9, 0, 6.44)],
  [0.25, C(405, 395, 445.0, 52, 18, 0, 6.56)],
  [0.45, C(500, 425, 481.7, 66, 30, 0, 6.67)],
  [0.7, C(550, 470, 513.1, 76, 44, 0, 6.79)],
  [1.0, C(570, 530, 529.9, 82, 52, 0, 6.91)],
];
export const FOCO: Colocacion = C(285, 297, 221, -16, 6, 29, 5.2);
export const FOCO_SALE: Colocacion = C(640, 330, 215, 10, 6, 20, 5.2);
/** Globo: círculo ajustado al borde del video (centro 857, 488; radio ~372) y giro que iguala los continentes. */
export const GLOBO: Colocacion = C(857, 488, 368, -23, 0, -9, 9.2);
export const GLOBO_SUBE: Colocacion = C(830, 300, 380, -20, 0, -9, 9.2);
/** La marca de Atendel del cierre: en la caja y el lugar de la marca del video (centro 548, 335). */
export const MARCA: Colocacion = C(548, 340, 265, -32, 14, -8, 4.6);

/** Qué tanto brilla cada figura (medido: el pico de un triangulito del cerebro es ~122 de 255). */
/**
 * Cuánto copia cada partícula la velocidad de su lugar (1 = sin retraso): cuando la figura
 * solo se mueve o gira, va pegada al scroll; en los cambios, el resorte da la llegada suave.
 */
const SEGUIR = 0.97;

const LUZ = { cerebro: 0.55, foco: 0.42, globo: 0.5, marca: 0.5 };
/** Intensidad del halo de cada triangulito (medido: el video tiene un resplandor entre partículas). */
const HALO = 0.13;
/** Fuerza del resplandor ancho de la figura (el brillo suave del interior). */
const RESPLANDOR = 0.06;

/** Figuras con volumen: cuánto se ve lo de atrás (a través) y cuánto cambia con la profundidad. */
type Volumen = { atras: number; prof: number; radio: number; dofIzq?: number };
const VOL_CEREBRO: Volumen = { atras: 0.2, prof: 1, radio: 1, dofIzq: 0.85 };
/** El vidrio del foco es transparente: lo de atrás se ve más que en el cerebro. */
const VOL_FOCO: Volumen = { atras: 0.5, prof: 0.8, radio: 1 };

/* ---------------------------------------------------------------------- */
/* Polvo (en fracciones de la pantalla)                                    */
/* ---------------------------------------------------------------------- */

type Campo = "suelto" | "caos" | "junto" | "equipo" | "planes" | "centro";

/** Dónde cae el polvo de cada partícula y si se ve, según el reparto. */
function campo(c: Campo, hx: number, hy: number, vis: number): [number, number, number] {
  switch (c) {
    case "suelto":
      return [hx, hy, vis < 0.018 ? 1 : 0];
    case "caos":
      return [hx * 1.04 - 0.02, hy * 1.04 - 0.02, vis < 0.085 ? 1 : 0];
    case "junto": {
      // Nube recargada a la izquierda y al centro (centro de masa ≈ 39 %, 47 %), con polvo ralo hasta la orilla derecha
      const dx = hx * 2 - 1;
      const dy = hy * 2 - 1;
      const r = Math.max(Math.abs(dx), Math.abs(dy));
      // (difusa, sin un punto brillante en medio: en el video la nube se ve pareja)
      const k = r > 0 ? Math.pow(r, 1.35) / r : 0;
      const dens = 0.05 + 0.11 * (1 - r) ** 1.2;
      return [0.33 + dx * k * 0.6, 0.45 + dy * k * 0.55, vis < dens ? 1 : 0];
    }
    case "equipo": {
      // Recargado arriba (y 8-35 %) y ralo en lo demás
      const arriba = hy < 0.8;
      const y = arriba ? 0.07 + 0.3 * Math.pow(hy / 0.8, 1.3) : 0.35 + ((hy - 0.8) / 0.2) * 0.65;
      return [hx, y, vis < (arriba ? 0.06 : 0.012) ? 1 : 0];
    }
    case "planes": {
      const x = Math.pow(hx, 1.25);
      const y = Math.pow(hy, 1.15);
      return [x, y, vis < 0.012 + 0.03 * (1 - x) * (1 - y) ? 1 : 0];
    }
    case "centro": {
      // Nube redonda al centro (como el polvo del video a los 15.0 s), más densa en medio
      const dx = hx * 2 - 1;
      const dy = hy * 2 - 1;
      const r = Math.max(Math.abs(dx), Math.abs(dy));
      const a = Math.atan2(dy, dx);
      const rr = Math.pow(r, 1.15);
      return [0.47 + Math.cos(a) * rr * 0.3, 0.45 + Math.sin(a) * rr * 0.4, vis < 0.04 + 0.08 * (1 - r) ? 1 : 0];
    }
  }
}

/* ---------------------------------------------------------------------- */
/* El motor                                                                */
/* ---------------------------------------------------------------------- */

type Objetivo = { x: Float32Array; y: Float32Array; r: Float32Array; g: Float32Array; b: Float32Array; a: Float32Array; t: Float32Array; m: Float32Array; d: Float32Array };
/** Proyección: lugar en pantalla, perspectiva, normal vista desde la cámara (x a la derecha, y arriba, z hacia ti) y profundidad. */
type Proy = { x: Float32Array; y: Float32Array; f: Float32Array; nz: Float32Array; fr: Float32Array; nx: Float32Array; ny: Float32Array; z: Float32Array };

/** Tetraedro grande: lugar en la pantalla del video cuando el scroll del video vale `ancla`; k = paralaje. */
type TetraGrande = { x: number; y: number; ancla: number; k: number; tam: number; color: string; alfa: number; g0: number[]; gv: number[] };

/** Scroll del video para una posición de la historia (para el paralaje de los tetraedros grandes). */
function scrollVideo(P: number) {
  const r = REPOSO_VIDEO;
  const i = Math.min(r.length - 2, Math.max(0, Math.floor(P)));
  return lerp(r[i], r[i + 1], clamp01(P - i));
}

export class MotorFiguras {
  readonly N: number;
  private gl: WebGLRenderingContext;
  private ctx2: CanvasRenderingContext2D;
  private prog: WebGLProgram;
  private progR: WebGLProgram | null = null;
  private AR: Record<string, number> = {};
  private UR: Record<string, WebGLUniformLocation | null> = {};
  private buf: WebGLBuffer;
  private datos: Float32Array;
  private A: Record<string, number>;
  private U: Record<string, WebGLUniformLocation | null>;
  private w = 1212;
  private h = 750;
  private dpr = 1;
  claro = false;

  private formas: { cerebro: Forma; foco: Forma | null; globo: Forma | null; marca: Forma | null };

  // Lo propio de cada partícula
  private hx: Float32Array;
  private hy: Float32Array;
  private vis: Float32Array;
  private fase: Float32Array;
  private rigidez: Float32Array;
  private tamPolvo: Float32Array;
  private colPolvo: Float32Array;
  private giro0: Float32Array;
  private giroVel: Float32Array;
  private azarDes: Float32Array;

  // Estado de cada partícula
  private pos: Float32Array;
  private vel: Float32Array;
  /** Dónde estaba el lugar de cada partícula en el cuadro anterior (para copiar su velocidad). */
  private ant: Float32Array;
  private col: Float32Array;
  private alfa: Float32Array;
  private tam: Float32Array;
  /** Desenfoque (0 = nítido) y forma (1 = rombo) de cada partícula. */
  private desen: Float32Array;
  private rombo: Float32Array;
  private rot: Float32Array;

  // Objetivos (lo llena el guion en cada cuadro) y proyecciones temporales
  private o1: Objetivo;
  private o2: Objetivo;
  private pr: Proy;
  private pr2: Proy;

  /**
   * Posición en la historia: la que se pide (el scroll del texto) y la que se ve, casi
   * sin retraso propio. Los tramos de cada cambio ya están medidos contra el scroll del
   * texto del video (MEDIDAS §8), donde la figura va adelante del texto o con él.
   */
  objetivo = 0;
  posicion = 0;
  private velPos = 0;
  private reloj = 0;
  private primera = true;

  private tetras: TetraGrande[];
  /** La colocación con la que se está dibujando la figura (ya adaptada a la pantalla). */
  private actual: Colocacion = GLOBO;

  constructor(canvas: HTMLCanvasElement, lineas: HTMLCanvasElement, opciones: { claro?: boolean; n?: number } = {}) {
    const gl = canvas.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: true, preserveDrawingBuffer: false });
    const ctx2 = lineas.getContext("2d");
    if (!gl || !ctx2) throw new Error("sin WebGL");
    this.gl = gl;
    this.ctx2 = ctx2;
    this.claro = !!opciones.claro;
    const ancho = window.innerWidth;
    this.N = opciones.n ?? (ancho < 700 ? 6000 : ancho < 1100 ? 9000 : 11000);
    const N = this.N;

    const p = gl.createProgram()!;
    for (const [tipo, src] of [
      [gl.VERTEX_SHADER, VERT],
      [gl.FRAGMENT_SHADER, FRAG],
    ] as const) {
      const s = gl.createShader(tipo)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      gl.attachShader(p, s);
    }
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error("shader");
    this.prog = p;
    // El resplandor (solo en pantallas grandes: en el celular no hace falta y cuesta)
    if (ancho >= 700) {
      const r = gl.createProgram()!;
      for (const [tipo, src] of [
        [gl.VERTEX_SHADER, VERT_RESPLANDOR],
        [gl.FRAGMENT_SHADER, FRAG_RESPLANDOR],
      ] as const) {
        const sh = gl.createShader(tipo)!;
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        gl.attachShader(r, sh);
      }
      gl.linkProgram(r);
      if (gl.getProgramParameter(r, gl.LINK_STATUS)) {
        this.progR = r;
        this.AR = { pos: gl.getAttribLocation(r, "aPos"), tam: gl.getAttribLocation(r, "aTam"), col: gl.getAttribLocation(r, "aCol"), extra: gl.getAttribLocation(r, "aExtra") };
        this.UR = Object.fromEntries(["uRes", "uDpr", "uAncho", "uFuerza"].map((n) => [n, gl.getUniformLocation(r, n)]));
      }
    }
    this.A = { pos: gl.getAttribLocation(p, "aPos"), tam: gl.getAttribLocation(p, "aTam"), col: gl.getAttribLocation(p, "aCol"), rot: gl.getAttribLocation(p, "aRot"), extra: gl.getAttribLocation(p, "aExtra") };
    this.U = Object.fromEntries(["uRes", "uDpr", "uTrazo", "uClaro", "uHalo", "uMargen"].map((n) => [n, gl.getUniformLocation(p, n)]));
    this.datos = new Float32Array(N * 13);
    this.buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    gl.bufferData(gl.ARRAY_BUFFER, this.datos.byteLength, gl.DYNAMIC_DRAW);

    const rnd = azar(7);
    const f32 = () => new Float32Array(N);
    this.hx = f32();
    this.hy = f32();
    this.vis = f32();
    this.fase = f32();
    this.rigidez = f32();
    this.tamPolvo = f32();
    this.colPolvo = new Float32Array(N * 3);
    this.giro0 = new Float32Array(N * 3);
    this.giroVel = new Float32Array(N * 3);
    this.azarDes = f32();
    // El lugar de polvo de cada partícula sigue el mismo orden por bandas que las
    // figuras (ordenarPorPantalla): la partícula i cae en la misma zona en todas.
    const bandas = Math.max(1, Math.round(Math.sqrt(N / 1.6)));
    for (let i = 0; i < N; i++) {
      const b = Math.floor((i * bandas) / N);
      const de = Math.floor((b * N) / bandas);
      const a = Math.floor(((b + 1) * N) / bandas);
      this.hy[i] = (b + rnd()) / bandas;
      this.hx[i] = (i - de + rnd()) / Math.max(1, a - de);
    }
    const coloresPolvo: [Color, number][] = [
      [PALETA.ambar, 53],
      [PALETA.blanco, 28],
      [PALETA.violeta, 9],
      [PALETA.amarillo, 6],
      [PALETA.verdeAzul, 2],
      [PALETA.rosa, 2],
    ];
    for (let i = 0; i < N; i++) {
      this.vis[i] = rnd();
      this.fase[i] = rnd() * Math.PI * 2;
      this.rigidez[i] = 0.75 + rnd() * 0.5;
      const u = rnd();
      this.tamPolvo[i] = u < 0.75 ? 5 + rnd() * 4.5 : u < 0.96 ? 9 + rnd() * 5 : 14 + rnd() * 8;
      let k = rnd() * 100;
      let c: Color = PALETA.ambar;
      for (const [cc, pe] of coloresPolvo) {
        if (k < pe) {
          c = cc;
          break;
        }
        k -= pe;
      }
      this.colPolvo.set(c, i * 3);
      for (let j = 0; j < 3; j++) {
        this.giro0[i * 3 + j] = rnd() * Math.PI * 2;
        this.giroVel[i * 3 + j] = (rnd() - 0.5) * 0.5;
      }
      this.azarDes[i] = rnd();
    }

    this.pos = new Float32Array(N * 2);
    this.vel = new Float32Array(N * 2);
    this.ant = new Float32Array(N * 2);
    this.col = new Float32Array(N * 3);
    this.alfa = f32();
    this.desen = f32();
    this.rombo = f32();
    for (let i = 0; i < N; i++) this.rombo[i] = this.tamPolvo[i] > 13 && this.vis[i] * 7.31 % 1 < 0.45 ? 1 : 0;
    this.tam = f32();
    this.rot = new Float32Array(N * 3);
    const objetivo = (): Objetivo => ({ x: f32(), y: f32(), r: f32(), g: f32(), b: f32(), a: f32(), t: f32(), m: f32(), d: f32() });
    this.o1 = objetivo();
    this.o2 = objetivo();
    this.pr = { x: f32(), y: f32(), f: f32(), nz: f32(), fr: f32(), nx: f32(), ny: f32(), z: f32() };
    this.pr2 = { x: f32(), y: f32(), f: f32(), nz: f32(), fr: f32(), nx: f32(), ny: f32(), z: f32() };

    this.formas = { cerebro: cerebro(N), foco: null, globo: null, marca: null };

    const T = (x: number, y: number, ancla: number, k: number, tam: number, color: string, alfa: number): TetraGrande => ({
      x,
      y,
      ancla,
      k,
      tam,
      color,
      alfa,
      g0: [rnd() * 6, rnd() * 6, rnd() * 6],
      gv: [(rnd() - 0.5) * 0.4, (rnd() - 0.5) * 0.35, (rnd() - 0.5) * 0.2],
    });
    // Medidos en el video (MEDIDAS.md §6): lugar en la pantalla cuando el scroll del video vale `ancla`
    this.tetras = [
      T(38, 218, 0, 0.35, 34, "#ffb829", 0.85),
      T(505, 45, 0, 0.5, 20, "#ffb829", 0.75),
      T(545, 640, 0, 0.55, 18, "#8052ff", 0.75),
      T(82, 460, 0, 0.45, 14, "#ffb829", 0.6),
      T(1132, 439, 1235, 0.35, 32, "#d9d4e8", 0.75),
      T(432, 625, 1235, 0.3, 30, "#d9d4e8", 0.8),
      T(708, 208, 2023, 0.2, 22, "#d9d4e8", 0.75),
      T(1000, 630, 2023, 0.25, 34, "#d9d4e8", 0.7),
      T(296, 622, 5571, 0.3, 32, "#d9d4e8", 0.8),
      T(540, 210, 6830, 0.3, 34, "#ffb829", 0.8),
      T(1005, 625, 7770, 0.25, 30, "#d9d4e8", 0.75),
      T(30, 292, 8485, 0.25, 40, "#ffb829", 0.8),
      T(1000, 614, 8485, 0.3, 36, "#d9d4e8", 0.75),
      T(1085, 612, 9340, 0.3, 32, "#d9d4e8", 0.75),
      T(25, 395, 9340, 0.2, 30, "#ffb829", 0.75),
    ];
  }

  /** ¿Ya está el cerebro de la malla real? Mientras no, la portada muestra polvo (nunca el de respaldo a medias). */
  cerebroListo = false;

  /**
   * Carga el cerebro de malla real (public/figuras/cerebro.bin, ~60 KB). Si no se puede,
   * queda el cerebro de respaldo hecho de lóbulos.
   */
  async cargarCerebro(url: string) {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(String(r.status));
      this.formas.cerebro = cerebroDeMalla(leerCerebro(await r.arrayBuffer()), this.N);
    } catch {
      // sin red o sin archivo: el de respaldo
    }
    this.cerebroListo = true;
  }

  /** Las figuras que faltan (se crean cuando hacen falta o cuando el navegador está libre). */
  prepararResto() {
    if (!this.formas.foco) this.formas.foco = foco(this.N);
    if (!this.formas.globo) this.formas.globo = globo(this.N);
    if (!this.formas.marca) this.formas.marca = marca(this.N);
  }

  medir(w: number, h: number, dpr: number) {
    this.w = w;
    this.h = h;
    this.dpr = dpr;
    const c = this.gl.canvas as HTMLCanvasElement;
    c.width = Math.round(w * dpr);
    c.height = Math.round(h * dpr);
    this.ctx2.canvas.width = c.width;
    this.ctx2.canvas.height = c.height;
    this.gl.viewport(0, 0, c.width, c.height);
  }

  private get sx() {
    return this.w / 1212;
  }
  private get sy() {
    return this.h / 750;
  }
  private get s() {
    return Math.sqrt(this.sx * this.sy);
  }
  /** Pantalla vertical (celular): la figura va centrada y abajo, sin tapar el texto. */
  private get vertical() {
    return this.w < 700 || this.w / this.h < 0.8;
  }

  /**
   * En pantallas verticales, la figura va centrada (x 0.5) y abajo (centro en y 0.72),
   * con ~0.85 del ancho (cabe entre y 0.52 y 0.92); el giro y los cambios son los mismos.
   */
  private adaptar(c: Colocacion): Colocacion {
    if (!this.vertical) return c;
    const S = (0.85 * this.w) / 2.1; // px por unidad: la figura mide ~2.1 unidades de ancho
    return { ...c, cx: 606, cy: 540, escala: S / this.s, tam: c.tam * 0.8 };
  }

  /* ---------- Proyección de una figura ---------- */

  private proyectar(F: Forma, c: Colocacion, out: Proy) {
    const N = this.N;
    const s = this.s;
    const S = c.escala * s;
    const D = 2300 * s; // distancia de la cámara (perspectiva moderada)
    // Giro lento y continuo (la figura "respira" girando apenas, como en el video)
    const yaw = c.yaw * G + Math.sin(this.reloj * 0.26) * 0.035;
    const pitch = c.pitch * G + Math.sin(this.reloj * 0.19 + 1) * 0.012;
    const roll = c.roll * G;
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);
    const cr = Math.cos(roll);
    const sr = Math.sin(roll);
    const X0 = c.cx * this.sx;
    const Y0 = c.cy * this.sy;
    const P = F.pos;
    const Nn = F.nor;
    for (let i = 0; i < N; i++) {
      const o = i * 3;
      const x1 = P[o] * cy + P[o + 2] * sy;
      const z1 = -P[o] * sy + P[o + 2] * cy;
      const y1 = P[o + 1];
      const y2 = y1 * cp - z1 * sp;
      const z2 = y1 * sp + z1 * cp;
      const x3 = x1 * cr - y2 * sr;
      const y3 = x1 * sr + y2 * cr;
      const nx1 = Nn[o] * cy + Nn[o + 2] * sy;
      const nz1 = -Nn[o] * sy + Nn[o + 2] * cy;
      const ny1 = Nn[o + 1];
      const ny2 = ny1 * cp - nz1 * sp;
      const nz2 = ny1 * sp + nz1 * cp;
      const f = D / (D - z2 * S);
      out.x[i] = X0 + x3 * S * f;
      out.y[i] = Y0 - y3 * S * f;
      out.f[i] = f;
      out.nz[i] = nz2;
      out.fr[i] = Math.min(1, Math.hypot(nx1, ny2));
      out.nx[i] = nx1 * cr - ny2 * sr;
      out.ny[i] = nx1 * sr + ny2 * cr;
      out.z[i] = z2;
    }
  }

  /* ---------- Escribir objetivos ---------- */

  /** La partícula i como polvo del reparto c, en el objetivo O. */
  private polvo(O: Objetivo, i: number, c: Campo) {
    const [fx, fy, v] = campo(c, this.hx[i], this.hy[i], this.vis[i]);
    const t = this.reloj;
    const ph = this.fase[i];
    O.x[i] = (fx + Math.sin(t * 0.13 + ph) * 0.006) * this.w;
    O.y[i] = (fy + Math.cos(t * 0.11 + ph * 1.3) * 0.006) * this.h;
    const cc = this.colPolvo;
    O.r[i] = cc[i * 3];
    O.g[i] = cc[i * 3 + 1];
    O.b[i] = cc[i * 3 + 2];
    O.a[i] = v * (0.45 + 0.55 * ((this.vis[i] * 977) % 1));
    O.t[i] = this.tamPolvo[i] * this.s;
    O.m[i] = 1;
    // Las sueltas grandes van un poco fuera de foco (más cerca de la cámara)
    O.d[i] = this.tamPolvo[i] > 13 ? 0.35 : 0;
  }

  /** Todas las partículas como polvo del reparto c. */
  private todoPolvo(O: Objetivo, c: Campo) {
    for (let i = 0; i < this.N; i++) this.polvo(O, i, c);
  }

  /**
   * Una figura en 3D en el objetivo O. Las partículas de sobra (alfa 0) quedan
   * como polvo del reparto `sobra`.
   */
  private figura(
    O: Objetivo,
    F: Forma,
    c0: Colocacion,
    color: (i: number, pr: Proy) => Color,
    ocultarAtras: number,
    sobra: Campo,
    pr: Proy,
    luz = 1,
    volumen: Volumen | null = null,
  ) {
    const c = this.adaptar(c0);
    this.actual = c;
    if (this.vertical) luz *= 0.8;
    this.proyectar(F, c, pr);
    const s = this.s;
    for (let i = 0; i < this.N; i++) {
      // Partículas de sobra: polvo suelto. Las de "solo orilla" (alfa < 0) se encienden donde la
      // superficie se ve de lado: así la orilla queda apretada y el centro abierto (cáscara hueca).
      const soloOrilla = F.alfa[i] < 0;
      if (F.alfa[i] === 0 || (soloOrilla && (!volumen || this.vis[i] < 0.03))) {
        this.polvo(O, i, sobra);
        continue;
      }
      const nz = pr.nz[i];
      let atras: number;
      let tam = 1;
      let desen = 0;
      if (volumen) {
        // Volumen: lo de enfrente más grande y brillante; lo de atrás se ve a través, tenue y chico
        const prof = Math.min(1, Math.max(0, (pr.z[i] / volumen.radio + 1) / 2));
        // (la orilla, de canto, se ve completa: en el video el contorno es nítido y brillante)
        atras = (volumen.atras + (1 - volumen.atras) * suave(-0.32, 0.02, nz)) * (1 - volumen.prof * 0.55 * (1 - prof));
        tam = 1 + volumen.prof * 0.55 * (prof - 0.5);
        // Profundidad de campo: lo más cercano (y, en el cerebro, el lado izquierdo) va fuera de foco
        const izq = volumen.dofIzq ? suave(0.1, 0.85, -(pr.x[i] - c.cx * this.sx) / (c.escala * s)) * volumen.dofIzq : 0;
        desen = Math.min(0.45, suave(0.93, 1, prof) * 0.3 + izq * suave(0.7, 0.92, prof) * 0.6);
        tam *= 1 + 0.7 * desen;
      } else {
        // Lo de atrás no se ve (figura sólida) y lo que está de canto brilla menos (si no, la orilla se quema)
        atras = ocultarAtras > 0 ? (1 - ocultarAtras * (1 - suave(-0.12, 0.22, nz))) * (1 - ocultarAtras * 0.4 * (1 - suave(0.0, 0.42, nz))) : 1;
      }
      const cc = color(i, pr);
      let alfa = Math.abs(F.alfa[i]) * atras * luz;
      if (soloOrilla) alfa *= suave(0.7, 0.92, pr.fr[i]);
      // En la orilla se juntan muchas: cada una brilla un poco menos para que la banda no se queme
      if (volumen) alfa *= 1 - 0.4 * suave(0.8, 1, pr.fr[i]);
      O.x[i] = pr.x[i];
      O.y[i] = pr.y[i];
      O.r[i] = cc[0];
      O.g[i] = cc[1];
      O.b[i] = cc[2];
      O.a[i] = alfa;
      O.t[i] = c.tam * s * F.tam[i] * pr.f[i] * tam;
      O.m[i] = 0;
      O.d[i] = desen;
    }
  }

  /** o1[i] ← mezcla de o1[i] y o2[i] (k = 1 deja o2). */
  private mezclar(i: number, k: number) {
    const a = this.o1;
    const b = this.o2;
    a.x[i] += (b.x[i] - a.x[i]) * k;
    a.y[i] += (b.y[i] - a.y[i]) * k;
    a.r[i] += (b.r[i] - a.r[i]) * k;
    a.g[i] += (b.g[i] - a.g[i]) * k;
    a.b[i] += (b.b[i] - a.b[i]) * k;
    a.a[i] += (b.a[i] - a.a[i]) * k;
    a.t[i] += (b.t[i] - a.t[i]) * k;
    a.m[i] += (b.m[i] - a.m[i]) * k;
    a.d[i] += (b.d[i] - a.d[i]) * k;
  }

  /* ---------- Colores con brillo de orilla ---------- */

  /**
   * Color del cerebro por orientación y por zona, como en el video (medido por la
   * dirección hacia la orilla más cercana): ámbar en la orilla y en las caras de abajo
   * (orilla de abajo ~75 %, derecha ~69 %, arriba ~50 %, frente ~36 %; centro ~23 %),
   * blanco donde la cara mira a la cámara y a la luz, y zonas verde azulado y violeta
   * que giran con el cerebro. Cada triangulito elige su color con su propio umbral
   * (con bordes suaves para que no parpadee al girar).
   */
  private colorCerebro = (i: number, pr: Proy): Color => {
    const F = this.formas.cerebro;
    const nx = pr.nx[i];
    const ny = pr.ny[i];
    const nz = pr.nz[i];
    // La orilla es solo la franja de afuera (medido: ~25 px de ~330 → de canto, fr > 0.9)
    const fr = pr.fr[i];
    const rim = suave(0.86, 0.98, fr);
    const medio = suave(0.76, 0.92, fr);
    const abajo = suave(0.2, 0.85, -ny) * medio;
    const arriba = suave(0.3, 0.9, ny);
    const izquierda = suave(0.3, 0.9, -nx);
    const derecha = suave(0.3, 0.9, nx) * medio;
    const luzBlanca = suave(0.45, 0.95, 0.3 * nx + 0.25 * ny + 0.92 * nz);
    const pA = Math.min(0.9, 0.32 + (0.16 * medio + 0.16 * rim) * (1 - 0.5 * izquierda) + 0.14 * abajo + 0.06 * derecha);
    const g = F.grupo[i];
    const pWrel = Math.min(0.95, (0.66 + 0.2 * (1 - medio) + 0.1 * luzBlanca) * (1 - 0.5 * g));
    const pW = pA + (1 - pA) * pWrel;
    const u = F.umbral[i];
    const wA = 1 - suave(pA - 0.03, pA + 0.03, u);
    const wW = (1 - wA) * (1 - suave(pW - 0.03, pW + 0.03, u));
    const wC = Math.max(0, 1 - wA - wW);
    const o = i * 3;
    const A = PALETA.ambar;
    const B = PALETA.blanco;
    // Luz: lo que mira a la luz brilla más; lo de canto, un poco menos
    const l = 0.84 + 0.3 * Math.max(luzBlanca, rim * 0.7);
    // Destellos magenta en el borde de arriba (como en el video)
    const mag = arriba * medio > 0.3 && (u * 13.7) % 1 < 0.45;
    const c0 = mag ? PALETA.magenta[0] : F.col[o];
    const c1 = mag ? PALETA.magenta[1] : F.col[o + 1];
    const c2 = mag ? PALETA.magenta[2] : F.col[o + 2];
    // El blanco del interior tira a gris lavanda en las caras que no miran a la luz
    const Bl = 1 - 0.06 * (1 - luzBlanca);
    return [(A[0] * wA + B[0] * Bl * wW + c0 * wC) * l, (A[1] * wA + B[1] * Bl * 0.97 * wW + c1 * wC) * l, (A[2] * wA + B[2] * wW + c2 * wC) * l];
  };

  private colorFoco = (i: number, pr: Proy): Color => {
    const F = this.formas.foco!;
    const base: Color = [F.col[i * 3], F.col[i * 3 + 1], F.col[i * 3 + 2]];
    // Ámbar solo en la orilla del vidrio, en el arco de arriba a la izquierda (de las 12 a las 8)
    const y = F.pos[i * 3 + 1];
    if (y < -0.75) return base;
    const cx = this.actual.cx * this.sx;
    const cy = this.actual.cy * this.sy;
    const dx = pr.x[i] - cx;
    const dy = pr.y[i] - cy;
    const d = Math.hypot(dx, dy) || 1;
    const arco = suave(-0.2, 0.55, (-dx * 0.85 - dy * 0.52) / d);
    const orilla = suave(0.62, 0.97, pr.fr[i]);
    const w = orilla * arco * suave(-0.75, -0.2, y);
    const u = F.umbral[i];
    // Luz de frente, un poco desde arriba a la derecha: reflejo blanco y lado de sombra más tenue
    const lam = Math.max(0, 0.3 * pr.nx[i] + 0.35 * pr.ny[i] + 0.88 * pr.nz[i]);
    const conLuz = mezcla(base, PALETA.blanco, suave(0.72, 0.98, lam) * 0.5);
    const c = mezcla(conLuz, PALETA.ambar, suave(u - 0.15, u + 0.15, w * 1.15));
    const k = 0.55 + 0.6 * lam + 0.25 * orilla;
    return [c[0] * k, c[1] * k, c[2] * k];
  };

  private colorGlobo = (i: number, pr: Proy): Color => {
    const F = this.formas.globo!;
    let c: Color = [F.col[i * 3], F.col[i * 3 + 1], F.col[i * 3 + 2]];
    if (F.clave[i] > 0.5) {
      // Parche blanco (reflejo) en el lado izquierdo
      const x = (pr.x[i] - this.actual.cx * this.sx) / (this.actual.escala * this.s);
      const y = (pr.y[i] - this.actual.cy * this.sy) / (this.actual.escala * this.s);
      // Medido: el parche está en x 540-700, y 330-510 (centro ≈ -0.63, -0.18 en radios del globo)
      const brillo = suave(0.27, 0.08, Math.hypot((x + 0.62) * 0.95, (y + 0.17) * 0.85));
      c = mezcla(c, PALETA.blanco, brillo * (0.55 + 0.45 * F.umbral[i]));
    }
    const orilla = suave(0.85, 0.99, pr.fr[i]);
    return mezcla(c, mezcla(PALETA.ambar, PALETA.blanco, 0.3), orilla * 0.45);
  };

  private colorMarca = (i: number): Color => {
    const F = this.formas.marca!;
    return [F.col[i * 3], F.col[i * 3 + 1], F.col[i * 3 + 2]];
  };

  /* ---------- El guion ---------- */

  /** Lugar del cerebro para una posición de la historia (0 a 2), continuo entre los dos tramos. */
  private cerebroEn(P: number): Colocacion {
    return P < 1 ? entre(CEREBRO_A, clamp01(P)) : entre(CEREBRO_B, clamp01(P - 1));
  }

  /** Llena o1 (el objetivo de cada partícula) para la posición P (0 a 7). */
  private componer(P: number) {
    const N = this.N;
    const fm = this.formas;
    const seg = Math.min(6, Math.max(0, Math.floor(P)));
    const p = clamp01(P - seg);
    const h = this.h;
    const o1 = this.o1;
    const o2 = this.o2;

    if (seg <= 1 && !this.cerebroListo) {
      this.todoPolvo(o1, seg === 0 ? "suelto" : "caos");
      return;
    }
    if (seg === 0) {
      // Portada → decisiones: el cerebro gira de lado a frente, crece y se va a la izquierda.
      // Al llegar, abajo a la derecha se deshace en una cola de polvo.
      this.figura(o1, fm.cerebro, this.cerebroEn(this.posicion), this.colorCerebro, 0, "suelto", this.pr, LUZ.cerebro, VOL_CEREBRO);
      this.cola(suave(0.82, 1.0, p));
      return;
    }
    if (seg === 1) {
      // Decisiones → caos: el cerebro va al centro, se ve desde arriba y se deshace
      // de abajo hacia arriba hasta llenar la pantalla de polvo.
      this.figura(o1, fm.cerebro, this.cerebroEn(this.posicion), this.colorCerebro, 0, "suelto", this.pr, LUZ.cerebro, VOL_CEREBRO);
      this.cola(1 - suave(0.0, 0.3, p) * 0.4);
      this.todoPolvo(o2, "caos");
      for (let i = 0; i < N; i++) {
        const y = o1.y[i] / h;
        const umbral = 0.08 + 0.62 * clamp01(1.05 - y) + 0.14 * this.azarDes[i];
        const k = suave(umbral, umbral + 0.22, p);
        if (k > 0) this.mezclar(i, k);
      }
      return;
    }
    if (seg === 2) {
      // Caos (quieto) → el polvo se junta → se forma el foco
      if (p < 0.642) {
        this.todoPolvo(o1, "caos");
        return;
      }
      if (p < 0.704) {
        const k0 = suave(0.642, 0.704, p);
        this.todoPolvo(o1, "caos");
        this.todoPolvo(o2, "junto");
        for (let i = 0; i < N; i++) this.mezclar(i, suave(this.azarDes[i] * 0.4, 0.6 + this.azarDes[i] * 0.4, k0));
        return;
      }
      const q = suave(0.704, 0.95, p);
      this.prepararResto();
      this.todoPolvo(o1, "junto");
      if (q <= 0) return;
      this.figura(o2, fm.foco!, FOCO, this.colorFoco, 0, "suelto", this.pr, LUZ.foco, VOL_FOCO);
      // Se arma del vidrio (arriba) hacia la rosca, con escalonado
      for (let i = 0; i < N; i++) {
        const umbral = fm.foco!.clave[i] * 0.55 + this.azarDes[i] * 0.2;
        this.mezclar(i, suave(umbral, umbral + 0.25, q));
      }
      return;
    }
    this.prepararResto();
    if (seg === 3) {
      // Foco → globo: el foco se corre a la derecha y se deshace; el globo se forma a la derecha
      const q = suave(0.05, 0.45, p);
      this.figura(o1, fm.foco!, entre2(FOCO, FOCO_SALE, suave(0.0, 0.3, p)), this.colorFoco, 0, "suelto", this.pr, LUZ.foco, VOL_FOCO);
      if (q <= 0) return;
      this.figura(o2, fm.globo!, GLOBO, this.colorGlobo, 1, "suelto", this.pr2, LUZ.globo);
      for (let i = 0; i < N; i++) {
        const umbral = 0.1 + this.azarDes[i] * 0.45;
        const k = suave(umbral, umbral + 0.45, q);
        this.mezclar(i, k);
        // A mitad del cambio, una nube suave
        const nube = Math.sin(k * Math.PI);
        o1.x[i] += (this.hx[i] - 0.5) * 110 * nube * this.s;
        o1.y[i] += (this.hy[i] - 0.5) * 80 * nube * this.s;
      }
      return;
    }
    if (seg === 4) {
      // Globo → equipo: el globo sube, se vacía en un anillo y queda polvo arriba
      const q = suave(0.25, 1.0, p);
      this.figura(o1, fm.globo!, entre2(GLOBO, GLOBO_SUBE, suave(0.25, 0.75, p)), this.colorGlobo, 1, "suelto", this.pr, LUZ.globo);
      if (q <= 0) return;
      this.todoPolvo(o2, "equipo");
      for (let i = 0; i < N; i++) {
        // Primero se va lo del frente (el centro), al final la orilla
        const frente = clamp01(this.pr.nz[i]);
        const umbral = 0.05 + 0.5 * (1 - frente) + 0.15 * this.azarDes[i];
        this.mezclar(i, suave(umbral, umbral + 0.25, q));
      }
      return;
    }
    if (seg === 5) {
      // Equipo → planes: el polvo se reparte ralo (más arriba a la izquierda)
      const q = suave(0.04, 0.9, p);
      this.todoPolvo(o1, "equipo");
      if (q <= 0) return;
      this.todoPolvo(o2, "planes");
      for (let i = 0; i < N; i++) {
        const umbral = this.azarDes[i] * 0.5;
        this.mezclar(i, suave(umbral, umbral + 0.5, q));
      }
      return;
    }
    // Planes → cierre: el polvo se junta al centro y forma la marca de Atendel, que llega
    // girando y después sigue girando despacio. Todo va atado al scroll y es continuo:
    // - el polvo se junta de p 0.05 a 0.65 y la marca se arma de p 0.55 a 1, con el mismo
    //   avance para todas las partículas (apenas escalonado del centro hacia afuera);
    // - las partículas de la marca ya se ven en la nube, así que al armarse solo se mueven y
    //   toman su color: no aparecen una por una.
    // (Antes la marca se armaba en el último 5 % del tramo, los últimos ~40 px de scroll
    // pegados al final de la página: con el frenado del scroll suave avanzaba a pasitos.)
    this.prepararResto();
    const M = fm.marca!;
    const q1 = suave(0.05, 0.65, p);
    const q2 = suave(0.55, 1.0, p);
    this.todoPolvo(o1, "planes");
    this.todoPolvo(o2, "centro");
    const s = this.s;
    for (let i = 0; i < N; i++) {
      if (M.alfa[i] > 0) {
        // En la nube ya va la partícula de la marca (con el color del polvo y su tamaño)
        o2.a[i] = Math.max(o2.a[i] * 0.6, 0.42 * LUZ.marca);
        o2.t[i] = MARCA.tam * s * M.tam[i] * 1.1;
      }
      const umbral = this.azarDes[i] * 0.2;
      this.mezclar(i, suave(umbral, umbral + 0.8, q1));
    }
    if (q2 <= 0) return;
    const falta = (1 - q2) * (1 - q2);
    const t = this.reloj;
    const lugar: Colocacion = {
      ...MARCA,
      yaw: MARCA.yaw - 55 * falta + 7 * Math.sin(t * 0.38),
      pitch: MARCA.pitch + 3 * Math.sin(t * 0.29 + 1),
      roll: MARCA.roll + 30 * falta,
    };
    this.figura(o2, M, lugar, this.colorMarca, 0, "suelto", this.pr, LUZ.marca);
    for (let i = 0; i < N; i++) {
      const umbral = clamp01(M.clave[i]) * 0.12 + this.azarDes[i] * 0.08;
      this.mezclar(i, suave(umbral, umbral + 0.8, q2));
    }
  }

  /** La cola de polvo abajo a la derecha del cerebro grande (decisiones). */
  private cola(k: number) {
    if (k <= 0) return;
    const o = this.o1;
    for (let i = 0; i < this.N; i++) {
      if (o.m[i] > 0.5) continue;
      const y = o.y[i] / this.h;
      const x = o.x[i] / this.w;
      // Solo lo de abajo (y > 75 %) y del lado derecho del cerebro
      const zona = suave(0.74, 0.92, y) * suave(0.2, 0.42, x);
      if (zona <= 0) continue;
      const a = this.azarDes[i];
      const kk = k * zona * (0.4 + 0.6 * a);
      o.x[i] += (60 + 260 * a) * kk * this.s;
      o.y[i] += (30 + 120 * ((a * 7.3) % 1)) * kk * this.s;
      o.a[i] *= 1 - 0.35 * kk;
    }
  }

  /* ---------- Simulación ---------- */

  /** Avanza dt segundos. Con `quieto` (movimiento reducido) todo llega de inmediato. */
  paso(dt: number, quieto = false) {
    dt = Math.min(Math.max(dt, 0), 1 / 15);
    this.reloj += dt;
    // La figura va con el scroll ya suavizado (Lenis), sin retraso propio: en el video incluso
    // va un poco adelante del texto (eso ya está en las llaves de cada tramo). Si la posición
    // pedida brinca, los resortes de cada partícula dan la llegada suave.
    this.posicion = Number.isFinite(this.objetivo) ? this.objetivo : this.posicion;
    this.velPos = 0;
    this.componer(this.posicion);
    const o = this.o1;
    const N = this.N;
    const kc = 1 - Math.exp(-dt * 9);
    if (this.primera || quieto) {
      for (let i = 0; i < N; i++) {
        this.pos[i * 2] = this.ant[i * 2] = o.x[i];
        this.pos[i * 2 + 1] = this.ant[i * 2 + 1] = o.y[i];
        this.vel[i * 2] = this.vel[i * 2 + 1] = 0;
        this.col[i * 3] = o.r[i];
        this.col[i * 3 + 1] = o.g[i];
        this.col[i * 3 + 2] = o.b[i];
        this.alfa[i] = o.a[i];
        this.tam[i] = o.t[i];
        this.desen[i] = o.d[i];
      }
    } else {
      const sub = Math.max(1, Math.min(6, Math.round(dt * 120)));
      const hh = dt / sub;
      // Cada partícula sigue a su lugar con un resorte que además copia la velocidad de
      // ese lugar: cuando la figura solo se mueve o gira, va pegada (sin quedarse atrás);
      // en los cambios de figura el resorte sigue dando la llegada suave.
      const inv = 1 / Math.max(dt, 1e-3);
      const vmax = 2600 * this.s;
      for (let i = 0; i < N; i++) {
        const w = 13 * this.rigidez[i];
        const k = w * w;
        const am = 2 * w;
        const ix = i * 2;
        let x = this.pos[ix];
        let y = this.pos[ix + 1];
        let vx = this.vel[ix];
        let vy = this.vel[ix + 1];
        let tvx = (o.x[i] - this.ant[ix]) * inv;
        let tvy = (o.y[i] - this.ant[ix + 1]) * inv;
        const tv = Math.hypot(tvx, tvy);
        if (tv > vmax) {
          tvx *= vmax / tv;
          tvy *= vmax / tv;
        }
        tvx *= SEGUIR;
        tvy *= SEGUIR;
        this.ant[ix] = o.x[i];
        this.ant[ix + 1] = o.y[i];
        for (let s = 0; s < sub; s++) {
          vx += ((o.x[i] - x) * k + (tvx - vx) * am) * hh;
          vy += ((o.y[i] - y) * k + (tvy - vy) * am) * hh;
          x += vx * hh;
          y += vy * hh;
        }
        this.pos[ix] = x;
        this.pos[ix + 1] = y;
        this.vel[ix] = vx;
        this.vel[ix + 1] = vy;
        this.col[i * 3] += (o.r[i] - this.col[i * 3]) * kc;
        this.col[i * 3 + 1] += (o.g[i] - this.col[i * 3 + 1]) * kc;
        this.col[i * 3 + 2] += (o.b[i] - this.col[i * 3 + 2]) * kc;
        this.alfa[i] += (o.a[i] - this.alfa[i]) * kc;
        this.tam[i] += (o.t[i] - this.tam[i]) * kc;
        this.desen[i] += (o.d[i] - this.desen[i]) * kc;
      }
    }
    // Giro de cada tetraedro: alineado en la figura (punta arriba; en el foco, al revés), suelto en el polvo
    const t = this.reloj;
    const enFoco = suave(2.72, 2.85, this.posicion) * (1 - suave(3.1, 3.3, this.posicion));
    const vuelta = (a: number) => a - Math.round(a / (Math.PI * 2)) * Math.PI * 2;
    const kr = this.primera || quieto ? 1 : kc;
    for (let i = 0; i < N; i++) {
      const m = o.m[i];
      const j = i * 3;
      const az = this.giro0[j];
      const fx = Math.sin(az) * 0.22;
      const fy = Math.cos(az * 1.7) * 0.22;
      // en el plano: casi todos apuntan arriba, algunos girados (como en el video)
      const fz = Math.sin(az * 2.3) * 0.42 + enFoco * Math.PI;
      const px = this.giro0[j] + t * this.giroVel[j];
      const py = this.giro0[j + 1] + t * this.giroVel[j + 1];
      const pz = this.giro0[j + 2] + t * this.giroVel[j + 2];
      const ax = fx + vuelta(px - fx) * m;
      const ay = fy + vuelta(py - fy) * m;
      const az2 = fz + vuelta(pz - fz) * m;
      this.rot[j] += vuelta(ax - this.rot[j]) * kr;
      this.rot[j + 1] += vuelta(ay - this.rot[j + 1]) * kr;
      this.rot[j + 2] += vuelta(az2 - this.rot[j + 2]) * kr;
    }
    this.primera = false;
  }

  /* ---------- Dibujo ---------- */

  dibujar() {
    const gl = this.gl;
    const N = this.N;
    const d = this.datos;
    for (let i = 0; i < N; i++) {
      const o = i * 13;
      d[o] = this.pos[i * 2];
      d[o + 1] = this.pos[i * 2 + 1];
      // El triangulito mide tam px de ancho (el punto, más grande, se calcula en el shader)
      d[o + 2] = this.tam[i] / 0.77;
      d[o + 3] = this.col[i * 3];
      d[o + 4] = this.col[i * 3 + 1];
      d[o + 5] = this.col[i * 3 + 2];
      d[o + 6] = this.alfa[i];
      d[o + 7] = this.rot[i * 3];
      d[o + 8] = this.rot[i * 3 + 1];
      d[o + 9] = this.rot[i * 3 + 2];
      d[o + 10] = this.desen[i];
      d[o + 11] = this.rombo[i] * this.mOrilla(i);
      // En la figura, triángulo hueco (aristas al centro apagadas); en el polvo, tetraedro
      d[o + 12] = 0.15 + 0.75 * this.mOrilla(i);
    }
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    if (this.claro) gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    else gl.blendFunc(gl.ONE, gl.ONE);
    gl.useProgram(this.prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, d);
    const A = this.A;
    gl.enableVertexAttribArray(A.pos);
    gl.vertexAttribPointer(A.pos, 2, gl.FLOAT, false, 52, 0);
    gl.enableVertexAttribArray(A.tam);
    gl.vertexAttribPointer(A.tam, 1, gl.FLOAT, false, 52, 8);
    gl.enableVertexAttribArray(A.col);
    gl.vertexAttribPointer(A.col, 4, gl.FLOAT, false, 52, 12);
    gl.enableVertexAttribArray(A.rot);
    gl.vertexAttribPointer(A.rot, 3, gl.FLOAT, false, 52, 28);
    gl.enableVertexAttribArray(A.extra);
    gl.vertexAttribPointer(A.extra, 3, gl.FLOAT, false, 52, 40);
    gl.uniform2f(this.U.uRes, this.w, this.h);
    gl.uniform1f(this.U.uDpr, this.dpr);
    gl.uniform1f(this.U.uTrazo, 0.7);
    gl.uniform1f(this.U.uClaro, this.claro ? 1 : 0);
    // Halo suave (en claro no: ahí se pinta encima)
    gl.uniform1f(this.U.uHalo, this.claro ? 0 : HALO);
    gl.uniform1f(this.U.uMargen, 1.45);
    gl.drawArrays(gl.POINTS, 0, N);
    for (const l of [A.pos, A.tam, A.col, A.rot, A.extra]) gl.disableVertexAttribArray(l);
    // El resplandor suave de la figura (en oscuro)
    if (this.progR && !this.claro && RESPLANDOR > 0) {
      const R = this.AR;
      gl.useProgram(this.progR);
      gl.enableVertexAttribArray(R.pos);
      gl.vertexAttribPointer(R.pos, 2, gl.FLOAT, false, 52, 0);
      gl.enableVertexAttribArray(R.tam);
      gl.vertexAttribPointer(R.tam, 1, gl.FLOAT, false, 52, 8);
      gl.enableVertexAttribArray(R.col);
      gl.vertexAttribPointer(R.col, 4, gl.FLOAT, false, 52, 12);
      gl.enableVertexAttribArray(R.extra);
      gl.vertexAttribPointer(R.extra, 3, gl.FLOAT, false, 52, 40);
      gl.uniform2f(this.UR.uRes, this.w, this.h);
      gl.uniform1f(this.UR.uDpr, this.dpr);
      gl.uniform1f(this.UR.uAncho, 4.2);
      gl.uniform1f(this.UR.uFuerza, RESPLANDOR);
      gl.drawArrays(gl.POINTS, 0, N);
      for (const l of [R.pos, R.tam, R.col, R.extra]) gl.disableVertexAttribArray(l);
    }
    this.dibujarTetras();
  }

  /** Cuánto es polvo la partícula i (0 = en la figura, 1 = suelta). */
  private mOrilla(i: number) {
    return Math.min(1, Math.max(0, this.o1.m[i]));
  }

  /** Los tetraedros grandes de contorno que flotan (lienzo 2D), con paralaje según el scroll del video. */
  private dibujarTetras() {
    const ctx = this.ctx2;
    const dpr = this.dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, this.w, this.h);
    ctx.lineJoin = "round";
    const t = this.reloj;
    const s = this.s;
    const sv = scrollVideo(this.objetivo);
    for (const te of this.tetras) {
      const yv = te.y - (sv - te.ancla) * te.k;
      const x = te.x * this.sx + Math.sin(t * 0.2 + te.g0[0]) * 8 * s;
      const y = yv * this.sy + Math.cos(t * 0.17 + te.g0[1]) * 6 * s;
      if (y < -90 || y > this.h + 90) continue;
      const ay = te.g0[0] + t * te.gv[0];
      const ax = te.g0[1] + t * te.gv[1];
      const az = te.g0[2] + t * te.gv[2];
      const V = [
        [0, 1, 0],
        [0.943, -0.333, 0],
        [-0.471, -0.333, 0.816],
        [-0.471, -0.333, -0.816],
      ].map(([vx, vy, vz]) => {
        const x1 = Math.cos(ay) * vx + Math.sin(ay) * vz;
        const z1 = -Math.sin(ay) * vx + Math.cos(ay) * vz;
        const y1 = Math.cos(ax) * vy - Math.sin(ax) * z1;
        const x2 = Math.cos(az) * x1 - Math.sin(az) * y1;
        const y2 = Math.sin(az) * x1 + Math.cos(az) * y1;
        return [x + x2 * te.tam * s, y - y2 * te.tam * s];
      });
      ctx.globalAlpha = te.alfa * (this.claro ? 0.7 : 1);
      ctx.strokeStyle = this.claro && te.color === "#d9d4e8" ? "#8a83a3" : te.color;
      ctx.lineWidth = 2 * Math.max(0.8, s);
      ctx.shadowColor = this.claro ? "transparent" : te.color;
      ctx.shadowBlur = this.claro ? 0 : 6;
      ctx.beginPath();
      for (const [a, b] of [
        [0, 1],
        [0, 2],
        [0, 3],
        [1, 2],
        [2, 3],
        [3, 1],
      ]) {
        ctx.moveTo(V[a][0], V[a][1]);
        ctx.lineTo(V[b][0], V[b][1]);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  destruir() {
    this.gl.deleteBuffer(this.buf);
    this.gl.deleteProgram(this.prog);
    if (this.progR) this.gl.deleteProgram(this.progR);
  }
}
