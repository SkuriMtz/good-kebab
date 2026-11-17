"use client";

import { useEffect, useRef } from "react";
import { COLORES } from "@/components/Logo";

/* =====================================================================
   Fondo de las páginas de acceso (entrar, crear cuenta, 404 y 500).
   Cuatro listones grandes y curvos que cruzan la pantalla, hechos de
   fragmentos que nadan como una escuela de peces: cada fragmento es un
   triángulo irregular que apunta hacia donde va, avanza a lo largo de su
   liston (≈1000 en total), mueve la cola y toda la escuela ondula.
   - Tonos azul marino e índigo muy oscuros; unos pocos fragmentos llevan
     los colores de los agentes (COLORES de Logo) con opacidad muy baja.
     Brillo bajo, sin bloom: el texto de la tarjeta siempre se lee.
   - Con el cursor, los peces a menos de 130 px se apartan un poco
     (máximo 16 px), giran y regresan a la escuela con un resorte suave.
     En celular (sin cursor) solo nadan.
   - "Reducir movimiento": se pinta una vez, quieto. Pausa con la pestaña
     oculta o fuera de la vista; DPR máximo de 2; menos peces en pantallas
     chicas.
   ===================================================================== */

type Punto = [number, number];
type Liston = {
  /** Curva de Bézier cúbica en coordenadas de 0 a 1 de la pantalla (los extremos, fuera de la vista). */
  p: [Punto, Punto, Punto, Punto];
  /** Ancho total como fracción de la diagonal de la pantalla. */
  ancho: number;
  /** Tono base (HSL) de su escuela. */
  tono: number;
  /** Cuántos peces lleva. */
  peces: number;
  /** Fracción del liston que avanza la escuela por segundo (negativo: nada al revés). */
  vel: number;
  /** Fase y rapidez de la deriva (rad/s) de cada punto de control. */
  deriva: { fase: number; vel: number; amp: number }[];
};

const LISTONES: Liston[] = [
  {
    p: [[-0.2, 0.98], [0.3, 0.5], [0.62, 0.98], [1.2, 0.34]],
    ancho: 0.15,
    tono: 232,
    peces: 340,
    vel: 0.011,
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
    peces: 280,
    vel: -0.012,
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
    peces: 220,
    vel: 0.013,
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
    peces: 160,
    vel: -0.016,
    deriva: [
      { fase: 4.4, vel: 0.05, amp: 0.02 },
      { fase: 2.1, vel: 0.04, amp: 0.03 },
      { fase: 0.6, vel: 0.055, amp: 0.02 },
      { fase: 3.0, vel: 0.045, amp: 0.02 },
    ],
  },
];

/** Puntos de la curva que se calculan por cuadro; cada pez interpola entre dos. */
const MUESTRAS = 96;
const RADIO = 130;
const MAX_DESPLAZA = 16;

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

