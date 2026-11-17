"use client";

import { useEffect, useRef } from "react";

/* =====================================================================
   Fondo de las páginas de acceso (entrar, crear cuenta, 404 y 500).
   Un mapa topográfico hecho de fragmentos: sobre las curvas de nivel de un
   terreno de ruido fractal van fragmentos sueltos (triángulos huecos como
   los del inicio, con un relleno muy tenue).
   - El mapa no cambia: los fragmentos se arman una vez y nunca aparecen
     ni desaparecen. Cada uno solo se mece un poquito en su lugar.
   - Color por altura: lo bajo en el violeta de Atendel, lo alto en arena.
   - Con el cursor, los fragmentos cercanos se hacen a un lado unos pocos
     píxeles (entra y sale suave). En celular solo se mecen.
   - Abajo se desvanece para que el pie se lea siempre.
   - "Reducir movimiento": se pinta una vez, quieto. Pausa con la pestaña
     oculta o fuera de la vista; DPR máximo de 2; ~30 cuadros por segundo.
   ===================================================================== */

/** Tamaño de la celda de la rejilla (px): más chica = curvas más finas, más trabajo. */
const CELDA = 15;
/** Cuántas curvas de nivel. */
const NIVELES = 13;
/** Tamaño de los "continentes" del terreno (px). */
const ESCALA = 430;
const RADIO = 120;
/** Lo más que el cursor aparta un fragmento (px). */
const EMPUJE = 3.5;
/** Lo que se mece cada fragmento en su lugar (px). */
const MECE = 1.1;

// ---- Ruido de valor con interpolación suave (repetible: el mismo terreno cada visita) ----
const PERM = (() => {
  const p = Array.from({ length: 256 }, (_, i) => i);
  let a = 4;
  for (let i = 255; i > 0; i--) {
    a = (a * 1664525 + 1013904223) >>> 0;
    const j = a % (i + 1);
    [p[i], p[j]] = [p[j], p[i]];
  }
  const t = new Uint8Array(512);
  for (let i = 0; i < 512; i++) t[i] = p[i & 255];
  return t;
})();
const VAL = (() => {
  const v = new Float32Array(256);
  let a = 9;
  for (let i = 0; i < 256; i++) {
    a = (a * 1664525 + 1013904223) >>> 0;
    v[i] = a / 4294967296;
  }
  return v;
})();

