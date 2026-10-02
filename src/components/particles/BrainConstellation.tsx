"use client";

import { useEffect, useRef } from "react";
import { ajustarCanvas, bucleVisible, clamp01, easeOutCubic, triangulo } from "./draw";

const TAU = Math.PI * 2;
const PALETA = ["#8052ff", "#a98bff", "#4d7cff", "#1fc7a4", "#f29d0a", "#ff5fd2"];
const NIVELES = [0.38, 0.58, 0.8, 1];

/**
 * La imagen principal de la marca: miles de triangulitos de colores que
 * forman un cerebro en 3D (inteligencia distribuida). Al cargar, las
 * partículas llegan desde todos lados y se juntan; luego el cerebro gira
 * despacio, sigue al mouse y se aparta del cursor. Alrededor flotan
 * partículas sueltas.
 */
export function BrainConstellation({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const conMouse = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const compacto = canvas.clientWidth < 640;
    const N = compacto ? 720 : 1400;
    const NA = compacto ? 40 : 90;

    // ---------- Partículas del cerebro ----------
    const bx = new Float32Array(N);
    const by = new Float32Array(N);
    const bz = new Float32Array(N);
    const qx = new Float32Array(N);
    const qy = new Float32Array(N);
    const qz = new Float32Array(N);
    const retraso = new Float32Array(N);
    const tam = new Float32Array(N);
    const giro = new Float32Array(N);
    const vel = new Float32Array(N);
    const fase = new Float32Array(N);
    const alfa = new Float32Array(N);
    const color = new Uint8Array(N);
    const sx = new Float32Array(N);
    const sy = new Float32Array(N);
    const ss = new Float32Array(N);
    const nivel = new Uint8Array(N);

    let k = 0;
    const agregar = (x: number, y: number, z: number) => {
      bx[k] = x;
      by[k] = y;
      bz[k] = z;
      // Punto de partida: una esfera enorme alrededor
      const u = Math.random() * 2 - 1;
      const th = Math.random() * TAU;
      const s = Math.sqrt(1 - u * u);
      const rr = 2.2 + Math.random() * 1.6;
      qx[k] = s * Math.cos(th) * rr;
      qy[k] = u * rr;
      qz[k] = s * Math.sin(th) * rr;
      retraso[k] = Math.random();
      tam[k] = (compacto ? 1.7 : 2) + Math.random() * (compacto ? 1.8 : 2.4);
      giro[k] = Math.random() * TAU;
      vel[k] = (Math.random() - 0.5) * 0.9;
      fase[k] = Math.random() * TAU;
      alfa[k] = 0.6 + Math.random() * 0.4;
      // Color por bandas en el espacio, con algo de azar
      const v = Math.sin(z * 1.8 + y * 2.6 + x * 1.1) * 0.5 + 0.5;
      color[k] =
        Math.random() < 0.3
          ? Math.floor(Math.random() * PALETA.length)
          : Math.min(PALETA.length - 1, Math.floor(v * PALETA.length));
      k++;
    };
    const direccion = () => {
      const u = Math.random() * 2 - 1;
      const th = Math.random() * TAU;
      const s = Math.sqrt(1 - u * u);
      return [s * Math.cos(th), u, s * Math.sin(th)] as const;
    };

    // Corteza: dos hemisferios con pliegues
    const nCorteza = Math.round(N * 0.83);
    const nCerebelo = Math.round(N * 0.12);
    while (k < nCorteza) {
      const lado = k % 2 === 0 ? -1 : 1;
      const [dx, dy, dz] = direccion();
      const capa = 0.8 + 0.2 * Math.pow(Math.random(), 0.3);
      const pliegue = 1 + 0.06 * Math.sin(dz * 10 + dy * 6 + lado) * Math.cos(dy * 8 - dz * 4);
      const r = capa * pliegue;
      const medial = dx * lado < 0;
      const x = lado * 0.3 + dx * 0.52 * r * (medial ? 0.52 : 1);
      let y = dy * 0.7 * r * (1 + 0.08 * dz);
      if (y < -0.22) y = -0.22 + (y + 0.22) * 0.5;
      agregar(x, y + 0.08, dz * r);
    }
    // Cerebelo
    while (k < nCorteza + nCerebelo) {
      const lado = k % 2 === 0 ? -1 : 1;
      const [dx, dy, dz] = direccion();
      const r = 0.78 + 0.22 * Math.pow(Math.random(), 0.4);
      const z = -0.66 + dz * 0.27 * r;
      agregar(lado * 0.2 + dx * 0.25 * r, -0.36 + dy * 0.16 * r + 0.012 * Math.sin(z * 55), z);
    }
    // Tallo
    while (k < N) {
      const t = Math.random();
      const a = Math.random() * TAU;
      const rr = 0.07 * Math.sqrt(Math.random());
      agregar(Math.cos(a) * rr, -0.34 - t * 0.55, -0.3 - t * 0.14 + Math.sin(a) * rr);
    }

    // ---------- Partículas sueltas de ambiente ----------
    const ax = new Float32Array(NA);
    const ay = new Float32Array(NA);
    const avx = new Float32Array(NA);
    const avy = new Float32Array(NA);
    const atam = new Float32Array(NA);
    const agiro = new Float32Array(NA);
    const avel = new Float32Array(NA);
    const acolor = new Uint8Array(NA);
    const anivel = new Uint8Array(NA);
    for (let j = 0; j < NA; j++) {
      ax[j] = Math.random();
      ay[j] = Math.random();
      const ang = Math.random() * TAU;
      const rapidez = 0.004 + Math.random() * 0.01;
      avx[j] = Math.cos(ang) * rapidez;
      avy[j] = Math.sin(ang) * rapidez;
      atam[j] = 1.6 + Math.random() * 2.2;
      agiro[j] = Math.random() * TAU;
      avel[j] = (Math.random() - 0.5) * 0.6;
      acolor[j] = Math.floor(Math.random() * PALETA.length);
      anivel[j] = Math.random() < 0.6 ? 0 : 1;
    }

    // ---------- Interacción ----------
    const puntero = { nx: 0, ny: 0, x: -1e4, y: -1e4, activo: false };
    let giroX = 0;
    let giroY = 0;
    let w = 0;
    let h = 0;
    const t0 = performance.now();
    let anterior = t0;

    const dibujar = (ahora: number) => {
      const dt = Math.min(64, ahora - anterior) / 1000;
      anterior = ahora;
      const t = quieto ? 10 : (ahora - t0) / 1000;
      const suave = 1 - Math.exp(-dt * 2.5);
      giroY += (puntero.nx * 0.45 - giroY) * suave;
      giroX += (puntero.ny * 0.22 - giroX) * suave;

      const angY = Math.PI / 2 + (quieto ? 0.35 : Math.sin(t * 0.13) * 0.55) + giroY;
      const angX = 0.3 + (quieto ? 0 : Math.sin(t * 0.09 + 1) * 0.07) + giroX;
      const cosY = Math.cos(angY);
      const sinY = Math.sin(angY);
      const cosX = Math.cos(angX);
      const sinX = Math.sin(angX);

      const angosto = w < 640;
      const scrollY = window.scrollY;
      const vh = window.innerHeight || 1;
      const cx = w * (angosto ? 0.5 : 0.63);
      const cy = h * 0.5 + (quieto ? 0 : scrollY * 0.12);
      const R = Math.min(w, h) * (angosto ? 0.4 : 0.3);
      const desvanecer = quieto ? 1 : 1 - clamp01(scrollY / (vh * 1.1)) * 0.6;
      const respirar = 1 + (quieto ? 0 : Math.sin(t * 0.8) * 0.012);
      const D = 3.6;
      const RADIO = 95;
      const RADIO2 = RADIO * RADIO;
      const factorTam = angosto ? 0.85 : 1;

      for (let i = 0; i < N; i++) {
        const p = quieto ? 1 : easeOutCubic(clamp01((t - 0.1 - retraso[i] * 0.9) / 1.7));
        let x = qx[i] + (bx[i] - qx[i]) * p;
        let y = qy[i] + (by[i] - qy[i]) * p;
        let z = qz[i] + (bz[i] - qz[i]) * p;
        if (!quieto) {
          x += Math.sin(t * 1.2 + fase[i]) * 0.008;
          y += Math.cos(t * 1.05 + fase[i] * 1.7) * 0.008;
        }
        x *= respirar;
        y *= respirar;
        z *= respirar;
        // Rotación en Y y luego en X, con perspectiva
        const x1 = x * cosY + z * sinY;
        const z1 = -x * sinY + z * cosY;
        const y2 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;
        const persp = D / (D - z2);
        let X = cx + x1 * R * persp;
        let Y = cy - y2 * R * persp;

        if (puntero.activo) {
          const dx = X - puntero.x;
          const dy = Y - puntero.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < RADIO2 && d2 > 1) {
            const d = Math.sqrt(d2);
            const f = 1 - d / RADIO;
            const empuje = f * f * 34;
            X += (dx / d) * empuje;
            Y += (dy / d) * empuje;
          }
        }

        const prof = clamp01((z2 + 1.15) / 2.3);
        sx[i] = X;
        sy[i] = Y;
        ss[i] = tam[i] * (0.62 + 0.75 * prof) * factorTam;
        const al = alfa[i] * (0.18 + 0.82 * prof) * (0.25 + 0.75 * p) * desvanecer;
        nivel[i] = al > 0.7 ? 3 : al > 0.45 ? 2 : al > 0.25 ? 1 : 0;
        if (!quieto) giro[i] += vel[i] * dt;
      }

      if (!quieto) {
        for (let j = 0; j < NA; j++) {
          ax[j] = (ax[j] + avx[j] * dt + 1) % 1;
          ay[j] = (ay[j] + avy[j] * dt + 1) % 1;
          agiro[j] += avel[j] * dt;
        }
      }

      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      ctx.lineJoin = "round";
      for (let c = 0; c < PALETA.length; c++) {
        for (let l = 0; l < NIVELES.length; l++) {
          let hay = false;
          ctx.beginPath();
          for (let i = 0; i < N; i++) {
            if (color[i] !== c || nivel[i] !== l) continue;
            hay = true;
            triangulo(ctx, sx[i], sy[i], ss[i], giro[i]);
          }
          for (let j = 0; j < NA; j++) {
            if (acolor[j] !== c || anivel[j] !== l) continue;
            hay = true;
            triangulo(ctx, ax[j] * w, ay[j] * h, atam[j], agiro[j]);
          }
          if (!hay) continue;
          ctx.globalAlpha = NIVELES[l];
          ctx.strokeStyle = PALETA[c];
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
      puntero.nx = (e.clientX / window.innerWidth - 0.5) * 2;
      puntero.ny = (e.clientY / window.innerHeight - 0.5) * 2;
      const r = canvas.getBoundingClientRect();
      puntero.x = e.clientX - r.left;
      puntero.y = e.clientY - r.top;
      puntero.activo = puntero.x >= 0 && puntero.y >= 0 && puntero.x <= r.width && puntero.y <= r.height;
    };
    if (conMouse && !quieto) window.addEventListener("pointermove", mover, { passive: true });

    return () => {
      detenerBucle();
      ro.disconnect();
      window.removeEventListener("pointermove", mover);
    };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
