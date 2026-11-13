"use client";

import { Enlace, Odometro } from "./Piezas";

/** "3 esperan tu visto bueno ›": la franja chica arriba de las tarjetas del Inicio. Lleva a Pendientes. */
export function FranjaPendientes({ n, href }: { n: number | null; href: string }) {
  if (n === null) return null;
  return (
    <Enlace href={href} className="pc-franja" data-tono={n > 0 ? "atencion" : undefined}>
      <span className="pc-franja__punto" aria-hidden="true" />
      <span>{n > 0 ? `${n} ${n === 1 ? "espera" : "esperan"} tu visto bueno` : "Nada espera tu visto bueno"}</span>
      <span className="pc-franja__flecha" aria-hidden="true">
        ›
      </span>
    </Enlace>
  );
}

/** "Max · 43 % usado" a la derecha, debajo de la caja: lleva a Ajustes (el plan solo se ve). */
export function UsoPlan({ plan, usados, total, href }: { plan: string; usados: number; total: number; href: string }) {
  const pct = Math.min(100, Math.round((usados / Math.max(1, total)) * 100));
  return (
    <Enlace href={href} className="pc-uso" aria-label={`Atendel ${plan}: ${pct} % de los mensajes del mes usados. Ver tu plan`}>
      <span className="pc-uso__plan">{plan}</span>
      <span className="pc-uso__tenue" aria-hidden="true">
        · <Odometro valor={pct} /> % usado
      </span>
    </Enlace>
  );
}