function ruido(x: number, y: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = x - xi;
  const fy = y - yi;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const X = xi & 255;
  const Y = yi & 255;
  const a = VAL[PERM[PERM[X] + Y]];
  const b = VAL[PERM[PERM[X + 1] + Y]];
  const c = VAL[PERM[PERM[X] + Y + 1]];
  const d = VAL[PERM[PERM[X + 1] + Y + 1]];
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function fractal(x: number, y: number, octavas: number) {
  let suma = 0;
  let amp = 0.5;
  let total = 0;
  for (let o = 0; o < octavas; o++) {
    suma += ruido(x, y) * amp;
    total += amp;
    x = x * 2.03 + 17.1;
    y = y * 2.03 + 3.7;
    amp *= 0.5;
  }
  return suma / total;
}

/** Color de cada curva: de violeta (bajo) a arena (alto), más visible hacia arriba. */
const colorNivel = (k: number, alfa: number) => {
  const t = k / (NIVELES - 1);
  const de = [122, 104, 255];
  const a = [222, 196, 160];
  const m = (i: number) => Math.round(de[i] + (a[i] - de[i]) * Math.pow(t, 0.85));
  return `rgba(${m(0)},${m(1)},${m(2)},${alfa.toFixed(3)})`;
};
const COLORES_NIVEL = Array.from({ length: NIVELES }, (_, k) => colorNivel(k, 0.38 + 0.5 * (k / (NIVELES - 1))));
const RELLENOS_NIVEL = Array.from({ length: NIVELES }, (_, k) => colorNivel(k, 0.06 + 0.1 * (k / (NIVELES - 1))));

type Frag = { x: number; y: number; ang: number; r0: number; r1: number; r2: number; a1: number; a2: number; fase: number };

export function FondoTopografico() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reducir = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fino = window.matchMedia("(hover: hover) and (pointer: fine)");

    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let visible = true;
    let ultimo = 0;
    let reloj = 0;
    /** Los fragmentos de cada curva de nivel. Se arman una vez por tamaño de pantalla: nunca aparecen ni desaparecen. */
    let porNivel: Frag[][] = [];
    // Cursor suavizado: su lugar y su fuerza (0 a 1) entran y salen despacio
    const cursor = { x: -9999, y: -9999, dentro: false, sx: -9999, sy: -9999, fuerza: 0 };

    /** El terreno (quieto) y, sobre sus curvas de nivel, los fragmentos. */
    const construir = () => {
      const cols = Math.ceil(w / CELDA) + 1;
      const filas = Math.ceil(h / CELDA) + 1;
      const fila = cols + 1;
      const alt = new Float32Array(fila * (filas + 1));
      for (let j = 0; j <= filas; j++) {
        for (let i = 0; i <= cols; i++) {
          const nx = (i * CELDA) / ESCALA;
          const ny = (j * CELDA) / ESCALA;
          const v = fractal(nx, ny, 5) * 0.72 + fractal(nx * 1.6 + 5.2, ny * 1.6 + 9.1, 3) * 0.28;
          // Más contraste: anillos apretados en los picos, como en un mapa
          alt[j * fila + i] = (v - 0.5) * 1.9 + 0.5;
        }
      }
      porNivel = Array.from({ length: NIVELES }, () => []);
      for (let lv = 0; lv < NIVELES; lv++) {
        const L = (lv + 0.5) / NIVELES;
        const t = lv / (NIVELES - 1);
        const lista = porNivel[lv];
        const poner = (ax: number, ay: number, bx: number, by: number, s: number) => {
          // Uno de cada cinco tramos queda vacío: se leen como fragmentos, no como línea
          if (s % 5 === 0) return;
          const r = (3 + t * 1.6) * (0.8 + ((s >> 3) & 3) * 0.12);
          lista.push({
            x: (ax + bx) / 2,
            y: (ay + by) / 2,
            ang: Math.atan2(by - ay, bx - ax) + ((s >> 9) & 63) * 0.1,
            r0: r,
            r1: r * (0.8 + ((s >> 21) & 3) * 0.1),
            r2: r * (0.8 + ((s >> 23) & 3) * 0.1),
            a1: 2.094 + (((s >> 15) & 7) - 3.5) * 0.08,
            a2: 4.189 + (((s >> 18) & 7) - 3.5) * 0.08,
            fase: ((s >> 5) & 255) * 0.0246,
          });
        };
        for (let j = 0; j < filas; j++) {
          for (let i = 0; i < cols; i++) {
            const k = j * fila + i;
            const a = alt[k];
            const b = alt[k + 1];
            const c = alt[k + fila + 1];
            const d = alt[k + fila];
            const caso = (a > L ? 8 : 0) | (b > L ? 4 : 0) | (c > L ? 2 : 0) | (d > L ? 1 : 0);
            if (caso === 0 || caso === 15) continue;
            const x = i * CELDA;
            const y = j * CELDA;
            // Cruces en cada borde de la celda (arriba, derecha, abajo, izquierda)
            const ar = [x + ((L - a) / (b - a)) * CELDA, y] as const;
            const de = [x + CELDA, y + ((L - b) / (c - b)) * CELDA] as const;
            const ab = [x + ((L - d) / (c - d)) * CELDA, y + CELDA] as const;
            const iz = [x, y + ((L - a) / (d - a)) * CELDA] as const;
            const s = ((i * 73856093) ^ (j * 19349663) ^ (lv * 83492791)) >>> 0;
            const tramo = (p: readonly [number, number], q: readonly [number, number], sem: number) => poner(p[0], p[1], q[0], q[1], sem);
            switch (caso) {
              case 1:
              case 14:
                tramo(iz, ab, s);
                break;
              case 2:
              case 13:
                tramo(ab, de, s);
                break;
              case 3:
              case 12:
                tramo(iz, de, s);
                break;
              case 4:
              case 11:
                tramo(ar, de, s);
                break;
              case 6:
              case 9:
                tramo(ar, ab, s);
                break;
              case 7:
              case 8:
                tramo(iz, ar, s);
                break;
              case 5:
              case 10: {
                // Silla: el centro decide cómo se unen
                if ((caso === 5) === (a + b + c + d) / 4 > L) {
                  tramo(iz, ar, s);
                  tramo(ab, de, s >>> 3);
                } else {
                  tramo(ar, de, s);
                  tramo(iz, ab, s >>> 3);
                }
                break;
              }
            }
          }
        }
      }
      canvas.dataset.fragmentos = String(porNivel.reduce((n, l) => n + l.length, 0));
    };

    const dibujar = (tiempo: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      ctx.lineJoin = "round";
      const c = cursor;
      const conCursor = c.fuerza > 0.002;
      for (let lv = 0; lv < NIVELES; lv++) {
        ctx.beginPath();
        for (const f of porNivel[lv]) {
          // Se mece apenas en su lugar (un píxel y poco) y casi no gira
          let x = f.x + MECE * Math.sin(tiempo * 0.5 + f.fase);
          let y = f.y + MECE * Math.cos(tiempo * 0.41 + f.fase * 1.3);
          const ang = f.ang + 0.1 * Math.sin(tiempo * 0.3 + f.fase);
          if (conCursor) {
            const dx = x - c.sx;
            const dy = y - c.sy;
            const dd = Math.hypot(dx, dy);
            if (dd < RADIO && dd > 0.01) {
              const q = 1 - dd / RADIO;
              const e = q * q * EMPUJE * c.fuerza;
              x += (dx / dd) * e;
              y += (dy / dd) * e;
            }
          }
          ctx.moveTo(x + Math.cos(ang) * f.r0, y + Math.sin(ang) * f.r0);
          ctx.lineTo(x + Math.cos(ang + f.a1) * f.r1, y + Math.sin(ang + f.a1) * f.r1);
          ctx.lineTo(x + Math.cos(ang + f.a2) * f.r2, y + Math.sin(ang + f.a2) * f.r2);
          ctx.closePath();
        }
        // Relleno muy tenue y contorno: triángulos huecos, como los fragmentos del inicio
        ctx.fillStyle = RELLENOS_NIVEL[lv];
        ctx.fill();
        ctx.strokeStyle = COLORES_NIVEL[lv];
        ctx.stroke();
      }
      // Abajo se desvanece: el pie (textos chicos) siempre se lee
      const alto = Math.min(190, h * 0.24);
      const g = ctx.createLinearGradient(0, h - alto, 0, h);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(1, "rgba(0,0,0,0.92)");
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = g;
      ctx.fillRect(0, h - alto, w, alto);
      ctx.globalCompositeOperation = "source-over";
    };

    const quieto = () => reducir.matches;

    const paso = (t: number) => {
      raf = 0;
      if (!visible || document.hidden || quieto()) return;
      if (ultimo && t - ultimo < 32) {
        raf = requestAnimationFrame(paso);
        return;
      }
      const dt = ultimo ? Math.min(0.06, (t - ultimo) / 1000) : 0.033;
      ultimo = t;
      reloj += dt;
      const c = cursor;
      const meta = c.dentro && fino.matches ? 1 : 0;
      c.fuerza += (meta - c.fuerza) * Math.min(1, dt * 2);
      if (c.sx < -9000) {
        c.sx = c.x;
        c.sy = c.y;
      }
      c.sx += (c.x - c.sx) * Math.min(1, dt * 4);
      c.sy += (c.y - c.sy) * Math.min(1, dt * 4);
      dibujar(reloj);
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
      construir();
      dibujar(reloj);
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
    };
    const alSalir = () => {
      cursor.dentro = false;
    };
    const alReducir = () => {
      if (quieto()) {
        parar();
        cursor.fuerza = 0;
        dibujar(reloj);
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
