"use client";

import { useEffect, useRef } from "react";

/*
 * Los fragmentos del menú del sitio:
 * - MarcaFragmentos: la marca de Atendel hecha de triangulitos, la misma del
 *   cierre del inicio (formas.ts → marca()), girando despacio como allá.
 *   Sin cuadro: flota sobre el fondo del menú.
 * - FondoFragmentos: triangulitos y tetraedros de alambre esparcidos por todo
 *   el menú, que suben y giran muy lento.
 * Solo se animan con el menú abierto; con movimiento reducido quedan quietos.
 * La marca se calcula la primera vez que se abre el menú (y su código se baja
 * aparte), así no pesa en la carga de cada página.
 */

type Pintor = { medir: (w: number, h: number) => void; pintar: (ctx: CanvasRenderingContext2D, t: number) => void };

function Lienzo({ activo, crear, className }: { activo: boolean; crear: () => Promise<Pintor>; className?: string }) {
  const lienzo = useRef<HTMLCanvasElement>(null);
  const activoRef = useRef(activo);
  const arrancar = useRef<() => void>(() => {});

  useEffect(() => {
    const canvas = lienzo.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)");
    const inicio = performance.now();
    let pintor: Pintor | null = null;
    let pidio = false;
    let vivo = true;
    let cuadro = 0;
    let w = 0;
    let h = 0;

    const dibujar = (t: number) => {
      if (!pintor || !w) return;
      ctx.clearRect(0, 0, w, h);
      pintor.pintar(ctx, t);
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
      pintor?.medir(w, h);
      dibujar((performance.now() - inicio) / 1000);
    };
    const vuelta = (ahora: number) => {
      dibujar((ahora - inicio) / 1000);
      cuadro = activoRef.current && !quieto.matches ? requestAnimationFrame(vuelta) : 0;
    };
    arrancar.current = () => {
      if (!activoRef.current) return;
      if (!pidio) {
        pidio = true;
        crear().then((p) => {
          if (!vivo) return;
          pintor = p;
          medir();
          arrancar.current();
        });
        return;
      }
      if (pintor && !cuadro && !quieto.matches) cuadro = requestAnimationFrame(vuelta);
    };

    const observador = new ResizeObserver(medir);
    observador.observe(canvas);
    arrancar.current();
    return () => {
      vivo = false;
      observador.disconnect();
      cancelAnimationFrame(cuadro);
      arrancar.current = () => {};
    };
  }, [crear]);

  useEffect(() => {
    activoRef.current = activo;
    if (activo) arrancar.current();
  }, [activo]);

  return <canvas ref={lienzo} className={className} aria-hidden="true" />;
}

/* ---------- Ayudas ---------- */

function azar(semilla: number) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const G = Math.PI / 180;
const dar = (v: number, m: number) => ((v % m) + m) % m;

/** Un triangulito: tres puntas alrededor de (x, y), con su forma propia (f0..f2, b1, b2). */
function triangulo(ctx: CanvasRenderingContext2D, x: number, y: number, tam: number, ang: number, f: number[]) {
  ctx.moveTo(x + Math.cos(ang) * tam * f[0], y + Math.sin(ang) * tam * f[0]);
  ctx.lineTo(x + Math.cos(ang + f[3]) * tam * f[1], y + Math.sin(ang + f[3]) * tam * f[1]);
  ctx.lineTo(x + Math.cos(ang + f[4]) * tam * f[2], y + Math.sin(ang + f[4]) * tam * f[2]);
  ctx.closePath();
}

function formaAzar(azr: () => number) {
  return [0.8 + azr() * 0.4, 0.8 + azr() * 0.4, 0.8 + azr() * 0.4, (Math.PI * 2) / 3 + (azr() - 0.5) * 0.8, (Math.PI * 4) / 3 + (azr() - 0.5) * 0.8];
}

/* ---------- La marca de Atendel ---------- */

