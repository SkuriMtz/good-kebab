"use client";

import { useEffect, useId, useRef } from "react";
import type { IdAgente } from "@/lib/agentes";

/** Color y rasgo de cada personaje. Los colores se ven bien sobre fondo claro y oscuro. */
export const PERSONAJES: Record<IdAgente, { color: string; rasgo: string; fase: number }> = {
  lola: { color: "#ff8a6b", rasgo: "audífonos con micrófono", fase: 0.4 },
  clara: { color: "#7fb2ff", rasgo: "lentes redondos", fase: 2.1 },
  victor: { color: "#5fd09f", rasgo: "moño", fase: 3.7 },
  iris: { color: "#f6c64a", rasgo: "chongo con lápiz", fase: 5.2 },
};

/**
 * La personalidad está en cómo se mueve cada uno:
 * - Lola: inquieta y atenta; respira rápido y sus ojos van directo al cursor.
 * - Clara: tranquila; respira despacio y mira con calma.
 * - Víctor: entusiasta; sigue al cursor con ganas y se inclina más.
 * - Iris: concentrada; se mueve poco y con calma.
 */
const TEMPERAMENTO: Record<
  IdAgente,
  { ritmo: number; amplitud: number; ojos: number; inclina: number }
> = {
  lola: { ritmo: 2.1, amplitud: 0.032, ojos: 0.2, inclina: 6 },
  clara: { ritmo: 1.15, amplitud: 0.02, ojos: 0.07, inclina: 3 },
  victor: { ritmo: 1.6, amplitud: 0.026, ojos: 0.15, inclina: 5 },
  iris: { ritmo: 1.0, amplitud: 0.018, ojos: 0.1, inclina: 2.5 },
};

const TINTA = "#1c1b1f";

// Geometría (viewBox 0 0 200 210). Ojos, lentes y boca salen de estas mismas medidas.
const CX = 100;
const CY = 114;
const R = 62;
const OJO_Y = 106;
const OJOS = [80, 120] as const;
const OJO_RX = 11.5;
const OJO_RY = 13.5;
const PUPILA = 6;
const MAX_X = OJO_RX - PUPILA - 1.6;
const MAX_Y = OJO_RY - PUPILA - 1.6;
const PUNTOS = 10;

/* ---------- Dónde está la mirada (compartido por todos los personajes) ---------- */

type Mirada = { x: number; y: number; desde: number; tipo: "mouse" | "toque" | "nada" };
const mirada: Mirada = { x: 0, y: 0, desde: 0, tipo: "nada" };
let escuchando = 0;
const alMover = (e: PointerEvent) => {
  mirada.x = e.clientX;
  mirada.y = e.clientY;
  mirada.desde = performance.now();
  mirada.tipo = e.pointerType === "mouse" ? "mouse" : "toque";
};
function escuchar() {
  if (escuchando++ === 0) {
    window.addEventListener("pointermove", alMover, { passive: true });
    window.addEventListener("pointerdown", alMover, { passive: true });
  }
  return () => {
    if (--escuchando === 0) {
      window.removeEventListener("pointermove", alMover);
      window.removeEventListener("pointerdown", alMover);
    }
  };
}

/* ---------- Forma orgánica ---------- */

