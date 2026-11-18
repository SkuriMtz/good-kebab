"use client";

import { useEffect, useRef } from "react";
import { COLORES } from "./Logo";
import { azar } from "./escena/figuras/formas";

/*
 * La figurita del menú: Aura, Altair, Rigel y Mira como cuatro estrellas
 * hechas de fragmentos (triangulitos), cada una con su color, unidas por
 * líneas finas también de fragmentos, sobre un poco de polvo. Se mueve
 * suave: cada estrella respira, los fragmentos tiemblan apenas y un brillo
 * corre por las líneas. Solo se anima con el menú abierto; con movimiento
 * reducido queda quieta.
 */

type Rgb = [number, number, number];
type Frag = {
  x: number;
  y: number;
  ang: number;
  r0: number;
  r1: number;
  r2: number;
  a1: number;
  a2: number;
  color: string;
  alfa: number;
  fase: number;
  amp: number;
  giro: number;
};

const ESTRELLAS = [
  { nombre: "Aura", x: 0.25, y: 0.6, tam: 1 },
  { nombre: "Altair", x: 0.47, y: 0.27, tam: 1.15 },
  { nombre: "Rigel", x: 0.77, y: 0.46, tam: 0.95 },
  { nombre: "Mira", x: 0.6, y: 0.79, tam: 0.9 },
];
const UNIONES: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
];

const rgb = (h: string): Rgb => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as Rgb;
const css = ([r, g, b]: Rgb) => `rgb(${Math.round(r)} ${Math.round(g)} ${Math.round(b)})`;
const hacia = (a: Rgb, b: Rgb, k: number): Rgb => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const BLANCO: Rgb = [255, 255, 255];

function fragmento(azr: () => number, x: number, y: number, tam: number, color: string, alfa: number, amp: number): Frag {
  return {
    x,
    y,
    ang: azr() * Math.PI * 2,
    r0: tam * (0.75 + azr() * 0.5),
    r1: tam * (0.75 + azr() * 0.5),
    r2: tam * (0.75 + azr() * 0.5),
    a1: (Math.PI * 2) / 3 + (azr() - 0.5) * 0.9,
    a2: (Math.PI * 4) / 3 + (azr() - 0.5) * 0.9,
    color,
    alfa,
    fase: azr() * Math.PI * 2,
    amp,
    giro: (azr() - 0.5) * 0.5,
  };
}

/** Arma todo una vez por tamaño: el polvo, las líneas y cada estrella (relativa a su centro). */
function construir(w: number, h: number) {
  const azr = azar(23);
  const S = Math.min(w, h);
  const k = S / 380;

  const polvo: Frag[] = [];
  for (let i = 0; i < 150; i++) {
    const tono = hacia([150, 150, 185], BLANCO, azr() * 0.5);
    polvo.push(fragmento(azr, azr() * w, azr() * h, (0.6 + azr() * 1.1) * k, css(tono), 0.08 + azr() * 0.3, 0.4 * k));
  }

  const estrellas = ESTRELLAS.map((e, i) => {
    const R = S * 0.15 * e.tam;
    const base = rgb(COLORES[i]);
    const frags: Frag[] = [];
    for (let j = 0; j < 140; j++) {
      const t = azr() * Math.PI * 2;
      // Cuatro puntas (arriba, abajo, izquierda y derecha) y el centro lleno
      const punta = Math.pow(Math.abs(Math.cos(2 * t)), 8);
      const rMax = R * (0.2 + 0.8 * punta);
      const r = rMax * Math.pow(azr(), 1.35);
      const lejos = r / R;
      const tono = hacia(base, BLANCO, Math.pow(1 - r / rMax, 2) * 0.65);
      frags.push(
        fragmento(azr, Math.cos(t) * r, Math.sin(t) * r, (4.4 - 3 * lejos) * k, css(tono), 0.62 + (1 - lejos) * 0.38, (0.5 + azr() * 0.8) * k),
      );
    }
    return { x: e.x * w, y: e.y * h, R, base, frags, fase: azr() * Math.PI * 2, nombre: e.nombre };
  });

  const lineas: (Frag & { d: number })[] = [];
  for (const [a, b] of UNIONES) {
    const A = estrellas[a];
    const B = estrellas[b];
    const dx = B.x - A.x;
    const dy = B.y - A.y;
    const largo = Math.hypot(dx, dy);
    const desde = A.R * 0.55;
    const hasta = largo - B.R * 0.55;
    for (let d = desde; d < hasta; d += 6.5 * k) {
      const f = fragmento(azr, A.x + (dx / largo) * d, A.y + (dy / largo) * d, 0.95 * k, "rgb(225 225 240)", 0.3, 0.25 * k);
      lineas.push({ ...f, d });
    }
  }

  return { polvo, estrellas, lineas, k };
}

