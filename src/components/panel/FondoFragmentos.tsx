"use client";

import { useEffect, useRef } from "react";
import { EVENTO_TEMA } from "@/lib/tema";

/* =====================================================================
   Los fragmentos de Atendel como fondo del chat (Inicio y Conversación).
   - Canvas 2D (nada de WebGL en el panel), 40 a 110 triangulitos HUECOS de
     1–1.8px en los colores de ATENDEL.md; DPR limitado a 2.
   - Profundidad: los de cerca son más grandes y se ven apenas borrosos
     (doble trazo suave); los de lejos, chicos y nítidos. Derivan muy lento,
     giran un poco y, con mouse (hover: hover), se mueven unos píxeles con
     el cursor (parallax mínimo, más los de cerca).
   - Nunca bajan el contraste: se desvanecen antes de llegar al texto, la
     caja y las burbujas (cada pieza mide su distancia a esas zonas y se
     apaga a 24px de ellas, con una rampa de 72px).
   - Se pausa con la pestaña oculta y fuera de la vista; con "reducir
     movimiento" se pinta una vez y se queda quieto.
   ===================================================================== */

const COLORES = ["#ffb829", "#8052ff", "#15846e", "#23d9b5", "#e040fb", "#3d7bff"];
/** Distancia mínima a una zona protegida, y la rampa en la que se desvanecen. */
const MARGEN = 24;
const RAMPA = 72;

type Pieza = { x: number; y: number; z: number; tam: number; color: string; giro: number; vg: number; vx: number; vy: number; a: number; grosor: number };
type Zona = { x: number; y: number; w: number; h: number };

/** Números al azar repetibles (mulberry32): el mismo campo en cada visita. */
function azar(semilla: number) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * `proteger`: lo que se lee (selectores), cada uno con su caja exacta.
 * `bandas`: columnas protegidas de arriba abajo (la columna de mensajes).
 */
