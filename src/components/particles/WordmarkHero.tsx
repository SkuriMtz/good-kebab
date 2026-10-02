"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { ajustarCanvas, bucleVisible, clamp01, easeOutCubic, triangulo } from "./draw";

const TAU = Math.PI * 2;
const ROJO = "#ff2936";

type Props = { texto?: string; children?: ReactNode };

/**
 * Portada tipo título de cine: miles de fragmentos (triangulitos) llegan
 * desde todos lados y arman la palabra "atendel". Cuando la palabra queda
 * formada, aparece el texto real y los fragmentos se sueltan como polvo
 * que flota y se aparta del cursor.
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
    if (!zona || !canvas || !titulo || !ctx) return;

    const mostrarTitulo = () => {
      zona.dataset.show = "";
    };
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const conMouse = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    // Red de seguridad: el título aparece sí o sí
    const respaldo = window.setTimeout(mostrarTitulo, 3200);

    const compacto = zona.clientWidth < 700;
    const N = compacto ? 900 : 1700;
    const px = new Float32Array(N); // posición actual
    const py = new Float32Array(N);
    const sx = new Float32Array(N); // salida (dispersos)
    const sy = new Float32Array(N);
    const tx = new Float32Array(N); // destino (la palabra)
    const ty = new Float32Array(N);
    const vx = new Float32Array(N); // deriva como polvo
    const vy = new Float32Array(N);
    const retraso = new Float32Array(N);
    const tam = new Float32Array(N);
    const giro = new Float32Array(N);
    const vel = new Float32Array(N);
    const fase = new Float32Array(N);
    const queda = new Uint8Array(N); // ¿sigue visible como polvo?
    const rojo = new Uint8Array(N);
    const qx = new Float32Array(N); // posición dibujada en este cuadro
    const qy = new Float32Array(N);
    const nivel = new Uint8Array(N);
    let w = 0;
    let h = 0;
    let listo = false;
    let t0 = 0;
    let anterior = 0;
    const puntero = { x: -1e4, y: -1e4, activo: false };

    const muestrearPalabra = () => {
      const z = zona.getBoundingClientRect();
      const r = titulo.getBoundingClientRect();
      const estilo = getComputedStyle(titulo);
      const off = document.createElement("canvas");
      // Margen extra: la itálica se sale de su caja (la "l" y la "d")
      const margen = Math.ceil(parseFloat(estilo.fontSize) * 0.25);
      const ow = Math.max(1, Math.ceil(r.width) + margen * 2);
      const oh = Math.max(1, Math.ceil(r.height) + margen * 2);
      off.width = ow;
      off.height = oh;
      const octx = off.getContext("2d", { willReadFrequently: true });
      if (!octx) return [] as [number, number][];
      octx.font = `${estilo.fontStyle} ${estilo.fontWeight} ${estilo.fontSize} ${estilo.fontFamily}`;
      octx.fillStyle = "#fff";
      octx.textBaseline = "alphabetic";
      const m = octx.measureText(texto);
      const asc = m.fontBoundingBoxAscent || m.actualBoundingBoxAscent;
      const desc = m.fontBoundingBoxDescent || m.actualBoundingBoxDescent;
      const x = (ow - m.width) / 2;
      const y = (oh - (asc + desc)) / 2 + asc;
      octx.fillText(texto, x, y);
      const datos = octx.getImageData(0, 0, ow, oh).data;
      const paso = Math.max(2, Math.round(parseFloat(estilo.fontSize) / 70));
      const puntos: [number, number][] = [];
      for (let yy = 0; yy < oh; yy += paso) {
        for (let xx = 0; xx < ow; xx += paso) {
          if (datos[(yy * ow + xx) * 4 + 3] > 120) puntos.push([r.left - z.left + xx - margen, r.top - z.top + yy - margen]);
        }
      }
      for (let i = puntos.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [puntos[i], puntos[j]] = [puntos[j], puntos[i]];
      }
      return puntos;
    };

    const preparar = () => {
      const puntos = muestrearPalabra();
      if (!puntos.length) return false;
      for (let i = 0; i < N; i++) {
        const [x, y] = puntos[i % puntos.length];
        tx[i] = x + (i >= puntos.length ? (Math.random() - 0.5) * 3 : 0);
        ty[i] = y;
        // Salen de fuera de la pantalla y de los bordes
        const a = Math.random() * TAU;
        const d = Math.max(w, h) * (0.55 + Math.random() * 0.6);
        sx[i] = w / 2 + Math.cos(a) * d;
        sy[i] = h / 2 + Math.sin(a) * d;
        px[i] = sx[i];
        py[i] = sy[i];
        const ang = Math.random() * TAU;
        const rap = 4 + Math.random() * 14;
        vx[i] = Math.cos(ang) * rap;
        vy[i] = Math.sin(ang) * rap - 4;
        retraso[i] = Math.random();
        tam[i] = (compacto ? 1.4 : 1.8) + Math.random() * (compacto ? 1.6 : 2.2);
        giro[i] = Math.random() * TAU;
        vel[i] = (Math.random() - 0.5) * 1.2;
        fase[i] = Math.random() * TAU;
        queda[i] = Math.random() < (compacto ? 0.16 : 0.12) ? 1 : 0;
        rojo[i] = Math.random() < 0.035 ? 1 : 0;
      }
      return true;
    };

    // Tiempos (segundos)
    const LLEGADA = 1.5;
    const FORMADA = 2.05;
    const SUELTA = 2.5;

    const dibujar = (ahora: number) => {
      const dt = Math.min(64, ahora - anterior) / 1000;
      anterior = ahora;
      const t = quieto ? 99 : (ahora - t0) / 1000;
      if (t > FORMADA && !zona.hasAttribute("data-show")) mostrarTitulo();

      // 1) Calcular posiciones (una vez por cuadro)
      const R = 90;
      const R2 = R * R;
      for (let i = 0; i < N; i++) {
        let x: number;
        let y: number;
        let alfa: number;
        if (t < SUELTA) {
          const p = easeOutCubic(clamp01((t - retraso[i] * 0.55) / (LLEGADA - 0.33)));
          x = sx[i] + (tx[i] - sx[i]) * p;
          y = sy[i] + (ty[i] - sy[i]) * p;
          alfa = 0.25 + 0.75 * p;
          // Al aparecer el texto real, los que no quedan se apagan
          if (t > FORMADA && !queda[i]) alfa *= 1 - clamp01((t - FORMADA) / (SUELTA - FORMADA));
          px[i] = x;
          py[i] = y;
        } else if (queda[i]) {
          // Polvo: flota despacio y da la vuelta por los bordes
          px[i] += vx[i] * dt;
          py[i] += vy[i] * dt;
          if (px[i] < -10) px[i] = w + 10;
          if (px[i] > w + 10) px[i] = -10;
          if (py[i] < -10) py[i] = h + 10;
          if (py[i] > h + 10) py[i] = -10;
          x = px[i] + Math.sin(t * 0.8 + fase[i]) * 3;
          y = py[i];
          alfa = 0.55;
        } else {
          nivel[i] = 255;
          continue;
        }
        if (puntero.activo) {
          const dx = x - puntero.x;
          const dy = y - puntero.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < R2 && d2 > 1) {
            const d = Math.sqrt(d2);
            const f = 1 - d / R;
            x += (dx / d) * f * f * 40;
            y += (dy / d) * f * f * 40;
            if (t >= SUELTA) {
              px[i] += (dx / d) * f * 2;
              py[i] += (dy / d) * f * 2;
            }
          }
        }
        qx[i] = x;
        qy[i] = y;
        nivel[i] = alfa <= 0.02 ? 255 : alfa > 0.75 ? 2 : alfa > 0.4 ? 1 : 0;
        if (!quieto) giro[i] += vel[i] * dt;
      }

      // 2) Dibujar agrupado por color y opacidad
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      ctx.lineJoin = "round";
      for (let pasada = 0; pasada < 2; pasada++) {
        for (let l = 0; l < 3; l++) {
          let hay = false;
          ctx.beginPath();
          for (let i = 0; i < N; i++) {
            if (rojo[i] !== pasada || nivel[i] !== l) continue;
            hay = true;
            triangulo(ctx, qx[i], qy[i], tam[i], giro[i]);
          }
          if (!hay) continue;
          ctx.globalAlpha = [0.3, 0.6, 0.95][l];
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
        await document.fonts.load(`italic 200 100px ${getComputedStyle(titulo).fontFamily}`);
      } catch {
        /* si falla la fuente, se usa la de respaldo */
      }
      if (cancelado) return;
      const r = ajustarCanvas(canvas, ctx);
      w = r.w;
      h = r.h;
      listo = preparar();
      if (!listo) {
        mostrarTitulo();
        return;
      }
      if (quieto) {
        mostrarTitulo();
        dibujar(performance.now());
        return;
      }
      t0 = performance.now();
      anterior = t0;
      detener = bucleVisible(canvas, dibujar);
      ro = new ResizeObserver(() => {
        const n = ajustarCanvas(canvas, ctx);
        w = n.w;
        h = n.h;
      });
      ro.observe(canvas);
    };
    iniciar();

    const mover = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      puntero.x = e.clientX - r.left;
      puntero.y = e.clientY - r.top;
      puntero.activo = puntero.y >= 0 && puntero.y <= r.height;
    };
    if (conMouse && !quieto) window.addEventListener("pointermove", mover, { passive: true });

    return () => {
      cancelado = true;
      window.clearTimeout(respaldo);
      detener();
      ro?.disconnect();
      window.removeEventListener("pointermove", mover);
    };
  }, [texto]);

  return (
    <div ref={zonaRef} className="wordmark-zone relative flex flex-1 flex-col items-center justify-center">
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" />
      <h1 ref={tituloRef} className="wordmark editorial relative inline-block text-wordmark">
        {texto}
      </h1>
      {children}
    </div>
  );
}
