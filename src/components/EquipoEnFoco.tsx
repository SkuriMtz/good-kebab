"use client";

import { useState } from "react";
import { AGENTES_INFO } from "@/lib/agentes";
import { PERSONAJES } from "./agentes/Personaje";
import TrueFocus from "./TrueFocus";

/**
 * Los nombres del equipo, como créditos de película: el visor enfoca a uno
 * por uno y abajo se lee qué hace. El visor toma el color del agente enfocado.
 */
export function EquipoEnFoco() {
  const [i, setI] = useState(0);
  const a = AGENTES_INFO[i] ?? AGENTES_INFO[0];

  return (
    <div className="text-center">
      <p className="etiqueta etiqueta--brasa">Con</p>
      <div aria-hidden="true">
        <TrueFocus
          sentence={AGENTES_INFO.map((x) => x.nombre).join(" ")}
          blurAmount={6}
          borderColor={PERSONAJES[a.id].color}
          glowColor={`${PERSONAJES[a.id].color}59`}
          animationDuration={0.6}
          pauseBetweenAnimations={1.8}
          onFocusChange={setI}
          className="mt-8 gap-x-[0.36em] gap-y-[0.2em] text-[clamp(2.6rem,6.4vw,7.5rem)] font-medium uppercase leading-[0.9] [&_.focus-word]:pt-[0.06em]"
        />
        <div className="mx-auto mt-10 min-h-[120px] max-w-[620px] lg:mt-14">
          <p key={a.id} className="swap-in">
            <span className="etiqueta">{a.area}</span>
            <span className="etiqueta etiqueta--suave"> · {a.abarca}</span>
          </p>
          <p key={`${a.id}-lema`} className="swap-in cuerpo mt-3 text-balance">
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
