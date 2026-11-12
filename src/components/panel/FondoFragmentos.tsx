"use client";

import { useEffect, useRef } from "react";
import { EVENTO_TEMA } from "@/lib/tema";

/* =====================================================================
   Los fragmentos de Atendel como fondo del chat (Inicio y Conversación).
   Segunda versión (el dueño: "el fondo de los triangulitos mejóralo"):
   - Canvas 2D único (nada de WebGL en el panel): 120–220 triangulitos
     HUECOS, más chicos, en los colores de ATENDEL.md; ~60 en celular.
   - Van en 3 CORRIENTES curvas (a la izquierda, a la derecha y un arco
     arriba), como la estela de la portada, y derivan despacio a lo largo
     de su corriente; al llegar al final se desvanecen y vuelven a empezar.
   - 3 capas de profundidad: lejos (chicas, nítidas, tenues), en medio, y
     cerca (más grandes, apenas borrosas, pocas). El parallax con el mouse
     cambia por capa. Unas pocas titilan con la opacidad.
   - Dibujos precalculados: un triangulito por color y capa en un canvas
     aparte; cada cuadro solo los copia (drawImage) con su giro.
   - Nunca bajan el contraste: se apagan a 24px de todo lo que se lee
     (rampa de 72px). Pausa con la pestaña oculta y fuera de la vista; DPR
     máximo de 2; con "reducir movimiento" se pinta una vez y queda quieto.
   ===================================================================== */

const COLORES = ["#ffb829", "#8052ff", "#15846e", "#23d9b5", "#e040fb", "#3d7bff"];
/** Distancia mínima a una zona protegida, y la rampa en la que se desvanecen. */
const MARGEN = 24;
const RAMPA = 72;

type Punto = [number, number];
/** Las corrientes, en coordenadas de 0 a 1 del área del chat (curvas de Bézier cúbicas). */
const CORRIENTES: { p: [Punto, Punto, Punto, Punto]; ancho: number; peso: number }[] = [
  { p: [[0.03, 1.08], [0.24, 0.72], [-0.07, 0.34], [0.17, -0.08]], ancho: 70, peso: 0.4 },
  { p: [[0.98, 1.06], [0.75, 0.66], [1.07, 0.3], [0.84, -0.08]], ancho: 70, peso: 0.4 },
  { p: [[0.06, 0.17], [0.36, -0.07], [0.64, 0.25], [0.95, 0.04]], ancho: 42, peso: 0.2 },
  // Con `repartir` (la conversación): dos corrientes anchas por el centro, más tenues, para que no quede un hueco
  { p: [[0.3, 1.08], [0.58, 0.72], [0.36, 0.32], [0.62, -0.08]], ancho: 170, peso: 0.24 },
  { p: [[0.7, 1.08], [0.42, 0.68], [0.66, 0.3], [0.4, -0.08]], ancho: 170, peso: 0.2 },
];
/** Qué tan visibles son los fragmentos de las corrientes del centro (detrás del texto). */
const CENTRO_ALFA = 0.7;

/** Las 3 capas: tamaño, opacidad (oscuro / claro), parallax, rapidez y qué tanto se abren de la corriente. */
const CAPAS = [
  { parte: 0.55, tam: [2.5, 3.6], alfa: [0.26, 0.16], parallax: 2, rapidez: [0.004, 0.007], abre: 1.3 },
  { parte: 0.35, tam: [4, 5.6], alfa: [0.36, 0.22], parallax: 6, rapidez: [0.006, 0.01], abre: 1 },
  { parte: 0.1, tam: [7, 10], alfa: [0.3, 0.19], parallax: 14, rapidez: [0.009, 0.014], abre: 0.8 },
] as const;

type Pieza = { corriente: number; capa: number; t: number; d: number; vt: number; tam: number; color: number; giro: number; vg: number; a: number; titila: number; fase: number };
type Zona = { x: number; y: number; w: number; h: number; suave?: boolean };
/** En una banda (la columna de mensajes) los fragmentos no se apagan: se quedan a esta fuerza. */
const EN_BANDA = 0.4;

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

