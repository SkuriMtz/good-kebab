"use client";

import type { CSSProperties } from "react";
import { PERSONAJES, Personaje } from "./Personaje";
import { AGENTES_INFO } from "@/lib/agentes";
import { EVENTO_ELEGIR_AGENTE } from "@/lib/eventos";

/**
 * Los cuatro personajes en la portada, como un collage de tarjetas apenas
 * giradas. Cada tarjeta toma el color de su agente; al tocarla se abre su
 * ficha (la misma que en la sección de agentes).
 */
export function HeroPersonajes() {
  return (
    <ul className="hero-personajes" aria-label="Los agentes">
      {AGENTES_INFO.map((a, i) => (
        <li
          key={a.id}
          className="hero-personajes__item"
          style={{ "--agente": PERSONAJES[a.id].color, "--i": i } as CSSProperties}
        >
          <button
            type="button"
            className="hero-personaje"
            onClick={() => window.dispatchEvent(new CustomEvent(EVENTO_ELEGIR_AGENTE, { detail: a.id }))}
            aria-label={`Conoce a ${a.nombre}, ${a.area}`}
          >
            <Personaje agente={a.id} className="hero-personaje__cuerpo" />
            <span className="hero-personaje__pie">
              <span className="font-semibold tracking-[-0.02em] text-bone">{a.nombre}</span>
              <span className="text-ash">{a.area}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
