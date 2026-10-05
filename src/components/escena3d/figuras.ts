/**
 * Las figuras de la escena 3D, como nubes de puntos.
 * Cada figura se arma muestreando la SUPERFICIE de un modelo 3D sencillo
 * (hecho con matemáticas, sin archivos), así los puntos quedan repartidos
 * parejo. Todas tienen el mismo número de puntos: el punto i de una figura
 * viaja al punto i de la siguiente.
 *
 * Por punto se guardan:
 * - posición (x, y, z) — la figura mide más o menos de -1.5 a 1.5
 * - normal (nx, ny, nz) — hacia dónde mira la superficie, para la luz
 *   (0, 0, 0 = polvo suelto, sin luz)
 * - color (r, g, b) de 0 a 1 — la mayoría apagados; solo algunos blancos brillantes
 * - opacidad (0.5 a 0.8, distinta en cada uno)
 */
export type Nube = {
  n: number;
  pos: Float32Array;
  normal: Float32Array;
  color: Float32Array;
  alfa: Float32Array;
};

type Color = [number, number, number];
type V3 = [number, number, number];
const hex = (h: string): Color => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as Color;
const mezcla = (a: Color, b: Color, k: number): Color => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const por = (a: Color, k: number): Color => [a[0] * k, a[1] * k, a[2] * k];

/** La paleta de la escena: ámbar, morado, blanco y un poco de verde azulado. */
export const PALETA = {
  ambar: hex("#f5a623"),
  morado: hex("#7b5cff"),
  blanco: hex("#ffffff"),
  verdeAzul: hex("#2fd6b5"),
};

/** Los colores de Lola, Clara, Víctor e Iris (los del logo), llevados hacia la paleta de la escena. */
const COLORES_LOGO: Color[] = [
  mezcla(hex("#ff8a6b"), PALETA.ambar, 0.45), // Lola: coral → ámbar
  mezcla(hex("#7fb2ff"), PALETA.morado, 0.6), // Clara: azul → morado
  mezcla(hex("#5fd09f"), PALETA.verdeAzul, 0.5), // Víctor: verde → verde azulado
  mezcla(hex("#f6c64a"), PALETA.ambar, 0.4), // Iris: amarillo → ámbar
];

/** La opacidad de cada partícula: entre 0.5 y 0.8, distinta en cada una. */
const opacidad = () => 0.5 + Math.random() * 0.3;
/** Color apagado (la mayoría) o, a veces, un blanco brillante. */
function tono(base: Color, blancos = 0.07): Color {
  return Math.random() < blancos ? PALETA.blanco : por(base, 0.55 + Math.random() * 0.25);
}
function alAzar<T>(lista: T[]): T {
  return lista[Math.floor(Math.random() * lista.length)];
}
/** Dirección al azar sobre una esfera. */
function direccion(): V3 {
  const u = Math.random() * 2 - 1;
  const a = Math.random() * Math.PI * 2;
  const r = Math.sqrt(1 - u * u);
  return [r * Math.cos(a), u, r * Math.sin(a)];
}
/** Número con forma de campana entre -1 y 1. */
const campana = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;

function nueva(n: number): Nube {
  return { n, pos: new Float32Array(n * 3), normal: new Float32Array(n * 3), color: new Float32Array(n * 3), alfa: new Float32Array(n) };
}
function poner(f: Nube, i: number, p: V3, nrm: V3, c: Color, a: number) {
  f.pos.set(p, i * 3);
  f.normal.set(nrm, i * 3);
  f.color.set(c, i * 3);
  f.alfa[i] = a;
}
/** Polvo suelto alrededor de una figura (sin luz, más tenue). */
function polvoAlrededor(f: Nube, i: number, r0: number, r1: number) {
  const [x, y, z] = direccion();
  const r = r0 + Math.random() * (r1 - r0);
  poner(f, i, [x * r, y * r * 0.8, z * r * 0.6], [0, 0, 0], tono(alAzar([PALETA.ambar, PALETA.morado, PALETA.verdeAzul]), 0.15), opacidad() * 0.6);
}

/**
 * 1. El logo de Atendel: los cuatro círculos (uno por agente) como cuatro
 *    esferas acomodadas dos por dos, con los puntos repartidos parejo sobre
 *    cada superficie (espiral de Fibonacci).
 */
