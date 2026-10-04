"use client";

/**
 * @name: FlowField
 * @description: Canvas particle flow field background — organic noise-driven streams of glowing light.
 * @version: 1.0.0
 * @author: @dorian_baffier
 * @license: MIT
 * @website: https://kokonutui.com
 * @github: https://github.com/kokonut-labs/kokonutui
 *
 * Adaptado a Atendel: tema "atendel" con los colores de los personajes y el
 * fondo de la página (cambia con el modo claro/oscuro), se pausa fuera de
 * pantalla y respeta a quien pidió menos movimiento.
 */

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { colorCss, EVENTO_TEMA } from "@/lib/tema";

// ─── Types ────────────────────────────────────────────────────────────────────

type ColorTheme = "aurora" | "ember" | "ocean" | "atendel";
type ParticleDensity = "sparse" | "medium" | "dense";

interface Particle {
  x: number;
  y: number;
  speed: number;
  hue: number;
  life: number;
  maxLife: number;
}

interface ThemeConfig {
  hueStart: number;
  hueRange: number;
  saturation: number;
  lightness: number;
  /** "r, g, b"; null = el fondo de la página (var(--color-void)). */
  bg: string | null;
  trailAlpha: number;
}

export interface FlowFieldProps {
  className?: string;
  children?: ReactNode;
  theme?: ColorTheme;
  density?: ParticleDensity;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PARTICLE_COUNTS: Record<ParticleDensity, number> = {
  sparse: 600,
  medium: 1200,
  dense: 2000,
} as const;

const THEMES: Record<ColorTheme, ThemeConfig> = {
  aurora: { hueStart: 120, hueRange: 200, saturation: 90, lightness: 62, bg: "5, 5, 8", trailAlpha: 0.06 },
  ember: { hueStart: 0, hueRange: 55, saturation: 95, lightness: 58, bg: "8, 4, 2", trailAlpha: 0.07 },
  ocean: { hueStart: 180, hueRange: 90, saturation: 88, lightness: 60, bg: "2, 6, 10", trailAlpha: 0.06 },
  // Del coral de Lola al azul de Clara, pasando por el amarillo de Iris y el verde de Víctor
  atendel: { hueStart: 8, hueRange: 210, saturation: 85, lightness: 64, bg: null, trailAlpha: 0.06 },
} as const;

/** "rgb(250, 247, 243)" → "250, 247, 243" */
const canales = (rgb: string) => rgb.replace(/^rgba?\(|\)$/g, "").split(/[ ,/]+/).filter(Boolean).slice(0, 3).join(", ");

// ─── Noise / vector-field ─────────────────────────────────────────────────────

/**
 * Smooth organic 2D noise via a multi-octave trigonometric series.
 * Returns an angle in radians that evolves continuously with time `t`.
 */
function fieldAngle(x: number, y: number, t: number): number {
  const s = 0.0025;
  return (
    Math.sin(x * s + t * 0.0007) * Math.PI +
    Math.cos(y * s + t * 0.0005) * Math.PI +
    Math.sin((x + y) * s * 0.6 + t * 0.0009) * Math.PI * 0.6 +
    Math.cos((x - y) * s * 0.4 + t * 0.0006) * Math.PI * 0.4
  );
}

// ─── Default hero content ─────────────────────────────────────────────────────

function DefaultContent() {
  return (
    <div className="relative z-10 flex flex-col items-center justify-center gap-6 px-6 text-center">
      <motion.h1
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl text-5xl font-bold leading-[1.08] tracking-tight text-white sm:text-6xl md:text-7xl"
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.9, delay: 0.38, ease: [0.22, 0.61, 0.36, 1] }}
      >
        Chaos finds its
        <br />
        <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-violet-300 bg-clip-text text-transparent">
          own beauty
        </span>
      </motion.h1>
      <motion.p
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md text-base leading-relaxed text-white/50"
        initial={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.9, delay: 0.56, ease: "easeOut" }}
      >
        Thousands of particles drift through an organic noise field, painting luminous trails that shift and spiral
        endlessly.
      </motion.p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function FlowField({ className = "", children, theme = "aurora", density = "medium" }: FlowFieldProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cfg = THEMES[theme];
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // En celular, menos partículas
    const count = Math.round(PARTICLE_COUNTS[density] * (window.innerWidth < 700 ? 0.5 : 1));
    const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
    const leerFondo = () => cfg.bg ?? canales(colorCss("var(--color-void)"));
    let bg = leerFondo();
    root.style.setProperty("--ff-bg", bg);

    let width = 0;
    let height = 0;
    let animId = 0;
    let time = 0;
    let visible = true;
    let particles: Particle[] = [];

    const spawnParticle = (): Particle => {
      const maxLife = 200 + Math.floor(Math.random() * 300);
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        speed: 1.1 + Math.random() * 1.8,
        hue: cfg.hueStart + Math.random() * cfg.hueRange,
        life: Math.floor(Math.random() * maxLife),
        maxLife,
      };
    };

    const resize = () => {
      width = root.clientWidth;
      height = root.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Fill base on resize
      ctx.fillStyle = `rgb(${bg})`;
      ctx.fillRect(0, 0, width, height);

      // Re-seed particles spread across the canvas
      particles = Array.from({ length: count }, spawnParticle);
    };

    const paso = () => {
      time++;

      // Fade previous frame — each dot persists ~16 frames, creating soft trails
      ctx.fillStyle = `rgba(${bg}, ${cfg.trailAlpha})`;
      ctx.fillRect(0, 0, width, height);

      for (const p of particles) {
        const angle = fieldAngle(p.x, p.y, time);

        p.x += Math.cos(angle) * p.speed;
        p.y += Math.sin(angle) * p.speed;
        p.life++;

        // Respawn aged-out particles at a random position
        if (p.life > p.maxLife) {
          p.x = Math.random() * width;
          p.y = Math.random() * height;
          p.life = 0;
          p.hue = cfg.hueStart + Math.random() * cfg.hueRange;
          continue;
        }

        // Wrap edges
        if (p.x < 0) p.x += width;
        else if (p.x > width) p.x -= width;
        if (p.y < 0) p.y += height;
        else if (p.y > height) p.y -= height;

        // Fade in / out over particle lifetime
        const progress = p.life / p.maxLife;
        const fadeIn = Math.min(progress * 8, 1);
        const fadeOut = Math.min((1 - progress) * 6, 1);
        const alpha = fadeIn * fadeOut * 0.9;

        // Hue shifts subtly with field direction for color variety
        const hueMod = (p.hue + (angle / (Math.PI * 2)) * 70 + 360) % 360;

        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.3, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hueMod}, ${cfg.saturation}%, ${cfg.lightness}%, ${alpha})`;
        ctx.fill();
      }
    };

    const render = () => {
      paso();
      animId = visible ? requestAnimationFrame(render) : 0;
    };

    const dibujarQuieto = () => {
      // Sin movimiento: se dibujan unas estelas una sola vez
      for (let i = 0; i < 90; i++) paso();
    };

    resize();
    if (quieto) dibujarQuieto();
    else render();

    // Solo se anima mientras está en pantalla
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !animId && !quieto) render();
    });
    io.observe(root);

    const ro = new ResizeObserver(() => {
      resize();
      if (quieto) dibujarQuieto();
    });
    ro.observe(root);

    // Al cambiar de modo claro/oscuro, se toma el nuevo fondo
    const alCambiarTema = () => {
      bg = leerFondo();
      root.style.setProperty("--ff-bg", bg);
      ctx.fillStyle = `rgb(${bg})`;
      ctx.fillRect(0, 0, width, height);
      if (quieto) dibujarQuieto();
    };
    window.addEventListener(EVENTO_TEMA, alCambiarTema);

    return () => {
      cancelAnimationFrame(animId);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener(EVENTO_TEMA, alCambiarTema);
    };
  }, [theme, density]);

  const fijo = THEMES[theme].bg;
  const color = fijo ?? "var(--ff-bg)";

  return (
    <div
      ref={rootRef}
      className={`relative flex min-h-screen w-full items-center justify-center overflow-hidden ${className}`}
      style={{ background: fijo ? `rgb(${fijo})` : "rgb(var(--c-void))" }}
    >
      <canvas aria-hidden="true" className="pointer-events-none absolute inset-0" ref={canvasRef} />

      {/* Radial vignette — focuses center, dims edges */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(ellipse 65% 60% at 50% 50%, transparent 20%, rgba(${color}, 0.92) 100%)` }}
      />

      {/* Soft top / bottom fades */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-40"
        style={{ background: `linear-gradient(to bottom, rgb(${color}), transparent)` }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40"
        style={{ background: `linear-gradient(to top, rgb(${color}), transparent)` }}
      />

      {children ?? <DefaultContent />}
    </div>
  );
}
