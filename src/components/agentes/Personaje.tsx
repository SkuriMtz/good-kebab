"use client";

import { useEffect, useId, useRef } from "react";
import type { IdAgente } from "@/lib/agentes";
import { PERSONAJES } from "@/lib/personajes";

export { PERSONAJES };

/**
 * La personalidad está en cómo se mueve cada uno (sin saltos ni gestos de más):
 * - Lola: atenta; sus ojos van rápido a donde estás.
 * - Clara: tranquila; mira con calma y respira despacio.
 * - Víctor: entusiasta; sigue al cursor con ganas y se inclina un poco más.
 * - Iris: concentrada; se mueve poco.
 */
const TEMPERAMENTO: Record<IdAgente, { ritmo: number; amplitud: number; ojos: number; inclina: number }> = {
  lola: { ritmo: 1.9, amplitud: 0.018, ojos: 0.2, inclina: 4 },
  clara: { ritmo: 1.1, amplitud: 0.012, ojos: 0.08, inclina: 2 },
  victor: { ritmo: 1.5, amplitud: 0.016, ojos: 0.15, inclina: 3.5 },
  iris: { ritmo: 1.0, amplitud: 0.01, ojos: 0.1, inclina: 1.5 },
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

/** Contorno del cuerpo en el instante t: un círculo apenas ondulado que cambia despacio. */
function contorno(t: number, fase: number) {
  const p: [number, number][] = [];
  for (let i = 0; i < PUNTOS; i++) {
    const a = (i / PUNTOS) * Math.PI * 2;
    let r =
      R *
      (1 +
        0.032 * Math.sin(2 * a + t * 0.6 + fase) +
        0.022 * Math.sin(3 * a - t * 0.8 + fase * 1.7) +
        0.012 * Math.sin(5 * a + t * 1.1 + fase * 0.6));
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

/** Mezcla un color hex con blanco (k>0) o negro (k<0): el volumen apenas perceptible. */
function tono(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k)));
  return `rgb(${c[0]} ${c[1]} ${c[2]})`;
}

/* ---------------------------------------------------------------------
   Un solo motor para todos los personajes de la página: un solo
   "pointermove", un solo requestAnimationFrame y un solo
   IntersectionObserver. Solo trabaja con los que se ven, y se detiene
   cuando los ojos ya llegaron a donde miran y no hay ninguno grande
   a la vista (los grandes respiran).
   --------------------------------------------------------------------- */

type Instancia = {
  svg: SVGSVGElement;
  pupilas: (SVGGElement | null)[];
  cuerpo: SVGGElement | null;
  forma: SVGPathElement | null;
  cara: SVGGElement | null;
  parpados: SVGGElement | null;
  sombra: SVGEllipseElement | null;
  grande: boolean;
  fase: number;
  temp: (typeof TEMPERAMENTO)[IdAgente];
  visible: boolean;
  ojo: { x: number; y: number };
  mira: { x: number; y: number };
  curioso: { x: number; y: number };
  proximoVistazo: number;
  proximoParpadeo: number;
  parpadeo: number;
  doble: boolean;
};

const mirada = { x: 0, y: 0, desde: 0, tipo: "nada" as "mouse" | "toque" | "nada" };
const instancias = new Set<Instancia>();
const porSvg = new WeakMap<Element, Instancia>();
let raf = 0;
let vuelta = 0;
let observador: IntersectionObserver | null = null;

function alMover(e: PointerEvent) {
  mirada.x = e.clientX;
  mirada.y = e.clientY;
  mirada.desde = performance.now();
  mirada.tipo = e.pointerType === "mouse" ? "mouse" : "toque";
  arrancar();
  // Con el dedo, al rato vuelven a mirar al frente
  if (mirada.tipo === "toque") {
    window.clearTimeout(vuelta);
    vuelta = window.setTimeout(arrancar, 3600);
  }
}

function arrancar() {
  if (!raf && instancias.size) raf = requestAnimationFrame(cuadro);
}

