"use client";

import { useState, type CSSProperties } from "react";
import { BotonFicha } from "./BotonFicha";
import { Personaje } from "./Personaje";
import { AGENTES_INFO } from "@/lib/agentes";
import { PERSONAJES } from "@/lib/personajes";

const total = AGENTES_INFO.length;

/**
 * El equipo como carrusel: un agente al frente (su retrato a todo color, el
 * área en violeta y el nombre grande), los demás atenuados a los lados y dos
 * flechas violetas. Tocar el retrato abre la ficha del agente.
 */
export function CarruselEquipo() {
  const [i, setI] = useState(0);
  const mover = (d: number) => setI((v) => (v + d + total) % total);
  const a = AGENTES_INFO[i];
  const siguiente = AGENTES_INFO[(i + 1) % total];
  const anterior = AGENTES_INFO[(i - 1 + total) % total];

  return (
    <div
      className="carrusel"
      role="group"
      aria-roledescription="carrusel"
      aria-label="Los cuatro agentes"
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") mover(1);
        if (e.key === "ArrowLeft") mover(-1);
      }}
    >
      <div className="carrusel__fila">
        <button type="button" className="carrusel__fantasma carrusel__fantasma--antes" onClick={() => mover(-1)} tabIndex={-1} aria-hidden="true">
          <span className="retrato retrato--lleno" style={{ "--agente": PERSONAJES[anterior.id].color } as CSSProperties}>
            <Personaje agente={anterior.id} avatar />
          </span>
        </button>

        <div className="carrusel__actual" key={a.id} aria-live="polite">
          <BotonFicha agente={a.id} className="carrusel__foto" ariaLabel={`${a.nombre}, ${a.area}: ver su ficha`}>
            <span className="retrato retrato--lleno" style={{ "--agente": PERSONAJES[a.id].color } as CSSProperties}>
              <Personaje agente={a.id} avatar />
            </span>
          </BotonFicha>
          <div className="carrusel__datos">
            <p className="t-rol">
              {a.area} · {a.abarca}
            </p>
            <p className="carrusel__nombre">{a.nombre}</p>
            <p className="t-cuerpo mt-[var(--spacing-12)] max-w-[260px]">{a.lema}</p>
            <BotonFicha agente={a.id} className="btn btn--suave mt-[var(--spacing-12)] !px-0">
              Ver todo lo que hace
            </BotonFicha>
          </div>
        </div>

        <button type="button" className="carrusel__fantasma carrusel__fantasma--despues" onClick={() => mover(1)} tabIndex={-1} aria-hidden="true">
          <span className="retrato retrato--lleno" style={{ "--agente": PERSONAJES[siguiente.id].color } as CSSProperties}>
            <Personaje agente={siguiente.id} avatar />
          </span>
        </button>
      </div>

      <div className="carrusel__flechas">
        <button type="button" className="carrusel__flecha" onClick={() => mover(-1)} aria-label={`Anterior: ${anterior.nombre}`}>
          ←
        </button>
        <span className="t-caption tabular-nums">
          {i + 1} / {total}
        </span>
        <button type="button" className="carrusel__flecha" onClick={() => mover(1)} aria-label={`Siguiente: ${siguiente.nombre}`}>
          →
        </button>
      </div>
    </div>
  );
}