/** Punto y dirección de una curva de Bézier cúbica en t. */
function enCurva(p: [Punto, Punto, Punto, Punto], t: number, w: number, h: number) {
  const u = 1 - t;
  const x = u * u * u * p[0][0] + 3 * u * u * t * p[1][0] + 3 * u * t * t * p[2][0] + t * t * t * p[3][0];
  const y = u * u * u * p[0][1] + 3 * u * u * t * p[1][1] + 3 * u * t * t * p[2][1] + t * t * t * p[3][1];
  const dx = 3 * u * u * (p[1][0] - p[0][0]) + 6 * u * t * (p[2][0] - p[1][0]) + 3 * t * t * (p[3][0] - p[2][0]);
  const dy = 3 * u * u * (p[1][1] - p[0][1]) + 6 * u * t * (p[2][1] - p[1][1]) + 3 * t * t * (p[3][1] - p[2][1]);
  const lx = dx * w;
  const ly = dy * h;
  const l = Math.hypot(lx, ly) || 1;
  return { x: x * w, y: y * h, nx: -ly / l, ny: lx / l };
}

const suave = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Un triangulito de contorno por color y capa, dibujado una vez (los de cerca, apenas borrosos). */
function dibujosPrecalculados(dpr: number) {
  return CAPAS.map((capa, i) =>
    COLORES.map((color) => {
      const s = capa.tam[1] * 2; // se dibuja al doble y se reduce al copiar: queda nítido
      const lado = Math.ceil((s + 8) * dpr);
      const c = document.createElement("canvas");
      c.width = lado;
      c.height = lado;
      const x = c.getContext("2d");
      if (!x) return c;
      x.scale(dpr, dpr);
      x.translate(lado / dpr / 2, lado / dpr / 2);
      const alto = s * 0.866;
      const trazo = () => {
        x.beginPath();
        x.moveTo(0, (-alto * 2) / 3);
        x.lineTo(s / 2, alto / 3);
        x.lineTo(-s / 2, alto / 3);
        x.closePath();
      };
      x.strokeStyle = color;
      x.lineJoin = "round";
      if (i === 2) {
        // Cerca: un halo ancho y tenue bajo el trazo (se ve apenas borroso)
        x.globalAlpha = 0.32;
        x.lineWidth = 4.4;
        trazo();
        x.stroke();
        x.globalAlpha = 0.85;
      }
      x.lineWidth = i === 0 ? 2 : i === 1 ? 2.4 : 2.8; // al doble: 1–1.4px en pantalla
      trazo();
      x.stroke();
      return c;
    }),
  );
}

/**
 * `proteger`: lo que se lee (selectores), cada uno con su caja exacta.
 * `bandas`: columnas protegidas de arriba abajo (la columna de mensajes).
 */
