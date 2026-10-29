"use client";

import { useEffect, useId, useRef } from "react";
import type { IdAgente } from "@/lib/agentes";
import { PERSONAJES } from "@/lib/personajes";

export { PERSONAJES };

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
/** Debajo de este ancho (avatares del chat, pestañas) el personaje se queda quieto: no se notaría. */
const ANCHO_MINIMO_VIVO = 44;

/**
 * La personalidad está en cómo mira cada uno (no en adornos):
 * Lola va directo al cursor, Clara mira con calma, Víctor sigue con ganas,
 * Iris apenas se distrae. "forma" es qué tan rápido cambia su contorno.
 */
const TEMPERAMENTO: Record<IdAgente, { ojos: number; forma: number }> = {
  lola: { ojos: 0.2, forma: 1.15 },
  clara: { ojos: 0.08, forma: 0.75 },
  victor: { ojos: 0.15, forma: 1 },
  iris: { ojos: 0.1, forma: 0.65 },
};

/* ---------- Hacia dónde mirar (un solo oyente para todos los personajes) ---------- */

type Mirada = { x: number; y: number; desde: number; tipo: "mouse" | "toque" | "nada" };
const mirada: Mirada = { x: 0, y: 0, desde: 0, tipo: "nada" };
let oyentes = 0;
const alMover = (e: PointerEvent) => {
  mirada.x = e.clientX;
  mirada.y = e.clientY;
  mirada.desde = performance.now();
  mirada.tipo = e.pointerType === "mouse" ? "mouse" : "toque";
};
function escuchar() {
  if (oyentes++ === 0) {
    window.addEventListener("pointermove", alMover, { passive: true });
    window.addEventListener("pointerdown", alMover, { passive: true });
  }
  return () => {
    if (--oyentes === 0) {
      window.removeEventListener("pointermove", alMover);
      window.removeEventListener("pointerdown", alMover);
    }
  };
}

/* ---------- Forma orgánica ---------- */

/** Contorno del cuerpo en el instante t: un círculo apenas ondulado que cambia despacio. */
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

/**
 * Personaje de cada agente: un cuerpo redondo con cara, en SVG. Un color por
 * personaje y tinta para los detalles (audífonos de Lola, lentes de Clara,
 * moño de Víctor, chongo con lápiz de Iris). Sin saltos ni adornos: la vida
 * está en tres cosas pequeñas.
 * - Las pupilas siguen al cursor (o al dedo, unos segundos) sin salirse del
 *   ojo, con el retraso de cada temperamento; la cara se asoma apenas hacia
 *   allá. Si nadie interactúa, miran alrededor de vez en cuando.
 * - El contorno cambia de forma muy despacio (forma orgánica).
 * - Parpadea a ratos distintos.
 * Solo se anima cuando está a la vista y mide 44px o más (de chiquito, en el
 * chat o en las pestañas, se queda quieto). Con "reducir movimiento", quieto
 * y mirando al frente. La API no cambia (la usa también el panel).
 */
