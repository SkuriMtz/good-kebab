import { esTierra } from "./tierra";

/**
 * Las figuras del fondo del inicio (como los videos de referencia): el
 * cerebro, el foco, el globo con continentes y la marca de Atendel del cierre, más
 * los repartos de polvo. Todas usan el mismo número de puntos (N) para que
 * cada triangulito pase de una figura a otra.
 *
 * Coordenadas del modelo: "y" hacia arriba; la figura mide más o menos de
 * -1 a 1. Cada punto guarda posición, normal (para el brillo de la orilla),
 * color, opacidad (0 = punto de sobra, escondido) y tamaño.
 *
 * Todo sale de un azar con semilla: las figuras son iguales en cada visita
 * (y las capturas para comparar con el video se pueden repetir).
 */

export type Color = [number, number, number];

export type Forma = {
  /** Cuántos puntos tiene la figura de verdad (el resto son de sobra, invisibles). */
  reales: number;
  pos: Float32Array; // N × 3
  nor: Float32Array; // N × 3
  col: Float32Array; // N × 3
  alfa: Float32Array; // N
  tam: Float32Array; // N
  /** Un número por punto para escalonar los cambios (0 a 1; p. ej., la altura). */
  clave: Float32Array; // N
  /** Umbral propio de cada punto para el brillo de la orilla (0 a 1). */
  umbral: Float32Array; // N
  /** Manchas de color (0 a 1): dónde se juntan los triangulitos de color. */
  grupo: Float32Array; // N
};

/* ---------- Azar con semilla (mulberry32) ---------- */
export function azar(semilla: number) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hex = (h: string): Color => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as Color;

/** Los colores de los triangulitos, medidos en los videos (sRGB). */
export const PALETA = {
  ambar: hex("#ffb02e"),
  amarillo: hex("#f7d84a"),
  blanco: hex("#ecebf2"),
  durazno: hex("#ffd2b0"),
  lila: hex("#c9a8ff"),
  violeta: hex("#8b5cff"),
  magenta: hex("#c95ce6"),
  rosa: hex("#f08cb4"),
  coral: hex("#ff8a66"),
  azul: hex("#5f7dff"),
  verdeAzul: hex("#14b29a"),
  verde: hex("#3fd17a"),
};
type NombreColor = keyof typeof PALETA;

export const mezcla = (a: Color, b: Color, k: number): Color => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
export const suave = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Elige un color según pesos. */
function elegir(pesos: [NombreColor, number][], u: number): Color {
  let total = 0;
  for (const [, p] of pesos) total += p;
  let k = u * total;
  for (const [n, p] of pesos) {
    if (k < p) return PALETA[n];
    k -= p;
  }
  return PALETA[pesos[pesos.length - 1][0]];
}

/* ---------- Ruido suave 3D (para manchas y surcos) ---------- */
function hash3(x: number, y: number, z: number) {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return s - Math.floor(s);
}
export function ruido(x: number, y: number, z: number) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fy = y - iy;
  const fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const uz = fz * fz * (3 - 2 * fz);
  const l = (a: number, b: number, t: number) => a + (b - a) * t;
  const c = (dx: number, dy: number, dz: number) => hash3(ix + dx, iy + dy, iz + dz);
  return l(l(l(c(0, 0, 0), c(1, 0, 0), ux), l(c(0, 1, 0), c(1, 1, 0), ux), uy), l(l(c(0, 0, 1), c(1, 0, 1), ux), l(c(0, 1, 1), c(1, 1, 1), ux), uy), uz);
}

/* ---------- Puntos parejos (sin amontonarse): "ruido azul" en 3D ---------- */
type Candidato = { x: number; y: number; z: number; nx: number; ny: number; nz: number; dato: number };

