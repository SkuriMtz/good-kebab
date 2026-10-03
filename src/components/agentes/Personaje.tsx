"use client";

import { useEffect, useId, useRef } from "react";
import { gsap } from "gsap";
import type { IdAgente } from "@/lib/agentes";

/** Color y rasgo de cada personaje. Los colores se ven bien sobre fondo claro y oscuro. */
export const PERSONAJES: Record<IdAgente, { color: string; rasgo: string }> = {
  lola: { color: "#ff8a6b", rasgo: "audífonos con micrófono" },
  clara: { color: "#86b9ff", rasgo: "lentes redondos" },
  victor: { color: "#6fd3a6", rasgo: "moño" },
  iris: { color: "#f6c94c", rasgo: "chongo con lápiz" },
};

const TINTA = "#171717";

/**
 * Personaje de cada agente: un blob con cara.
 * El cuerpo usa la técnica de BlobCursor (React Bits): varios círculos que se
 * funden con un filtro "gooey" y siguen al cursor con gsap (el principal
 * rápido y los demás lento), aquí de forma muy sutil: el blob se inclina y
 * mira hacia el cursor. Además respira, cambia de forma despacio y parpadea.
 * Con "reducir movimiento" se queda quieto.
 */
export function Personaje({ agente, className = "" }: { agente: IdAgente; className?: string }) {
  const { color } = PERSONAJES[agente];
  const id = useId().replace(/:/g, "");
  const svgRef = useRef<SVGSVGElement>(null);
  const cuerpoRef = useRef<SVGGElement>(null);
  const blobsRef = useRef<(SVGCircleElement | null)[]>([]);
  const caraRef = useRef<SVGGElement>(null);
  const ojosRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const [principal, b1, b2] = blobsRef.current;
    const cara = caraRef.current;
    const ctx = gsap.context(() => {
      // Respira
      gsap.to(cuerpoRef.current, {
        scaleY: 1.035,
        scaleX: 0.985,
        transformOrigin: "50% 85%",
        duration: 2.4,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
      // Los blobs pequeños rondan dentro del cuerpo: la silueta cambia despacio
      gsap.to(b1, { x: 16, y: -10, duration: 3.6, ease: "sine.inOut", yoyo: true, repeat: -1 });
      gsap.to(b2, { x: -14, y: 8, duration: 4.4, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 0.6 });
      // Parpadea
      gsap
        .timeline({ repeat: -1, repeatDelay: 3.2 + Math.random() * 2.5, delay: Math.random() * 2 })
        .to(ojosRef.current, { scaleY: 0.12, transformOrigin: "50% 50%", duration: 0.08, ease: "power1.in" })
        .to(ojosRef.current, { scaleY: 1, duration: 0.12, ease: "power1.out" });
    }, svg);

    // Como BlobCursor: al mover el cursor, el blob principal va rápido y los otros lento
    let visible = false;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(svg);
    const mover = (e: PointerEvent) => {
      if (!visible || e.pointerType !== "mouse") return;
      const r = svg.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy) || 1;
      const f = Math.min(1, d / 500);
      const ux = (dx / d) * f;
      const uy = (dy / d) * f;
      gsap.to(principal, { x: ux * 5, y: uy * 4, duration: 0.1, ease: "power3.out" });
      gsap.to(cara, { x: ux * 7, y: uy * 5, duration: 0.5, ease: "power1.out" });
    };
    window.addEventListener("pointermove", mover, { passive: true });
    return () => {
      ctx.revert();
      io.disconnect();
      window.removeEventListener("pointermove", mover);
      gsap.killTweensOf([principal, cara]);
    };
  }, []);

  return (
    <svg ref={svgRef} viewBox="0 0 200 200" className={className} aria-hidden="true" focusable="false">
      <defs>
        <filter id={`goo-${id}`}>
          <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="blur" />
          <feColorMatrix in="blur" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" />
        </filter>
      </defs>

      <g ref={cuerpoRef}>
        <g filter={`url(#goo-${id})`} fill={color}>
          <circle ref={(el) => void (blobsRef.current[0] = el)} cx="100" cy="112" r="58" />
          <circle ref={(el) => void (blobsRef.current[1] = el)} cx="74" cy="92" r="30" />
          <circle ref={(el) => void (blobsRef.current[2] = el)} cx="126" cy="130" r="28" />
          {/* Iris: el chongo es parte del blob */}
          {agente === "iris" ? <circle cx="100" cy="52" r="17" /> : null}
        </g>

        <g ref={caraRef}>
          {/* Ojos */}
          <g ref={ojosRef}>
            <ellipse cx="84" cy="106" rx="5" ry="7" fill={TINTA} />
            <ellipse cx="116" cy="106" rx="5" ry="7" fill={TINTA} />
          </g>
          {/* Boca */}
          <path d="M90 126 Q100 135 110 126" fill="none" stroke={TINTA} strokeWidth="3.5" strokeLinecap="round" />

          {agente === "clara" ? (
            <g fill="none" stroke={TINTA} strokeWidth="3.5">
              <circle cx="84" cy="106" r="14" />
              <circle cx="116" cy="106" r="14" />
              <path d="M98 105 Q100 102 102 105" strokeLinecap="round" />
            </g>
          ) : null}
        </g>

        {agente === "lola" ? (
          <g fill="none" stroke={TINTA} strokeWidth="4" strokeLinecap="round">
            <path d="M52 104 C52 54 148 54 148 104" />
            <rect x="44" y="98" width="13" height="24" rx="5" fill={TINTA} />
            <rect x="143" y="98" width="13" height="24" rx="5" fill={TINTA} />
            <path d="M50 120 C54 140 70 146 84 144" strokeWidth="3" />
            <circle cx="86" cy="144" r="3.5" fill={TINTA} stroke="none" />
          </g>
        ) : null}

        {agente === "victor" ? (
          <g fill={TINTA}>
            <path d="M100 160 L82 150 L82 170 Z" />
            <path d="M100 160 L118 150 L118 170 Z" />
            <circle cx="100" cy="160" r="4.5" />
          </g>
        ) : null}

        {agente === "iris" ? (
          <g strokeLinecap="round">
            <path d="M82 66 L122 40" stroke={TINTA} strokeWidth="5" />
            <path d="M122 40 L127 37" stroke="#ff2936" strokeWidth="5" />
          </g>
        ) : null}
      </g>
    </svg>
  );
}
