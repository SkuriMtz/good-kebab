"use client";

import { useEffect, useRef } from "react";
import { crearAstilla, dibujarAstilla, type Astilla } from "@/components/escena/figuras/astilla";

/**
 * EL RÍO DE INFORMACIÓN (el inicio, en lugar del cerebro): un río de partículas que corre de la
 * portada («Que ningún cliente se quede sin respuesta», entra por la derecha) a decisiones
 * («Trabaja aunque no estés», sale por la izquierda), por fuera de los textos.
 * - Grueso: unos 40 % del alto de la pantalla (35 % en el celular, que es angosto).
 * - El cauce hace una S suave (suma de 3 senoides de distinta frecuencia) y ondula muy lento con
 *   el tiempo, como si respirara.
 * - Por dentro van varias hebras (4; 3 en el celular) que se trenzan, se cruzan y se separan, cada
 *   una con su propia ondulación.
 * - La base es polvo: a lo ancho de cada hebra, reparto gaussiano (centro denso y orillas que se
 *   deshilachan, con algunas partículas que se escapan del cauce).
 * - Encima, para que llame la atención: líneas hechas de fragmentos en fila (hilos que se cruzan,
 *   con pulsos de luz que corren por ellos), asteroides (astillas grandes e irregulares, con caras
 *   de vidrio, que giran y van más despacio; astilla.ts) y destellos que se prenden y se apagan.
 * - Avanzan más rápido al centro del río y más lento en las orillas, con un remolino ligero de
 *   ruido (curl de ruido simplex) para que no parezcan rieles.
 * - Donde hay texto, las partículas pasan por detrás casi transparentes (no compite con él).
 * - Pegado a la página (se ve pasar al bajar); solo dibuja mientras está a la vista. Con «reducir
 *   movimiento», se queda quieto.
 */
type Tema = { colores: string[]; luz: GlobalCompositeOperation; fuerza: number };
// Los mismos colores de siempre: ámbar, lavanda, gris claro y turquesa
const OSCURO: Tema = { colores: ["#f1bc5b", "#916ef8", "#d9d5e6", "#3fd6b8"], luz: "lighter", fuerza: 1 };
const CLARO: Tema = { colores: ["#b9810f", "#6b48e0", "#55516a", "#11957c"], luz: "source-over", fuerza: 0.9 };

/** Muestras del cauce (se recalculan en cada cuadro, porque respira). */
const M = 480;
/** Qué tan visible es cada partícula según qué tan lejos está del centro de su hebra. */
const ALFA = [0.8, 0.5, 0.28];
/** Tamaño (px) de la cuadrícula donde se calcula el remolino (después se interpola). */
const CEL = 28;

type Particula = { s: number; k: number; u: number; jit: number; v: number; tam: number; grupo: number };
type P = { x: number; y: number };
/** Una línea hecha de fragmentos: su ondulación a lo ancho del río, su velocidad y su color. */
type Linea = { f: number; p: number; w: number; a: number; vel: number; color: number; pulso: number; o: Float32Array };
type PuntoLinea = { l: number; s: number; j: number; tam: number };
type Asteroide = { s: number; lat: number; v: number; tam: number; color: number; a: number; b: number; va: number; vb: number; forma: Astilla };
type Destello = { k: number; s: number; u: number; v: number; fase: number; vel: number; color: number; tam: number };

/** Un puntito con halo, pintado una vez por color (para los destellos). */
function brillo(color: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 32;
  const g = c.getContext("2d");
  if (!g) return c;
  const r = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  r.addColorStop(0, color);
  r.addColorStop(0.15, `${color}dd`);
  r.addColorStop(0.4, `${color}33`);
  r.addColorStop(1, `${color}00`);
  g.fillStyle = r;
  g.fillRect(0, 0, 32, 32);
  return c;
}