/** Se queda con candidatos separados al menos `d` entre sí (en el orden en que vienen). */
function separar(cands: Candidato[], d: number, maximo: number): Candidato[] {
  const celda = d;
  const mapa = new Map<number, Candidato[]>();
  const llave = (i: number, j: number, k: number) => ((i + 512) * 1024 + (j + 512)) * 1024 + (k + 512);
  const out: Candidato[] = [];
  const d2 = d * d;
  for (const c of cands) {
    const i = Math.floor(c.x / celda);
    const j = Math.floor(c.y / celda);
    const k = Math.floor(c.z / celda);
    let libre = true;
    for (let a = -1; a <= 1 && libre; a++)
      for (let b = -1; b <= 1 && libre; b++)
        for (let e = -1; e <= 1 && libre; e++) {
          const lista = mapa.get(llave(i + a, j + b, k + e));
          if (!lista) continue;
          for (const o of lista) {
            const dx = o.x - c.x;
            const dy = o.y - c.y;
            const dz = o.z - c.z;
            if (dx * dx + dy * dy + dz * dz < d2) {
              libre = false;
              break;
            }
          }
        }
    if (!libre) continue;
    out.push(c);
    const ll = llave(i, j, k);
    const lista = mapa.get(ll);
    if (lista) lista.push(c);
    else mapa.set(ll, [c]);
    if (out.length >= maximo) break;
  }
  return out;
}

/** Busca la distancia que deja más o menos `n` puntos. */
function separarHasta(cands: Candidato[], n: number, d0: number): Candidato[] {
  let d = d0;
  let mejor: Candidato[] = [];
  for (let intento = 0; intento < 7; intento++) {
    const r = separar(cands, d, n);
    mejor = r;
    if (r.length >= n * 0.985) return r.slice(0, n);
    d *= Math.sqrt(r.length / n) * 0.985;
  }
  return mejor;
}

/* ---------- Construir la forma final (N puntos, ordenados para que los cambios sean ordenados) ---------- */
type PuntoFinal = Candidato & { col: Color; alfa: number; tam: number; clave: number; umbral: number; grupo?: number };

/**
 * Completa hasta N con puntos de sobra (copias invisibles de puntos reales,
 * para que al aparecer en la figura siguiente salgan de un lugar cercano) y
 * ordena todo por la posición en pantalla de su vista principal: los de arriba
 * primero. Así el punto i de una figura y el punto i de otra están en la
 * misma zona de la pantalla y los cambios no cruzan la pantalla en desorden.
 */
function armar(N: number, puntos: PuntoFinal[], vista: (p: PuntoFinal) => [number, number], rnd: () => number): Forma {
  const reales = Math.min(N, puntos.length);
  const todos: PuntoFinal[] = puntos.slice(0, reales);
  while (todos.length < N) {
    const o = puntos[Math.floor(rnd() * reales)];
    todos.push({ ...o, x: o.x + (rnd() - 0.5) * 0.04, y: o.y + (rnd() - 0.5) * 0.04, z: o.z + (rnd() - 0.5) * 0.04, alfa: 0 });
  }
  const orden = ordenarPorPantalla(todos.map(vista));
  const f: Forma = {
    reales,
    pos: new Float32Array(N * 3),
    nor: new Float32Array(N * 3),
    col: new Float32Array(N * 3),
    alfa: new Float32Array(N),
    tam: new Float32Array(N),
    clave: new Float32Array(N),
    umbral: new Float32Array(N),
    grupo: new Float32Array(N),
  };
  for (let i = 0; i < N; i++) {
    const p = todos[orden[i]];
    f.pos.set([p.x, p.y, p.z], i * 3);
    f.nor.set([p.nx, p.ny, p.nz], i * 3);
    f.col.set(p.col, i * 3);
    f.alfa[i] = p.alfa;
    f.tam[i] = p.tam;
    f.clave[i] = p.clave;
    f.umbral[i] = p.umbral;
    f.grupo[i] = p.grupo ?? 0;
  }
  return f;
}

/**
 * Orden por bandas: se parte la pantalla en franjas horizontales con el mismo
 * número de puntos y, dentro de cada franja, de izquierda a derecha. Las
 * partículas (src: motor) usan el mismo orden con su lugar de "polvo", así que
 * el punto i cae en la misma zona en todas las figuras.
 */
export function ordenarPorPantalla(xy: [number, number][]): number[] {
  const n = xy.length;
  const bandas = Math.max(1, Math.round(Math.sqrt(n / 1.6)));
  const porY = Array.from({ length: n }, (_, i) => i).sort((a, b) => xy[a][1] - xy[b][1]);
  const out: number[] = [];
  for (let b = 0; b < bandas; b++) {
    const de = Math.floor((b * n) / bandas);
    const a = Math.floor(((b + 1) * n) / bandas);
    const banda = porY.slice(de, a).sort((p, q) => xy[p][0] - xy[q][0]);
    out.push(...banda);
  }
  return out;
}