/** Contorno del blob en el instante t: un círculo que respira con varias ondas suaves. */
function contorno(t: number, fase: number) {
  const p: [number, number][] = [];
  for (let i = 0; i < PUNTOS; i++) {
    const a = (i / PUNTOS) * Math.PI * 2;
    let r =
      R *
      (1 +
        0.032 * Math.sin(2 * a + t * 0.9 + fase) +
        0.022 * Math.sin(3 * a - t * 1.25 + fase * 1.7) +
        0.012 * Math.sin(5 * a + t * 1.6 + fase * 0.6));
    const abajo = Math.sin(a);
    if (abajo > 0) r *= 1 - 0.07 * abajo; // base un poco más plana: se "sienta"
    p.push([CX + r * Math.cos(a), CY + r * abajo * 0.96]);
  }
  // Catmull-Rom cerrado → curvas Bézier
  let d = `M${p[0][0].toFixed(2)} ${p[0][1].toFixed(2)}`;
  for (let i = 0; i < PUNTOS; i++) {
    const p0 = p[(i - 1 + PUNTOS) % PUNTOS];
    const p1 = p[i];
    const p2 = p[(i + 1) % PUNTOS];
    const p3 = p[(i + 2) % PUNTOS];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  return d + "Z";
}

/** Mezcla un color hex con blanco (k>0) o negro (k<0). */
function tono(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k)));
  return `rgb(${c[0]} ${c[1]} ${c[2]})`;
}

/**
 * Personaje de cada agente: un blob con cara, hecho en SVG.
 * Minimalista: un color por personaje, tinta para los detalles y nada más.
 * La calidad está en el movimiento:
 * - El cuerpo cambia de forma despacio y respira (cada uno a su ritmo), se
 *   inclina hacia donde mira y tiene una sombra suave que respira con él.
 * - Las pupilas siguen al cursor (o al dedo en celular) sin salirse del ojo,
 *   con un poco de retraso; si nadie interactúa, miran alrededor de vez en cuando.
 * - Parpadea a ratos distintos en cada uno.
 * - Los accesorios están dentro del mismo grupo que el cuerpo: se mueven y
 *   respiran con él, y los lentes usan las mismas medidas que los ojos.
 * Con "reducir movimiento" se queda quieto y mirando al frente.
 */
