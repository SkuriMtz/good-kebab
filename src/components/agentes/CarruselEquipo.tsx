"use client";

import { useState, type CSSProperties } from "react";
import { BotonFicha } from "./BotonFicha";
import { Personaje } from "./Personaje";
import { AGENTES_INFO } from "@/lib/agentes";
import { PERSONAJES } from "@/lib/personajes";

const total = AGENTES_INFO.length;
const mod = (n: number) => ((n % total) + total) % total;
/** Las tarjetas a cada lado de la del centro (se repiten en círculo). */
const LUGARES = [-3, -2, -1, 0, 1, 2, 3];

/**
 * El equipo como el carrusel de Dala: una fila de retratos a todo lo ancho;
 * el del centro, grande y a color, con su área en violeta y su nombre a la
 * derecha; los demás, atenuados. Las flechas violetas deslizan la fila.
 * Tocar el retrato del centro abre la ficha del agente.
 */
export function CarruselEquipo() {
  const [centro, setCentro] = useState(0);
  const a = AGENTES_INFO[mod(centro)];

  return (
    <div
      className="equipo"
      role="group"
      aria-roledescription="carrusel"
      aria-label="Los cuatro agentes"
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") setCentro((v) => v + 1);
        if (e.key === "ArrowLeft") setCentro((v) => v - 1);
      }}
    >
      <div className="equipo__pista">
        {LUGARES.map((k) => {
          const v = centro + k;
          const ag = AGENTES_INFO[mod(v)];
          const retrato = (
            <span className="retrato retrato--lleno equipo__retrato" style={{ "--agente": PERSONAJES[ag.id].color } as CSSProperties}>
              <Personaje agente={ag.id} avatar />
            </span>
          );
          return (
            <div key={v} className="equipo__tarjeta" data-centro={k === 0 ? "true" : "false"} style={{ "--k": k } as CSSProperties}>
              {k === 0 ? (
                <BotonFicha agente={ag.id} className="equipo__boton" ariaLabel={`${ag.nombre}, ${ag.area}: ver su ficha`}>
                  {retrato}
                </BotonFicha>
              ) : (
                <button type="button" className="equipo__boton" tabIndex={-1} aria-hidden="true" onClick={() => setCentro(v)}>
                  {retrato}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="equipo__datos" key={centro} aria-live="polite">
        <p className="d-rol">{a.area}</p>
        <p className="equipo__nombre">{a.nombre}</p>
        <p className="equipo__abarca">{a.abarca}</p>
        <BotonFicha agente={a.id} className="equipo__ficha">
          Ver su ficha
        </BotonFicha>
      </div>

      <div className="equipo__flechas">
        <button type="button" className="equipo__flecha" onClick={() => setCentro((v) => v - 1)} aria-label={`Anterior: ${AGENTES_INFO[mod(centro - 1)].nombre}`}>
          ←
        </button>
        <button type="button" className="equipo__flecha" onClick={() => setCentro((v) => v + 1)} aria-label={`Siguiente: ${AGENTES_INFO[mod(centro + 1)].nombre}`}>
          →
        </button>
      </div>
    </div>
  );
}