/* ====================================================================== */
/* Cerebro                                                                 */
/* ====================================================================== */

/*
 * Perfiles medidos en el video: de lado (portada, 1.0 s) y de frente (2.7 s).
 * Por cada altura (de 0.75 a -0.75): dónde empieza y termina el cerebro de
 * atrás (z negativo) hacia el frente (z positivo), y el medio ancho de frente.
 * Unidad: la mitad del largo del cerebro (334 px en la portada del video).
 */
const C_Y0 = 0.75;
const C_PASO = 1.5 / 42;
const C_ATRAS = [
  -0.383, -0.461, -0.536, -0.584, -0.62, -0.686, -0.722, -0.772, -0.808, -0.823, -0.832, -0.853, -0.883, -0.922, -0.949, -0.967, -0.979, -0.991, -1.006,
  -1.015, -1.03, -1.033, -1.036, -1.036, -1.036, -1.036, -1.036, -1.036, -1.033, -1.024, -1.012, -1.009, -0.997, -0.985, -0.97, -0.973, -0.97, -0.955,
  -0.928, -0.916, -0.904, -0.877, -0.832,
];
const C_FRENTE = [
  0.225, 0.323, 0.404, 0.518, 0.578, 0.626, 0.656, 0.701, 0.74, 0.769, 0.799, 0.826, 0.85, 0.874, 0.895, 0.922, 0.943, 0.964, 0.97, 0.97, 0.994, 1.009,
  1.018, 1.03, 1.03, 1.03, 1.042, 1.051, 1.057, 1.051, 1.03, 1.009, 1.012, 1.009, 1.0, 0.982, 0.955, 0.913, 0.868, 0.716, 0.677, 0.38, 0.308,
];
const C_ANCHO = [
  0.396, 0.492, 0.528, 0.55, 0.565, 0.585, 0.621, 0.657, 0.686, 0.712, 0.745, 0.766, 0.821, 0.875, 0.898, 0.909, 0.906, 0.901, 0.905, 0.915, 0.93, 0.939,
  0.945, 0.952, 0.958, 0.964, 0.967, 0.975, 0.987, 0.997, 0.994, 0.986, 0.964, 0.919, 0.901, 0.883, 0.857, 0.814, 0.779, 0.743, 0.703, 0.595, 0.444,
];
/** Lo que se encoge la orilla de un poco más afuera de la medida (para cerrar arriba y abajo). */
const C_FIN = 0.03;

function perfilCerebro(y: number): [number, number, number, number] {
  // [atrás, frente, ancho, escala de cierre]
  let cierre = 1;
  let yy = y;
  if (y > C_Y0) {
    cierre = Math.sqrt(Math.max(0, 1 - ((y - C_Y0) / C_FIN) ** 2));
    yy = C_Y0;
  } else if (y < -C_Y0) {
    cierre = Math.sqrt(Math.max(0, 1 - ((-C_Y0 - y) / C_FIN) ** 2));
    yy = -C_Y0;
  }
  const t = (C_Y0 - yy) / C_PASO;
  const i = Math.min(C_ATRAS.length - 2, Math.max(0, Math.floor(t)));
  const f = t - i;
  const l = (a: number[]) => a[i] + (a[i + 1] - a[i]) * f;
  return [l(C_ATRAS), l(C_FRENTE), l(C_ANCHO), cierre];
}

const C_K = 2.4; // forma del corte horizontal (2 = elipse; más = más cuadrado)

