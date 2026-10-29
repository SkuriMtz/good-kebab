"use client";

import { useEffect, useRef } from "react";

/**
 * La constelación de Atendel: miles de triangulitos de contorno, en los
 * colores de los cuatro agentes, que forman los cuatro círculos del logo
 * ("cuatro agentes, un solo equipo"). Alrededor flotan partículas sueltas.
 * - Se mueve muy despacio (cada triángulo gira y flota en su lugar).
 * - Se aparta un poco del cursor y regresa.
 * - Con "reducir movimiento" se queda quieta. Fuera de pantalla no dibuja.
 * `densidad` 1 = la imagen principal; menos de 1 = solo el polvo de fondo.
 */

/** Lola, Clara, Víctor e Iris (los colores del logo) y los acentos violeta y ámbar. */
const AGENTES = ["#ff8a6b", "#7fb2ff", "#5fd09f", "#f6c64a"];
const ACENTOS = ["#8052ff", "#ffb829"];
/** Centros de los cuatro círculos del logo, en un cuadro de [-1, 1]. */
const CENTROS: [number, number][] = [
  [-0.36, -0.36],
  [0.36, -0.36],
  [-0.36, 0.36],
  [0.36, 0.36],
];
const TAU = Math.PI * 2;
const ALFAS = [0.4, 0.75, 1];

function triangulo(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, r: number) {
  const a = Math.cos(r) * s;
  const b = Math.sin(r) * s;
  // Rotar 120° dos veces
  const c = -0.5;
  const d = 0.8660254;
  ctx.moveTo(x + a, y + b);
  ctx.lineTo(x + a * c - b * d, y + b * c + a * d);
  ctx.lineTo(x + a * c + b * d, y + b * c - a * d);
  ctx.closePath();
}

/** Número con forma de campana entre -1 y 1 (más cerca del centro). */
const campana = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;

