"use client";

import { useId } from "react";
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
const PUNTOS = 10;

/** Contorno del cuerpo: un círculo apenas ondulado, distinto en cada personaje (según su fase). */
function contorno(fase: number) {
  const p: [number, number][] = [];
  for (let i = 0; i < PUNTOS; i++) {
    const a = (i / PUNTOS) * Math.PI * 2;
    let r =
      R *
      (1 +
        0.032 * Math.sin(2 * a + fase) +
        0.022 * Math.sin(3 * a + fase * 1.7) +
        0.012 * Math.sin(5 * a + fase * 0.6));
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
 * Personaje de cada agente: un cuerpo redondo con cara, en SVG. Plano y
 * quieto: un color por personaje y tinta para los detalles (audífonos de
 * Lola, lentes de Clara, moño de Víctor, chongo con lápiz de Iris).
 * La versión que respira, parpadea y sigue el cursor está guardada en
 * componentes-pendientes/personaje-animado.
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

  return (
    <svg viewBox={avatar ? "28 26 144 154" : "0 0 200 210"} className={className} aria-hidden="true" focusable="false">
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

      <path d={contorno(fase)} fill={color} />

      {agente === "lola" ? (
        <g>
          <path d="M44 108 C44 46 156 46 156 108" fill="none" stroke={TINTA} strokeWidth="5" strokeLinecap="round" />
          <rect x="35" y="96" width="15" height="28" rx="7" fill={TINTA} />
          <rect x="150" y="96" width="15" height="28" rx="7" fill={TINTA} />
          <path d="M43 122 C46 142 62 148 78 146" fill="none" stroke={TINTA} strokeWidth="3" strokeLinecap="round" />
          <circle cx="81" cy="146" r="4.5" fill={TINTA} />
        </g>
      ) : null}

      {/* Ojos: blanco y pupila al centro */}
      {OJOS.map((x) => (
        <ellipse key={x} cx={x} cy={OJO_Y} rx={OJO_RX} ry={OJO_RY} fill="#fff" />
      ))}
      <g clipPath={`url(#${ojos})`}>
        {OJOS.map((x) => (
          <circle key={x} cx={x} cy={OJO_Y} r={PUPILA} fill={TINTA} />
        ))}
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

      {/* Lentes de Clara: mismas medidas que los ojos */}
      {agente === "clara" ? (
        <g fill="none" stroke={TINTA} strokeWidth="3.4" strokeLinecap="round">
          {OJOS.map((x) => (
            <circle key={x} cx={x} cy={OJO_Y} r="16.5" />
          ))}
          <path d={`M${OJOS[0] + 16.5} ${OJO_Y - 2} Q100 ${OJO_Y - 7} ${OJOS[1] - 16.5} ${OJO_Y - 2}`} />
        </g>
      ) : null}

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
