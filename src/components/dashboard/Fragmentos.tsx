import type { CSSProperties } from "react";

/**
 * Los fragmentos de Atendel en el panel: triangulitos de contorno (1 a 2px)
 * en los colores del cerebro. SVG ligero, nada de WebGL. Cada uno deriva
 * unos pocos píxeles y grados, muy despacio (solo transform); con "reducir
 * movimiento" se quedan quietos (src/estilos/panel.css). Las posiciones
 * salen de una semilla: el mismo lugar en el servidor y en el navegador.
 */

/** Los colores del cerebro. */
export const COLORES_FRAGMENTO = ["#ffb829", "#8052ff", "#15846e", "#23d9b5", "#e040fb", "#3d7bff"] as const;

/** Números al azar repetibles (mulberry32): la misma semilla da los mismos fragmentos. */
function azar(semilla: number) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Fragmento = { x: number; y: number; tam: number; giro: number; color: string; trazo: number; opacidad: number; dx: number; dy: number; dg: number; dur: number; retraso: number };

function crear(cantidad: number, semilla: number, tamMin: number, tamMax: number): Fragmento[] {
  const r = azar(semilla);
  return Array.from({ length: cantidad }, (_, i) => ({
    x: Math.round(r() * 1000) / 10,
    y: Math.round(r() * 1000) / 10,
    tam: Math.round(tamMin + r() * (tamMax - tamMin)),
    giro: Math.round(r() * 360),
    color: COLORES_FRAGMENTO[(i + semilla) % COLORES_FRAGMENTO.length],
    trazo: Math.round((1 + r()) * 100) / 100,
    opacidad: Math.round((0.5 + r() * 0.3) * 100) / 100,
    dx: Math.round((r() * 2 - 1) * 6),
    dy: Math.round((r() * 2 - 1) * 6),
    dg: Math.round((r() * 2 - 1) * 18),
    dur: Math.round(14 + r() * 10),
    retraso: -Math.round(r() * 20),
  }));
}

export function Fragmentos({
  cantidad = 9,
  semilla = 7,
  tamMin = 8,
  tamMax = 22,
  className = "",
}: {
  cantidad?: number;
  semilla?: number;
  tamMin?: number;
  tamMax?: number;
  className?: string;
}) {
  const lista = crear(cantidad, semilla, tamMin, tamMax);
  return (
    <span className={`pnl-frag ${className}`} aria-hidden="true">
      {lista.map((f, i) => (
        <svg
          key={i}
          className="pnl-frag__tri"
          viewBox="0 0 24 24"
          width={f.tam}
          height={f.tam}
          style={
            {
              left: `${f.x}%`,
              top: `${f.y}%`,
              opacity: f.opacidad,
              "--giro": `${f.giro}deg`,
              "--dx": `${f.dx}px`,
              "--dy": `${f.dy}px`,
              "--dg": `${f.dg}deg`,
              "--dur": `${f.dur}s`,
              "--retraso": `${f.retraso}s`,
            } as CSSProperties
          }
        >
          <path d="M12 3.5 21 19 3 19Z" fill="none" stroke={f.color} strokeWidth={f.trazo} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
      ))}
    </span>
  );
}
