"use client";

import { useEffect, useRef } from "react";

/* =====================================================================
   Fondo de las páginas de acceso (entrar, crear cuenta, 404 y 500).
   Un mapa topográfico hecho de fragmentos: sobre las curvas de nivel de un
   terreno de ruido fractal van fragmentos sueltos (triángulos huecos como
   los del inicio, con un relleno muy tenue), separados y girando despacio.
   - El terreno cambia de forma muy despacio: las curvas fluyen.
   - Color por altura: lo bajo en el violeta de Atendel, lo alto en arena.
   - Con el cursor el terreno se levanta un poquito (aparecen anillos
     alrededor) y las astillas cercanas se hacen a un lado unos píxeles.
     Entra y sale suave. En celular (sin cursor) solo fluye.
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
const RADIO = 150;
const EMPUJE = 7;

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
    let cols = 0;
    let filas = 0;
    let alturas = new Float32Array(0);
    let minimos = new Float32Array(0);
    let maximos = new Float32Array(0);
    let raf = 0;
    let visible = true;
    let ultimo = 0;
    let reloj = 0;
    // Cursor suavizado: su lugar y su fuerza (0 a 1) entran y salen despacio
    const cursor = { x: -9999, y: -9999, dentro: false, sx: -9999, sy: -9999, fuerza: 0 };

    const terreno = (tiempo: number) => {
      const c = cursor;
      const conBulto = c.fuerza > 0.002;
      for (let j = 0; j <= filas; j++) {
        for (let i = 0; i <= cols; i++) {
          const x = i * CELDA;
          const y = j * CELDA;
          const nx = x / ESCALA;
          const ny = y / ESCALA;
          // Dos capas que se mueven distinto: el terreno cambia de forma, no solo se desliza
          let v = fractal(nx + tiempo * 0.011, ny + tiempo * 0.004, 5) * 0.72 + fractal(nx * 1.6 - tiempo * 0.009 + 5.2, ny * 1.6 + 9.1, 3) * 0.28;
          // Más contraste: anillos apretados en los picos, como en un mapa
          v = (v - 0.5) * 1.9 + 0.5;
          if (conBulto) {
            const dx = x - c.sx;
            const dy = y - c.sy;
            v += 0.085 * c.fuerza * Math.exp(-(dx * dx + dy * dy) / (2 * 95 * 95));
          }
          alturas[j * (cols + 1) + i] = v;
        }
      }
      for (let j = 0; j < filas; j++) {
        for (let i = 0; i < cols; i++) {
          const k = j * (cols + 1) + i;
          const a = alturas[k];
          const b = alturas[k + 1];
          const cc = alturas[k + cols + 2];
          const d = alturas[k + cols + 1];
          minimos[j * cols + i] = Math.min(a, b, cc, d);
          maximos[j * cols + i] = Math.max(a, b, cc, d);
        }
      }
    };

    /** Un fragmento en medio del tramo (ax, ay) → (bx, by): triángulo irregular que gira despacio. */
    const astilla = (ax: number, ay: number, bx: number, by: number, semilla: number, nivel: number) => {
      // Uno de cada cinco tramos queda vacío: se leen como fragmentos, no como línea
      if (semilla % 5 === 0) return;
      let mx = (ax + bx) / 2;
      let my = (ay + by) / 2;
      const c = cursor;
      if (c.fuerza > 0.002) {
        const dx = mx - c.sx;
        const dy = my - c.sy;
        const dd = Math.hypot(dx, dy);
        if (dd < RADIO && dd > 0.01) {
          const q = 1 - dd / RADIO;
          const e = q * q * EMPUJE * c.fuerza;
          mx += (dx / dd) * e;
          my += (dy / dd) * e;
        }
      }
      const giro = (((semilla >> 5) & 15) - 7.5) * 0.06;
      const ang = Math.atan2(by - ay, bx - ax) + ((semilla >> 9) & 63) * 0.1 + reloj * giro;
      const r = (3 + nivel * 1.6) * (0.8 + ((semilla >> 3) & 3) * 0.12);
      const j1 = (((semilla >> 15) & 7) - 3.5) * 0.08;
      const j2 = (((semilla >> 18) & 7) - 3.5) * 0.08;
      const r1 = r * (0.8 + ((semilla >> 21) & 3) * 0.1);
      const r2 = r * (0.8 + ((semilla >> 23) & 3) * 0.1);
      ctx.moveTo(mx + Math.cos(ang) * r, my + Math.sin(ang) * r);
      ctx.lineTo(mx + Math.cos(ang + 2.094 + j1) * r1, my + Math.sin(ang + 2.094 + j1) * r1);
      ctx.lineTo(mx + Math.cos(ang + 4.189 + j2) * r2, my + Math.sin(ang + 4.189 + j2) * r2);
      ctx.closePath();
    };

    const dibujar = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      ctx.lineJoin = "round";
      const fila = cols + 1;
      for (let lv = 0; lv < NIVELES; lv++) {
        const L = (lv + 0.5) / NIVELES;
        ctx.beginPath();
        for (let j = 0; j < filas; j++) {
          for (let i = 0; i < cols; i++) {
            const ci = j * cols + i;
            if (minimos[ci] > L || maximos[ci] <= L) continue;
            const k = j * fila + i;
            const a = alturas[k];
            const b = alturas[k + 1];
            const c = alturas[k + fila + 1];
            const d = alturas[k + fila];
            const caso = (a > L ? 8 : 0) | (b > L ? 4 : 0) | (c > L ? 2 : 0) | (d > L ? 1 : 0);
            if (caso === 0 || caso === 15) continue;
            const x = i * CELDA;
            const y = j * CELDA;
            // Cruces en cada borde de la celda (arriba, derecha, abajo, izquierda)
            const arriba = () => [x + ((L - a) / (b - a)) * CELDA, y] as const;
            const derecha = () => [x + CELDA, y + ((L - b) / (c - b)) * CELDA] as const;
            const abajo = () => [x + ((L - d) / (c - d)) * CELDA, y + CELDA] as const;
            const izquierda = () => [x, y + ((L - a) / (d - a)) * CELDA] as const;
            const semilla = ((i * 73856093) ^ (j * 19349663) ^ (lv * 83492791)) >>> 0;
            const tramo = (p: readonly [number, number], q: readonly [number, number], s: number) => astilla(p[0], p[1], q[0], q[1], s, L);
            switch (caso) {
              case 1:
              case 14:
                tramo(izquierda(), abajo(), semilla);
                break;
              case 2:
              case 13:
                tramo(abajo(), derecha(), semilla);
                break;
              case 3:
              case 12:
                tramo(izquierda(), derecha(), semilla);
                break;
              case 4:
              case 11:
                tramo(arriba(), derecha(), semilla);
                break;
              case 6:
              case 9:
                tramo(arriba(), abajo(), semilla);
                break;
              case 7:
              case 8:
                tramo(izquierda(), arriba(), semilla);
                break;
              case 5:
              case 10: {
                // Silla: el centro decide cómo se unen
                const centro = (a + b + c + d) / 4 > L;
                if ((caso === 5) === centro) {
                  tramo(izquierda(), arriba(), semilla);
                  tramo(abajo(), derecha(), semilla >> 3);
                } else {
                  tramo(arriba(), derecha(), semilla);
                  tramo(izquierda(), abajo(), semilla >> 3);
                }
                break;
              }
            }
          }
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
      c.fuerza += (meta - c.fuerza) * Math.min(1, dt * 2.5);
      if (c.sx < -9000) {
        c.sx = c.x;
        c.sy = c.y;
      }
      c.sx += (c.x - c.sx) * Math.min(1, dt * 5);
      c.sy += (c.y - c.sy) * Math.min(1, dt * 5);
      terreno(reloj);
      dibujar();
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
      cols = Math.ceil(w / CELDA) + 1;
      filas = Math.ceil(h / CELDA) + 1;
      alturas = new Float32Array((cols + 1) * (filas + 1));
      minimos = new Float32Array(cols * filas);
      maximos = new Float32Array(cols * filas);
      terreno(reloj);
      dibujar();
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
        terreno(reloj);
        dibujar();
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
