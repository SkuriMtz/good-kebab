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
  const porEsfera = Math.floor(n / 4);
  const dorado = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const j = i;
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

/**
 * El cerebro (la inteligencia de Atendel), visto de perfil: dos hemisferios
 * con pliegues (circunvoluciones), la fisura entre ellos, el cerebelo atrás
 * abajo y el tronco. Ejes: x = de atrás (-) hacia adelante (+), y = arriba,
 * z = de un lado al otro.
 */
export function cerebro(n: number): Nube {
  const f = nueva(n);
  // Los pliegues: ondas que se cruzan sobre la superficie
  const pliegue = (x: number, y: number, z: number) =>
    Math.sin(x * 9 + Math.sin(y * 6 + z * 4) * 1.8) * Math.sin(y * 8 + Math.sin(x * 5 - z * 3) * 1.6);
  const colorDe = (y: number, x: number): Color => {
    const t = Math.min(1, Math.max(0, (y + 0.7) / 1.5));
    const c = mezcla(PALETA.morado, mezcla(PALETA.morado, PALETA.blanco, 0.5), t);
    return mezcla(c, PALETA.ambar, Math.max(0, x - 0.3) * 0.5);
  };
  for (let i = 0; i < n; i++) {
    const q = Math.random();
    if (q < 0.1) {
      // Cerebelo: atrás y abajo, con rayas finas
      const [dx, dy, dz] = direccion();
      const R: V3 = [0.36, 0.26, 0.5];
      const raya = 1 + 0.05 * Math.sin(dy * 22);
      const p: V3 = [-0.72 + dx * R[0] * raya, -0.42 + dy * R[1] * raya, dz * R[2] * raya];
      poner(f, i, p, [dx / R[0], dy / R[1], dz / R[2]], tono(mezcla(PALETA.morado, PALETA.verdeAzul, 0.35)), opacidad());
      continue;
    }
    if (q < 0.15) {
      // Tronco: un cilindro que baja
      const u = Math.random();
      const a = Math.random() * Math.PI * 2;
      const r = 0.13 - u * 0.03;
      const p: V3 = [-0.3 - u * 0.12 + Math.cos(a) * r, -0.48 - u * 0.6, Math.sin(a) * r];
      poner(f, i, p, [Math.cos(a), 0, Math.sin(a)], tono(mezcla(PALETA.morado, PALETA.ambar, 0.3)), opacidad() * 0.85);
      continue;
    }
    // Hemisferios: un elipsoide de cada lado, con la parte de abajo más plana y la fisura en medio
    const lado = Math.random() < 0.5 ? -1 : 1;
    const [dx, dy, dz] = direccion();
    const R: V3 = [1.02, 0.74, 0.52];
    let x = dx * R[0];
    let y = dy * R[1];
    let z = dz * R[2];
    if (y < -0.25) y = -0.25 + (y + 0.25) * 0.55; // la base, más plana
    const fold = pliegue(x, y, z + lado);
    const k = 1 + 0.085 * fold;
    x *= k;
    y *= k;
    z *= k;
    const p: V3 = [x, y + 0.08, z + lado * 0.27];
    const interna = dz * lado < -0.3; // la cara que mira a la fisura se ve menos
    const c = colorDe(y, x);
    poner(f, i, p, [dx / R[0], dy / R[1], dz / R[2]], tono(fold > 0.45 ? mezcla(c, PALETA.blanco, 0.45) : fold < -0.4 ? por(c, 0.6) : c), opacidad() * (interna ? 0.45 : 1));
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
    // Sin hueco: denso al centro y se desvanece hacia afuera, sin orilla marcada
    const r = 0.22 + Math.abs(campana()) * 1.4 + Math.random() * 0.15;
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
  const e = 2.6;
  const SX = 1.15;
  const SY = 0.85;
  const SZ = 0.55;
  for (let i = 0; i < n; i++) {
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

  for (let i = 0; i < n; i++) {
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

/**
 * Ordena los puntos de una figura por lugar: en franjas de arriba abajo y,
 * dentro de cada franja, alrededor (en zigzag). Si todas las figuras se
 * ordenan igual, el punto i de una cae cerca del punto i de la siguiente:
 * al cambiar de figura cada partícula viaja una distancia corta y la nube se
 * mueve como un solo cuerpo (como en el video de referencia), sin cruzarse.
 */
export function ordenar(f: Nube): Nube {
  const { n } = f;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (let i = 0; i < n; i++) {
    const x = f.pos[i * 3], y = f.pos[i * 3 + 1], z = f.pos[i * 3 + 2];
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
  }
  const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
  const sx = (maxX - minX) / 2 || 1, sz = (maxZ - minZ) / 2 || 1;
  const franjas = Math.max(8, Math.round(Math.sqrt(n) / 2));
  const clave = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const ny = (f.pos[i * 3 + 1] - minY) / (maxY - minY || 1);
    const b = Math.min(franjas - 1, Math.floor(ny * franjas));
    let a = (Math.atan2((f.pos[i * 3 + 2] - cz) / sz, (f.pos[i * 3] - cx) / sx) + Math.PI) / (2 * Math.PI);
    if (b % 2) a = 1 - a; // zigzag: cada franja sigue donde terminó la anterior
    clave[i] = b + a * 0.999;
  }
  const orden = Array.from({ length: n }, (_, i) => i).sort((p, q) => clave[p] - clave[q]);
  const g = nueva(n);
  orden.forEach((src, dst) => {
    g.pos.set(f.pos.subarray(src * 3, src * 3 + 3), dst * 3);
    g.normal.set(f.normal.subarray(src * 3, src * 3 + 3), dst * 3);
    g.color.set(f.color.subarray(src * 3, src * 3 + 3), dst * 3);
    g.alfa[dst] = f.alfa[src];
  });
  return g;
}