export function logo(n: number): Nube {
  const f = nueva(n);
  const R = 0.52;
  const SEP = 0.62;
  const CENTROS: [number, number][] = [
    [-SEP, SEP],
    [SEP, SEP],
    [-SEP, -SEP],
    [SEP, -SEP],
  ];
  const polvo = Math.floor(n * 0.05);
  const porEsfera = Math.floor((n - polvo) / 4);
  const dorado = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    if (i < polvo) {
      polvoAlrededor(f, i, 1.5, 2.9);
      continue;
    }
    const j = i - polvo;
    const k = Math.min(3, Math.floor(j / porEsfera));
    const m = j - k * porEsfera;
    const [cx, cy] = CENTROS[k];
    const y = 1 - ((m + 0.5) / porEsfera) * 2;
    const rr = Math.sqrt(Math.max(0, 1 - y * y));
    const a = m * dorado + k * 1.7;
    const nx = Math.cos(a) * rr;
    const nz = Math.sin(a) * rr;
    // El color del agente, con destellos de la paleta
    const azar = Math.random();
    const base = azar < 0.06 ? PALETA.morado : azar < 0.1 ? PALETA.ambar : COLORES_LOGO[k];
    poner(f, i, [cx + nx * R, cy + y * R, nz * R], [nx, y, nz], tono(base), opacidad());
  }
  return f;
}

/** 2. El caos: las partículas dispersas por toda la pantalla, en desorden. */
export function caos(n: number): Nube {
  const f = nueva(n);
  for (let i = 0; i < n; i++) {
    const base = alAzar([PALETA.ambar, PALETA.ambar, PALETA.morado, PALETA.morado, PALETA.verdeAzul, PALETA.blanco]);
    poner(
      f,
      i,
      [(Math.random() * 2 - 1) * 8, (Math.random() * 2 - 1) * 4.8, Math.random() * 9 - 7],
      [0, 0, 0],
      tono(base, 0.05),
      opacidad() * 0.75,
    );
  }
  return f;
}

/** 3. Las partículas juntas en el centro, una nube apretada con brillo cálido. */
export function junta(n: number): Nube {
  const f = nueva(n);
  for (let i = 0; i < n; i++) {
    const [x, y, z] = direccion();
    // Muy denso al centro, se deshilacha hacia afuera
    const r = 0.45 + Math.pow(Math.random(), 1.6) * 1.2;
    const calido = Math.random();
    const base = calido < 0.55 ? PALETA.ambar : calido < 0.8 ? mezcla(PALETA.ambar, PALETA.blanco, 0.5) : PALETA.morado;
    poner(f, i, [x * r, y * r, z * r], [0, 0, 0], tono(base, 0.12), opacidad());
  }
  return f;
}

/**
 * 4. Una burbuja de chat 3D: cuerpo redondo e inflado y la colita abajo a la
 *    izquierda. Degradado: naranja arriba, blanco al centro, morado abajo.
 */
export function burbuja(n: number): Nube {
  const f = nueva(n);
  const color = (y: number): Color => {
    const t = Math.min(1, Math.max(0, (y + 1.1) / 2.1)); // 0 abajo, 1 arriba
    if (t > 0.62) return mezcla(PALETA.blanco, PALETA.ambar, (t - 0.62) / 0.38);
    if (t > 0.38) return mezcla(mezcla(PALETA.morado, PALETA.blanco, 0.45), PALETA.blanco, (t - 0.38) / 0.24);
    return mezcla(PALETA.morado, mezcla(PALETA.morado, PALETA.blanco, 0.45), t / 0.38);
  };
  const polvo = Math.floor(n * 0.04);
  const e = 2.6;
  const SX = 1.15;
  const SY = 0.85;
  const SZ = 0.55;
  for (let i = 0; i < n; i++) {
    if (i < polvo) {
      polvoAlrededor(f, i, 1.6, 2.8);
      continue;
    }
    if (Math.random() < 0.09) {
      // La colita: un cono que sale abajo a la izquierda
      const u = Math.pow(Math.random(), 0.8);
      const radio = 0.22 * (1 - u) + 0.02;
      const a = Math.random() * Math.PI * 2;
      const x = -0.55 - 0.45 * u + Math.cos(a) * radio * 0.7;
      const y = -0.7 - 0.45 * u + Math.sin(a) * radio * 0.5;
      const z = Math.sin(a) * radio;
      poner(f, i, [x, y, z], [Math.cos(a) * 0.5, -0.5, Math.sin(a)], tono(color(y), 0.04), opacidad());
      continue;
    }
    // El cuerpo: un "cojín" (superelipsoide) con los puntos en la superficie
    const [dx, dy, dz] = direccion();
    const g = Math.abs(dx / SX) ** e + Math.abs(dy / SY) ** e + Math.abs(dz / SZ) ** e;
    const r = 1 / Math.pow(g, 1 / e);
    const x = dx * r;
    const y = dy * r;
    const z = dz * r;
    const grad = (v: number, s: number) => (Math.sign(v) * Math.abs(v / s) ** (e - 1)) / s;
    poner(f, i, [x, y, z], [grad(x, SX), grad(y, SY), grad(z, SZ)], tono(color(y), 0.06), opacidad());
  }
  return f;
}

