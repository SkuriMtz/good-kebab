"use client";

import { useEffect, useRef, type RefObject } from "react";
import { ajustarCanvas, bucleVisible, clamp01, triangulo } from "./particles/draw";
import { colorCss, EVENTO_TEMA } from "@/lib/tema";

const ALTO = 280; // alto de la franja de abajo donde se dibujan los fragmentos
const CERCA = 180; // a esta distancia (px) del dock los fragmentos empiezan a juntarse
const PASO = 5.5; // un fragmento cada tantos px de contorno
const ALFAS = [0.3, 0.6, 0.95];

type Caja = { x: number; y: number; w: number; h: number };

/** Punto a la distancia u (0 a 1) del contorno de una caja, en el sentido del reloj. */
function enContorno(c: Caja, u: number): [number, number] {
  const p = u * 2 * (c.w + c.h);
  if (p < c.w) return [c.x + p, c.y];
  if (p < c.w + c.h) return [c.x + c.w, c.y + (p - c.w)];
  if (p < 2 * c.w + c.h) return [c.x + c.w - (p - c.w - c.h), c.y + c.h];
  return [c.x, c.y + c.h - (p - 2 * c.w - c.h)];
}

/** Distancia de un punto a una caja (0 si está adentro). */
function distancia(x: number, y: number, c: Caja) {
  const dx = Math.max(c.x - x, 0, x - (c.x + c.w));
  const dy = Math.max(c.y - y, 0, y - (c.y + c.h));
  return Math.hypot(dx, dy);
}

/**
 * Los bordes del dock hechos de fragmentos (triángulos, como la portada).
 * Lejos del cursor flotan sueltos alrededor del dock; al acercarlo se juntan
 * y forman el panel y cada botón. Le pasa al panel `--unido` (0 a 1) para
 * que el fondo y los íconos aparezcan al mismo ritmo.
 * En pantallas táctiles (sin cursor) y con "reducir movimiento" se quedan unidos.
 */