/** Punto de la superficie del cerebro para la altura y y el ángulo a (alrededor del eje vertical). */
function superficieCerebro(y: number, a: number): [number, number, number] {
  const [atras, frente, ancho, cierre] = perfilCerebro(y);
  const zm = (atras + frente) / 2;
  const zh = ((frente - atras) / 2) * cierre;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const ex = 2 / C_K;
  const z = zm + zh * Math.sign(s) * Math.abs(s) ** ex;
  // El frente es un poco más angosto (lóbulos frontales); atrás, un poco también
  const zn = (z - zm) / Math.max(zh, 1e-3);
  const angosto = 1 - 0.13 * suave(0.35, 1, zn) - 0.06 * suave(-0.5, -1, zn);
  const x = ancho * cierre * angosto * Math.sign(c) * Math.abs(c) ** ex;
  // Fisura entre hemisferios: la parte de arriba se hunde hacia el centro
  const m = Math.abs(x);
  if (y > -0.2 && m < 0.16) {
    const hund = (1 - m / 0.16) ** 2 * 0.07 * suave(-0.2, 0.25, y);
    return [x, y - hund, z];
  }
  return [x, y, z];
}

export function cerebro(N: number, semilla = 11): Forma {
  const rnd = azar(semilla);
  const cands: Candidato[] = [];
  const Y1 = C_Y0 + C_FIN;
  // Candidatos con densidad pareja: se acepta según el área local
  const area = (y: number, a: number) => {
    const e = 0.004;
    const p = superficieCerebro(y, a);
    const py = superficieCerebro(y + e, a);
    const pa = superficieCerebro(y, a + e);
    const u = [py[0] - p[0], py[1] - p[1], py[2] - p[2]];
    const v = [pa[0] - p[0], pa[1] - p[1], pa[2] - p[2]];
    const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const l = Math.hypot(n[0], n[1], n[2]) / (e * e);
    return { p, n: n.map((k) => k / (l * e * e || 1)) as [number, number, number], l };
  };
  const total = Math.round(Math.min(N * 0.6, 5600) * 3.4);
  let maxA = 0;
  for (let k = 0; k < 400; k++) maxA = Math.max(maxA, area(-Y1 + rnd() * 2 * Y1, rnd() * Math.PI * 2).l);
  while (cands.length < total) {
    const y = -Y1 + rnd() * 2 * Y1;
    const a = rnd() * Math.PI * 2;
    const { p, n, l } = area(y, a);
    if (rnd() * maxA * 1.1 > l) continue;
    // la normal apunta hacia afuera
    let [nx, ny, nz] = n;
    const len = Math.hypot(nx, ny, nz) || 1;
    nx /= len;
    ny /= len;
    nz /= len;
    if (nx * p[0] + ny * (p[1] - 0) + nz * (p[2] - 0) < 0) {
      nx = -nx;
      ny = -ny;
      nz = -nz;
    }
    // Fisura: nada justo en la línea del medio (arriba y al frente)
    if (Math.abs(p[0]) < 0.03 && p[1] > -0.3) continue;
    // Cisura lateral: separa el lóbulo temporal (una línea sin puntos a cada lado)
    const zc = p[2];
    const ySilvio = -0.12 + 0.22 * suave(0.6, -0.4, zc);
    if (Math.abs(p[0]) > 0.55 && zc > -0.45 && zc < 0.75 && Math.abs(p[1] - ySilvio) < 0.022) continue;
    // Surcos: líneas finas con menos puntos (circunvoluciones)
    const s = ruido(p[0] * 3.1 + 7, p[1] * 3.1 + 3, p[2] * 3.1 + 1) * 0.7 + ruido(p[0] * 6.3, p[1] * 6.3 + 9, p[2] * 6.3) * 0.3;
    if (Math.abs(s - 0.5) < 0.012 && rnd() < 0.7) continue;
    cands.push({ x: p[0], y: p[1], z: p[2], nx, ny, nz, dato: s });
  }
  // Medido en el video: en el centro del cerebro de la portada hay un triangulito por cada ~308 px²
  // contando los de adelante y los de atrás, que se ven a través (el cerebro es transparente):
  // unos 5 600 en toda la superficie.
  const sup = separarHasta(cands, Math.min(Math.round(N * 0.6), 5600), 0.045);

  // El tallo: un cilindro que baja desde abajo del cerebro hasta salir de la pantalla
  const tallo: Candidato[] = [];
  const nTallo = Math.min(Math.round(N * 0.06), 260);
  for (let k = 0; k < nTallo * 3; k++) {
    const t = rnd();
    const y = -0.62 - t * 0.95;
    const ang = rnd() * Math.PI * 2;
    const r = 0.088 + 0.02 * (1 - t);
    const cx = 0.0;
    const cz = -0.14 - t * 0.12;
    tallo.push({ x: cx + Math.cos(ang) * r, y, z: cz + Math.sin(ang) * r, nx: Math.cos(ang), ny: 0, nz: Math.sin(ang), dato: -1 });
  }
  const talloSep = separarHasta(tallo, nTallo, 0.04);

  const puntos: PuntoFinal[] = [];
  for (const c of [...sup, ...talloSep]) {
    const esTallo = c.dato < 0;
    // Color propio del punto (manchas: grupos del mismo color); el ámbar de la orilla se agrega en el motor
    const mancha = ruido(c.x * 2.2 + 11, c.y * 2.2 + 5, c.z * 2.2 + 2);
    const u = rnd();
    // Medido (sin contar blanco ni ámbar): amarillo, violeta, coral y rosa ~4-5 % cada uno,
    // magenta ~3 %, azul y verde azulado ~1-2 %. En las manchas, más violeta y verde azulado.
    const col = esTallo
      ? elegir(
          [
            ["violeta", 2],
            ["verdeAzul", 1],
            ["azul", 1],
          ],
          u,
        )
      : mancha > 0.66
        ? elegir(
            [
              ["violeta", 4],
              ["magenta", 2],
              ["verdeAzul", 3],
              ["azul", 1],
            ],
            u,
          )
        : elegir(
            [
              ["amarillo", 5],
              ["violeta", 5],
              ["magenta", 3],
              ["rosa", 4],
              ["coral", 5],
              ["azul", 2],
              ["verdeAzul", 1],
            ],
            u,
          );
    puntos.push({
      ...c,
      col,
      alfa: esTallo ? 0.5 : 1,
      tam: esTallo ? 0.75 : 0.85 + rnd() * 0.3,
      clave: (c.y + 1.6) / 2.4,
      umbral: rnd(),
      grupo: esTallo ? 0.3 : suave(0.6, 0.75, mancha),
    });
  }
  // Vista principal para ordenar: de lado, con el frente a la izquierda
  return armar(N, puntos, (p) => [-p.z, -p.y], rnd);
}

