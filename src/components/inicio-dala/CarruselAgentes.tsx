"use client";

import { useState, type CSSProperties, type KeyboardEvent } from "react";
import { Personaje } from "@/components/agentes/Personaje";
import { Icono } from "@/components/base/Iconos";
import { AGENTES_INFO, type IdAgente } from "@/lib/agentes";
import { EVENTO_ELEGIR_AGENTE } from "@/lib/eventos";
import { PERSONAJES } from "@/lib/personajes";
import { useIdioma } from "@/i18n/Idioma";

const total = AGENTES_INFO.length;
const mod = (n: number) => ((n % total) + total) % total;
/** Las fichas a cada lado de la del centro (en círculo). */
const LUGARES = [-2, -1, 0, 1, 2];

const pedirFicha = (id: IdAgente) => window.dispatchEvent(new CustomEvent(EVENTO_ELEGIR_AGENTE, { detail: id }));

/**
 * "Tu equipo": el carrusel de los cuatro agentes.
 * - La ficha del centro con el personaje del agente en grande; tocarla abre
 *   la ficha del agente.
 * - Debajo de ella, centrados: el nombre (grande) y su cargo en Mono gris,
 *   y una fila con las dos flechas violetas y, entre ellas, "Ver su ficha".
 * - A los lados, las fichas apagadas, más chicas y casi transparentes. Tocar
 *   una la trae al centro. También con las flechas del teclado.
 * Se desliza con transform (0.6 s, salida fuerte); con "reducir movimiento", sin deslizar.
 */
export function CarruselAgentes() {
  const { d } = useIdioma();
  const c = d.carrusel;
  const [centro, setCentro] = useState(0);
  const actual = AGENTES_INFO[mod(centro)];

  const alTeclear = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setCentro((v) => v + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setCentro((v) => v - 1);
    }
  };

  return (
    <div className="carrusel" role="region" aria-roledescription={c.tipo} aria-label={c.region} onKeyDown={alTeclear}>
      <div className="carrusel__pista">
        {LUGARES.map((k) => {
          const v = centro + k;
          const ag = AGENTES_INFO[mod(v)];
          const estilo = { "--k": k, "--agente": PERSONAJES[ag.id].color } as CSSProperties;
          return (
            <div key={v} className="carrusel__ficha" data-centro={k === 0 ? "true" : "false"} style={estilo}>
              {k === 0 ? (
                <button type="button" className="carrusel__retrato" onClick={() => pedirFicha(ag.id)} aria-label={c.abrir(ag.nombre, c.cargo[ag.id])}>
                  <Personaje agente={ag.id} className="carrusel__personaje" />
                </button>
              ) : (
                <button type="button" className="carrusel__retrato" tabIndex={-1} aria-hidden="true" onClick={() => setCentro(v)}>
                  <Personaje agente={ag.id} className="carrusel__personaje" />
                </button>
              )}
            </div>
          );
        })}
      </div>
      <div className="carrusel__datos" key={actual.id} aria-live="polite">
        <p className="carrusel__nombre">{actual.nombre}</p>
        <p className="carrusel__cargo">{c.cargo[actual.id]}</p>
      </div>
      <div className="carrusel__flechas">
        <button
          type="button"
          className="carrusel__flecha"
          onClick={() => setCentro((v) => v - 1)}
          aria-label={c.anterior(AGENTES_INFO[mod(centro - 1)].nombre)}
        >
          <Icono nombre="flecha" tam={16} className="carrusel__flecha-icono carrusel__flecha-icono--izq" />
        </button>
        <button type="button" className="carrusel__ver" onClick={() => pedirFicha(actual.id)}>
          {c.verFicha}
        </button>
        <button
          type="button"
          className="carrusel__flecha"
          onClick={() => setCentro((v) => v + 1)}
          aria-label={c.siguiente(AGENTES_INFO[mod(centro + 1)].nombre)}
        >
          <Icono nombre="flecha" tam={16} className="carrusel__flecha-icono" />
        </button>
      </div>
    </div>
  );
}
