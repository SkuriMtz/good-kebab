"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { ajustarCanvas, bucleVisible, clamp01, easeOutCubic, triangulo } from "./draw";

const TAU = Math.PI * 2;
const ROJO = "#ff2936";
const ALFAS = [0.2, 0.42, 0.68, 0.95];
/** Grosor con el que se "dibuja" la palabra para muestrearla (más legible que el 200 de los títulos). */
const PESO = 340;

type Props = { texto?: string; children?: ReactNode };

type Particulas = {
  n: number; // fragmentos de la palabra
  total: number; // palabra + polvo suelto
  sx: Float32Array; // salida
  sy: Float32Array;
  tx: Float32Array; // destino (la palabra) o posición del polvo
  ty: Float32Array;
  vx: Float32Array; // deriva del polvo
  vy: Float32Array;
  ox: Float32Array; // empujón del cursor (con resorte)
  oy: Float32Array;
  wx: Float32Array; // hacia dónde se los lleva el viento al bajar
  wy: Float32Array;
  umbral: Float32Array; // cuándo empieza a deshacerse cada uno
  retraso: Float32Array;
  amp: Float32Array;
  tam: Float32Array;
  giro: Float32Array;
  vel: Float32Array;
  fase: Float32Array;
  rojo: Uint8Array;
  qx: Float32Array; // posición dibujada en este cuadro
  qy: Float32Array;
  nivel: Uint8Array;
};

/**
 * Portada: la palabra "atendel" hecha solo de fragmentos (triangulitos).
 * Llegan desde todos lados, arman la palabra y se quedan respirando; se
 * apartan del cursor y, al bajar, el viento se los lleva como polvo.
 * El <h1> real sigue ahí (transparente) para lectores de pantalla y buscadores.
 */