export function Personaje({ agente, className = "" }: { agente: IdAgente; className?: string }) {
  const { color, fase } = PERSONAJES[agente];
  const temp = TEMPERAMENTO[agente];
  const id = useId().replace(/:/g, "");
  const svgRef = useRef<SVGSVGElement>(null);
  const cuerpoRef = useRef<SVGGElement>(null);
  const formaRef = useRef<SVGPathElement>(null);
  const sombraRef = useRef<SVGEllipseElement>(null);
  const caraRef = useRef<SVGGElement>(null);
  const pupilasRef = useRef<(SVGGElement | null)[]>([]);
  const parpadosRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const dejar = escuchar();

    let raf = 0;
    let visible = false;
    const t0 = performance.now() - fase * 1000;
    // Mirada actual (interpolada) y objetivo, en unidades de -1 a 1
    const ojo = { x: 0, y: 0 };
    const cara = { x: 0, y: 0 };
    // Mirar alrededor cuando nadie interactúa
    let curioso = { x: 0, y: 0 };
    let proximoVistazo = 0;
    // Parpadeo
    let proximoParpadeo = performance.now() + 1200 + Math.random() * 3500;
    let parpadeo = -1; // inicio del parpadeo en curso
    let doble = false;

    const cuadro = (ahora: number) => {
      raf = requestAnimationFrame(cuadro);
      if (!visible) return;
      const t = (ahora - t0) / 1000;

      // ¿A dónde mirar?
      let mx = 0;
      let my = 0;
      const reciente = ahora - mirada.desde < (mirada.tipo === "mouse" ? 60000 : 3500);
      if (mirada.tipo !== "nada" && reciente) {
        const r = svg.getBoundingClientRect();
        const dx = mirada.x - (r.left + r.width / 2);
        const dy = mirada.y - (r.top + r.height * (OJO_Y / 210));
        const d = Math.hypot(dx, dy) || 1;
        const f = Math.min(1, d / Math.max(140, r.width * 0.9));
        mx = (dx / d) * f;
        my = (dy / d) * f;
      } else {
        if (ahora > proximoVistazo) {
          const quieto = Math.random() < 0.3;
          const a = Math.random() * Math.PI * 2;
          curioso = quieto ? { x: 0, y: 0 } : { x: Math.cos(a) * 0.85, y: Math.sin(a) * 0.7 };
          proximoVistazo = ahora + 1400 + Math.random() * 2600;
        }
        mx = curioso.x;
        my = curioso.y;
      }
      ojo.x += (mx - ojo.x) * temp.ojos;
      ojo.y += (my - ojo.y) * temp.ojos;
      cara.x += (mx - cara.x) * 0.06;
      cara.y += (my - cara.y) * 0.06;

      // Pupilas dentro del ojo (elipse): nunca se salen
      let px = ojo.x * MAX_X;
      let py = ojo.y * MAX_Y;
      const e = (px * px) / (MAX_X * MAX_X) + (py * py) / (MAX_Y * MAX_Y);
      if (e > 1) {
        const k = 1 / Math.sqrt(e);
        px *= k;
        py *= k;
      }
      for (const p of pupilasRef.current) p?.setAttribute("transform", `translate(${px.toFixed(2)} ${py.toFixed(2)})`);
      // Toda la cara (ojos, boca, lentes) se asoma un poquito hacia donde mira
      caraRef.current?.setAttribute("transform", `translate(${(cara.x * 3.2).toFixed(2)} ${(cara.y * 2.2).toFixed(2)})`);

      // Respira (cada uno a su ritmo) y se inclina hacia donde mira
      const resp = Math.sin(t * temp.ritmo + fase);
      const sy = 1 + temp.amplitud * resp;
      const sx = 1 - temp.amplitud * 0.65 * resp;
      const giro = cara.x * temp.inclina;
      cuerpoRef.current?.setAttribute(
        "transform",
        `rotate(${giro.toFixed(2)} ${CX} 172) translate(${CX} 172) scale(${sx.toFixed(4)} ${sy.toFixed(4)}) translate(${-CX} -172)`,
      );
      sombraRef.current?.setAttribute("rx", (46 * (1 + 0.04 * -resp)).toFixed(2));
      formaRef.current?.setAttribute("d", contorno(t, fase));

      // Parpadeo natural: rápido, a veces doble
      if (parpadeo < 0 && ahora > proximoParpadeo) {
        parpadeo = ahora;
        doble = Math.random() < 0.18;
      }
      let abierto = 1;
      if (parpadeo >= 0) {
        const dur = doble ? 420 : 190;
        const k = (ahora - parpadeo) / 190;
        const fase1 = k % 1;
        abierto = 1 - Math.sin(Math.min(1, fase1) * Math.PI) * 0.92;
        if (ahora - parpadeo > dur) {
          parpadeo = -1;
          abierto = 1;
          proximoParpadeo = ahora + 2200 + Math.random() * 4200;
        }
      }
      parpadosRef.current?.setAttribute(
        "transform",
        `translate(0 ${OJO_Y}) scale(1 ${abierto.toFixed(3)}) translate(0 ${-OJO_Y})`,
      );
    };

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    });
    io.observe(svg);
    raf = requestAnimationFrame(cuadro);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      dejar();
    };
  }, [fase, temp]);

  const g = (n: string) => `${n}-${id}`;

  return (
    <svg ref={svgRef} viewBox="0 0 200 210" className={className} aria-hidden="true" focusable="false">
      <defs>
        {/* Un solo color con un degradado apenas perceptible para dar volumen */}
        <linearGradient id={g("cuerpo")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tono(color, 0.12)} />
          <stop offset="100%" stopColor={tono(color, -0.1)} />
        </linearGradient>
        <radialGradient id={g("sombra")} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <clipPath id={g("ojos")}>
          {OJOS.map((x) => (
            <ellipse key={x} cx={x} cy={OJO_Y} rx={OJO_RX} ry={OJO_RY} />
          ))}
        </clipPath>
      </defs>

      {/* Sombra en el piso (respira al revés que el cuerpo) */}
      <ellipse ref={sombraRef} cx={CX} cy="177" rx="46" ry="7" fill={`url(#${g("sombra")})`} />

      {/* Todo el personaje: cuerpo, cara y accesorios en el mismo grupo */}
      <g ref={cuerpoRef}>
        {agente === "iris" ? (
          <>
            <circle cx={CX + 6} cy="54" r="19" fill={`url(#${g("cuerpo")})`} />
            {/* Lápiz atravesado en el chongo: un solo trazo */}
            <path d={`M${CX - 16} 70 L${CX + 30} 38`} stroke={TINTA} strokeWidth="4.5" strokeLinecap="round" />
          </>
        ) : null}

        <path ref={formaRef} d={contorno(0, fase)} fill={`url(#${g("cuerpo")})`} />

        {agente === "lola" ? (
          <g>
            <path d="M44 108 C44 46 156 46 156 108" fill="none" stroke={TINTA} strokeWidth="5" strokeLinecap="round" />
            <rect x="35" y="96" width="15" height="28" rx="7" fill={TINTA} />
            <rect x="150" y="96" width="15" height="28" rx="7" fill={TINTA} />
            <path d="M43 122 C46 142 62 148 78 146" fill="none" stroke={TINTA} strokeWidth="3" strokeLinecap="round" />
            <circle cx="81" cy="146" r="4.5" fill={TINTA} />
          </g>
        ) : null}

        <g ref={caraRef}>
          {/* Ojos: blanco, pupila que se mueve dentro y párpado al parpadear */}
          <g ref={parpadosRef}>
            {OJOS.map((x) => (
              <ellipse key={x} cx={x} cy={OJO_Y} rx={OJO_RX} ry={OJO_RY} fill="#fff" />
            ))}
            <g clipPath={`url(#${g("ojos")})`}>
              {OJOS.map((x, i) => (
                <g key={x} ref={(el) => void (pupilasRef.current[i] = el)}>
                  <circle cx={x} cy={OJO_Y} r={PUPILA} fill={TINTA} />
                </g>
              ))}
            </g>
          </g>

          {/* Boca: un trazo, distinto para cada uno */}
          {agente === "lola" ? (
            <path d="M88 127 Q100 140 112 127" fill="none" stroke={TINTA} strokeWidth="3.4" strokeLinecap="round" />
          ) : null}
          {agente === "clara" ? (
            <path d="M92 130 Q100 136 108 130" fill="none" stroke={TINTA} strokeWidth="3.2" strokeLinecap="round" />
          ) : null}
          {agente === "victor" ? (
            <path d="M85 126 Q100 143 115 126" fill="none" stroke={TINTA} strokeWidth="3.4" strokeLinecap="round" />
          ) : null}
          {agente === "iris" ? (
            <path d="M93 131 Q101 135 109 129" fill="none" stroke={TINTA} strokeWidth="3.2" strokeLinecap="round" />
          ) : null}

          {/* Lentes de Clara: mismas medidas que los ojos, en el mismo grupo que la cara */}
          {agente === "clara" ? (
            <g fill="none" stroke={TINTA} strokeWidth="3.4" strokeLinecap="round">
              {OJOS.map((x) => (
                <circle key={x} cx={x} cy={OJO_Y} r="16.5" />
              ))}
              <path d={`M${OJOS[0] + 16.5} ${OJO_Y - 2} Q100 ${OJO_Y - 7} ${OJOS[1] - 16.5} ${OJO_Y - 2}`} />
            </g>
          ) : null}
        </g>

        {agente === "victor" ? (
          <g fill={TINTA} stroke={TINTA} strokeWidth="2" strokeLinejoin="round">
            <path d="M100 158 L82 149 Q79 158 82 167 Z" />
            <path d="M100 158 L118 149 Q121 158 118 167 Z" />
            <circle cx="100" cy="158" r="5" />
          </g>
        ) : null}
      </g>
    </svg>
  );
}