/* ====================================================================== */
/* Foco                                                                     */
/* ====================================================================== */

/** Radio del foco a lo largo de su eje (s = -1 arriba del vidrio; crece hacia la rosca). */
function radioFoco(s: number): number {
  if (s <= 0.45) return Math.sqrt(Math.max(0, 1 - s * s));
  if (s <= 1.45) {
    // Curva de Hermite: del vidrio (0.893, pendiente -0.504) al cuello (0.42, plano)
    const t = (s - 0.45) / 1.0;
    const p0 = Math.sqrt(1 - 0.45 * 0.45);
    const m0 = (-0.45 / p0) * 1.0;
    const p1 = 0.42;
    const h00 = 2 * t ** 3 - 3 * t ** 2 + 1;
    const h10 = t ** 3 - 2 * t ** 2 + t;
    const h01 = -2 * t ** 3 + 3 * t ** 2;
    return h00 * p0 + h10 * m0 + h01 * p1;
  }
  if (s <= 2.55) {
    // La rosca: anillos
    const k = (s - 1.45) / 0.13;
    return 0.405 + 0.022 * Math.cos(k * Math.PI * 2);
  }
  // La punta de abajo, redondeada
  const t = Math.min(1, (s - 2.55) / 0.22);
  return 0.405 * Math.sqrt(Math.max(0, 1 - t * t));
}
const FOCO_S0 = -1;
const FOCO_S1 = 2.77;