/** Catmull-Rom: pasa por todos los puntos, sin esquinas. */
function curva(pts: P[], pasos = 64): P[] {
  const out: P[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let s = 0; s < pasos; s++) {
      const t = s / pasos;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push({
        x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      });
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/** Azar fijo: el mismo dibujo en cada visita. */
function azar(semilla: number) {
  let s = semilla;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

/** Ruido simplex 2D (Gustavson), con permutación fija. Devuelve de -1 a 1. */
function ruidoSimplex(semilla: number) {
  const r = azar(semilla);
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  const perm = new Uint8Array(512);
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const GX = [1, -1, 1, -1, 1, -1, 0, 0];
  const GY = [1, 1, -1, -1, 0, 0, 1, -1];
  const F2 = 0.5 * (Math.sqrt(3) - 1);
  const G2 = (3 - Math.sqrt(3)) / 6;
  return (xin: number, yin: number) => {
    const s = (xin + yin) * F2;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const t = (i + j) * G2;
    const x0 = xin - (i - t);
    const y0 = yin - (j - t);
    const i1 = x0 > y0 ? 1 : 0;
    const j1 = 1 - i1;
    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2;
    const y2 = y0 - 1 + 2 * G2;
    const ii = i & 255;
    const jj = j & 255;
    let n = 0;
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 > 0) {
      const g = perm[ii + perm[jj]] & 7;
      t0 *= t0;
      n += t0 * t0 * (GX[g] * x0 + GY[g] * y0);
    }
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 > 0) {
      const g = perm[ii + i1 + perm[jj + j1]] & 7;
      t1 *= t1;
      n += t1 * t1 * (GX[g] * x1 + GY[g] * y1);
    }
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 > 0) {
      const g = perm[ii + 1 + perm[jj + 1]] & 7;
      t2 *= t2;
      n += t2 * t2 * (GX[g] * x2 + GY[g] * y2);
    }
    return 70 * n;
  };
}

/** Normal casi gaussiana (Box-Muller). */
function gauss(r: () => number) {
  return Math.sqrt(-2 * Math.log(Math.max(1e-6, r()))) * Math.cos(2 * Math.PI * r());
}