export function WordmarkHero({ texto = "atendel", children }: Props) {
  const zonaRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tituloRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const zona = zonaRef.current;
    const canvas = canvasRef.current;
    const titulo = tituloRef.current;
    const ctx = canvas?.getContext("2d");
    if (!zona || !canvas || !titulo) return;
    // Sin canvas: se muestra la palabra como texto normal
    const plano = () => zona.setAttribute("data-plano", "");
    if (!ctx) {
      plano();
      return;
    }

    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let P: Particulas | null = null;
    let t0 = 0;
    let anterior = 0;
    let anchoMuestreado = 0;
    let altoZona = 1;
    let limitePolvo = 1e9; // debajo de aquí (el texto de la portada) el polvo se apaga
    const puntero = { x: -1e4, y: -1e4, activo: false };

    const muestrear = (): [number, number][] => {
      const z = zona.getBoundingClientRect();
      const r = titulo.getBoundingClientRect();
      const estilo = getComputedStyle(titulo);
      const fs = parseFloat(estilo.fontSize);
      // Margen extra: la itálica se sale de su caja (la "l" y la "d")
      const margen = Math.ceil(fs * 0.3);
      const ow = Math.max(1, Math.ceil(r.width) + margen * 2);
      const oh = Math.max(1, Math.ceil(r.height) + margen * 2);
      const off = document.createElement("canvas");
      off.width = ow;
      off.height = oh;
      const o = off.getContext("2d", { willReadFrequently: true });
      if (!o) return [];
      o.font = `italic ${PESO} ${estilo.fontSize} ${estilo.fontFamily}`;
      const conEspaciado = o as CanvasRenderingContext2D & { letterSpacing?: string };
      if ("letterSpacing" in conEspaciado && estilo.letterSpacing !== "normal") {
        conEspaciado.letterSpacing = estilo.letterSpacing;
      }
      o.fillStyle = "#fff";
      o.textBaseline = "alphabetic";
      const m = o.measureText(texto);
      const asc = m.fontBoundingBoxAscent || m.actualBoundingBoxAscent;
      const desc = m.fontBoundingBoxDescent || m.actualBoundingBoxDescent;
      o.fillText(texto, (ow - m.width) / 2, (oh - (asc + desc)) / 2 + asc);
      const datos = o.getImageData(0, 0, ow, oh).data;
      const paso = Math.max(1, Math.round(fs / 115));
      const baseX = r.left - z.left - margen;
      const baseY = r.top - z.top - margen;
      const puntos: [number, number][] = [];
      for (let yy = 0; yy < oh; yy += paso) {
        for (let xx = 0; xx < ow; xx += paso) {
          if (datos[(yy * ow + xx) * 4 + 3] > 140) {
            // Un poco de desorden para que no se note la cuadrícula
            puntos.push([baseX + xx + (Math.random() - 0.5) * paso, baseY + yy + (Math.random() - 0.5) * paso]);
          }
        }
      }
      for (let i = puntos.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [puntos[i], puntos[j]] = [puntos[j], puntos[i]];
      }
      return puntos;
    };

    const medirLimite = () => {
      const pie = titulo.parentElement?.nextElementSibling;
      limitePolvo = pie ? pie.getBoundingClientRect().top - zona.getBoundingClientRect().top : 1e9;
    };

    const preparar = (): Particulas | null => {
      medirLimite();
      const puntos = muestrear();
      if (puntos.length < 50) return null;
      const compacto = w < 700;
      const tope = compacto ? 1150 : w < 1100 ? 2400 : 3400;
      const n = Math.min(tope, puntos.length);
      const polvo = compacto ? 70 : 150;
      const total = n + polvo;
      const f = () => new Float32Array(total);
      const p: Particulas = {
        n,
        total,
        sx: f(),
        sy: f(),
        tx: f(),
        ty: f(),
        vx: f(),
        vy: f(),
        ox: f(),
        oy: f(),
        wx: f(),
        wy: f(),
        umbral: f(),
        retraso: f(),
        amp: f(),
        tam: f(),
        giro: f(),
        vel: f(),
        fase: f(),
        rojo: new Uint8Array(total),
        qx: f(),
        qy: f(),
        nivel: new Uint8Array(total),
      };
      for (let i = 0; i < total; i++) {
        const deLaPalabra = i < n;
        if (deLaPalabra) {
          p.tx[i] = puntos[i][0];
          p.ty[i] = puntos[i][1];
        } else {
          p.tx[i] = Math.random() * w;
          p.ty[i] = Math.random() * h;
          const a = Math.random() * TAU;
          const rap = 3 + Math.random() * 9;
          p.vx[i] = Math.cos(a) * rap;
          p.vy[i] = Math.sin(a) * rap - 3;
        }
        // Salen de cualquier punto de la pantalla (y un poco más allá)
        p.sx[i] = (Math.random() * 1.3 - 0.15) * w;
        p.sy[i] = (Math.random() * 1.3 - 0.15) * h;
        p.retraso[i] = Math.random();
        p.amp[i] = 0.35 + Math.random() * (compacto ? 0.6 : 1.1);
        p.tam[i] = deLaPalabra
          ? (compacto ? 0.95 : 1.3) + Math.random() * (compacto ? 1.05 : 1.8)
          : 1 + Math.random() * 2;
        p.giro[i] = Math.random() * TAU;
        p.vel[i] = (Math.random() - 0.5) * 1.1;
        p.fase[i] = Math.random() * TAU;
        p.rojo[i] = Math.random() < 0.012 ? 1 : 0;
        // El viento entra por la izquierda: se deshace de izquierda a derecha
        p.umbral[i] = (p.tx[i] / Math.max(1, w)) * 0.55 + Math.random() * 0.45;
        p.wx[i] = 0.35 + Math.random() * 0.9;
        p.wy[i] = -(0.15 + Math.random() * 0.75);
      }
      return p;
    };

    const dibujar = (ahora: number) => {
      if (!P) return;
      const p = P;
      const dt = Math.min(64, ahora - anterior) / 1000;
      anterior = ahora;
      const t = quieto ? 99 : (ahora - t0) / 1000;
      if (t > 1.5 && !zona.hasAttribute("data-show")) zona.setAttribute("data-show", "");

      // Qué tanto bajó la persona: 0 = arriba, 1 = la portada ya se fue
      const s = quieto ? 0 : clamp01(window.scrollY / (altoZona * 0.7));
      const R = w < 700 ? 70 : 110;
      const R2 = R * R;
      const resorte = Math.min(1, dt * 9);

      for (let i = 0; i < p.total; i++) {
        let x: number;
        let y: number;
        let a: number;
        if (i < p.n) {
          const llegada = quieto ? 1 : easeOutCubic(clamp01((t - p.retraso[i] * 0.75) / 1.25));
          // Respiran: se mueven apenas alrededor de su lugar
          const bx = p.tx[i] + Math.sin(t * 0.9 + p.fase[i]) * p.amp[i];
          const by = p.ty[i] + Math.cos(t * 0.7 + p.fase[i] * 1.3) * p.amp[i];
          x = p.sx[i] + (bx - p.sx[i]) * llegada;
          y = p.sy[i] + (by - p.sy[i]) * llegada;
          a = 0.12 + 0.88 * llegada;
          // Un brillo lento recorre la palabra de izquierda a derecha
          if (llegada >= 1) a *= 0.72 + 0.28 * (0.5 + 0.5 * Math.sin(t * 0.85 - (p.tx[i] / w) * 7));
        } else {
          // Polvo suelto: flota despacio y da la vuelta por los bordes
          if (!quieto) {
            p.tx[i] += p.vx[i] * dt;
            p.ty[i] += p.vy[i] * dt;
            if (p.tx[i] < -10) p.tx[i] = w + 10;
            if (p.tx[i] > w + 10) p.tx[i] = -10;
            if (p.ty[i] < -10) p.ty[i] = h + 10;
            if (p.ty[i] > h + 10) p.ty[i] = -10;
          }
          x = p.tx[i] + Math.sin(t * 0.8 + p.fase[i]) * 3;
          y = p.ty[i];
          a = 0.34 * clamp01(t / 1.6) * clamp01((limitePolvo - y) / 70);
        }

        // Al bajar, el viento se los lleva
        let k = 0;
        if (s > 0) {
          k = clamp01((s - p.umbral[i] * 0.5) / 0.5);
          const k2 = k * k;
          x += p.wx[i] * k2 * w * 0.5 + Math.sin(p.fase[i] + k * 5) * k * 22;
          y += p.wy[i] * k2 * h * 0.7;
          a *= 1 - k;
        }

        // El cursor los aparta; regresan con un resorte suave
        let ex = 0;
        let ey = 0;
        if (puntero.activo) {
          const dx = x - puntero.x;
          const dy = y - puntero.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < R2 && d2 > 0.5) {
            const d = Math.sqrt(d2);
            const fu = 1 - d / R;
            ex = (dx / d) * fu * fu * 46;
            ey = (dy / d) * fu * fu * 46;
          }
        }
        p.ox[i] += (ex - p.ox[i]) * resorte;
        p.oy[i] += (ey - p.oy[i]) * resorte;

        p.qx[i] = x + p.ox[i];
        p.qy[i] = y + p.oy[i];
        p.nivel[i] = a < 0.03 ? 255 : a < 0.3 ? 0 : a < 0.55 ? 1 : a < 0.8 ? 2 : 3;
        if (!quieto) p.giro[i] += p.vel[i] * dt * (1 + k * 8);
      }

      // Dibujar agrupado por color y opacidad (pocas llamadas a stroke)
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      ctx.lineJoin = "round";
      for (let pasada = 0; pasada < 2; pasada++) {
        for (let l = 0; l < ALFAS.length; l++) {
          let hay = false;
          ctx.beginPath();
          for (let i = 0; i < p.total; i++) {
            if (p.rojo[i] !== pasada || p.nivel[i] !== l) continue;
            hay = true;
            triangulo(ctx, p.qx[i], p.qy[i], p.tam[i], p.giro[i]);
          }
          if (!hay) continue;
          ctx.globalAlpha = ALFAS[l];
          ctx.strokeStyle = pasada ? ROJO : "#ffffff";
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    };

    let detener = () => {};
    let ro: ResizeObserver | null = null;
    let cancelado = false;

    const iniciar = async () => {
      try {
        await document.fonts.ready;
        await document.fonts.load(`italic ${PESO} 100px ${getComputedStyle(titulo).fontFamily}`);
      } catch {
        /* si falla la fuente, se usa la de respaldo */
      }
      if (cancelado) return;
      const r = ajustarCanvas(canvas, ctx);
      w = r.w;
      h = r.h;
      altoZona = Math.max(1, zona.offsetHeight);
      P = preparar();
      anchoMuestreado = w;
      if (!P) {
        plano();
        return;
      }
      zona.setAttribute("data-listo", "");
      t0 = performance.now();
      anterior = t0;
      if (quieto) {
        zona.setAttribute("data-show", "");
        dibujar(t0);
      } else {
        detener = bucleVisible(canvas, dibujar);
      }
      ro = new ResizeObserver(() => {
        const n = ajustarCanvas(canvas, ctx);
        w = n.w;
        h = n.h;
        altoZona = Math.max(1, zona.offsetHeight);
        medirLimite();
        // Si cambió el ancho (girar el celular, cambiar la ventana), se vuelve a muestrear
        if (Math.abs(w - anchoMuestreado) > 40) {
          anchoMuestreado = w;
          const nuevo = preparar();
          if (nuevo) {
            // Ya formada: sin volver a hacer la llegada
            nuevo.sx.set(nuevo.tx);
            nuevo.sy.set(nuevo.ty);
            P = nuevo;
          }
        }
        if (quieto) dibujar(performance.now());
      });
      ro.observe(canvas);
    };
    iniciar().catch(plano);

    const mover = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      puntero.x = e.clientX - r.left;
      puntero.y = e.clientY - r.top;
      puntero.activo = puntero.y >= 0 && puntero.y <= r.height;
    };
    const soltar = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") puntero.activo = false;
    };
    const salir = () => {
      puntero.activo = false;
    };
    if (!quieto) {
      window.addEventListener("pointermove", mover, { passive: true });
      window.addEventListener("pointerdown", mover, { passive: true });
      window.addEventListener("pointerup", soltar, { passive: true });
      window.addEventListener("pointercancel", soltar, { passive: true });
      document.documentElement.addEventListener("pointerleave", salir);
    }

    return () => {
      cancelado = true;
      detener();
      ro?.disconnect();
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerdown", mover);
      window.removeEventListener("pointerup", soltar);
      window.removeEventListener("pointercancel", soltar);
      document.documentElement.removeEventListener("pointerleave", salir);
    };
  }, [texto]);

  return (
    <div ref={zonaRef} className="wordmark-zone relative flex min-h-[100svh] flex-col">
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" />
      <div className="flex flex-1 items-center justify-center px-4 pt-[72px]">
        <h1 ref={tituloRef} className="wordmark editorial relative inline-block select-none text-wordmark">
          {texto}
        </h1>
      </div>
      {children}
    </div>
  );
}