export function foco(N: number, semilla = 23): Forma {
  const rnd = azar(semilla);
  const cands: Candidato[] = [];
  const total = Math.round(Math.min(N, 5200) * 3.2);
  const e = 0.003;
  // densidad pareja: peso = radio × largo de la curva
  const peso = (s: number) => {
    const r = radioFoco(s);
    const dr = (radioFoco(s + e) - radioFoco(s - e)) / (2 * e);
    return r * Math.sqrt(1 + dr * dr);
  };
  let maxP = 0;
  for (let k = 0; k < 500; k++) maxP = Math.max(maxP, peso(FOCO_S0 + rnd() * (FOCO_S1 - FOCO_S0)));
  while (cands.length < total) {
    const s = FOCO_S0 + rnd() * (FOCO_S1 - FOCO_S0);
    if (rnd() * maxP * 1.05 > peso(s)) continue;
    const r = radioFoco(s);
    const dr = (radioFoco(s + e) - radioFoco(s - e)) / (2 * e);
    const a = rnd() * Math.PI * 2;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const y = -s; // el eje va de arriba (vidrio) hacia abajo (rosca)
    // normal: (cos a, dr, sin a) normalizada (con y = -s, la componente vertical cambia de signo)
    let nx = Math.cos(a);
    let ny = dr;
    let nz = Math.sin(a);
    const l = Math.hypot(nx, ny, nz) || 1;
    nx /= l;
    ny /= l;
    nz /= l;
    cands.push({ x, y, z, nx, ny, nz, dato: s });
  }
  // Medido: en el centro del foco hay un triangulito por cada ~181 px² (separación de ~14.5 px a
  // 243 px por unidad): unos 5 200 en toda la superficie.
  const sup = separarHasta(cands, Math.min(N, 5200), 0.06);
  const puntos: PuntoFinal[] = sup.map((c) => {
    const s = c.dato;
    // Degradado a lo largo del eje: durazno y blanco en el vidrio, lila y violeta en el cuello,
    // azul, verde azulado y verde en la rosca, y un toque amarillo en la punta
    const t = (s + 1) / 3.77;
    const u = rnd();
    let col: Color;
    if (s < 0.75) col = u < 0.55 ? PALETA.blanco : u < 0.85 ? PALETA.durazno : PALETA.lila;
    else if (s < 1.25) col = mezcla(PALETA.lila, PALETA.violeta, suave(0.75, 1.25, s));
    else if (s < 1.75) col = mezcla(PALETA.violeta, PALETA.azul, suave(1.3, 1.75, s));
    else if (s < 2.2) col = mezcla(PALETA.azul, PALETA.verdeAzul, suave(1.75, 2.2, s));
    else col = mezcla(PALETA.verdeAzul, u < 0.5 ? PALETA.verde : PALETA.amarillo, suave(2.2, 2.7, s));
    return { ...c, col, alfa: 1, tam: 0.8 + rnd() * 0.3, clave: t, umbral: rnd() };
  });
  // Vista principal: inclinado, el vidrio arriba a la izquierda
  return armar(N, puntos, (p) => [p.x + 0.5 * -p.y, -p.y], rnd);
}

/* ====================================================================== */
/* Globo terráqueo                                                          */
/* ====================================================================== */

export function globo(N: number, semilla = 37): Forma {
  const rnd = azar(semilla);
  const puntos: PuntoFinal[] = [];
  const dorado = Math.PI * (3 - Math.sqrt(5));
  // Red de Fibonacci: puntos parejos sobre la esfera. Medido: en la tierra hay un triangulito por
  // cada ~222 px² (separación de ~16 px a 372 px por unidad): unos 7 800 en toda la esfera.
  const M = Math.min(N, 7800);
  for (let j = 0; j < M; j++) {
    const y = 1 - ((j + 0.5) / M) * 2;
    const r = Math.sqrt(1 - y * y);
    const a = j * dorado;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    // Latitud y longitud (la longitud 0 mira hacia +z)
    const lat = (Math.asin(y) * 180) / Math.PI;
    const lon = (Math.atan2(x, z) * 180) / Math.PI;
    const tierra = esTierra(lat, lon);
    const mancha = ruido(x * 3 + 4, y * 3 + 1, z * 3 + 8);
    const mancha2 = ruido(x * 6 + 1, y * 6 + 7, z * 6 + 3);
    const u = rnd();
    let col: Color;
    if (tierra) {
      // Manchas de color en la tierra: ámbar dominante, violeta, verde azulado y algo de rosa
      if (mancha > 0.6) col = elegir([["violeta", 6], ["magenta", 1], ["ambar", 3], ["verdeAzul", 1]], u);
      else if (mancha2 > 0.62) col = elegir([["verdeAzul", 5], ["ambar", 3], ["violeta", 2]], u);
      else col = elegir([["ambar", 10], ["amarillo", 2], ["violeta", 2], ["verdeAzul", 1], ["rosa", 1], ["coral", 1], ["blanco", 1]], u);
    } else col = u < 0.5 ? PALETA.violeta : u < 0.85 ? PALETA.ambar : PALETA.verdeAzul;
    puntos.push({
      x,
      y,
      z,
      nx: x,
      ny: y,
      nz: z,
      dato: tierra ? 1 : 0,
      col,
      // El mar: puntitos ralos y muy tenues
      alfa: tierra ? 1 : rnd() < 0.4 ? 0.22 : 0,
      tam: tierra ? 0.95 + rnd() * 0.2 : 0.36,
      clave: tierra ? 1 : 0,
      umbral: rnd(),
    });
  }
  return armar(N, puntos, (p) => [p.x, -p.y], rnd);
}

