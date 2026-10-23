"use client";

import { useState, type CSSProperties } from "react";
import { BotonFicha } from "@/components/agentes/BotonFicha";
import { Personaje } from "@/components/agentes/Personaje";
import { AGENTES_INFO } from "@/lib/agentes";
import { PERSONAJES } from "@/lib/personajes";

const total = AGENTES_INFO.length;
const mod = (n: number) => ((n % total) + total) % total;
/** Las tarjetas a cada lado de la del centro (se repiten en círculo). */
const LUGARES = [-3, -2, -1, 0, 1, 2, 3];

/**
 * El equipo como en la versión 7 (copiado de componentes-pendientes/
 * carrusel-del-equipo y ajustado a la muestra M1): una fila de retratos a
 * todo lo ancho; el del centro, grande y a color, con su área en Mono y su
 * nombre a la derecha; los demás, atenuados. Flechas y puntos deslizan la
 * fila (también las flechas del teclado). Tocar el retrato del centro, o
 * "Ver su ficha", abre la ficha del agente.
 */
export function CarruselEquipo() {
  const [centro, setCentro] = useState(0);
  const actual = mod(centro);
  const a = AGENTES_INFO[actual];

  return (
    <div
      className="m1-carrusel"
      role="group"
      aria-roledescription="carrusel"
      aria-label="Los cuatro agentes"
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") setCentro((v) => v + 1);
        if (e.key === "ArrowLeft") setCentro((v) => v - 1);
      }}
    >
      <div className="m1-carrusel__pista">
        {LUGARES.map((k) => {
          const v = centro + k;
          const ag = AGENTES_INFO[mod(v)];
          const retrato = (
            <span className="m1-carrusel__retrato" style={{ "--agente": PERSONAJES[ag.id].color } as CSSProperties}>
              <Personaje agente={ag.id} avatar />
            </span>
          );
          return (
            <div key={v} className="m1-carrusel__tarjeta" data-centro={k === 0 ? "true" : "false"} style={{ "--k": k } as CSSProperties}>
              {k === 0 ? (
                <BotonFicha agente={ag.id} className="m1-carrusel__boton" ariaLabel={`${ag.nombre}, ${ag.area}: ver su ficha`}>
                  {retrato}
                </BotonFicha>
              ) : (
                <button type="button" className="m1-carrusel__boton" tabIndex={-1} aria-hidden="true" onClick={() => setCentro(v)}>
                  {retrato}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="m1-carrusel__datos" key={centro} aria-live="polite">
        <p className="m1-etiqueta">{a.area}</p>
        <p className="m1-carrusel__nombre">{a.nombre}</p>
        <p className="m1-carrusel__abarca">{a.abarca}</p>
        <BotonFicha agente={a.id} className="m1-carrusel__ficha">
          Ver su ficha <span aria-hidden="true">→</span>
        </BotonFicha>
      </div>

      <div className="m1-carrusel__control">
        <button
          type="button"
          className="m1-carrusel__flecha"
          onClick={() => setCentro((v) => v - 1)}
          aria-label={`Anterior: ${AGENTES_INFO[mod(centro - 1)].nombre}`}
        >
          <span aria-hidden="true">←</span>
        </button>
        <div className="m1-carrusel__puntos">
          {AGENTES_INFO.map((ag, i) => (
            <button
              key={ag.id}
              type="button"
              className="m1-carrusel__punto"
              aria-label={`Ver a ${ag.nombre}`}
              aria-current={i === actual ? "true" : undefined}
              onClick={() => setCentro((v) => v + (i - actual))}
            />
          ))}
        </div>
        <button
          type="button"
          className="m1-carrusel__flecha"
          onClick={() => setCentro((v) => v + 1)}
          aria-label={`Siguiente: ${AGENTES_INFO[mod(centro + 1)].nombre}`}
        >
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}