export function FondoFragmentos({ proteger, bandas = [], repartir = false }: { proteger: string[]; bandas?: string[]; /** También por el centro (la conversación), no solo a los lados. */ repartir?: boolean }) {
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
    let reloj = 0;
    let piezas: Pieza[] = [];
    let zonas: Zona[] = [];
    let dibujos: HTMLCanvasElement[][] = [];
    const puntero = { x: 0, y: 0, tx: 0, ty: 0 };

    const medirZonas = () => {
      const r = canvas.getBoundingClientRect();
      const de = (sel: string, banda: boolean) =>
        [...document.querySelectorAll(sel)].map((el) => {
          const b = el.getBoundingClientRect();
          return banda
            ? { x: b.left - r.left - MARGEN, y: -1e5, w: b.width + 2 * MARGEN, h: 2e5, suave: true }
            : { x: b.left - r.left - MARGEN, y: b.top - r.top - MARGEN, w: b.width + 2 * MARGEN, h: b.height + 2 * MARGEN };
        });
      zonas = [...selectores[0].flatMap((s) => de(s, false)), ...selectores[1].flatMap((s) => de(s, true))];
    };

    const crear = () => {
      const r = azar(11);
      const celular = w < 600;
      const base = celular ? 60 : Math.max(120, Math.min(220, Math.round((w * h) / 5500)));
      const n = repartir ? Math.round(base * 1.4) : base;
      const corrientes = repartir ? (celular ? [0, 1, 3] : [0, 1, 2, 3, 4]) : celular ? [0, 1] : [0, 1, 2];
      piezas = Array.from({ length: n }, () => {
        const k = r();
        const capa = k < CAPAS[0].parte ? 0 : k < CAPAS[0].parte + CAPAS[1].parte ? 1 : 2;
        const c = CAPAS[capa];
        // La corriente, según su peso
        let q = r() * corrientes.reduce((t, i) => t + CORRIENTES[i].peso, 0);
        let corriente = corrientes[0];
        for (const i of corrientes) {
          q -= CORRIENTES[i].peso;
          if (q <= 0) {
            corriente = i;
            break;
          }
        }
        const normal = (r() + r() + r() - 1.5) / 1.5; // más tupidas al centro de la corriente
        return {
          corriente,
          capa,
          t: r(),
          d: normal * CORRIENTES[corriente].ancho * c.abre * (celular ? 0.6 : 1),
          vt: c.rapidez[0] + r() * (c.rapidez[1] - c.rapidez[0]),
          tam: c.tam[0] + r() * (c.tam[1] - c.tam[0]),
          color: Math.floor(r() * COLORES.length),
          giro: r() * Math.PI * 2,
          vg: (r() * 2 - 1) * 0.12,
          a: 0.75 + r() * 0.5,
          titila: r() < 0.08 ? 0.8 + r() * 0.9 : 0,
          fase: r() * Math.PI * 2,
        };
      });
      canvas.dataset.piezas = String(n);
    };

    /** 0 dentro de una zona protegida (o a menos de MARGEN), 1 lejos de todas. */
    const mascara = (x: number, y: number, radio: number) => {
      let duro = Infinity;
      let suave = Infinity;
      for (const z of zonas) {
        const dx = Math.max(z.x - x, 0, x - (z.x + z.w));
        const dy = Math.max(z.y - y, 0, y - (z.y + z.h));
        const d = Math.hypot(dx, dy);
        if (z.suave) suave = Math.min(suave, d);
        else duro = Math.min(duro, d);
      }
      const rampa = (d: number) => {
        d -= radio;
        if (d <= 0) return 0;
        if (d >= RAMPA) return 1;
        const t = d / RAMPA;
        return t * t * (3 - 2 * t);
      };
      return Math.min(rampa(duro), EN_BANDA + (1 - EN_BANDA) * rampa(suave));
    };

    const dibujar = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!dibujos.length) return;
      const claro = document.documentElement.dataset.tema === "claro" ? 1 : 0;
      for (const q of piezas) {
        const c = CAPAS[q.capa];
        const k = enCurva(CORRIENTES[q.corriente].p, q.t, w, h);
        const ondula = Math.sin(reloj * 0.35 + q.fase) * 3;
        const x = k.x + k.nx * (q.d + ondula) + puntero.x * c.parallax;
        const y = k.y + k.ny * (q.d + ondula) + puntero.y * c.parallax * 0.75;
        const m = mascara(x, y, q.tam * 0.6);
        if (m <= 0.01) continue;
        // Se desvanecen al empezar y al terminar su corriente (no aparecen de golpe)
        const extremos = suave(0, 0.07, q.t) * (1 - suave(0.93, 1, q.t));
        const titila = q.titila ? 0.55 + 0.45 * Math.sin(reloj * q.titila + q.fase) : 1;
        const alfa = Math.min(1, c.alfa[claro] * q.a) * m * extremos * titila * (q.corriente >= 3 ? CENTRO_ALFA : 1);
        if (alfa <= 0.01) continue;
        const img = dibujos[q.capa][q.color];
        const lado = (img.width / dpr) * (q.tam / (c.tam[1] * 2));
        const cos = Math.cos(q.giro) * dpr;
        const sen = Math.sin(q.giro) * dpr;
        ctx.globalAlpha = alfa;
        ctx.setTransform(cos, sen, -sen, cos, x * dpr, y * dpr);
        ctx.drawImage(img, -lado / 2, -lado / 2, lado, lado);
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
    };

    const quieto = () => reducir.matches;
    const paso = (t: number) => {
      raf = 0;
      if (!visible || document.hidden || quieto()) return;
      const dt = ultimo ? Math.min(0.05, (t - ultimo) / 1000) : 0;
      ultimo = t;
      reloj += dt;
      for (const q of piezas) {
        q.t += q.vt * dt;
        if (q.t > 1) q.t -= 1;
        q.giro += q.vg * dt;
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
      const dprNuevo = Math.min(2, window.devicePixelRatio || 1);
      w = r.width;
      h = r.height;
      if (dprNuevo !== dpr || !dibujos.length) {
        dpr = dprNuevo;
        dibujos = dibujosPrecalculados(dpr);
      }
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
  }, [claveZonas, repartir]);

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