/* ====================================================================== */
/* La marca de Atendel (el cierre)                                          */
/* ====================================================================== */

/**
 * En el cierre del video, el polvo se junta y forma la marca del sitio. Aquí es
 * la marca de Atendel (src/components/Logo.tsx): cuatro círculos, uno por agente
 * y con su color (Lola, Clara, Víctor e Iris). Cada círculo va un poco inclinado,
 * como aspa, para que al girar se vea en 3D. Unidad: la mitad del ancho de la marca.
 */
const MARCA_CIRCULOS: { x: number; y: number; color: Color; inclina: number }[] = [
  { x: -0.44, y: 0.44, color: hex("#ff8a6b"), inclina: 0.38 }, // Lola, arriba a la izquierda
  { x: 0.44, y: 0.44, color: hex("#7fb2ff"), inclina: -0.38 }, // Clara, arriba a la derecha
  { x: -0.44, y: -0.44, color: hex("#5fd09f"), inclina: -0.38 }, // Víctor, abajo a la izquierda
  { x: 0.44, y: -0.44, color: hex("#f6c64a"), inclina: 0.38 }, // Iris, abajo a la derecha
];
const MARCA_R = 0.38;

export function marca(N: number, semilla = 53): Forma {
  const rnd = azar(semilla);
  const n = Math.min(N, 9000);
  const cands: Candidato[] = [];
  while (cands.length < n * 3) {
    const k = Math.floor(rnd() * 4);
    const c = MARCA_CIRCULOS[k];
    // Punto parejo en el círculo, un poco más denso hacia la orilla (como en el video)
    const rho = MARCA_R * Math.pow(rnd(), 0.42);
    const ang = rnd() * Math.PI * 2;
    const lx = Math.cos(ang) * rho;
    const ly = Math.sin(ang) * rho;
    // Inclinar el círculo alrededor del eje que va del centro de la marca a su centro
    const largo = Math.hypot(c.x, c.y);
    const ex = c.x / largo;
    const ey = c.y / largo;
    const along = lx * ex + ly * ey;
    const perp = -lx * ey + ly * ex;
    const co = Math.cos(c.inclina);
    const si = Math.sin(c.inclina);
    cands.push({
      x: c.x + along * ex - perp * co * ey,
      y: c.y + along * ey + perp * co * ex,
      z: perp * si,
      nx: ey * si,
      ny: -ex * si,
      nz: co,
      dato: k * 10 + rho / MARCA_R,
    });
  }
  const sup = separarHasta(cands, n, 0.02);
  const puntos: PuntoFinal[] = sup.map((c) => {
    const k = Math.floor(c.dato / 10);
    const orilla = c.dato - k * 10;
    const base = MARCA_CIRCULOS[k].color;
    const u = rnd();
    // El color del agente, con matices: algunos más claros y algunos hacia el violeta
    let col = u < 0.14 ? mezcla(base, PALETA.violeta, 0.5) : u < 0.28 ? mezcla(base, PALETA.blanco, 0.45) : mezcla(base, PALETA.blanco, rnd() * 0.2);
    col = mezcla(col, base, suave(0.75, 1, orilla) * 0.5);
    return { ...c, col, alfa: 0.85 + rnd() * 0.15, tam: 0.75 + rnd() * 0.25, clave: Math.hypot(c.x, c.y) / 0.82, umbral: rnd() };
  });
  return armar(N, puntos, (p) => [p.x, -p.y], rnd);
}