export function Personaje({
  agente,
  className = "",
  avatar = false,
}: {
  agente: IdAgente;
  className?: string;
  /** Recortado al cuerpo, para usarlo chiquito (chat, menús, marcas). */
  avatar?: boolean;
}) {
  const { color, fase } = PERSONAJES[agente];
  const ojos = `ojos-${useId().replace(/:/g, "")}`;
  const svgRef = useRef<SVGSVGElement>(null);
  const formaRef = useRef<SVGPathElement>(null);
  const caraRef = useRef<SVGGElement>(null);
  const parpadoRef = useRef<SVGGElement>(null);
  const pupilasRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || typeof ResizeObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const temp = TEMPERAMENTO[agente];
    let dejar: (() => void) | null = null;
    let raf = 0;
    let visible = false;
    let vivo = false;
    const t0 = performance.now() - fase * 1000;
    const ojo = { x: 0, y: 0 };
    const cara = { x: 0, y: 0 };
    let curioso = { x: 0, y: 0 };
    let proximoVistazo = 0;
    let proximoParpadeo = performance.now() + 1500 + Math.random() * 3500;
    let parpadeo = -1;
    let doble = false;

    const cuadro = (ahora: number) => {
      raf = 0;
      if (!visible || !vivo) return;
      raf = requestAnimationFrame(cuadro);
      const t = ((ahora - t0) / 1000) * temp.forma;

      // ¿A dónde mirar?
      let mx = curioso.x;
      let my = curioso.y;
      const reciente = ahora - mirada.desde < (mirada.tipo === "mouse" ? 60000 : 3500);
      if (mirada.tipo !== "nada" && reciente) {
        const r = svg.getBoundingClientRect();
        const dx = mirada.x - (r.left + r.width / 2);
        const dy = mirada.y - (r.top + r.height * 0.5);
        const d = Math.hypot(dx, dy) || 1;
        const f = Math.min(1, d / Math.max(140, r.width * 0.9));
        mx = (dx / d) * f;
        my = (dy / d) * f;
      } else if (ahora > proximoVistazo) {
        const quieto = Math.random() < 0.35;
        const a = Math.random() * Math.PI * 2;
        curioso = quieto ? { x: 0, y: 0 } : { x: Math.cos(a) * 0.8, y: Math.sin(a) * 0.6 };
        proximoVistazo = ahora + 1600 + Math.random() * 2800;
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
      pupilasRef.current?.setAttribute("transform", `translate(${px.toFixed(2)} ${py.toFixed(2)})`);
      caraRef.current?.setAttribute("transform", `translate(${(cara.x * 3).toFixed(2)} ${(cara.y * 2).toFixed(2)})`);
      formaRef.current?.setAttribute("d", contorno(t, fase));

      // Parpadeo: rápido, a veces doble
      if (parpadeo < 0 && ahora > proximoParpadeo) {
        parpadeo = ahora;
        doble = Math.random() < 0.18;
      }
      let abierto = 1;
      if (parpadeo >= 0) {
        const k = ((ahora - parpadeo) / 180) % 1;
        abierto = 1 - Math.sin(k * Math.PI) * 0.92;
        if (ahora - parpadeo > (doble ? 360 : 180)) {
          parpadeo = -1;
          abierto = 1;
          proximoParpadeo = ahora + 2400 + Math.random() * 4200;
        }
      }
      parpadoRef.current?.setAttribute("transform", `translate(0 ${OJO_Y}) scale(1 ${abierto.toFixed(3)}) translate(0 ${-OJO_Y})`);
    };

    const arrancar = () => {
      if (!raf && visible && vivo) raf = requestAnimationFrame(cuadro);
    };
    // Solo los personajes grandes se mueven (el tamaño puede cambiar con la pantalla)
    const ro = new ResizeObserver(([entrada]) => {
      vivo = entrada.contentRect.width >= ANCHO_MINIMO_VIVO;
      if (vivo && !dejar) dejar = escuchar();
      arrancar();
    });
    const io = new IntersectionObserver(([entrada]) => {
      visible = entrada.isIntersecting;
      arrancar();
    });
    ro.observe(svg);
    io.observe(svg);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      dejar?.();
    };
  }, [agente, fase]);

  return (
    <svg ref={svgRef} viewBox={avatar ? "28 26 144 154" : "0 0 200 210"} className={className} aria-hidden="true" focusable="false">
      <defs>
        <clipPath id={ojos}>
          {OJOS.map((x) => (
            <ellipse key={x} cx={x} cy={OJO_Y} rx={OJO_RX} ry={OJO_RY} />
          ))}
        </clipPath>
      </defs>

      {agente === "iris" ? (
        <>
          <circle cx={CX + 6} cy="54" r="19" fill={color} />
          {/* Lápiz atravesado en el chongo: un solo trazo */}
          <path d={`M${CX - 16} 70 L${CX + 30} 38`} stroke={TINTA} strokeWidth="4.5" strokeLinecap="round" />
        </>
      ) : null}

      <path ref={formaRef} d={contorno(0, fase)} fill={color} />

      {agente === "lola" ? (
        <g>
          <path d="M44 108 C44 46 156 46 156 108" fill="none" stroke={TINTA} strokeWidth="5" strokeLinecap="round" />
          <rect x="35" y="96" width="15" height="28" rx="7" fill={TINTA} />
          <rect x="150" y="96" width="15" height="28" rx="7" fill={TINTA} />
          <path d="M43 122 C46 142 62 148 78 146" fill="none" stroke={TINTA} strokeWidth="3" strokeLinecap="round" />
          <circle cx="81" cy="146" r="4.5" fill={TINTA} />
        </g>
      ) : null}

      {/* La cara (ojos, boca y lentes) se asoma un poquito hacia donde mira */}
      <g ref={caraRef}>
        <g ref={parpadoRef}>
          {OJOS.map((x) => (
            <ellipse key={x} cx={x} cy={OJO_Y} rx={OJO_RX} ry={OJO_RY} fill="#fff" />
          ))}
          <g clipPath={`url(#${ojos})`}>
            <g ref={pupilasRef}>
              {OJOS.map((x) => (
                <circle key={x} cx={x} cy={OJO_Y} r={PUPILA} fill={TINTA} />
              ))}
            </g>
          </g>
        </g>

        {/* Boca: un trazo, distinto para cada uno */}
        {agente === "lola" ? <path d="M88 127 Q100 140 112 127" fill="none" stroke={TINTA} strokeWidth="3.4" strokeLinecap="round" /> : null}
        {agente === "clara" ? <path d="M92 130 Q100 136 108 130" fill="none" stroke={TINTA} strokeWidth="3.2" strokeLinecap="round" /> : null}
        {agente === "victor" ? <path d="M85 126 Q100 143 115 126" fill="none" stroke={TINTA} strokeWidth="3.4" strokeLinecap="round" /> : null}
        {agente === "iris" ? <path d="M93 131 Q101 135 109 129" fill="none" stroke={TINTA} strokeWidth="3.2" strokeLinecap="round" /> : null}

        {/* Lentes de Clara: mismas medidas que los ojos */}
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
    </svg>
  );
}