function triangulo(ctx: CanvasRenderingContext2D, x: number, y: number, f: Frag, ang: number, escala = 1) {
  ctx.moveTo(x + Math.cos(ang) * f.r0 * escala, y + Math.sin(ang) * f.r0 * escala);
  ctx.lineTo(x + Math.cos(ang + f.a1) * f.r1 * escala, y + Math.sin(ang + f.a1) * f.r1 * escala);
  ctx.lineTo(x + Math.cos(ang + f.a2) * f.r2 * escala, y + Math.sin(ang + f.a2) * f.r2 * escala);
  ctx.closePath();
}

export function ConstelacionMenu({ activo }: { activo: boolean }) {
  const lienzo = useRef<HTMLCanvasElement>(null);
  const activoRef = useRef(activo);
  const arrancar = useRef<() => void>(() => {});

  useEffect(() => {
    const canvas = lienzo.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)");
    let escena: ReturnType<typeof construir> | null = null;
    let w = 0;
    let h = 0;
    let cuadro = 0;
    const inicio = performance.now();

    const pintar = (tiempo: number) => {
      if (!escena) return;
      const { polvo, estrellas, lineas, k } = escena;
      ctx.clearRect(0, 0, w, h);

      for (const f of polvo) {
        ctx.globalAlpha = f.alfa * (0.55 + 0.45 * Math.sin(tiempo * 0.9 + f.fase));
        ctx.fillStyle = f.color;
        ctx.beginPath();
        triangulo(ctx, f.x + Math.sin(tiempo * 0.5 + f.fase) * f.amp, f.y + Math.cos(tiempo * 0.4 + f.fase) * f.amp, f, f.ang);
        ctx.fill();
      }

      // Las líneas: un brillo que corre de una estrella a la otra
      ctx.fillStyle = "rgb(225 225 240)";
      for (const f of lineas) {
        const brillo = Math.max(0, Math.sin(tiempo * 1.3 - f.d * 0.035));
        ctx.globalAlpha = f.alfa + 0.4 * Math.pow(brillo, 6);
        ctx.beginPath();
        triangulo(ctx, f.x, f.y, f, f.ang + tiempo * f.giro);
        ctx.fill();
      }

      for (const e of estrellas) {
        const respira = 1 + 0.04 * Math.sin(tiempo * 0.9 + e.fase);
        const halo = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.R * 1.7);
        const [r, g, b] = e.base;
        halo.addColorStop(0, `rgb(${r} ${g} ${b} / ${0.2 * respira})`);
        halo.addColorStop(1, `rgb(${r} ${g} ${b} / 0)`);
        ctx.globalAlpha = 1;
        ctx.fillStyle = halo;
        ctx.fillRect(e.x - e.R * 1.7, e.y - e.R * 1.7, e.R * 3.4, e.R * 3.4);

        for (const f of e.frags) {
          ctx.globalAlpha = f.alfa;
          ctx.fillStyle = f.color;
          ctx.beginPath();
          triangulo(
            ctx,
            e.x + f.x * respira + Math.sin(tiempo * 0.8 + f.fase) * f.amp,
            e.y + f.y * respira + Math.cos(tiempo * 0.7 + f.fase) * f.amp,
            f,
            f.ang + tiempo * f.giro,
          );
          ctx.fill();
        }

        ctx.globalAlpha = 0.6;
        ctx.fillStyle = "rgb(235 235 245)";
        ctx.font = `500 ${Math.max(9, Math.round(10.5 * k))}px ui-monospace, SFMono-Regular, Menlo, monospace`;
        ctx.fillText(e.nombre.toUpperCase(), e.x + e.R * 0.5, e.y + e.R * 0.62 + 10 * k);
      }
      ctx.globalAlpha = 1;
    };

    const medir = () => {
      const caja = canvas.getBoundingClientRect();
      if (!caja.width || !caja.height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = caja.width;
      h = caja.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      escena = construir(w, h);
      pintar(0);
    };

    const vuelta = (ahora: number) => {
      pintar((ahora - inicio) / 1000);
      cuadro = activoRef.current && !quieto.matches ? requestAnimationFrame(vuelta) : 0;
    };
    arrancar.current = () => {
      if (!cuadro && activoRef.current && !quieto.matches) cuadro = requestAnimationFrame(vuelta);
    };

    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(canvas);
    arrancar.current();
    return () => {
      observador.disconnect();
      cancelAnimationFrame(cuadro);
      arrancar.current = () => {};
    };
  }, []);

  useEffect(() => {
    activoRef.current = activo;
    if (activo) arrancar.current();
  }, [activo]);

  return <canvas ref={lienzo} aria-hidden="true" />;
}