export function DockFragmentos({ panelRef }: { panelRef: RefObject<HTMLDivElement | null> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const panel = panelRef.current;
    if (!canvas || !ctx || !panel) return;

    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const conCursor = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    let tinta = colorCss("var(--color-bone-white)");
    let rojo = colorCss("var(--color-signal)");

    let { w, h } = ajustarCanvas(canvas, ctx);
    const puntero = { x: -9999, y: -9999 };
    let enfocado = false;
    // Al cargar, los fragmentos llegan y se juntan una vez (también en celular)
    let unido = 0;
    const t0 = performance.now();
    let anterior = t0;

    // Partículas: a qué caja pertenecen (0 = panel, 1.. = botones) y en qué punto del contorno
    let n = 0;
    let firma = "";
    let caja = new Uint8Array(0);
    let u = new Float32Array(0);
    let sx = new Float32Array(0); // desvío cuando están sueltas
    let sy = new Float32Array(0);
    let fase = new Float32Array(0);
    let tam = new Float32Array(0);
    let giro = new Float32Array(0);
    let vel = new Float32Array(0);
    let esRojo = new Uint8Array(0);
    let nivel = new Uint8Array(0);

    const medir = (): Caja[] => {
      const c = canvas.getBoundingClientRect();
      const a = (r: DOMRect): Caja => ({ x: r.left - c.left, y: r.top - c.top, w: r.width, h: r.height });
      return [a(panel.getBoundingClientRect()), ...Array.from(panel.querySelectorAll(".dock-item")).map((el) => a(el.getBoundingClientRect()))];
    };

    // Reparte los fragmentos en los contornos (otra vez si cambia el número de botones)
    const preparar = (cajas: Caja[]) => {
      const perimetros = cajas.map((c) => 2 * (c.w + c.h));
      n = Math.round(perimetros.reduce((s, p) => s + p, 0) / PASO);
      firma = `${cajas.length}`;
      caja = new Uint8Array(n);
      u = new Float32Array(n);
      sx = new Float32Array(n);
      sy = new Float32Array(n);
      fase = new Float32Array(n);
      tam = new Float32Array(n);
      giro = new Float32Array(n);
      vel = new Float32Array(n);
      esRojo = new Uint8Array(n);
      nivel = new Uint8Array(n);
      let i = 0;
      cajas.forEach((_, k) => {
        const cuantos = k === cajas.length - 1 ? n - i : Math.round(perimetros[k] / PASO);
        for (let j = 0; j < cuantos && i < n; j++, i++) {
          caja[i] = k;
          u[i] = (j + Math.random() * 0.6) / cuantos;
          const ang = Math.random() * Math.PI * 2;
          const r = 16 + Math.random() * 56;
          sx[i] = Math.cos(ang) * r * 1.6;
          sy[i] = Math.sin(ang) * r * 0.5 - 6;
          fase[i] = Math.random() * Math.PI * 2;
          tam[i] = 1.6 + Math.random() * 1.6;
          giro[i] = Math.random() * Math.PI * 2;
          vel[i] = (Math.random() - 0.5) * 1.6;
          esRojo[i] = Math.random() < 0.03 ? 1 : 0;
          nivel[i] = Math.floor(Math.random() * ALFAS.length);
        }
      });
    };

    let ultimoUnido = -1;
    const dibujar = (ahora: number) => {
      const dt = Math.min(64, ahora - anterior) / 1000;
      anterior = ahora;
      const t = (ahora - t0) / 1000;
      const cajas = medir();
      if (`${cajas.length}` !== firma) preparar(cajas);

      // ¿Qué tan unidos? Cerca del cursor (o con foco de teclado) se juntan
      let meta = 1;
      if (conCursor && !quieto) {
        const llegada = clamp01((t - 0.4) / 1.2); // la primera vez se juntan y luego se sueltan
        const cerca = enfocado ? 1 : clamp01(1 - distancia(puntero.x, puntero.y, cajas[0]) / CERCA);
        meta = t < 2.6 ? llegada : cerca;
      } else if (!quieto) {
        meta = clamp01((t - 0.3) / 1.2);
      }
      unido = quieto ? 1 : unido + (meta - unido) * Math.min(1, dt * 7);
      if (Math.abs(unido - ultimoUnido) > 0.003) {
        panel.style.setProperty("--unido", unido.toFixed(3));
        ultimoUnido = unido;
      }

      // Suelto: cada fragmento se aleja de su lugar y flota; unido: se queda en el contorno
      const suelto = 1 - unido * unido * (3 - 2 * unido);
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      ctx.lineJoin = "round";
      for (let pasada = 0; pasada < 2; pasada++) {
        for (let l = 0; l < ALFAS.length; l++) {
          ctx.beginPath();
          let hay = false;
          for (let i = 0; i < n; i++) {
            if (esRojo[i] !== pasada || nivel[i] !== l) continue;
            const [x, y] = enContorno(cajas[caja[i]], u[i]);
            const flota = Math.sin(t * 0.7 + fase[i]) * 6;
            const px = x + (sx[i] + flota) * suelto;
            const py = y + (sy[i] + Math.cos(t * 0.6 + fase[i]) * 4) * suelto;
            if (!quieto) giro[i] += vel[i] * dt * (0.4 + suelto);
            hay = true;
            triangulo(ctx, px, py, tam[i] * (1 - 0.25 * unido), giro[i]);
          }
          if (!hay) continue;
          ctx.globalAlpha = ALFAS[l] * (0.55 + 0.45 * unido);
          ctx.strokeStyle = pasada ? rojo : tinta;
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    };

    const ro = new ResizeObserver(() => {
      ({ w, h } = ajustarCanvas(canvas, ctx));
      if (quieto) dibujar(performance.now());
    });
    ro.observe(canvas);
    // Los botones cambian de tamaño al acercar el cursor: con movimiento reducido se redibuja al pasar
    const ro2 = new ResizeObserver(() => quieto && dibujar(performance.now()));
    ro2.observe(panel);

    const mover = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = canvas.getBoundingClientRect();
      puntero.x = e.clientX - r.left;
      puntero.y = e.clientY - r.top;
    };
    const salir = () => {
      puntero.x = puntero.y = -9999;
    };
    const alEnfocar = () => (enfocado = true);
    const alDesenfocar = () => setTimeout(() => (enfocado = panel.contains(document.activeElement)), 0);
    const alCambiarTema = () => {
      tinta = colorCss("var(--color-bone-white)");
      rojo = colorCss("var(--color-signal)");
      if (quieto) dibujar(performance.now());
    };
    window.addEventListener("pointermove", mover, { passive: true });
    document.documentElement.addEventListener("pointerleave", salir);
    panel.addEventListener("focusin", alEnfocar);
    panel.addEventListener("focusout", alDesenfocar);
    window.addEventListener(EVENTO_TEMA, alCambiarTema);

    let detener = () => {};
    if (quieto) dibujar(performance.now());
    else detener = bucleVisible(canvas, dibujar);

    return () => {
      detener();
      ro.disconnect();
      ro2.disconnect();
      window.removeEventListener("pointermove", mover);
      document.documentElement.removeEventListener("pointerleave", salir);
      panel.removeEventListener("focusin", alEnfocar);
      panel.removeEventListener("focusout", alDesenfocar);
      window.removeEventListener(EVENTO_TEMA, alCambiarTema);
      panel.style.removeProperty("--unido");
    };
  }, [panelRef]);

  return (
    <canvas ref={canvasRef} className="dock-fragmentos" style={{ height: ALTO }} aria-hidden="true" />
  );
}