export function Constelacion({ densidad = 1, className = "" }: { densidad?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    let n = 0;
    // Datos de cada triángulo
    let casaX = new Float32Array(0);
    let casaY = new Float32Array(0);
    let offX = new Float32Array(0);
    let offY = new Float32Array(0);
    let tam = new Float32Array(0);
    let giro = new Float32Array(0);
    let velGiro = new Float32Array(0);
    let fase = new Float32Array(0);
    let amp = new Float32Array(0);
    // Grupos por color y transparencia: se dibuja cada grupo de un solo trazo
    let grupos: { color: string; alfa: number; idx: Uint32Array }[] = [];

    const colores = [...AGENTES, ...ACENTOS];

    const armar = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width;
      h = r.height;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const lado = Math.min(w, h);
      const principal = densidad >= 1;
      // Más triángulos en pantallas grandes; menos en celular
      n = Math.round((principal ? Math.min(2600, Math.max(1000, lado * 3.8)) : (w * h) / 5200) * Math.min(densidad, 1));
      casaX = new Float32Array(n);
      casaY = new Float32Array(n);
      offX = new Float32Array(n);
      offY = new Float32Array(n);
      tam = new Float32Array(n);
      giro = new Float32Array(n);
      velGiro = new Float32Array(n);
      fase = new Float32Array(n);
      amp = new Float32Array(n);
      const color = new Uint8Array(n);
      const nivel = new Uint8Array(n);
      const cx = w / 2;
      const cy = h / 2;
      const escala = lado * 0.5;
      const radio = 0.58;

      for (let i = 0; i < n; i++) {
        const suelto = !principal || Math.random() < 0.14;
        if (suelto) {
          // Polvo alrededor: por todo el lienzo, más tenue
          casaX[i] = Math.random() * w;
          casaY[i] = Math.random() * h;
          color[i] = Math.floor(Math.random() * colores.length);
          nivel[i] = Math.random() < 0.75 ? 0 : 1;
          tam[i] = 1.2 + Math.random() * 1.8;
        } else {
          // Dentro de uno de los cuatro círculos: denso al centro, deshilachado en la orilla
          const k = Math.floor(Math.random() * 4);
          const a = Math.random() * TAU;
          const d = radio * Math.pow(Math.random(), 0.7) * (1 + 0.22 * campana());
          // Una deformación suave para que la nube sea orgánica y no cuatro círculos perfectos
          const deforma = 1 + 0.12 * Math.sin(a * 3 + k * 1.7) + 0.07 * Math.sin(a * 5 - k);
          casaX[i] = cx + (CENTROS[k][0] + Math.cos(a) * d * deforma) * escala;
          casaY[i] = cy + (CENTROS[k][1] + Math.sin(a) * d * deforma) * escala;
          // Casi siempre el color de su agente; a veces un acento
          const acento = Math.random() < 0.16;
          color[i] = acento ? 4 + Math.floor(Math.random() * 2) : k;
          const orilla = d / radio;
          nivel[i] = orilla > 0.85 ? 0 : orilla > 0.5 ? 1 : 2;
          tam[i] = 1.6 + Math.random() * 2.8;
        }
        giro[i] = Math.random() * TAU;
        velGiro[i] = (Math.random() - 0.5) * 0.6;
        fase[i] = Math.random() * TAU;
        amp[i] = 1 + Math.random() * 3.5;
      }

      const mapa = new Map<string, number[]>();
      for (let i = 0; i < n; i++) {
        const clave = `${color[i]}-${nivel[i]}`;
        const lista = mapa.get(clave);
        if (lista) lista.push(i);
        else mapa.set(clave, [i]);
      }
      grupos = [...mapa.entries()].map(([clave, lista]) => {
        const [c, l] = clave.split("-").map(Number);
        return { color: colores[c], alfa: ALFAS[l], idx: Uint32Array.from(lista) };
      });
    };

    // El cursor empuja un poco a los triángulos cercanos
    const mouse = { x: -9999, y: -9999 };
    const alMover = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    const alSalir = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    const dibujar = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      const s = t / 1000;
      const alcance = 90;
      for (let i = 0; i < n; i++) {
        if (!quieto) {
          const dx = casaX[i] + offX[i] - mouse.x;
          const dy = casaY[i] + offY[i] - mouse.y;
          const dist = Math.hypot(dx, dy);
          if (dist < alcance && dist > 0.01) {
            const f = (1 - dist / alcance) * 2.2;
            offX[i] += (dx / dist) * f;
            offY[i] += (dy / dist) * f;
          }
          // Regresa a su lugar despacio
          offX[i] *= 0.94;
          offY[i] *= 0.94;
        }
      }
      for (const g of grupos) {
        ctx.strokeStyle = g.color;
        ctx.globalAlpha = g.alfa;
        ctx.beginPath();
        for (let j = 0; j < g.idx.length; j++) {
          const i = g.idx[j];
          const x = casaX[i] + offX[i] + (quieto ? 0 : Math.sin(s * 0.5 + fase[i]) * amp[i]);
          const y = casaY[i] + offY[i] + (quieto ? 0 : Math.cos(s * 0.4 + fase[i] * 1.3) * amp[i]);
          triangulo(ctx, x, y, tam[i], giro[i] + (quieto ? 0 : s * velGiro[i]));
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };

    armar();
    dibujar(0);
    if (quieto) {
      const ro = new ResizeObserver(() => {
        armar();
        dibujar(0);
      });
      ro.observe(canvas);
      return () => ro.disconnect();
    }

    // Solo anima mientras se ve en pantalla y la pestaña está abierta
    let raf = 0;
    let corriendo = false;
    let enPantalla = false;
    const cuadro = (t: number) => {
      dibujar(t);
      raf = requestAnimationFrame(cuadro);
    };
    const iniciar = () => {
      if (corriendo) return;
      corriendo = true;
      raf = requestAnimationFrame(cuadro);
    };
    const detener = () => {
      corriendo = false;
      cancelAnimationFrame(raf);
    };
    const io = new IntersectionObserver(([e]) => {
      enPantalla = e.isIntersecting;
      if (enPantalla && !document.hidden) iniciar();
      else detener();
    });
    io.observe(canvas);
    const alCambiarVisibilidad = () => (document.hidden ? detener() : enPantalla && iniciar());
    document.addEventListener("visibilitychange", alCambiarVisibilidad);
    const ro = new ResizeObserver(() => armar());
    ro.observe(canvas);
    window.addEventListener("pointermove", alMover, { passive: true });
    document.addEventListener("pointerleave", alSalir);
    return () => {
      detener();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
      window.removeEventListener("pointermove", alMover);
      document.removeEventListener("pointerleave", alSalir);
    };
  }, [densidad]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
