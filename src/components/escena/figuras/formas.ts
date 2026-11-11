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
  /** Hondura (0 = cresta, 1 = fondo de un surco): el motor oscurece los surcos que se ven de frente. */
  hondo: Float32Array; // N
  /** Solo el cerebro: partes, surcos, relleno y colores por punto. */
  extra?: ExtraCerebro;
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

/**
 * Los colores del cerebro, como en el video de referencia: blanco y lavanda donde la
 * superficie mira de frente; a medio ángulo, violeta, turquesa, azul y un poco de
 * magenta; y ámbar donde se ve de canto (el borde). El tronco, gris lavanda.
 */
export const PALETA_CEREBRO = {
  blanco: hex("#f0eef8"),
  lavanda: hex("#c9c3e6"),
  ambar: hex("#ffb829"),
  violeta: hex("#8052ff"),
  magenta: hex("#e040fb"),
  turquesa: hex("#23d9b5"),
  turquesaHondo: hex("#15846e"),
  azul: hex("#3d7bff"),
  tronco: hex("#aaa6c2"),
};

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

/** Dirección al azar (pareja) sobre la esfera. */
function direccion(rnd: () => number): [number, number, number] {
  const u = rnd() * 2 - 1;
  const a = rnd() * Math.PI * 2;
  const r = Math.sqrt(1 - u * u);
  return [r * Math.cos(a), u, r * Math.sin(a)];
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
type PuntoFinal = Candidato & { col: Color; alfa: number; tam: number; clave: number; umbral: number; grupo?: number; hondo?: number };

/**
 * Completa hasta N con puntos de sobra (copias invisibles de puntos reales,
 * para que al aparecer en la figura siguiente salgan de un lugar cercano) y
 * ordena todo por la posición en pantalla de su vista principal: los de arriba
 * primero. Así el punto i de una figura y el punto i de otra están en la
 * misma zona de la pantalla y los cambios no cruzan la pantalla en desorden.
 */
function armar(N: number, puntos: PuntoFinal[], vista: (p: PuntoFinal) => [number, number], rnd: () => number, alfaCopias = 0): Forma {
  const reales = Math.min(N, puntos.length);
  const todos: PuntoFinal[] = puntos.slice(0, reales);
  while (todos.length < N) {
    const o = puntos[Math.floor(rnd() * reales)];
    // Copias cerca de un punto real. Con alfaCopias < 0 son "solo orilla": el motor las enciende
    // donde la superficie se ve de lado (la orilla se aprieta como en el video)
    todos.push({ ...o, x: o.x + (rnd() - 0.5) * 0.04, y: o.y + (rnd() - 0.5) * 0.04, z: o.z + (rnd() - 0.5) * 0.04, alfa: alfaCopias * (o.alfa > 0 ? 1 : 0) });
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
    hondo: new Float32Array(N),
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
    f.hondo[i] = p.hondo ?? 0;
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

/**
 * El cerebro en 3D: dos hemisferios hechos de lóbulos (frontal, parietal,
 * occipital y temporal) más el cerebelo y el tronco. Cada lóbulo es un
 * elipsoide; donde se juntan quedan los surcos (la cisura lateral, el surco
 * central y la fisura entre hemisferios) y encima van circunvoluciones con
 * ruido. Las medidas salen de igualar las siluetas del video de lado,
 * girando y de frente (IoU 0.90-0.94 en cinco poses).
 * Unidad: la mitad del largo del cerebro (336 px en la portada del video).
 * Coordenadas: x hacia el hemisferio izquierdo, y hacia arriba, z hacia el frente.
 */
type Lobulo = { c: [number, number, number]; r: [number, number, number]; inc: number };
/** Lóbulos del hemisferio izquierdo (x > 0); el derecho es su espejo. inc: inclinación en grados (eje x). */
const LOBULOS: Lobulo[] = [
  { c: [0.295, 0.04, 0.38], r: [0.56, 0.43, 0.5], inc: -6 }, // frontal
  { c: [0.285, 0.24, -0.18], r: [0.4, 0.48, 0.76], inc: -15 }, // parietal
  { c: [0.375, -0.06, -0.63], r: [0.44, 0.44, 0.34], inc: 6 }, // occipital
  { c: [0.51, -0.36, 0.22], r: [0.34, 0.34, 0.74], inc: -15 }, // temporal
  { c: [0.39, -0.47, -0.6], r: [0.38, 0.24, 0.4], inc: 16 }, // cerebelo
];

type Parte = { c: [number, number, number]; r: [number, number, number]; ca: number; sa: number; hemi: number };

/** Qué tan afuera del elipsoide está p (0 en la superficie, negativo adentro). */
function fuera(p: [number, number, number], e: Parte) {
  const dx = p[0] - e.c[0];
  const dy = p[1] - e.c[1];
  const dz = p[2] - e.c[2];
  const y = dy * e.ca + dz * e.sa;
  const z = -dy * e.sa + dz * e.ca;
  return Math.sqrt((dx / e.r[0]) ** 2 + (y / e.r[1]) ** 2 + (z / e.r[2]) ** 2) - 1;
}

export function cerebro(N: number, semilla = 11): Forma {
  const rnd = azar(semilla);
  const partes: Parte[] = [];
  for (const hemi of [1, -1])
    for (const l of LOBULOS) {
      const a = (l.inc * Math.PI) / 180;
      partes.push({ c: [l.c[0] * hemi, l.c[1], l.c[2]], r: l.r, ca: Math.cos(a), sa: Math.sin(a), hemi });
    }
  // Superficie: puntos en cada lóbulo que no quedan dentro de otro (la unión)
  const meta = Math.min(Math.round(N * 0.64), 6800);
  const areas = partes.map(({ r }) => 4 * Math.PI * (((r[0] * r[1]) ** 1.6 + (r[0] * r[2]) ** 1.6 + (r[1] * r[2]) ** 1.6) / 3) ** (1 / 1.6));
  const sumA = areas.reduce((a, b) => a + b, 0);
  const cands: Candidato[] = [];
  partes.forEach((e, k) => {
    const m = Math.round((meta * 4.2 * areas[k]) / sumA);
    const wmax = Math.max(e.r[1] * e.r[2], e.r[0] * e.r[2], e.r[0] * e.r[1]);
    let hechos = 0;
    while (hechos < m) {
      const [ux, uy, uz] = direccion(rnd);
      // Área pareja en el elipsoide: se acepta según cuánto estira el mapa esfera → elipsoide
      const w = e.r[0] * e.r[1] * e.r[2] * Math.hypot(ux / e.r[0], uy / e.r[1], uz / e.r[2]);
      if (rnd() * wmax > w) continue;
      hechos++;
      const qx = ux * e.r[0];
      const qy = uy * e.r[1];
      const qz = uz * e.r[2];
      let nx = ux / e.r[0];
      let ny = uy / e.r[1];
      let nz = uz / e.r[2];
      const ln = Math.hypot(nx, ny, nz);
      nx /= ln;
      ny /= ln;
      nz /= ln;
      const p: [number, number, number] = [e.c[0] + qx, e.c[1] + qy * e.ca - qz * e.sa, e.c[2] + qy * e.sa + qz * e.ca];
      const n: [number, number, number] = [nx, ny * e.ca - nz * e.sa, ny * e.sa + nz * e.ca];
      // La unión: fuera de los demás lóbulos. Cerca de otro lóbulo hay un surco.
      let otro = Infinity;
      let dentro = false;
      for (let j = 0; j < partes.length; j++) {
        if (j === k) continue;
        const f = fuera(p, partes[j]);
        if (f < 0) {
          dentro = true;
          break;
        }
        if (partes[j].hemi === e.hemi) otro = Math.min(otro, f);
      }
      if (dentro) continue;
      // La fisura entre hemisferios: nada en la línea del medio
      if (Math.abs(p[0]) < 0.035 && p[1] > -0.4) continue;
      const pliegue = 0.6 * (1 - suave(0.0, 0.04, otro));
      // Circunvoluciones: surcos finos con ruido
      const g = ruido(p[0] * 4.4 + 7, p[1] * 4.4 + 3, p[2] * 4.4 + 1) * 0.7 + ruido(p[0] * 8.3, p[1] * 8.3 + 9, p[2] * 8.3) * 0.3;
      const surco = 1 - suave(0.0, 0.055, Math.abs(g - 0.5));
      const hondo = Math.max(pliegue, surco * 0.85);
      if (hondo > 0.6 && rnd() < 0.35 * hondo) continue;
      // Los surcos se hunden un poco; donde dos lóbulos se juntan, la superficie se rellena
      // (como una unión suave) para que se vean pliegues y no globos pegados
      const relleno = 0.07 * (1 - suave(0.0, 0.12, otro)) ** 2;
      const baja = 0.03 * surco - relleno;
      // Normal: 80 % la de la forma general (elipsoide del cerebro) y 20 % la del lóbulo, para que
      // el brillo de la orilla siga la silueta y cada lóbulo solo dé volumen (no un aro por lóbulo)
      let gx = p[0] / 1.0;
      let gy = (p[1] + 0.03) / (0.78 * 0.78);
      let gz = (p[2] + 0.05) / (1.03 * 1.03);
      const lg = Math.hypot(gx, gy, gz) || 1;
      gx = (gx / lg) * 0.8 + n[0] * 0.2;
      gy = (gy / lg) * 0.8 + n[1] * 0.2;
      gz = (gz / lg) * 0.8 + n[2] * 0.2;
      const lm = Math.hypot(gx, gy, gz) || 1;
      cands.push({ x: p[0] - n[0] * baja, y: p[1] - n[1] * baja, z: p[2] - n[2] * baja, nx: gx / lm, ny: gy / lm, nz: gz / lm, dato: hondo });
    }
  });
  const sup = separarHasta(cands, meta, 0.045);

  // El tronco: baja desde abajo del cerebro hasta salir de la pantalla
  const tallo: Candidato[] = [];
  const nTallo = Math.min(Math.round(N * 0.06), 260);
  for (let k = 0; k < nTallo * 3; k++) {
    const t = rnd();
    const ang = rnd() * Math.PI * 2;
    const r = 0.09 + 0.025 * (1 - t);
    tallo.push({ x: Math.cos(ang) * r, y: -0.55 - t * 1.05, z: -0.17 - t * 0.12 + Math.sin(ang) * r, nx: Math.cos(ang), ny: 0, nz: Math.sin(ang), dato: -1 });
  }
  const talloSep = separarHasta(tallo, nTallo, 0.04);

  const puntos: PuntoFinal[] = [];
  for (const c of [...sup, ...talloSep]) {
    const esTallo = c.dato < 0;
    // Zonas de color que giran con el cerebro (como en el video): verde azulado, violeta y magenta
    const z1 = ruido(c.x * 1.9 + 11, c.y * 1.9 + 5, c.z * 1.9 + 2);
    const z2 = ruido(c.x * 1.9 + 31, c.y * 1.9 + 17, c.z * 1.9 + 23);
    const u = rnd();
    let col: Color;
    let grupo = 0;
    if (esTallo) col = elegir([["violeta", 2], ["verdeAzul", 1], ["azul", 1]], u);
    else if (z1 > 0.7) {
      col = u < 0.7 ? PALETA.verdeAzul : PALETA.azul;
      grupo = suave(0.68, 0.78, z1);
    } else if (z2 > 0.69) {
      col = u < 0.65 ? PALETA.violeta : PALETA.magenta;
      grupo = suave(0.67, 0.77, z2);
    } else col = elegir([["violeta", 5], ["magenta", 3], ["rosa", 4], ["coral", 5], ["amarillo", 4], ["azul", 2], ["verdeAzul", 2]], u);
    puntos.push({
      ...c,
      col,
      // la opacidad guarda la sombra de los surcos (adentro de un surco se ve más oscuro)
      alfa: esTallo ? 0.55 : 1 - 0.38 * Math.max(0, c.dato),
      tam: esTallo ? 0.75 : 0.85 + rnd() * 0.3,
      clave: (c.y + 1.6) / 2.4,
      umbral: rnd(),
      grupo,
    });
  }
  // Vista principal para ordenar: de lado, con el frente a la izquierda
  const f = armar(N, puntos, (p) => [-p.z, -p.y], rnd);
  f.extra = extraDeRespaldo(f, rnd);
  return f;
}

/* ---------- Cerebro real (public/figuras/cerebro.bin) ---------- */

/**
 * Un cerebro humano: la plantilla MNI ICBM152 2009a simétrica (materia gris + blanca,
 * el promedio de 152 resonancias, del paquete nilearn), suavizada ~5.5 mm, con los
 * pliegues marcados y ajustada a las siluetas de los videos de referencia. Lo genera
 * scripts/figuras/cerebro.py (ahí están los pasos y cómo correrlo). Los puntos van
 * parejos, en filas, sobre la superficie: primero la rejilla base (la que se ve de
 * frente) y luego el relleno, que queda en medio de la base y solo se enciende en el
 * borde, donde los triangulitos se enciman. cerebro.bin trae ~14 000 puntos;
 * cerebro-chico.bin, ~6 000 (celular). Licencia de la plantilla (se copia completa en
 * public/figuras/cerebro-LICENCIA.txt):
 *
 *   Copyright (C) 1993-2004 Louis Collins, McConnell Brain Imaging Centre,
 *   Montreal Neurological Institute, McGill University. Permission to use, copy,
 *   modify, and distribute this software and its documentation for any purpose
 *   and without fee is hereby granted, provided that the above copyright notice
 *   appear in all copies. The authors and McGill University make no
 *   representations about the suitability of this software for any purpose. It
 *   is provided "as is" without express or implied warranty.
 *
 * Formato del archivo, versión 2 (little endian): "CRB2", versión (uint16), reservado
 * (uint16), n (uint32), nBase (uint32), escala (float32) y luego n × (int16 x, y, z),
 * n × (int8 nx, ny, nz), n × int8 curvatura (−127 cresta … 127 surco) y n × uint8 parte
 * (0 hemisferio izquierdo, 1 derecho, 2 cerebelo, 3 tronco).
 */
export const VERSION_CEREBRO = 2;
export type DatosCerebro = {
  n: number;
  /** Los primeros nBase puntos son la rejilla base; los demás, el relleno. */
  nBase: number;
  pos: Float32Array;
  nor: Float32Array;
  /** −1 cresta … +1 surco. */
  curv: Float32Array;
  /** 0 hemisferio izquierdo, 1 derecho, 2 cerebelo, 3 tronco. */
  parte: Uint8Array;
};

export function leerCerebro(buf: ArrayBuffer): DatosCerebro {
  const dv = new DataView(buf);
  const firma = String.fromCharCode(dv.getUint8(0), dv.getUint8(1), dv.getUint8(2), dv.getUint8(3));
  if (firma !== "CRB2" || dv.getUint16(4, true) !== VERSION_CEREBRO) throw new Error("cerebro: formato");
  const n = dv.getUint32(8, true);
  const nBase = dv.getUint32(12, true);
  const escala = dv.getFloat32(16, true);
  if (buf.byteLength < 20 + n * 11 || nBase > n) throw new Error("cerebro: tamaño");
  const pos = new Float32Array(n * 3);
  const nor = new Float32Array(n * 3);
  const curv = new Float32Array(n);
  const parte = new Uint8Array(n);
  let o = 20;
  for (let i = 0; i < n * 3; i++, o += 2) pos[i] = dv.getInt16(o, true) * escala;
  for (let i = 0; i < n * 3; i++, o += 1) nor[i] = dv.getInt8(o) / 127;
  for (let i = 0; i < n; i++, o += 1) curv[i] = dv.getInt8(o) / 127;
  for (let i = 0; i < n; i++, o += 1) parte[i] = dv.getUint8(o);
  return { n, nBase, pos, nor, curv, parte };
}

/** Lo propio del cerebro, por punto (el motor lo usa para el color por ángulo de vista). */
export type ExtraCerebro = {
  /** 0 hemisferio izquierdo, 1 derecho, 2 cerebelo, 3 tronco. */
  parte: Uint8Array;
  /** 0 cresta … 1 fondo de un surco. */
  surco: Float32Array;
  /** 1 = punto de relleno: solo se enciende donde la superficie se ve de canto. */
  relleno: Uint8Array;
  /** Color de frente (blanco ↔ lavanda), N × 3. */
  frente: Float32Array;
  /** Color a medio ángulo (manchas violeta, turquesa, azul y algo de magenta), N × 3. */
  medio: Float32Array;
  /** Cuánto se ve la mancha de color aun de frente (0 a 1): los grupitos de color del interior. */
  mancha: Float32Array;
};

/**
 * Los colores por punto del cerebro. Las manchas salen de un ruido 3D ligado al cerebro
 * (giran con él); el motor decide en cada cuadro, según el ángulo de vista, cuánto pesa
 * el color de frente, el de medio ángulo y el ámbar del borde.
 */
function coloresCerebro(n: number, pos: (i: number) => [number, number, number], rnd: () => number): Pick<ExtraCerebro, "frente" | "medio" | "mancha"> {
  const PC = PALETA_CEREBRO;
  const frente = new Float32Array(n * 3);
  const medio = new Float32Array(n * 3);
  const mancha = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const [x, y, z] = pos(i);
    const n1 = ruido(x * 2.3 + 11, y * 2.3 + 5, z * 2.3 + 2);
    const n2 = ruido(x * 2.3 + 31, y * 2.3 + 17, z * 2.3 + 23);
    const n3 = ruido(x * 5.1 + 3, y * 5.1 + 9, z * 5.1 + 7);
    const n4 = ruido(x * 2.9 + 47, y * 2.9 + 29, z * 2.9 + 13);
    const u = rnd();
    // De frente: blanco y lavanda, en parches suaves
    const f = mezcla(PC.blanco, PC.lavanda, suave(0.3, 0.72, n3 * 0.75 + u * 0.25));
    frente.set(f, i * 3);
    // A medio ángulo: violeta sobre todo; turquesa, azul y un poco de magenta por manchas
    let m: Color;
    let k = 0;
    if (n1 > 0.7) {
      m = u < 0.68 ? PC.turquesa : PC.turquesaHondo;
      k = suave(0.74, 0.8, n1);
    } else if (n2 > 0.78) {
      m = PC.azul;
      k = suave(0.8, 0.86, n2);
    } else if (n2 < 0.23) {
      // magenta: destellos, no manchas grandes
      m = PC.magenta;
      k = suave(0.21, 0.15, n2) * 0.8;
    } else {
      k = suave(0.76, 0.86, n4);
      // Fuera de las manchas, el medio ángulo es lavanda con un poco de violeta (en el video casi no hay violeta)
      m = mezcla(PC.lavanda, PC.violeta, 0.3 + 0.7 * k);
    }
    medio.set(m, i * 3);
    mancha[i] = k;
  }
  return { frente, medio, mancha };
}

/** Completa una forma hasta N puntos con puntos de sobra invisibles (para las partículas que solo usa el cerebro). */
export function rellenarForma(f: Forma, N: number): Forma {
  const n = f.alfa.length;
  if (n >= N) return f;
  const crecer = (a: Float32Array, k: number) => {
    const b = new Float32Array(N * k);
    b.set(a);
    return b;
  };
  return { ...f, pos: crecer(f.pos, 3), nor: crecer(f.nor, 3), col: crecer(f.col, 3), alfa: crecer(f.alfa, 1), tam: crecer(f.tam, 1), clave: crecer(f.clave, 1), umbral: crecer(f.umbral, 1), grupo: crecer(f.grupo, 1), hondo: crecer(f.hondo, 1) };
}

/**
 * El cerebro para N partículas. Las primeras nComun partículas son las que también usan
 * las demás figuras y el polvo; las demás (de nComun a N) solo existen para el cerebro.
 * Reparto: la rejilla base completa y el relleno que quepa, dejando `sueltas` partículas
 * de sobra entre las comunes (las partículas sueltas alrededor del cerebro).
 */
export function cerebroDeMalla(d: DatosCerebro, N: number, nComun = N, semilla = 11): Forma {
  const rnd = azar(semilla);
  const sueltas = Math.min(nComun - 1, Math.max(300, Math.round(N * 0.07)));
  const usar = Math.min(d.n, N - sueltas);
  const nBase = Math.min(d.nBase, usar);
  // El tronco se apaga hacia abajo hasta perderse
  const alfaDe = (i: number) => (d.parte[i] === 3 ? Math.pow(Math.max(0, Math.min(1, (d.pos[i * 3 + 1] + 1.75) / 1.05)), 1.5) : 1);
  const puntos: PuntoCerebro[] = [];
  for (let i = 0; i < usar; i++) {
    const o = i * 3;
    puntos.push({ i, x: d.pos[o], y: d.pos[o + 1], z: d.pos[o + 2], alfa: alfaDe(i), relleno: i >= nBase ? 1 : 0 });
  }
  // Las comunes llevan toda la rejilla base (y, si cabe, parte del relleno); las propias, lo demás
  const enComunes = Math.min(usar, nComun - sueltas);
  const comunes: PuntoCerebro[] = puntos.slice(0, enComunes);
  const propias: PuntoCerebro[] = puntos.slice(enComunes);
  while (comunes.length < nComun) {
    // de sobra: copias invisibles cerca de un punto real (quedan como partículas sueltas)
    const p = puntos[Math.floor(rnd() * nBase)];
    comunes.push({ ...p, alfa: 0 });
  }
  while (propias.length < N - nComun) propias.push({ ...puntos[Math.floor(rnd() * usar)], alfa: 0 });
  // Vista principal para ordenar: de lado, con el frente a la izquierda
  const vista = (p: PuntoCerebro): [number, number] => [-p.z, -p.y];
  const orden = [...ordenarPorPantalla(comunes.map(vista)).map((k) => comunes[k]), ...ordenarPorPantalla(propias.map(vista)).map((k) => propias[k])];

  const f: Forma = {
    reales: usar,
    pos: new Float32Array(N * 3),
    nor: new Float32Array(N * 3),
    col: new Float32Array(N * 3),
    alfa: new Float32Array(N),
    tam: new Float32Array(N),
    clave: new Float32Array(N),
    umbral: new Float32Array(N),
    grupo: new Float32Array(N),
    hondo: new Float32Array(N),
  };
  const parte = new Uint8Array(N);
  const surco = new Float32Array(N);
  const relleno = new Uint8Array(N);
  for (let k = 0; k < N; k++) {
    const p = orden[k];
    const o = p.i * 3;
    f.pos.set([p.x, p.y, p.z], k * 3);
    f.nor.set([d.nor[o], d.nor[o + 1], d.nor[o + 2]], k * 3);
    f.alfa[k] = p.alfa;
    f.tam[k] = 0.9 + rnd() * 0.2;
    f.clave[k] = (p.y + 1.6) / 2.4;
    f.umbral[k] = rnd();
    parte[k] = d.parte[p.i];
    surco[k] = Math.max(0, d.curv[p.i]);
    f.hondo[k] = surco[k];
    relleno[k] = p.relleno;
  }
  f.extra = { parte, surco, relleno, ...coloresCerebro(N, (k) => [f.pos[k * 3], f.pos[k * 3 + 1], f.pos[k * 3 + 2]], rnd) };
  return f;
}
type PuntoCerebro = { i: number; x: number; y: number; z: number; alfa: number; relleno: number };

/** Lo propio del cerebro para el cerebro de respaldo (el de lóbulos), que no trae partes ni relleno. */
function extraDeRespaldo(f: Forma, rnd: () => number): ExtraCerebro {
  const N = f.alfa.length;
  const parte = new Uint8Array(N);
  const surco = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const tallo = f.alfa[i] > 0 && f.alfa[i] < 0.6;
    parte[i] = tallo ? 3 : f.pos[i * 3] > 0 ? 0 : 1;
    surco[i] = tallo ? 0 : Math.max(0, (1 - f.alfa[i]) / 0.38);
    if (f.alfa[i] > 0) f.alfa[i] = tallo ? Math.pow(Math.max(0, Math.min(1, (f.pos[i * 3 + 1] + 1.75) / 1.05)), 1.5) : 1;
  }
  return { parte, surco, relleno: new Uint8Array(N), ...coloresCerebro(N, (k) => [f.pos[k * 3], f.pos[k * 3 + 1], f.pos[k * 3 + 2]], rnd) };
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
  const total = Math.round(Math.min(N, 7600) * 3.2);
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
  const sup = separarHasta(cands, Math.min(N, 7600), 0.05);
  const puntos: PuntoFinal[] = sup.map((c) => {
    const s = c.dato;
    // Degradado a lo largo del eje: durazno y blanco en el vidrio, lila y violeta en el cuello,
    // azul, verde azulado y verde en la rosca, y un toque amarillo en la punta
    const t = (s + 1) / 3.77;
    const u = rnd();
    let col: Color;
    if (s < 0.75) col = u < 0.42 ? PALETA.blanco : u < 0.92 ? PALETA.durazno : PALETA.lila;
    else if (s < 1.3) col = mezcla(mezcla(PALETA.durazno, PALETA.lila, 0.6), PALETA.violeta, suave(0.9, 1.3, s));
    else if (s < 1.75) col = mezcla(PALETA.violeta, PALETA.azul, suave(1.3, 1.75, s));
    else if (s < 2.2) col = mezcla(PALETA.azul, PALETA.verdeAzul, suave(1.75, 2.2, s));
    else col = mezcla(PALETA.verdeAzul, u < 0.5 ? PALETA.verde : PALETA.amarillo, suave(2.2, 2.7, s));
    // El cuello y la rosca, más tenues (en el video casi no se ven)
    return { ...c, col, alfa: s < 1.1 ? 1 : 0.6, tam: 0.8 + rnd() * 0.3, clave: t, umbral: rnd() };
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
  const M = N;
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
      if (mancha > 0.66) col = elegir([["violeta", 6], ["magenta", 2], ["ambar", 3], ["blanco", 1]], u);
      else if (mancha2 > 0.7) col = elegir([["verdeAzul", 4], ["ambar", 3], ["violeta", 2], ["blanco", 1]], u);
      else col = elegir([["ambar", 9], ["blanco", 4], ["magenta", 2], ["rosa", 1], ["coral", 1], ["amarillo", 1], ["violeta", 1]], u);
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
      // El mar: puntitos tenues pero presentes (en el video la esfera se ve llena)
      alfa: tierra ? 1 : rnd() < 0.7 ? 0.42 : 0,
      tam: tierra ? 0.95 + rnd() * 0.2 : 0.62,
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
