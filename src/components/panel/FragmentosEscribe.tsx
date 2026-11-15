"use client";

import { useEffect, useRef } from "react";

/**
 * "Pensando / escribiendo": una nubecita de fragmentos (triangulitos huecos)
 * que flotan sin ritmo fijo, como los del fondo del Inicio pero en chiquito.
 * Cada uno con su tamaño, su vaivén (dos ondas de frecuencias distintas, así
 * nunca se repite igual), su giro y su titileo. Nada de saltos en fila: se ve
 * vivo, no mecánico. Canvas 2D a 2× como máximo; con "reducir movimiento"
 * (sistema o Ajustes) se pinta una vez y queda quieto.
 */

type Fragmento = {
  x: number;
  y: number;
  ax: number;
  ay: number;
  fx: number;
  fy: number;
  px: number;
  py: number;
  tam: number;
  giro: number;
  vgiro: number;
  alfa: number;
  titila: number;
  fase: number;
  color: string;
};

const ANCHO = 46;
const ALTO = 22;
const azar = (a: number, b: number) => a + Math.random() * (b - a);

function crear(colores: readonly string[]): Fragmento[] {
  return Array.from({ length: 7 }, (_, i) => ({
    // Repartidos a lo ancho, con algo de desorden
    x: 5 + (i / 6) * (ANCHO - 10) + azar(-3, 3),
    y: azar(7, ALTO - 7),
    ax: azar(1.5, 4),
    ay: azar(1.5, 4.5),
    fx: azar(0.7, 1.6),
    fy: azar(0.9, 2.1),
    px: Math.random() * Math.PI * 2,
    py: Math.random() * Math.PI * 2,
    tam: azar(3.5, 7),
    giro: Math.random() * Math.PI * 2,
    vgiro: azar(0.6, 1.8) * (Math.random() < 0.5 ? -1 : 1),
    alfa: azar(0.55, 0.95),
    titila: azar(1.2, 3),
    fase: Math.random() * Math.PI * 2,
    color: colores[i % colores.length],
  }));
}

export function FragmentosEscribe({ colores }: { colores: readonly string[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const clave = colores.join(",");

  useEffect(() => {
    const lienzo = ref.current;
    const ctx = lienzo?.getContext("2d");
    if (!lienzo || !ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    lienzo.width = Math.round(ANCHO * dpr);
    lienzo.height = Math.round(ALTO * dpr);
    const fragmentos = crear(clave.split(","));
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches || lienzo.closest(".pc")?.getAttribute("data-movimiento") === "reducido";

    const pintar = (t: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, ANCHO, ALTO);
      ctx.lineWidth = 1.25;
      ctx.lineJoin = "round";
      for (const f of fragmentos) {
        // Dos ondas que no cuadran entre sí: el camino nunca se repite igual
        const x = f.x + Math.sin(t * f.fx + f.px) * f.ax + Math.sin(t * f.fx * 2.3 + f.py) * f.ax * 0.35;
        const y = f.y + Math.sin(t * f.fy + f.py) * f.ay + Math.cos(t * f.fy * 1.7 + f.px) * f.ay * 0.3;
        const h = f.tam * 0.866;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(f.giro + t * f.vgiro);
        ctx.globalAlpha = f.alfa * (0.55 + 0.45 * Math.sin(t * f.titila + f.fase));
        ctx.strokeStyle = f.color;
        ctx.beginPath();
        ctx.moveTo(0, (-h * 2) / 3);
        ctx.lineTo(f.tam / 2, h / 3);
        ctx.lineTo(-f.tam / 2, h / 3);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }
    };

    if (quieto) {
      pintar(1.3);
      return;
    }
    let cuadro = 0;
    const inicio = performance.now();
    const paso = (ahora: number) => {
      if (!document.hidden) pintar((ahora - inicio) / 1000);
      cuadro = requestAnimationFrame(paso);
    };
    cuadro = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(cuadro);
  }, [clave]);

  return <canvas ref={ref} className="pc-escribe__nube" style={{ width: ANCHO, height: ALTO }} aria-hidden="true" />;
}