/**
 * 5. Un calendario 3D: un bloque con la franja de arriba en ámbar, la
 *    cuadrícula de días en el frente, algunas citas marcadas y dos argollas.
 */
export function calendario(n: number): Nube {
  const f = nueva(n);
  const W = 1.25; // medio ancho
  const H = 1.15; // medio alto
  const D = 0.16; // medio grueso
  const franja = 0.62; // de aquí para arriba es la franja de color
  const COLS = 7;
  const FILAS = 5;
  const celdaW = (2 * W - 0.2) / COLS;
  const celdaH = (franja + H - 0.2) / FILAS;
  // Días con cita (columna, fila)
  const citas = new Set(["1,1", "4,1", "2,2", "5,3", "0,3", "3,4", "6,2"]);
  const polvo = Math.floor(n * 0.04);

  for (let i = 0; i < n; i++) {
    if (i < polvo) {
      polvoAlrededor(f, i, 1.8, 3);
      continue;
    }
    const q = Math.random();
    if (q < 0.08) {
      // Las dos argollas de arriba (medio aro)
      const lado = Math.random() < 0.5 ? -1 : 1;
      const a = Math.random() * Math.PI;
      const fi = Math.random() * Math.PI * 2;
      const R = 0.18;
      const r = 0.035;
      const cx = lado * 0.6 + Math.cos(a) * (R + r * Math.cos(fi)) * 0.3;
      const cy = H - 0.05 + Math.sin(a) * (R + r * Math.cos(fi));
      const cz = Math.cos(a) * (R + r * Math.cos(fi)) * 0.9;
      poner(f, i, [cx, cy, cz], [0, Math.sin(a), Math.cos(a)], tono(PALETA.blanco, 0.3), opacidad());
      continue;
    }
    if (q < 0.25) {
      // Los costados y la parte de atrás (más tenues)
      const cara = Math.floor(Math.random() * 4);
      let p: V3;
      let nrm: V3;
      if (cara === 0) {
        p = [(Math.random() * 2 - 1) * W, (Math.random() * 2 - 1) * H, -D];
        nrm = [0, 0, -1];
      } else if (cara === 1) {
        p = [(Math.random() * 2 - 1) * W, H, (Math.random() * 2 - 1) * D];
        nrm = [0, 1, 0];
      } else if (cara === 2) {
        p = [(Math.random() < 0.5 ? -1 : 1) * W, (Math.random() * 2 - 1) * H, (Math.random() * 2 - 1) * D];
        nrm = [Math.sign(p[0]), 0, 0];
      } else {
        p = [(Math.random() * 2 - 1) * W, -H, (Math.random() * 2 - 1) * D];
        nrm = [0, -1, 0];
      }
      const c = p[1] > franja ? PALETA.ambar : PALETA.morado;
      poner(f, i, p, nrm, tono(c, 0.03), opacidad() * 0.8);
      continue;
    }
    // El frente
    const x = (Math.random() * 2 - 1) * W;
    const y = (Math.random() * 2 - 1) * H;
    if (y > franja) {
      // La franja de arriba: llena, ámbar
      poner(f, i, [x, y, D], [0, 0, 1], tono(mezcla(PALETA.ambar, PALETA.blanco, Math.random() * 0.25), 0.05), opacidad());
      continue;
    }
    // La cuadrícula: los puntos se juntan en las líneas y en los días con cita
    const gx = (x + W - 0.1) / celdaW;
    const gy = (franja - 0.1 - y) / celdaH;
    const col = Math.floor(gx);
    const fila = Math.floor(gy);
    const fx = gx - col;
    const fy = gy - fila;
    const enLinea = Math.min(fx, 1 - fx) < 0.08 || Math.min(fy, 1 - fy) < 0.08;
    const cita = citas.has(`${col},${fila}`) && Math.hypot(fx - 0.5, fy - 0.5) < 0.32;
    if (!enLinea && !cita && Math.random() < 0.82) {
      // La mayoría de los puntos de adentro de cada día se van a las líneas
      const yLinea = franja - 0.1 - Math.round(gy) * celdaH;
      poner(f, i, [x, Math.max(-H, Math.min(franja, yLinea)), D], [0, 0, 1], tono(mezcla(PALETA.morado, PALETA.blanco, 0.3), 0.05), opacidad());
      continue;
    }
    const c = cita ? PALETA.ambar : mezcla(PALETA.morado, PALETA.blanco, 0.3);
    poner(f, i, [x, y, D], [0, 0, 1], tono(c, cita ? 0.15 : 0.06), opacidad());
  }
  return f;
}
