"use client";

import { useEffect, useRef } from "react";
import { ajustarCanvas, bucleVisible, clamp01, easeInOutCubic, triangulo } from "./draw";
import { shapePoints, type ShapeName } from "./shapes";

type Props = {
  shape: ShapeName;
  colors: string[];
  /** Partículas girando en círculo (para estados de "procesando"). */
  busy?: boolean;
  /** Si es true, la figura se arma conforme haces scroll; si no, se arma sola al cargar. */
  scrollLinked?: boolean;
  /** Colorea de arriba (primer color) hacia abajo (último), como un degradado. */
  gradientY?: boolean;
  className?: string;
};

const TAU = Math.PI * 2;
const NIVELES = [0.5, 0.75, 1];
const DURACION_MORPH = 1300;

/**
 * Constelación de triangulitos que forman una figura (sobre, chat, gráfica…).
 * Las partículas se dispersan y se juntan con el scroll, cambian de figura
 * con una transición, giran en círculo cuando algo está cargando y se
 * apartan del cursor.
 */
export function ParticleShape({
  shape,
  colors,
  busy = false,
  scrollLinked = true,
  gradientY = false,
  className,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const api = useRef<{ figura: (s: ShapeName) => void; ocupado: (b: boolean) => void } | null>(null);
  const inicial = useRef({ shape, colors, busy, scrollLinked, gradientY });
  const figuraPrevia = useRef(shape);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const op = inicial.current;
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const conMouse = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    const ancho = canvas.clientWidth || 400;
    const n = ancho < 340 ? 230 : ancho < 480 ? 310 : 420;
    const nc = op.colors.length;

    // Datos de cada partícula
    const dispX = new Float32Array(n);
    const dispY = new Float32Array(n);
    const origX = new Float32Array(n);
    const origY = new Float32Array(n);
    const destX = new Float32Array(n);
    const destY = new Float32Array(n);
    const actX = new Float32Array(n);
    const actY = new Float32Array(n);
    const retraso = new Float32Array(n);
    const tam = new Float32Array(n);
    const giro = new Float32Array(n);
    const vel = new Float32Array(n);
    const fase = new Float32Array(n);
    const alfa = new Float32Array(n);
    const color = new Uint8Array(n);
    const px = new Float32Array(n);
    const py = new Float32Array(n);
    const nivel = new Uint8Array(n);

    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU;
      const r = 1.05 + Math.random() * 0.55;
      dispX[i] = Math.cos(a) * r;
      dispY[i] = Math.sin(a) * r;
      retraso[i] = Math.random();
      tam[i] = 1.9 + Math.random() * 2.5;
      giro[i] = Math.random() * TAU;
      vel[i] = (Math.random() - 0.5) * 0.9;
      fase[i] = Math.random() * TAU;
      alfa[i] = 0.55 + Math.random() * 0.45;
      color[i] = Math.floor(Math.random() * nc);
    }

    const colorearPorAltura = () => {
      for (let i = 0; i < n; i++) {
        const v = clamp01((destY[i] + 1) / 2 + (Math.random() - 0.5) * 0.25);
        color[i] = Math.min(nc - 1, Math.floor(v * nc));
      }
    };

    let puntos = shapePoints(op.shape, n);
    for (let i = 0; i < n; i++) {
      destX[i] = origX[i] = actX[i] = puntos[i][0];
      destY[i] = origY[i] = actY[i] = puntos[i][1];
    }
    if (op.gradientY) colorearPorAltura();

    let inicioMorph = -1;
    let armado = quieto ? 1 : 0;
    let armadoMeta = op.scrollLinked ? 0 : 1;
    let ocupado = op.busy;
    let ocupadoNivel = op.busy ? 1 : 0;
    const puntero = { x: 0, y: 0, activo: false };
    let w = 0;
    let h = 0;
    const t0 = performance.now();
    let anterior = t0;

    const dibujar = (ahora: number) => {
      const dt = Math.min(64, ahora - anterior) / 1000;
      anterior = ahora;
      const t = (ahora - t0) / 1000;

      if (quieto) {
        armado = 1;
        ocupadoNivel = ocupado ? 1 : 0;
      } else {
        if (op.scrollLinked) {
          const r = canvas.getBoundingClientRect();
          const vh = window.innerHeight;
          armadoMeta = clamp01((vh - (r.top + r.height / 2)) / (vh * 0.36));
        }
        armado += (armadoMeta - armado) * (1 - Math.exp(-dt * 3.2));
        ocupadoNivel += ((ocupado ? 1 : 0) - ocupadoNivel) * (1 - Math.exp(-dt * 3));
      }
      const ocup = easeInOutCubic(clamp01(ocupadoNivel));
      const escala = Math.min(w, h) / 2 / 1.2;
      const cx = w / 2;
      const cy = h / 2;
      const flotar = quieto ? 0 : Math.sin(t * 0.6) * 0.018;
      const progresoMorph = inicioMorph >= 0 ? (ahora - inicioMorph) / DURACION_MORPH : 2;
      const RADIO = 74;
      const RADIO2 = RADIO * RADIO;
      const tamFactor = escala < 150 ? 0.82 : 1;

      for (let i = 0; i < n; i++) {
        // 1. Transición entre figuras
        let bx = destX[i];
        let by = destY[i];
        if (progresoMorph < 2) {
          const m = easeInOutCubic(clamp01((progresoMorph - retraso[i] * 0.45) / 0.55));
          bx = origX[i] + (destX[i] - origX[i]) * m;
          by = origY[i] + (destY[i] - origY[i]) * m;
        }
        actX[i] = bx;
        actY[i] = by;

        // 2. Armado: de disperso a la figura (escalonado por partícula)
        const a = easeInOutCubic(clamp01((armado - retraso[i] * 0.3) / 0.7));
        let x = dispX[i] + (bx - dispX[i]) * a;
        let y = dispY[i] + (by - dispY[i]) * a;

        // 3. "Procesando": giran en un anillo que respira
        if (ocup > 0.001) {
          const ang = fase[i] + t * (0.7 + (i % 5) * 0.12);
          const rr = 0.5 + 0.2 * Math.sin(t * 1.4 + fase[i] * 3);
          x += (Math.cos(ang) * rr - x) * ocup;
          y += (Math.sin(ang) * rr - y) * ocup;
        }

        // 4. Vaivén sutil para que se sienta vivo
        if (!quieto) {
          x += Math.sin(t * 1.1 + fase[i]) * 0.012;
          y += Math.cos(t * 0.9 + fase[i] * 1.3) * 0.012 + flotar;
        }

        let X = cx + x * escala;
        let Y = cy + y * escala;

        // 5. Se apartan del cursor
        if (puntero.activo) {
          const dx = X - puntero.x;
          const dy = Y - puntero.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < RADIO2 && d2 > 0.5) {
            const d = Math.sqrt(d2);
            const f = 1 - d / RADIO;
            const empuje = f * f * 26;
            X += (dx / d) * empuje;
            Y += (dy / d) * empuje;
          }
        }

        px[i] = X;
        py[i] = Y;
        const al = alfa[i] * (0.22 + 0.78 * a);
        nivel[i] = al > 0.72 ? 2 : al > 0.42 ? 1 : 0;
        if (!quieto) giro[i] += vel[i] * dt;
      }
      if (progresoMorph >= 1.01) inicioMorph = -1;

      // Dibujo agrupado por color y opacidad (pocas llamadas = rápido)
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1.1;
      ctx.lineJoin = "round";
      for (let c = 0; c < nc; c++) {
        for (let l = 0; l < NIVELES.length; l++) {
          let hay = false;
          ctx.beginPath();
          for (let i = 0; i < n; i++) {
            if (color[i] !== c || nivel[i] !== l) continue;
            hay = true;
            triangulo(ctx, px[i], py[i], tam[i] * tamFactor, giro[i]);
          }
          if (!hay) continue;
          ctx.globalAlpha = NIVELES[l];
          ctx.strokeStyle = op.colors[c];
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    };

    const redimensionar = () => {
      const r = ajustarCanvas(canvas, ctx);
      w = r.w;
      h = r.h;
      dibujar(performance.now());
    };
    const ro = new ResizeObserver(redimensionar);
    ro.observe(canvas);
    redimensionar();

    const detenerBucle = quieto ? () => {} : bucleVisible(canvas, dibujar);

    const mover = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      puntero.x = e.clientX - r.left;
      puntero.y = e.clientY - r.top;
      puntero.activo = true;
    };
    const salir = () => {
      puntero.activo = false;
    };
    if (conMouse && !quieto) {
      canvas.addEventListener("pointermove", mover);
      canvas.addEventListener("pointerleave", salir);
    }

    api.current = {
      figura(s) {
        puntos = shapePoints(s, n);
        for (let i = 0; i < n; i++) {
          origX[i] = actX[i];
          origY[i] = actY[i];
          destX[i] = puntos[i][0];
          destY[i] = puntos[i][1];
        }
        if (op.gradientY) colorearPorAltura();
        inicioMorph = quieto ? -1 : performance.now();
        if (quieto) dibujar(performance.now());
      },
      ocupado(b) {
        ocupado = b;
        if (quieto) dibujar(performance.now());
      },
    };

    return () => {
      detenerBucle();
      ro.disconnect();
      canvas.removeEventListener("pointermove", mover);
      canvas.removeEventListener("pointerleave", salir);
      api.current = null;
    };
  }, []);

  useEffect(() => {
    if (figuraPrevia.current === shape) return;
    figuraPrevia.current = shape;
    api.current?.figura(shape);
  }, [shape]);

  useEffect(() => {
    api.current?.ocupado(busy);
  }, [busy]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