function cuadro(ahora: number) {
  raf = 0;
  let seguir = false;
  const t = ahora / 1000;
  const reciente = mirada.tipo !== "nada" && ahora - mirada.desde < (mirada.tipo === "mouse" ? 60000 : 3500);

  for (const p of instancias) {
    if (!p.visible) continue;

    // ¿A dónde mirar? Al cursor (o al dedo); si nadie interactúa, al frente
    // (los grandes echan un vistazo alrededor de vez en cuando).
    let mx = 0;
    let my = 0;
    if (reciente) {
      const r = p.svg.getBoundingClientRect();
      const dx = mirada.x - (r.left + r.width / 2);
      const dy = mirada.y - (r.top + r.height * 0.5);
      const d = Math.hypot(dx, dy) || 1;
      const f = Math.min(1, d / Math.max(140, r.width * 0.9));
      mx = (dx / d) * f;
      my = (dy / d) * f;
    } else if (p.grande) {
      if (ahora > p.proximoVistazo) {
        const quieto = Math.random() < 0.4;
        const a = Math.random() * Math.PI * 2;
        p.curioso = quieto ? { x: 0, y: 0 } : { x: Math.cos(a) * 0.7, y: Math.sin(a) * 0.5 };
        p.proximoVistazo = ahora + 1800 + Math.random() * 2800;
      }
      mx = p.curioso.x;
      my = p.curioso.y;
    }
    const k = p.grande ? p.temp.ojos : 0.18;
    p.ojo.x += (mx - p.ojo.x) * k;
    p.ojo.y += (my - p.ojo.y) * k;
    if (Math.abs(mx - p.ojo.x) > 0.002 || Math.abs(my - p.ojo.y) > 0.002) seguir = true;

    // Pupilas dentro del ojo (una elipse): nunca se salen
    let px = p.ojo.x * MAX_X;
    let py = p.ojo.y * MAX_Y;
    const e = (px * px) / (MAX_X * MAX_X) + (py * py) / (MAX_Y * MAX_Y);
    if (e > 1) {
      const s = 1 / Math.sqrt(e);
      px *= s;
      py *= s;
    }
    const mov = `translate(${px.toFixed(2)} ${py.toFixed(2)})`;
    for (const g of p.pupilas) g?.setAttribute("transform", mov);

    if (!p.grande) continue;
    seguir = true;

    // La cara se asoma un poquito hacia donde mira; el cuerpo respira y se inclina
    p.mira.x += (mx - p.mira.x) * 0.06;
    p.mira.y += (my - p.mira.y) * 0.06;
    p.cara?.setAttribute("transform", `translate(${(p.mira.x * 2.6).toFixed(2)} ${(p.mira.y * 1.8).toFixed(2)})`);
    const resp = Math.sin(t * p.temp.ritmo + p.fase);
    const sy = 1 + p.temp.amplitud * resp;
    const sx = 1 - p.temp.amplitud * 0.65 * resp;
    const giro = p.mira.x * p.temp.inclina;
    p.cuerpo?.setAttribute(
      "transform",
      `rotate(${giro.toFixed(2)} ${CX} 172) translate(${CX} 172) scale(${sx.toFixed(4)} ${sy.toFixed(4)}) translate(${-CX} -172)`,
    );
    p.sombra?.setAttribute("rx", (46 * (1 - 0.03 * resp)).toFixed(2));
    p.forma?.setAttribute("d", contorno(t, p.fase));

    // Parpadeo natural: rápido y a ratos distintos (a veces doble)
    if (p.parpadeo < 0 && ahora > p.proximoParpadeo) {
      p.parpadeo = ahora;
      p.doble = Math.random() < 0.18;
    }
    let abierto = 1;
    if (p.parpadeo >= 0) {
      const dur = p.doble ? 420 : 190;
      const fase1 = ((ahora - p.parpadeo) / 190) % 1;
      abierto = 1 - Math.sin(fase1 * Math.PI) * 0.92;
      if (ahora - p.parpadeo > dur) {
        p.parpadeo = -1;
        abierto = 1;
        p.proximoParpadeo = ahora + 2600 + Math.random() * 4400;
      }
    }
    p.parpados?.setAttribute("transform", `translate(0 ${OJO_Y}) scale(1 ${abierto.toFixed(3)}) translate(0 ${-OJO_Y})`);
  }

  if (seguir) raf = requestAnimationFrame(cuadro);
}