export function FondoFragmentos({ proteger, bandas = [] }: { proteger: string[]; bandas?: string[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const claveZonas = `${proteger.join("|")}#${bandas.join("|")}`;

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const selectores = claveZonas.split("#").map((s) => (s ? s.split("|") : []));
    const reducir = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fino = window.matchMedia("(hover: hover) and (pointer: fine)");
    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let visible = true;
    let ultimo = 0;
    let piezas: Pieza[] = [];
    let zonas: Zona[] = [];
    const puntero = { x: 0, y: 0, tx: 0, ty: 0 };

    const medirZonas = () => {
      const r = canvas.getBoundingClientRect();
      const de = (sel: string, banda: boolean) =>
        [...document.querySelectorAll(sel)].map((el) => {
          const b = el.getBoundingClientRect();
          return banda
            ? { x: b.left - r.left - MARGEN, y: -1e5, w: b.width + 2 * MARGEN, h: 2e5 }
            : { x: b.left - r.left - MARGEN, y: b.top - r.top - MARGEN, w: b.width + 2 * MARGEN, h: b.height + 2 * MARGEN };
        });
      zonas = [...selectores[0].flatMap((s) => de(s, false)), ...selectores[1].flatMap((s) => de(s, true))];
    };

    const crear = () => {
      const r = azar(7);
      const n = Math.max(40, Math.min(110, Math.round((w * h) / 9500)));
      piezas = Array.from({ length: n }, (_, i) => {
        const z = r(); // 0 = lejos, 1 = cerca
        return {
          x: r() * w,
          y: r() * h,
          z,
          tam: 5 + z * z * 19,
          color: COLORES[i % COLORES.length],
          giro: r() * Math.PI * 2,
          vg: (r() * 2 - 1) * (0.04 + 0.08 * z), // rad/s: unos pocos grados por segundo
          vx: (r() * 2 - 1) * (1.5 + 5 * z), // px/s: muy lento
          vy: (r() * 2 - 1) * (1.2 + 4 * z) - 1,
          a: r(),
          grosor: 1 + z * 0.8,
        };
      });
    };

    /** 0 dentro de una zona protegida (o a menos de MARGEN), 1 lejos de todas. */
    const mascara = (x: number, y: number, radio: number) => {
      let d = Infinity;
      for (const z of zonas) {
        const dx = Math.max(z.x - x, 0, x - (z.x + z.w));
        const dy = Math.max(z.y - y, 0, y - (z.y + z.h));
        d = Math.min(d, Math.hypot(dx, dy));
      }
      d -= radio;
      if (d <= 0) return 0;
      if (d >= RAMPA) return 1;
      const t = d / RAMPA;
      return t * t * (3 - 2 * t);
    };

    const dibujar = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const claro = document.documentElement.dataset.tema === "claro";
      // Opacidad baja: 0.25–0.45 en oscuro; menos en claro
      const [piso, tope] = claro ? [0.14, 0.28] : [0.25, 0.45];
      ctx.lineJoin = "round";
      for (const q of piezas) {
        const x = q.x + puntero.x * (2 + q.z * 12);
        const y = q.y + puntero.y * (2 + q.z * 9);
        const m = mascara(x, y, q.tam * 0.6);
        if (m <= 0.01) continue;
        const alfa = (piso + (tope - piso) * q.a) * m;
        const s = q.tam;
        const alto = s * 0.866;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(q.giro);
        ctx.beginPath();
        ctx.moveTo(0, (-alto * 2) / 3);
        ctx.lineTo(s / 2, alto / 3);
        ctx.lineTo(-s / 2, alto / 3);
        ctx.closePath();
        ctx.strokeStyle = q.color;
        if (q.z > 0.72) {
          // Los de cerca, apenas borrosos: un halo ancho y tenue bajo el trazo
          ctx.globalAlpha = alfa * 0.3;
          ctx.lineWidth = q.grosor * 2.8;
          ctx.stroke();
          ctx.globalAlpha = alfa * 0.75;
          ctx.lineWidth = q.grosor;
          ctx.stroke();
        } else {
          ctx.globalAlpha = alfa;
          ctx.lineWidth = q.grosor;
          ctx.stroke();
        }
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    };

    const quieto = () => reducir.matches;
    const paso = (t: number) => {
      raf = 0;
      if (!visible || document.hidden || quieto()) return;
      const dt = ultimo ? Math.min(0.05, (t - ultimo) / 1000) : 0;
      ultimo = t;
      const borde = 30;
      for (const q of piezas) {
        q.x += q.vx * dt;
        q.y += q.vy * dt;
        q.giro += q.vg * dt;
        if (q.x < -borde) q.x = w + borde;
        else if (q.x > w + borde) q.x = -borde;
        if (q.y < -borde) q.y = h + borde;
        else if (q.y > h + borde) q.y = -borde;
      }
      puntero.x += (puntero.tx - puntero.x) * 0.05;
      puntero.y += (puntero.ty - puntero.y) * 0.05;
      dibujar();
      raf = requestAnimationFrame(paso);
    };
    const seguir = () => {
      if (raf || !visible || document.hidden || quieto()) return;
      ultimo = 0;
      raf = requestAnimationFrame(paso);
    };
    const parar = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const ajustar = () => {
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const nuevo = Math.abs(r.width - w) > 1 || Math.abs(r.height - h) > 1;
      w = r.width;
      h = r.height;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      if (nuevo || !piezas.length) crear();
      medirZonas();
      dibujar();
    };

    ajustar();
    seguir();

    const ro = new ResizeObserver(() => ajustar());
    ro.observe(canvas);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) seguir();
      else parar();
    });
    io.observe(canvas);
    const alVisibilidad = () => (document.hidden ? parar() : seguir());
    const alDesplazar = () => {
      medirZonas();
      if (quieto()) dibujar();
    };
    const alMover = (e: PointerEvent) => {
      if (!fino.matches || e.pointerType !== "mouse") return;
      puntero.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      puntero.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    const alTema = () => dibujar();
    const alReducir = () => (quieto() ? (parar(), dibujar()) : seguir());
    document.addEventListener("visibilitychange", alVisibilidad);
    window.addEventListener("scroll", alDesplazar, { passive: true, capture: true });
    window.addEventListener("pointermove", alMover, { passive: true });
    window.addEventListener(EVENTO_TEMA, alTema);
    reducir.addEventListener("change", alReducir);
    return () => {
      parar();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", alVisibilidad);
      window.removeEventListener("scroll", alDesplazar, { capture: true });
      window.removeEventListener("pointermove", alMover);
      window.removeEventListener(EVENTO_TEMA, alTema);
      reducir.removeEventListener("change", alReducir);
    };
  }, [claveZonas]);

  return <canvas ref={ref} className="pc-fondo" aria-hidden="true" />;
}

/**
 * Al enviar un mensaje: unos pocos fragmentos salen suaves desde la caja
 * hacia arriba y se desvanecen (~400ms). Van en una capa fija sin eventos
 * del puntero (no tapan nada); con "reducir movimiento" no salen.
 */
export function lanzarFragmentos(desde: Element | null) {
  if (!desde || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const r = desde.getBoundingClientRect();
  const capa = document.createElement("div");
  capa.className = "pc-chispas";
  capa.setAttribute("aria-hidden", "true");
  capa.style.left = `${r.left}px`;
  capa.style.top = `${r.top}px`;
  capa.style.width = `${r.width}px`;
  for (let i = 0; i < 7; i++) {
    const chispa = document.createElement("span");
    chispa.className = "pc-chispa";
    chispa.style.setProperty("--x", `${16 + Math.random() * 68}%`);
    chispa.style.setProperty("--dx", `${Math.round((Math.random() * 2 - 1) * 26)}px`);
    chispa.style.setProperty("--dy", `${-Math.round(34 + Math.random() * 40)}px`);
    chispa.style.setProperty("--g", `${Math.round((Math.random() * 2 - 1) * 120)}deg`);
    chispa.style.setProperty("--d", `${i * 16}ms`);
    // Solo constantes: el color sale de la lista de la marca
    chispa.innerHTML = `<svg viewBox="0 0 12 12" width="11" height="11"><path d="M6 1.6 10.6 10 1.4 10Z" fill="none" stroke="${COLORES[i % COLORES.length]}" stroke-width="1.4" stroke-linejoin="round"/></svg>`;
    capa.appendChild(chispa);
  }
  document.body.appendChild(capa);
  window.setTimeout(() => capa.remove(), 640);
}