type Pez = {
  l: number;
  /** Lugar a lo largo del liston (0 a 1) y su rapidez (fracción por segundo). */
  t: number;
  vel: number;
  /** Lugar a lo ancho del liston (-1 a 1). */
  s: number;
  fase: number;
  largo: number;
  ancho: number;
  /** Irregularidad de la punta y de cada lado de la cola: así se leen como fragmentos. */
  punta: number;
  ladoA: number;
  ladoB: number;
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

    // ---- La escuela: se arma una vez ----
    const r = azar(7);
    const ondas = LISTONES.map(() => r() * 6.28);
    const porListon = LISTONES.map((liston, li) =>
      Array.from({ length: liston.peces }, (): Pez => {
        // Más peces hacia el centro del liston que en las orillas
        const s = Math.max(-1, Math.min(1, (r() + r() + r()) / 1.5 - 1));
        const largo = 8 + r() * 11;
        const tinta = r() < 0.09;
        const color = COLORES[Math.floor(r() * COLORES.length)];
        const L = 14 + 12 * r() + 6 * (1 - Math.abs(s));
        const H = liston.tono + (r() - 0.5) * 18;
        const S = 52 + r() * 18;
        return {
          l: li,
          t: r(),
          vel: liston.vel * (0.9 + r() * 0.2),
          s,
          fase: r() * 6.28,
          largo,
          ancho: largo * (0.32 + r() * 0.28),
          punta: 0.8 + r() * 0.4,
          ladoA: 0.6 + r() * 0.6,
          ladoB: 0.6 + r() * 0.6,
          relleno: `hsla(${H.toFixed(0)},${S.toFixed(0)}%,${L.toFixed(1)}%,0.92)`,
          trazo: tinta ? hexARgba(color, 0.22) : `rgba(150,170,255,${(0.06 + r() * 0.08).toFixed(3)})`,
          tinte: tinta ? hexARgba(color, 0.1 + r() * 0.08) : "",
        };
      }),
    );
    // Intercalados por liston: en pantallas chicas se pintan los primeros y siguen estando los cuatro listones
    const peces: Pez[] = [];
    const mayor = Math.max(...porListon.map((p) => p.length));
    for (let k = 0; k < mayor; k++) for (const lista of porListon) if (k < lista.length) peces.push(lista[k]);
    canvas.dataset.fragmentos = String(peces.length);

    const n = peces.length;
    // Resorte del cursor, dónde estaba cada pez y hacia dónde apunta
    const ox = new Float32Array(n);
    const oy = new Float32Array(n);
    const vx = new Float32Array(n);
    const vy = new Float32Array(n);
    const antX = new Float32Array(n);
    const antY = new Float32Array(n);
    const hx = new Float32Array(n);
    const hy = new Float32Array(n);
    let conRumbo = false;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let escala = 1;
    let cuantos = n;
    let raf = 0;
    let visible = true;
    let ultimo = 0;
    let reloj = 0;
    let ultimoCursor = -1e9;
    const cursor = { x: -9999, y: -9999, dentro: false };

    /** Por liston y por muestra: x, y, tangente (tx, ty) y medio ancho. */
    const curvas = LISTONES.map(() => new Float32Array((MUESTRAS + 1) * 5));

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
        const curva = curvas[li];
        for (let i = 0; i <= MUESTRAS; i++) {
          const t = i / MUESTRAS;
          const u = 1 - t;
          const x = u * u * u * c[0][0] + 3 * u * u * t * c[1][0] + 3 * u * t * t * c[2][0] + t * t * t * c[3][0];
          const y = u * u * u * c[0][1] + 3 * u * u * t * c[1][1] + 3 * u * t * t * c[2][1] + t * t * t * c[3][1];
          const dx = 3 * u * u * (c[1][0] - c[0][0]) + 6 * u * t * (c[2][0] - c[1][0]) + 3 * t * t * (c[3][0] - c[2][0]);
          const dy = 3 * u * u * (c[1][1] - c[0][1]) + 6 * u * t * (c[2][1] - c[1][1]) + 3 * t * t * (c[3][1] - c[2][1]);
          const len = Math.hypot(dx, dy) || 1;
          const ddx = 6 * u * (c[2][0] - 2 * c[1][0] + c[0][0]) + 6 * t * (c[3][0] - 2 * c[2][0] + c[1][0]);
          const ddy = 6 * u * (c[2][1] - 2 * c[1][1] + c[0][1]) + 6 * t * (c[3][1] - 2 * c[2][1] + c[1][1]);
          const curvatura = Math.abs(dx * ddy - dy * ddx) / (len * len * len);
          // Más ancho al centro, más fino hacia los extremos y en las vueltas cerradas
          const ideal = liston.ancho * diag * 0.5 * (0.4 + 0.6 * Math.pow(Math.sin(Math.PI * t), 0.7)) * (1 + 0.18 * Math.sin(t * 5 + ondas[li]));
          const k = i * 5;
          curva[k] = x;
          curva[k + 1] = y;
          curva[k + 2] = dx / len;
          curva[k + 3] = dy / len;
          curva[k + 4] = ideal / (1 + 1.4 * ideal * curvatura);
        }
      });
    };

    const tmp = new Float32Array(4);

    /** Dónde va cada pez en este cuadro (sin el empujón del cursor) y la dirección del liston ahí. */
    const lugar = (p: Pez, tiempo: number) => {
      const curva = curvas[p.l];
      const pos = Math.min(MUESTRAS - 1e-6, Math.max(0, p.t * MUESTRAS));
      const i = Math.floor(pos);
      const f = pos - i;
      const a = i * 5;
      const b = a + 5;
      const x = curva[a] + (curva[b] - curva[a]) * f;
      const y = curva[a + 1] + (curva[b + 1] - curva[a + 1]) * f;
      const tx = curva[a + 2] + (curva[b + 2] - curva[a + 2]) * f;
      const ty = curva[a + 3] + (curva[b + 3] - curva[a + 3]) * f;
      const medio = curva[a + 4] + (curva[b + 4] - curva[a + 4]) * f;
      // La escuela entera ondula de lado a lado, y cada pez se mece un poquito
      const lado = (p.s * 0.85 + 0.22 * Math.sin(p.t * 7 - tiempo * 0.45 + ondas[p.l]) + 0.07 * Math.sin(tiempo * 0.9 + p.fase)) * medio;
      tmp[0] = x - ty * lado;
      tmp[1] = y + tx * lado;
      tmp[2] = tx;
      tmp[3] = ty;
    };

    const dibujar = (dt: number, tiempo: number, conCursor: boolean, nadando: boolean) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      ctx.lineJoin = "round";
      for (let f = 0; f < cuantos; f++) {
        const p = peces[f];
        if (nadando) {
          p.t += p.vel * dt;
          if (p.t >= 1) p.t -= 1;
          else if (p.t < 0) p.t += 1;
        }
        lugar(p, tiempo);
        const bx = tmp[0];
        const by = tmp[1];
        const sentido = p.vel < 0 ? -1 : 1;

        if (conCursor) {
          // Resorte suave: se aparta del cursor y regresa a la escuela sin rebotar
          let ex = 0;
          let ey = 0;
          if (cursor.dentro) {
            const dx = bx + ox[f] - cursor.x;
            const dy = by + oy[f] - cursor.y;
            const d = Math.hypot(dx, dy);
            if (d < RADIO && d > 0.001) {
              const q = 1 - d / RADIO;
              const fuerza = q * q * (3 - 2 * q) * MAX_DESPLAZA;
              ex = (dx / d) * fuerza;
              ey = (dy / d) * fuerza;
            }
          }
          vx[f] += ((ex - ox[f]) * 40 - vx[f] * 12) * dt;
          vy[f] += ((ey - oy[f]) * 40 - vy[f] * 12) * dt;
          ox[f] += vx[f] * dt;
          oy[f] += vy[f] * dt;
          const m = Math.hypot(ox[f], oy[f]);
          if (m > MAX_DESPLAZA) {
            ox[f] *= MAX_DESPLAZA / m;
            oy[f] *= MAX_DESPLAZA / m;
          }
        }
        const x = bx + ox[f];
        const y = by + oy[f];

        // Apunta hacia donde se movió (gira poco a poco); si saltó o está quieto, hacia donde va el liston
        let dirX = tmp[2] * sentido;
        let dirY = tmp[3] * sentido;
        if (conRumbo) {
          const mx = x - antX[f];
          const my = y - antY[f];
          const m = Math.hypot(mx, my);
          if (m > 60) {
            hx[f] = dirX;
            hy[f] = dirY;
          } else if (m > 0.02) {
            const nx = hx[f] * 0.88 + (mx / m) * 0.12;
            const ny = hy[f] * 0.88 + (my / m) * 0.12;
            const nm = Math.hypot(nx, ny) || 1;
            hx[f] = nx / nm;
            hy[f] = ny / nm;
          }
          dirX = hx[f];
          dirY = hy[f];
        } else {
          hx[f] = dirX;
          hy[f] = dirY;
        }
        antX[f] = x;
        antY[f] = y;

        if (x < -40 || x > w + 40 || y < -40 || y > h + 40) continue;
        const L = p.largo * escala;
        const W = p.ancho * escala;
        const nx = -dirY;
        const ny = dirX;
        // La cola se mueve de lado a lado al nadar
        const cola = nadando ? Math.sin(tiempo * 5 + p.fase) * W * 0.28 : 0;
        const cx = x - dirX * L * 0.45;
        const cy = y - dirY * L * 0.45;
        ctx.beginPath();
        ctx.moveTo(x + dirX * L * 0.55 * p.punta, y + dirY * L * 0.55 * p.punta);
        ctx.lineTo(cx + nx * (W * 0.5 * p.ladoA + cola), cy + ny * (W * 0.5 * p.ladoA + cola));
        ctx.lineTo(cx - nx * (W * 0.5 * p.ladoB - cola), cy - ny * (W * 0.5 * p.ladoB - cola));
        ctx.closePath();
        ctx.fillStyle = p.relleno;
        ctx.fill();
        if (p.tinte) {
          ctx.fillStyle = p.tinte;
          ctx.fill();
        }
        ctx.strokeStyle = p.trazo;
        ctx.stroke();
      }
      conRumbo = nadando;
    };

    const quieto = () => reducir.matches;

    const paso = (t: number) => {
      raf = 0;
      if (!visible || document.hidden || quieto()) return;
      const activo = cursor.dentro || t - ultimoCursor < 1800;
      // Nadan despacio: sin cursor bastan ~30 cuadros por segundo
      const intervalo = activo ? 14 : 30;
      if (ultimo && t - ultimo < intervalo) {
        raf = requestAnimationFrame(paso);
        return;
      }
      const dt = ultimo ? Math.min(0.05, (t - ultimo) / 1000) : 0.016;
      ultimo = t;
      reloj += dt;
      calcular(reloj);
      dibujar(dt, reloj, fino.matches, true);
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
      escala = Math.min(1.15, Math.max(0.75, Math.hypot(w, h) / 1600));
      cuantos = Math.round(n * Math.min(1, Math.max(0.4, (w * h) / (1440 * 900))));
      calcular(reloj);
      dibujar(0, reloj, false, false);
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
        ox.fill(0);
        oy.fill(0);
        calcular(reloj);
        dibujar(0, reloj, false, false);
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