function registrar(p: Instancia) {
  if (instancias.size === 0) {
    window.addEventListener("pointermove", alMover, { passive: true });
    window.addEventListener("pointerdown", alMover, { passive: true });
    // Al bajar, el personaje se mueve bajo el cursor: vuelve a apuntar
    window.addEventListener("scroll", arrancar, { passive: true });
  }
  if (!observador) {
    observador = new IntersectionObserver((entradas) => {
      for (const en of entradas) {
        const inst = porSvg.get(en.target);
        if (inst) inst.visible = en.isIntersecting;
      }
      arrancar();
    });
  }
  instancias.add(p);
  porSvg.set(p.svg, p);
  observador.observe(p.svg);
  return () => {
    observador?.unobserve(p.svg);
    instancias.delete(p);
    if (instancias.size === 0) {
      window.removeEventListener("pointermove", alMover);
      window.removeEventListener("pointerdown", alMover);
      window.removeEventListener("scroll", arrancar);
      window.clearTimeout(vuelta);
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };
}

/**
 * Personaje de cada agente: un cuerpo redondo con cara, en SVG. Un color por
 * personaje (con un degradado apenas perceptible que le da volumen) y tinta
 * para los detalles: audífonos de Lola, lentes de Clara, moño de Víctor,
 * chongo con lápiz de Iris. Sin adornos de más: la personalidad está en el
 * movimiento.
 * - En todos los tamaños, las pupilas siguen al cursor (o al dedo) sin salirse del ojo.
 * - Los grandes (sin `avatar`) además respiran despacio, su forma cambia
 *   apenas, se inclinan hacia donde miran, parpadean y tienen una sombra suave.
 * - Con "reducir movimiento" se quedan quietos y mirando al frente.
 */
export function Personaje({
  agente,
  className = "",
  avatar = false,
}: {
  agente: IdAgente;
  className?: string;
  /** Recortado al cuerpo y sin sombra, para usarlo chiquito (chat, menús, marcas). */
  avatar?: boolean;
}) {
  const { color, fase } = PERSONAJES[agente];
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
    if (!svg || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ahora = performance.now();
    return registrar({
      svg,
      pupilas: pupilasRef.current,
      cuerpo: cuerpoRef.current,
      forma: formaRef.current,
      cara: caraRef.current,
      parpados: parpadosRef.current,
      sombra: sombraRef.current,
      grande: !avatar,
      fase,
      temp: TEMPERAMENTO[agente],
      visible: false,
      ojo: { x: 0, y: 0 },
      mira: { x: 0, y: 0 },
      curioso: { x: 0, y: 0 },
      proximoVistazo: ahora + 1500 + fase * 400,
      proximoParpadeo: ahora + 1200 + fase * 700,
      parpadeo: -1,
      doble: false,
    });
  }, [agente, avatar, fase]);

  const g = (n: string) => `${n}-${id}`;

  return (
    <svg ref={svgRef} viewBox={avatar ? "28 26 144 154" : "0 0 200 210"} className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={g("cuerpo")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tono(color, 0.12)} />
          <stop offset="100%" stopColor={tono(color, -0.1)} />
        </linearGradient>
        {avatar ? null : (
          <radialGradient id={g("sombra")} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#000" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#000" stopOpacity="0" />
          </radialGradient>
        )}
        <clipPath id={g("ojos")}>
          {OJOS.map((x) => (
            <ellipse key={x} cx={x} cy={OJO_Y} rx={OJO_RX} ry={OJO_RY} />
          ))}
        </clipPath>
      </defs>

      {/* Sombra en el piso (respira al revés que el cuerpo) */}
      {avatar ? null : <ellipse ref={sombraRef} cx={CX} cy="177" rx="46" ry="7" fill={`url(#${g("sombra")})`} />}

      {/* Todo el personaje: cuerpo, cara y accesorios se mueven juntos */}
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
          {agente === "lola" ? <path d="M88 127 Q100 140 112 127" fill="none" stroke={TINTA} strokeWidth="3.4" strokeLinecap="round" /> : null}
          {agente === "clara" ? <path d="M92 130 Q100 136 108 130" fill="none" stroke={TINTA} strokeWidth="3.2" strokeLinecap="round" /> : null}
          {agente === "victor" ? <path d="M85 126 Q100 143 115 126" fill="none" stroke={TINTA} strokeWidth="3.4" strokeLinecap="round" /> : null}
          {agente === "iris" ? <path d="M93 131 Q101 135 109 129" fill="none" stroke={TINTA} strokeWidth="3.2" strokeLinecap="round" /> : null}

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