export function FlujoInfo() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ruido = ruidoSimplex(5);

    let W = 0;
    let H = 0;
    let dpr = 1;
    let movil = false;
    let listo = false;
    // El camino base (de la portada a decisiones), muestreado parejo, con su normal; y el alto de
    // la pantalla
    const BX = new Float32Array(M);
    const BY = new Float32Array(M);
    const BNX = new Float32Array(M);
    const BNY = new Float32Array(M);
    let largo = 1;
    let alto = 1;
    let medio = 1; // medio grueso del río
    let arriba = 0;
    let abajo = 0;
    let K = 4;
    // Muestras de este cuadro: centro y normal del cauce, medio grueso, y centro y ancho de cada hebra
    const LX = new Float32Array(M);
    const LY = new Float32Array(M);
    const LNX = new Float32Array(M);
    const LNY = new Float32Array(M);
    const HW = new Float32Array(M);
    let OK: Float32Array[] = [];
    let SK: Float32Array[] = [];
    let parts: Particula[] = [];
    let lineas: Linea[] = [];
    let puntosLinea: PuntoLinea[] = [];
    let asteroides: Asteroide[] = [];
    let destellos: Destello[] = [];
    let sprites: HTMLCanvasElement[] = [];
    let spritesDe = "";
    let creadoPara: boolean | null = null;
    let textos: { x0: number; y0: number; x1: number; y1: number }[] = [];
    const tapados: number[] = [];
    // El remolino de este cuadro, en una cuadrícula que cubre la pantalla (en la página)
    let GDX = new Float32Array(0);
    let GDY = new Float32Array(0);
    let gw = 0;
    let gh = 0;
    let gx0 = 0;
    let gy0 = 0;

    /** Las hebras: frecuencia, fase y velocidad de ondulación propias (un poco desfasadas). */
    let hebras: { f1: number; f2: number; f3: number; p1: number; p2: number; p3: number; w1: number; w2: number }[] = [];

    const crear = () => {
      const r = azar(7);
      K = movil ? 3 : 4;
      hebras = Array.from({ length: K }, (_, k) => ({
        f1: 1.1 + r() * 0.9,
        f2: 2.3 + r() * 1.4,
        f3: 1.4 + r() * 1.2,
        p1: (k / K) * Math.PI * 2 + r() * 0.6,
        p2: r() * Math.PI * 2,
        p3: r() * Math.PI * 2,
        w1: 0.09 + r() * 0.08,
        w2: 0.06 + r() * 0.07,
      }));
      OK = Array.from({ length: K }, () => new Float32Array(M));
      SK = Array.from({ length: K }, () => new Float32Array(M));
      // El color principal de cada hebra; una parte de sus partículas lleva otro color de la paleta
      const principal = [0, 1, 0, 2];
      const otro = () => {
        const c = r();
        return c < 0.5 ? 0 : c < 0.78 ? 1 : c < 0.93 ? 2 : 3;
      };
      const N = movil ? 5200 : 14000;
      parts = Array.from({ length: N }, () => {
        const k = Math.floor(r() * K);
        let u = gauss(r);
        const q = r();
        if (q < 0.04) u *= 3.5 + r() * 1.5; // se escapan del cauce
        else if (q < 0.15) u *= 2.2; // polvo suelto de las orillas
        const lejos = Math.abs(u);
        const banda = lejos < 1 ? 0 : lejos < 2 ? 1 : 2;
        const color = r() < 0.65 ? principal[k] : otro();
        return {
          s: r(),
          k,
          u,
          jit: 0.8 + r() * 0.4,
          v: 0,
          tam: banda === 0 ? 1.5 + r() * 1 : banda === 1 ? 1.2 + r() * 0.7 : 1 + r() * 0.5,
          grupo: banda * 4 + color,
        };
      });
      // Juntas por grupo (color y opacidad): cada grupo se pinta con un solo estilo
      parts.sort((a, b) => a.grupo - b.grupo);

      // Las líneas hechas de fragmentos
      lineas = Array.from({ length: movil ? 4 : 7 }, (_, l) => ({
        f: 1.3 + r() * 1.9,
        p: r() * Math.PI * 2,
        w: (r() - 0.5) * 0.3,
        a: 0.3 + r() * 0.55,
        vel: (movil ? 80 : 100) + r() * 55,
        color: [0, 1, 2, 0, 1, 3, 0][l % 7],
        pulso: 1.7 + r() * 0.6,
        o: new Float32Array(M),
      }));
      const porLinea = movil ? 420 : 760;
      puntosLinea = [];
      lineas.forEach((_, l) => {
        for (let n = 0; n < porLinea; n++) puntosLinea.push({ l, s: r(), j: gauss(r) * 0.7, tam: 1.3 + r() * 0.7 });
      });
      puntosLinea.sort((a, b) => a.l - b.l);

      // Los asteroides: fragmentos grandes de alambre
      asteroides = Array.from({ length: movil ? 16 : 44 }, () => {
        const z = r();
        return {
          s: r(),
          lat: Math.max(-1.3, Math.min(1.3, gauss(r) * 0.6)),
          v: 26 + r() * 34,
          tam: (movil ? 7 : 8) + z * z * (movil ? 14 : 24),
          color: otro(),
          a: r() * Math.PI * 2,
          b: r() * Math.PI * 2,
          va: (r() - 0.5) * 1.2,
          vb: (r() - 0.5) * 0.9,
          forma: crearAstilla(r),
        };
      });

      // Los destellos
      destellos = Array.from({ length: movil ? 30 : 80 }, () => ({
        k: Math.floor(r() * K),
        s: r(),
        u: gauss(r) * 0.9,
        v: 40 + r() * 40,
        fase: r() * Math.PI * 2,
        vel: 0.8 + r() * 1.6,
        color: otro(),
        tam: (movil ? 12 : 16) + r() * 12,
      }));
      creadoPara = movil;
    };

    const medir = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      const por = document.querySelector<HTMLElement>('[data-escena="portada"]');
      const dec = document.querySelector<HTMLElement>('[data-escena="decisiones"]');
      if (!por || !dec) {
        listo = false;
        return;
      }
      const sy = window.scrollY;
      const pr = por.getBoundingClientRect();
      const dr = dec.getBoundingClientRect();
      const pt = pr.top + sy;
      const ph = pr.height;
      const dt = dr.top + sy;
      const dh = dr.height;
      movil = W < 768;
      // El alto de la pantalla al llegar (la portada puede ser más alta)
      alto = Math.min(ph, H);
      medio = alto * (movil ? 0.175 : 0.23);
      // El mismo camino de siempre: de la derecha de la portada a la izquierda de decisiones, con
      // las puntas fuera de la pantalla
      const pts: P[] = movil
        ? [
            { x: W * 1.3, y: pt + ph * 0.56 },
            { x: W * 0.82, y: pt + ph * 0.74 },
            { x: W * 0.6, y: pt + ph * 0.95 },
            { x: W * 0.45, y: dt + dh * 0.45 },
            { x: W * 0.22, y: dt + dh * 0.66 },
            { x: -W * 0.35, y: dt + dh * 0.85 },
          ]
        : [
            { x: W * 1.25, y: pt - alto * 0.05 },
            { x: W, y: pt + alto * 0.28 },
            { x: W * 0.75, y: pt + alto * 0.64 },
            { x: W * 0.5, y: pt + alto * 0.99 },
            { x: W * 0.22, y: dt + dh * 0.22 },
            { x: W * 0.06, y: dt + dh * 0.45 },
            { x: -W * 0.25, y: dt + dh * 0.62 },
          ];
      const ruta = curva(pts);
      const acum = [0];
      for (let i = 1; i < ruta.length; i++) acum.push(acum[i - 1] + Math.hypot(ruta[i].x - ruta[i - 1].x, ruta[i].y - ruta[i - 1].y));
      largo = acum[acum.length - 1] || 1;
      let j = 0;
      for (let m = 0; m < M; m++) {
        const d = (m / (M - 1)) * largo;
        while (j < acum.length - 2 && acum[j + 1] < d) j++;
        const seg = acum[j + 1] - acum[j] || 1;
        const k = (d - acum[j]) / seg;
        const a = ruta[j];
        const b = ruta[j + 1];
        BX[m] = a.x + (b.x - a.x) * k;
        BY[m] = a.y + (b.y - a.y) * k;
      }
      arriba = Infinity;
      abajo = -Infinity;
      for (let m = 0; m < M; m++) {
        const a = Math.max(0, m - 1);
        const b = Math.min(M - 1, m + 1);
        const tx = BX[b] - BX[a];
        const ty = BY[b] - BY[a];
        const l = Math.hypot(tx, ty) || 1;
        BNX[m] = -ty / l;
        BNY[m] = tx / l;
        if (BY[m] < arriba) arriba = BY[m];
        if (BY[m] > abajo) abajo = BY[m];
      }
      arriba -= medio * 3 + alto * 0.2;
      abajo += medio * 3 + alto * 0.2;
      textos = [...document.querySelectorAll<HTMLElement>('[data-escena="portada"] .ini-col, [data-escena="decisiones"] .ini-col')].map((el) => {
        const r = el.getBoundingClientRect();
        return { x0: r.left - 14, y0: r.top + sy - 14, x1: r.right + 14, y1: r.bottom + sy + 14 };
      });
      if (creadoPara !== movil) crear();
      listo = true;
    };

    /** El cauce de este momento: la S, su respiración y las hebras. */
    const cauce = (tiempo: number) => {
      const dos = Math.PI * 2;
      // La S: tres senoides de distinta frecuencia (más chica en el celular, que es angosto)
      const g = movil ? 0.6 : 1;
      for (let m = 0; m < M; m++) {
        const s = m / (M - 1);
        const a =
          alto *
          g *
          (0.06 * Math.sin(dos * 0.95 * s + 0.1 + 0.11 * tiempo) +
            0.03 * Math.sin(dos * 1.7 * s + 2.1 - 0.07 * tiempo) +
            0.015 * Math.sin(dos * 2.9 * s + 4.2 + 0.05 * tiempo));
        LX[m] = BX[m] + BNX[m] * a;
        LY[m] = BY[m] + BNY[m] * a;
        HW[m] = medio * (0.88 + 0.12 * Math.sin(dos * 1.3 * s + 0.8 + 0.06 * tiempo));
      }
      for (let m = 0; m < M; m++) {
        const a = Math.max(0, m - 1);
        const b = Math.min(M - 1, m + 1);
        const tx = LX[b] - LX[a];
        const ty = LY[b] - LY[a];
        const l = Math.hypot(tx, ty) || 1;
        LNX[m] = -ty / l;
        LNY[m] = tx / l;
      }
      for (let k = 0; k < K; k++) {
        const h = hebras[k];
        const o = OK[k];
        const sg = SK[k];
        for (let m = 0; m < M; m++) {
          const s = m / (M - 1);
          o[m] = HW[m] * 0.56 * (0.62 * Math.sin(dos * h.f1 * s + h.p1 + h.w1 * tiempo) + 0.38 * Math.sin(dos * h.f2 * s + h.p2 - h.w2 * tiempo));
          sg[m] = HW[m] * (0.13 + 0.05 * Math.sin(dos * h.f3 * s + h.p3 + 0.05 * tiempo));
        }
      }
      for (const l of lineas) {
        for (let m = 0; m < M; m++) {
          const s = m / (M - 1);
          l.o[m] = HW[m] * l.a * Math.sin(dos * l.f * s + l.p + l.w * tiempo);
        }
      }
    };

    // El punto del cauce en «s» con un desvío «lat» a lo ancho (deja el resultado en px, py)
    let ii = 0;
    let ww = 0;
    let px = 0;
    let py = 0;
    const indice = (s: number) => {
      const f = s * (M - 1);
      ii = Math.min(M - 2, f | 0);
      ww = f - ii;
    };
    const en = (arr: Float32Array) => arr[ii] + (arr[ii + 1] - arr[ii]) * ww;
    const colocar = (lat: number) => {
      px = en(LX) + en(LNX) * lat;
      py = en(LY) + en(LNY) * lat;
    };
    /** Suma el remolino (interpolado de la cuadrícula) a px, py, con la fuerza «k». */
    const remolino = (k: number) => {
      const fx = Math.min(gw - 1.001, Math.max(0, (px - gx0) / CEL));
      const fy = Math.min(gh - 1.001, Math.max(0, (py - gy0) / CEL));
      const ix = fx | 0;
      const iy = fy | 0;
      const ax = fx - ix;
      const ay = fy - iy;
      const n0 = iy * gw + ix;
      const n1 = n0 + gw;
      px += ((GDX[n0] * (1 - ax) + GDX[n0 + 1] * ax) * (1 - ay) + (GDX[n1] * (1 - ax) + GDX[n1 + 1] * ax) * ay) * k;
      py += ((GDY[n0] * (1 - ax) + GDY[n0 + 1] * ax) * (1 - ay) + (GDY[n1] * (1 - ax) + GDY[n1 + 1] * ax) * ay) * k;
    };
    const tapa = (x: number, y: number) => textos.some((r) => x > r.x0 && x < r.x1 && y > r.y0 && y < r.y1);

    let raf = 0;
    let antes = performance.now();
    let tiempo = 0;
    const cuadro = (ahora: number) => {
      raf = requestAnimationFrame(cuadro);
      const paso = Math.min(0.05, (ahora - antes) / 1000);
      antes = ahora;
      const sy = window.scrollY;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (!listo || sy + H < arriba || sy > abajo) return;
      const dt = quieto ? 0 : paso;
      tiempo += dt;
      cauce(tiempo);
      const claro = document.documentElement.dataset.tema === "claro";
      const T = claro ? CLARO : OSCURO;

      // En coordenadas de la página
      ctx.setTransform(dpr, 0, 0, dpr, 0, -sy * dpr);
      ctx.globalCompositeOperation = T.luz;
      const tope = sy - 10;
      const piso = sy + H + 10;
      const vmax = movil ? 52 : 72;
      // El remolino: un campo de ruido que cambia despacio; las partículas se desvían según su
      // curl (gira sin juntarlas ni separarlas). Se calcula en una cuadrícula y se interpola.
      const fr = 1 / (movil ? 120 : 170);
      const e = 0.04;
      const amp = movil ? 4.5 : 6.5;
      const tx = tiempo * 0.05;
      const ty = -tiempo * 0.035;
      gx0 = -2 * CEL;
      gy0 = Math.floor((sy - 60) / CEL) * CEL;
      gw = Math.ceil((W + 4 * CEL) / CEL) + 1;
      gh = Math.ceil((H + 120) / CEL) + 2;
      if (GDX.length !== gw * gh) {
        GDX = new Float32Array(gw * gh);
        GDY = new Float32Array(gw * gh);
      }
      for (let gy = 0; gy < gh; gy++) {
        for (let gx = 0; gx < gw; gx++) {
          const qx = (gx0 + gx * CEL) * fr + tx;
          const qy = (gy0 + gy * CEL) * fr + ty;
          const c = ruido(qx, qy);
          const n = gy * gw + gx;
          GDX[n] = ((ruido(qx, qy + e) - c) / e) * amp;
          GDY[n] = (-(ruido(qx + e, qy) - c) / e) * amp;
        }
      }
      tapados.length = 0;

      let grupo = -1;
      for (let n = 0; n < parts.length; n++) {
        const p = parts[n];
        p.s += (p.v * dt) / largo;
        if (p.s >= 1) p.s -= 1;
        if (p.grupo !== grupo) {
          grupo = p.grupo;
          ctx.fillStyle = T.colores[grupo % 4];
          ctx.globalAlpha = ALFA[grupo >> 2] * T.fuerza;
        }
        indice(p.s);
        const lat = en(OK[p.k]) + p.u * en(SK[p.k]);
        // Más rápido al centro del río, más lento en las orillas
        const rel = Math.min(1, Math.abs(lat) / (HW[ii] || 1));
        p.v = vmax * p.jit * (1 - 0.7 * rel * rel);
        colocar(lat);
        if (py < tope - 40 || py > piso + 40 || px < -40 || px > W + 40 || p.s < 0.01 || p.s > 0.99) continue;
        remolino(1);
        if (py < tope || py > piso || px < -4 || px > W + 4) continue;
        if (tapa(px, py)) {
          tapados.push(px, py, p.tam);
          continue;
        }
        ctx.fillRect(px - p.tam / 2, py - p.tam / 2, p.tam, p.tam);
      }

      // Las líneas hechas de fragmentos, con pulsos de luz que corren por ellas
      let lineaActual = -1;
      for (const q of puntosLinea) {
        const l = lineas[q.l];
        q.s += (l.vel * dt) / largo;
        if (q.s >= 1) q.s -= 1;
        if (q.l !== lineaActual) {
          lineaActual = q.l;
          ctx.fillStyle = T.colores[l.color];
        }
        if (q.s < 0.01 || q.s > 0.99) continue;
        indice(q.s);
        colocar(en(l.o) + q.j);
        if (py < tope - 40 || py > piso + 40 || px < -40 || px > W + 40) continue;
        remolino(0.5);
        if (py < tope || py > piso || px < -4 || px > W + 4 || tapa(px, py)) continue;
        const d = (((q.s * largo - tiempo * l.vel * l.pulso) % 620) + 620) % 620;
        const luz = d < 170 ? 1 - d / 170 : 0;
        ctx.globalAlpha = Math.min(1, 0.5 + 0.55 * luz) * T.fuerza;
        const t = q.tam * (1 + 0.7 * luz);
        ctx.fillRect(px - t / 2, py - t / 2, t, t);
      }

      // Los asteroides: astillas grandes (pedazos irregulares, con caras de vidrio) que giran
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.globalAlpha = T.fuerza;
      for (const a of asteroides) {
        a.s += (a.v * dt) / largo;
        if (a.s >= 1) a.s -= 1;
        a.a += a.va * dt;
        a.b += a.vb * dt;
        if (a.s < 0.01 || a.s > 0.99) continue;
        indice(a.s);
        colocar(a.lat * HW[ii]);
        if (py < tope - 40 || py > piso + 40 || px < -40 || px > W + 40) continue;
        remolino(1);
        if (tapa(px, py)) continue;
        dibujarAstilla(ctx, a.forma, px, py, a.tam * 0.6, a.a, a.b, a.a * 0.4, T.colores[a.color], claro ? 0.16 : 0.24, 0.9, 1.1);
      }
      ctx.globalAlpha = 1;

      // Los destellos: se prenden y se apagan
      const tema = claro ? "claro" : "oscuro";
      if (spritesDe !== tema) {
        sprites = T.colores.map(brillo);
        spritesDe = tema;
      }
      for (const d of destellos) {
        d.s += (d.v * dt) / largo;
        if (d.s >= 1) d.s -= 1;
        if (d.s < 0.01 || d.s > 0.99) continue;
        const b = Math.sin(tiempo * d.vel + d.fase);
        if (b <= 0.2) continue;
        indice(d.s);
        colocar(en(OK[d.k]) + d.u * en(SK[d.k]));
        if (py < tope || py > piso || px < -20 || px > W + 20) continue;
        remolino(1);
        if (tapa(px, py)) continue;
        ctx.globalAlpha = b * b * b * T.fuerza;
        ctx.drawImage(sprites[d.color], px - d.tam / 2, py - d.tam / 2, d.tam, d.tam);
      }

      // Las que pasan por detrás de un texto, apenas visibles
      if (tapados.length) {
        ctx.fillStyle = T.colores[2];
        ctx.globalAlpha = (claro ? 0.1 : 0.12) * T.fuerza;
        for (let n = 0; n < tapados.length; n += 3) ctx.fillRect(tapados[n] - tapados[n + 2] / 2, tapados[n + 1] - tapados[n + 2] / 2, tapados[n + 2], tapados[n + 2]);
      }

      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
    };

    medir();
    const ro = new ResizeObserver(() => medir());
    ro.observe(document.body);
    document.fonts?.ready.then(medir).catch(() => {});
    const alVisibilidad = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) {
        antes = performance.now();
        raf = requestAnimationFrame(cuadro);
      }
    };
    document.addEventListener("visibilitychange", alVisibilidad);
    raf = requestAnimationFrame(cuadro);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", alVisibilidad);
    };
  }, []);

  return <canvas ref={ref} className="flujo-info" aria-hidden="true" />;
}
