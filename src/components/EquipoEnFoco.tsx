"use client";

import { useState } from "react";
import { AGENTES_INFO } from "@/lib/agentes";
import TrueFocus from "./TrueFocus";

/**
 * Los nombres del equipo, como créditos de película: el visor enfoca a uno
 * por uno y abajo se lee qué hace.
 */
export function EquipoEnFoco() {
  const [i, setI] = useState(0);
  const a = AGENTES_INFO[i] ?? AGENTES_INFO[0];

  return (
    <div className="text-center">
      <p className="font-cond text-base uppercase tracking-[0.03em] text-ash">Con</p>
      <div aria-hidden="true">
        <TrueFocus
          sentence={AGENTES_INFO.map((x) => x.nombre).join(" ")}
          blurAmount={6}
          borderColor="#ff2936"
          glowColor="rgba(255, 41, 54, 0.35)"
          animationDuration={0.6}
          pauseBetweenAnimations={1.8}
          onFocusChange={setI}
          className="mt-6 gap-x-[0.42em] gap-y-[0.2em] font-cond text-[clamp(5rem,9.5vw,8.75rem)] font-normal uppercase leading-[0.78] tracking-[0.01em] [&_.focus-word]:pt-[0.08em]"
        />
        <div className="mx-auto mt-9 min-h-[96px] max-w-[460px] lg:mt-12">
          <p key={a.id} className="swap-in">
            <span className="font-cond text-[1.375rem] uppercase leading-none tracking-[0.03em]">{a.area}</span>
            <span className="text-ash"> · {a.abarca}</span>
          </p>
          <p key={`${a.id}-lema`} className="swap-in mt-2 text-balance text-body text-silver">
            {a.lema}
          </p>
        </div>
      </div>
      <ul className="sr-only">
        {AGENTES_INFO.map((x) => (
          <li key={x.id}>
            {x.nombre}, {x.area} ({x.abarca}): {x.lema}
          </li>
        ))}
      </ul>
    </div>
  );
}