async function crearMarca(): Promise<Pintor> {
  const { marca } = await import("./escena/figuras/formas");
  const F = marca(2600);
  const azr = azar(7);
  // Un solo relleno por color (cientos de triangulitos de un jalón): los colores se
  // redondean un poco para que salgan pocos grupos
  const grupos = new Map<string, { ids: number[]; forma: number[][]; giro: number[] }>();
  for (let i = 0; i < F.alfa.length; i++) {
    if (F.alfa[i] <= 0) continue;
    const o = i * 3;
    const q = (v: number) => Math.min(255, Math.round((v * 255) / 24) * 24);
    const clave = `rgb(${q(F.col[o])} ${q(F.col[o + 1])} ${q(F.col[o + 2])})`;
    const g = grupos.get(clave) ?? { ids: [], forma: [], giro: [] };
    g.ids.push(i);
    g.forma.push(formaAzar(azr));
    g.giro.push(azr() * Math.PI * 2);
    grupos.set(clave, g);
  }
  let cx = 0;
  let cy = 0;
  let S = 1;

  return {
    medir(w, h) {
      cx = w / 2;
      cy = h / 2;
      S = Math.min(w, h) * 0.5;
    },
    pintar(ctx, t) {
      // Como en el cierre del inicio: de lado, girando despacio de un lado a otro
      const yaw = (-32 + 11 * Math.sin(t * 0.38)) * G;
      const pitch = (14 + 3 * Math.sin(t * 0.29 + 1)) * G;
      const roll = -8 * G;
      const [cyw, syw, cp, sp, cr, sr] = [Math.cos(yaw), Math.sin(yaw), Math.cos(pitch), Math.sin(pitch), Math.cos(roll), Math.sin(roll)];
      const D = 8.7 * S;
      const P = F.pos;
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.65;
      for (const [color, g] of grupos) {
        ctx.fillStyle = color;
        ctx.beginPath();
        for (let j = 0; j < g.ids.length; j++) {
          const i = g.ids[j];
          const o = i * 3;
          const x1 = P[o] * cyw + P[o + 2] * syw;
          const z1 = -P[o] * syw + P[o + 2] * cyw;
          const y2 = P[o + 1] * cp - z1 * sp;
          const z2 = P[o + 1] * sp + z1 * cp;
          const x3 = x1 * cr - y2 * sr;
          const y3 = x1 * sr + y2 * cr;
          const f = D / (D - z2 * S);
          triangulo(ctx, cx + x3 * S * f, cy - y3 * S * f, S * 0.017 * F.tam[i] * f, g.giro[j] + t * 0.15, g.forma[j]);
        }
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
    },
  };
}

/* ---------- Los fragmentos esparcidos ---------- */

const COLORES_FONDO = ["#ffb02e", "#8b5cff", "#c9a8ff", "#ff8a6b", "#7fb2ff", "#5fd09f", "#f6c64a", "#c95ce6"];

async function crearFondo(): Promise<Pintor> {
  const azr = azar(31);
  const piezas = Array.from({ length: 90 }, (_, i) => {
    const alambre = i < 16;
    return {
      alambre,
      x: azr(),
      y: azr(),
      tam: alambre ? 8 + azr() * 14 : 1.4 + azr() * 3,
      color: COLORES_FONDO[Math.floor(azr() * COLORES_FONDO.length)],
      alfa: alambre ? 0.35 + azr() * 0.35 : 0.15 + azr() * 0.4,
      ang: azr() * Math.PI * 2,
      vgiro: (azr() - 0.5) * 0.35,
      vx: (azr() - 0.5) * 8,
      vy: -(2 + azr() * 7),
      fase: azr() * Math.PI * 2,
      forma: formaAzar(azr),
      punta: [azr() * 0.35, azr() * Math.PI * 2],
    };
  });
  let w = 0;
  let h = 0;

  return {
    medir(ancho, alto) {
      w = ancho;
      h = alto;
    },
    pintar(ctx, t) {
      const margen = 40;
      for (const p of piezas) {
        const x = dar(p.x * w + p.vx * t, w + margen * 2) - margen;
        const y = dar(p.y * h + p.vy * t, h + margen * 2) - margen;
        const ang = p.ang + p.vgiro * t;
        // Más tenues detrás de la columna de enlaces (computadora), para no estorbar al leer
        const detras = w >= 900 && x > w * 0.48 ? 0.35 : 1;
        ctx.globalAlpha = p.alfa * detras * (0.7 + 0.3 * Math.sin(t * 0.8 + p.fase));
        if (p.alambre) {
          // Tetraedro de alambre: el contorno y tres aristas a la punta de enfrente
          const v = [0, 1, 2].map((k) => {
            const a = ang + (k === 0 ? 0 : p.forma[2 + k]);
            return [x + Math.cos(a) * p.tam * p.forma[k], y + Math.sin(a) * p.tam * p.forma[k]];
          });
          const px = x + Math.cos(ang + p.punta[1]) * p.tam * p.punta[0];
          const py = y + Math.sin(ang + p.punta[1]) * p.tam * p.punta[0];
          ctx.strokeStyle = p.color;
          ctx.lineJoin = "round";
          ctx.beginPath();
          ctx.moveTo(v[0][0], v[0][1]);
          ctx.lineTo(v[1][0], v[1][1]);
          ctx.lineTo(v[2][0], v[2][1]);
          ctx.closePath();
          for (const [vx, vy] of v) {
            ctx.moveTo(vx, vy);
            ctx.lineTo(px, py);
          }
          // El brillo: el mismo trazo, ancho y tenue, debajo del fino
          const alfa = ctx.globalAlpha;
          ctx.globalAlpha = alfa * 0.22;
          ctx.lineWidth = 4;
          ctx.stroke();
          ctx.globalAlpha = alfa;
          ctx.lineWidth = 1.3;
          ctx.stroke();
        } else {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          triangulo(ctx, x, y, p.tam, ang, p.forma);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    },
  };
}

export function MarcaFragmentos({ activo }: { activo: boolean }) {
  return <Lienzo activo={activo} crear={crearMarca} />;
}

export function FondoFragmentos({ activo }: { activo: boolean }) {
  return <Lienzo activo={activo} crear={crearFondo} className="menu-sitio__fondo" />;
}
