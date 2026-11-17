"use client";

import { useEffect, useRef } from "react";
import { COLORES } from "@/components/Logo";

/* =====================================================================
   Fondo de las páginas de acceso (entrar, crear cuenta, 404 y 500).
   Cuatro listones grandes y curvos que cruzan la pantalla, como en las
   páginas de acceso de las apps grandes, pero hechos de fragmentos: cada
   liston es una malla de triangulitos (≈800 en total) con un pequeño
   hueco entre ellos y vértices irregulares, así que se leen como pedazos.
   - Tonos azul marino e índigo muy oscuros; unos pocos fragmentos llevan
     los colores de los agentes (COLORES de Logo) con opacidad muy baja.
     Brillo bajo, sin bloom: el texto de la tarjeta siempre se lee (7, 10, 11).
   - Una deriva lentísima mueve las curvas. Con el cursor, los fragmentos
     a menos de 120 px se apartan unos píxeles (máximo 8) y regresan con
     un resorte suave. En celular (sin cursor) solo hay deriva.
   - "Reducir movimiento": se pinta una vez, sin deriva ni cursor. Pausa con
     la pestaña oculta o fuera de la vista; DPR máximo de 2.
   ===================================================================== */

type Punto = [number, number];
type Liston = {
  /** Curva de Bézier cúbica en coordenadas de 0 a 1 de la pantalla. */
  p: [Punto, Punto, Punto, Punto];
  /** Ancho total como fracción de la diagonal de la pantalla. */
  ancho: number;
  /** Tono base (HSL) del liston. */
  tono: number;
  columnas: number;
  /** Fase y rapidez de la deriva (rad/s) de cada punto de control. */
  deriva: { fase: number; vel: number; amp: number }[];
};

const LISTONES: Liston[] = [
  {
    p: [[-0.2, 0.98], [0.3, 0.5], [0.62, 0.98], [1.2, 0.34]],
    ancho: 0.15,
    tono: 232,
    columnas: 36,
    deriva: [
      { fase: 0.3, vel: 0.05, amp: 0.02 },
      { fase: 1.7, vel: 0.04, amp: 0.035 },
      { fase: 2.9, vel: 0.06, amp: 0.03 },
      { fase: 4.1, vel: 0.045, amp: 0.02 },
    ],
  },
  {
    p: [[-0.12, 0.12], [0.3, -0.12], [0.5, 0.52], [1.14, 0.72]],
    ancho: 0.12,
    tono: 246,
    columnas: 34,
    deriva: [
      { fase: 1.1, vel: 0.045, amp: 0.02 },
      { fase: 3.3, vel: 0.055, amp: 0.03 },
      { fase: 0.2, vel: 0.04, amp: 0.035 },
      { fase: 5.0, vel: 0.05, amp: 0.02 },
    ],
  },
  {
    p: [[-0.12, 1.12], [0.36, 0.8], [0.7, 1.22], [1.12, 0.9]],
    ancho: 0.1,
    tono: 222,
    columnas: 30,
    deriva: [
      { fase: 2.2, vel: 0.05, amp: 0.015 },
      { fase: 0.9, vel: 0.06, amp: 0.025 },
      { fase: 3.8, vel: 0.045, amp: 0.025 },
      { fase: 1.4, vel: 0.04, amp: 0.015 },
    ],
  },
  {
    p: [[0.34, -0.16], [0.66, 0.26], [0.86, -0.02], [1.12, 0.22]],
    ancho: 0.075,
    tono: 256,
    columnas: 28,
    deriva: [
      { fase: 4.4, vel: 0.05, amp: 0.02 },
      { fase: 2.1, vel: 0.04, amp: 0.03 },
      { fase: 0.6, vel: 0.055, amp: 0.02 },
      { fase: 3.0, vel: 0.045, amp: 0.02 },
    ],
  },
];

/** Filas a lo ancho del liston (cada una son dos triángulos por columna). */
const FILAS = 3;
const RADIO = 120;
const MAX_DESPLAZA = 8;

/** Números al azar repetibles: el mismo fondo en cada visita. */
function azar(semilla: number) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hexARgba = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

type Fragmento = {
  /** Liston, y los tres vértices de la malla: [columna, fila] de cada uno. */
  l: number;
  v: [number, number][];
  relleno: string;
  trazo: string;
  /** Capa de color de agente (muy tenue) encima del relleno, o "". */
  tinte: string;
};

export function FondoListones() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reducir = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fino = window.matchMedia("(hover: hover) and (pointer: fine)");

    // ---- La malla: se arma una vez (los tonos y huecos no cambian) ----
    const r = azar(7);
    const fragmentos: Fragmento[] = [];
    /** Desplazamiento fijo de cada vértice de la malla (los bordes quedan irregulares). */
    const ruido: { jx: number; jy: number }[][][] = [];
    const lados: { fase: number; ritmo: number }[] = [];
    LISTONES.forEach((liston, li) => {
      ruido[li] = [];
      for (let i = 0; i <= liston.columnas; i++) {
        ruido[li][i] = [];
        for (let j = 0; j <= FILAS; j++) ruido[li][i][j] = { jx: (r() - 0.5) * 0.7, jy: (r() - 0.5) * 0.5 };
      }
      lados.push({ fase: r() * 6.28, ritmo: 4 + r() * 3 });
      for (let i = 0; i < liston.columnas; i++) {
        for (let j = 0; j < FILAS; j++) {
          const quad: [number, number][][] =
            (i + j) % 2 === 0
              ? [[[i, j], [i + 1, j], [i, j + 1]], [[i + 1, j], [i + 1, j + 1], [i, j + 1]]]
              : [[[i, j], [i + 1, j], [i + 1, j + 1]], [[i, j], [i + 1, j + 1], [i, j + 1]]];
          for (const v of quad) {
            const t = (i + 0.5) / liston.columnas;
            const s = (j + 0.5) / FILAS;
            // La luz corre a lo largo del liston en bandas suaves, más clara hacia un borde
            const luz = 0.5 + 0.5 * Math.sin(t * 6.2 + lados[li].fase + s * 1.4);
            const L = 8 + 8 * luz + 4 * r() + 3 * (1 - s);
            const H = liston.tono + (r() - 0.5) * 16;
            const S = 52 + r() * 18;
            const tinta = r() < 0.09;
            const color = COLORES[Math.floor(r() * COLORES.length)];
            fragmentos.push({
              l: li,
              v,
              relleno: `hsla(${H.toFixed(0)},${S.toFixed(0)}%,${L.toFixed(1)}%,0.94)`,
              trazo: tinta ? hexARgba(color, 0.2) : `rgba(150,170,255,${(0.05 + r() * 0.07).toFixed(3)})`,
              tinte: tinta ? hexARgba(color, 0.08 + r() * 0.08) : "",
            });
          }
        }
      }
    });
    canvas.dataset.fragmentos = String(fragmentos.length);

    // Estado del resorte de cada fragmento
    const n = fragmentos.length;
    const ox = new Float32Array(n);
    const oy = new Float32Array(n);
    const vx = new Float32Array(n);
    const vy = new Float32Array(n);

    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let visible = true;
    let ultimo = 0;
    let reloj = 0;
    let ultimoCursor = -1e9;
    const cursor = { x: -9999, y: -9999, dentro: false };

    /** Vértices de la malla de cada liston en pantalla (x, y por vértice), recalculados en cada cuadro. */
    const mallas = LISTONES.map((l) => new Float32Array((l.columnas + 1) * (FILAS + 1) * 2));

    const calcular = (tiempo: number) => {
      const diag = Math.hypot(w, h);
      LISTONES.forEach((liston, li) => {
        const c = liston.p.map((q, k) => {
          const d = liston.deriva[k];
          return [
            (q[0] + Math.sin(tiempo * d.vel + d.fase) * d.amp) * w,
            (q[1] + Math.cos(tiempo * d.vel * 0.8 + d.fase) * d.amp) * h,
          ];
        });
        const malla = mallas[li];
        for (let i = 0; i <= liston.columnas; i++) {
          const t = i / liston.columnas;
          const u = 1 - t;
          const x = u * u * u * c[0][0] + 3 * u * u * t * c[1][0] + 3 * u * t * t * c[2][0] + t * t * t * c[3][0];
          const y = u * u * u * c[0][1] + 3 * u * u * t * c[1][1] + 3 * u * t * t * c[2][1] + t * t * t * c[3][1];
          const dx = 3 * u * u * (c[1][0] - c[0][0]) + 6 * u * t * (c[2][0] - c[1][0]) + 3 * t * t * (c[3][0] - c[2][0]);
          const dy = 3 * u * u * (c[1][1] - c[0][1]) + 6 * u * t * (c[2][1] - c[1][1]) + 3 * t * t * (c[3][1] - c[2][1]);
          const len = Math.hypot(dx, dy) || 1;
          const tx = dx / len;
          const ty = dy / len;
          // El liston se ensancha al centro y se afina hacia los extremos
          const base = Math.sin(Math.PI * t);
          const ddx = 6 * u * (c[2][0] - 2 * c[1][0] + c[0][0]) + 6 * t * (c[3][0] - 2 * c[2][0] + c[1][0]);
          const ddy = 6 * u * (c[2][1] - 2 * c[1][1] + c[0][1]) + 6 * t * (c[3][1] - 2 * c[2][1] + c[1][1]);
          const curvatura = Math.abs(dx * ddy - dy * ddx) / (len * len * len);
          const ideal = liston.ancho * diag * 0.5 * (0.4 + 0.6 * Math.pow(base, 0.7)) * (1 + 0.18 * Math.sin(t * 5 + lados[li].fase));
          // En las vueltas cerradas el liston se afina: así la malla nunca se dobla sobre sí misma
          const medio = ideal / (1 + 1.4 * ideal * curvatura);
          const celda = Math.max(8, medio * 0.55);
          for (let j = 0; j <= FILAS; j++) {
            const s = (j / FILAS) * 2 - 1;
            const q = ruido[li][i][j];
            const lado = s * medio + q.jy * celda;
            const k = (i * (FILAS + 1) + j) * 2;
            malla[k] = x - ty * lado + tx * q.jx * celda;
            malla[k + 1] = y + tx * lado + ty * q.jx * celda;
          }
        }
      });
    };

    const trazarTriangulo = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number) => {
      // Se achica un poco hacia su centro: queda un hueco entre fragmentos
      const mx = (ax + bx + cx) / 3;
      const my = (ay + by + cy) / 3;
      const k = 0.86;
      ctx.beginPath();
      ctx.moveTo(mx + (ax - mx) * k, my + (ay - my) * k);
      ctx.lineTo(mx + (bx - mx) * k, my + (by - my) * k);
      ctx.lineTo(mx + (cx - mx) * k, my + (cy - my) * k);
      ctx.closePath();
    };

    const dibujar = (dt: number, conCursor: boolean) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      ctx.lineJoin = "round";
      for (let f = 0; f < n; f++) {
        const fr = fragmentos[f];
        const malla = mallas[fr.l];
        const ia = (fr.v[0][0] * (FILAS + 1) + fr.v[0][1]) * 2;
        const ib = (fr.v[1][0] * (FILAS + 1) + fr.v[1][1]) * 2;
        const ic = (fr.v[2][0] * (FILAS + 1) + fr.v[2][1]) * 2;
        const ax = malla[ia], ay = malla[ia + 1];
        const bx = malla[ib], by = malla[ib + 1];
        const cx = malla[ic], cy = malla[ic + 1];
        // Los que quedan fuera de la pantalla ni se pintan
        const mx = (ax + bx + cx) / 3;
        const my = (ay + by + cy) / 3;

        if (conCursor) {
          // Resorte (casi críticamente amortiguado): se aparta del cursor y regresa sin rebotar
          let tx = 0;
          let ty = 0;
          if (cursor.dentro) {
            const dx = mx - cursor.x;
            const dy = my - cursor.y;
            const d = Math.hypot(dx, dy);
            if (d < RADIO && d > 0.001) {
              const q = 1 - d / RADIO;
              const fuerza = q * q * (3 - 2 * q) * MAX_DESPLAZA;
              tx = (dx / d) * fuerza;
              ty = (dy / d) * fuerza;
            }
          }
          vx[f] += ((tx - ox[f]) * 60 - vx[f] * 15) * dt;
          vy[f] += ((ty - oy[f]) * 60 - vy[f] * 15) * dt;
          ox[f] += vx[f] * dt;
          oy[f] += vy[f] * dt;
          const m = Math.hypot(ox[f], oy[f]);
          if (m > MAX_DESPLAZA) {
            ox[f] *= MAX_DESPLAZA / m;
            oy[f] *= MAX_DESPLAZA / m;
          }
        }
        const px = ox[f];
        const py = oy[f];
        if (mx < -80 || mx > w + 80 || my < -80 || my > h + 80) continue;
        trazarTriangulo(ax + px, ay + py, bx + px, by + py, cx + px, cy + py);
        ctx.fillStyle = fr.relleno;
        ctx.fill();
        if (fr.tinte) {
          ctx.fillStyle = fr.tinte;
          ctx.fill();
        }
        ctx.strokeStyle = fr.trazo;
        ctx.stroke();
      }
    };

    const quieto = () => reducir.matches;

    const paso = (t: number) => {
      raf = 0;
      if (!visible || document.hidden || quieto()) return;
      const activo = cursor.dentro || t - ultimoCursor < 1800;
      // Sin cursor la deriva es tan lenta que 25 cuadros por segundo bastan
      const intervalo = activo ? 14 : 38;
      if (ultimo && t - ultimo < intervalo) {
        raf = requestAnimationFrame(paso);
        return;
      }
      const dt = ultimo ? Math.min(0.04, (t - ultimo) / 1000) : 0.016;
      ultimo = t;
      reloj += dt;
      calcular(reloj);
      dibujar(dt, fino.matches);
      raf = requestAnimationFrame(paso);
    };
    const seguir = () => {
      if (raf || !visible || document.hidden || quieto()) return;
      ultimo = 0;
      raf = requestAnimationFrame(paso);
    };
    const parar = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const ajustar = () => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      w = rect.width;
      h = rect.height;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      calcular(reloj);
      dibujar(0.016, false);
    };

    ajustar();
    seguir();

    const ro = new ResizeObserver(() => ajustar());
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) seguir();
      else parar();
    });
    io.observe(canvas);
    const alVisibilidad = () => (document.hidden ? parar() : seguir());
    const alMover = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || !fino.matches || quieto()) return;
      cursor.x = e.clientX;
      cursor.y = e.clientY;
      cursor.dentro = true;
      ultimoCursor = performance.now();
      seguir();
    };
    const alSalir = () => {
      cursor.dentro = false;
    };
    const alReducir = () => {
      if (quieto()) {
        parar();
        reloj = 0;
        ox.fill(0);
        oy.fill(0);
        calcular(0);
        dibujar(0.016, false);
      } else seguir();
    };
    document.addEventListener("visibilitychange", alVisibilidad);
    window.addEventListener("pointermove", alMover, { passive: true });
    document.documentElement.addEventListener("pointerleave", alSalir);
    window.addEventListener("blur", alSalir);
    reducir.addEventListener("change", alReducir);
    return () => {
      parar();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", alVisibilidad);
      window.removeEventListener("pointermove", alMover);
      document.documentElement.removeEventListener("pointerleave", alSalir);
      window.removeEventListener("blur", alSalir);
      reducir.removeEventListener("change", alReducir);
    };
  }, []);

  return <canvas ref={ref} className="acc__fondo" aria-hidden="true" />;
}
