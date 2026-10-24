"use client";

import { useId, useState, type ElementType, type ReactNode } from "react";
import { Icono } from "./Iconos";

/**
 * Acordeón accesible: cada pregunta es un botón con aria-expanded y
 * aria-controls; el panel se abre con grid-template-rows 0fr → 1fr (0.4s) y
 * el chevron de contorno gira. El padding va en el panel interior (no en la
 * pista), así la animación no salta. Cerrado, el contenido queda fuera del
 * orden de tabulación (visibility: hidden al terminar de cerrar).
 *
 * - unoALaVez: al abrir uno se cierra el anterior.
 * - abiertos: ids abiertos al principio (por defecto, ninguno).
 */

export type ItemAcordeon = { id?: string; titulo: ReactNode; contenido: ReactNode };

export function Acordeon({
  items,
  unoALaVez = false,
  abiertos: iniciales = [],
  nivelTitulo = 3,
  className = "",
}: {
  items: ItemAcordeon[];
  unoALaVez?: boolean;
  abiertos?: string[];
  nivelTitulo?: 2 | 3 | 4;
  className?: string;
}) {
  const base = useId().replace(/:/g, "");
  const claves = items.map((it, i) => it.id ?? String(i));
  const [abiertos, setAbiertos] = useState<string[]>(iniciales);
  const Titulo = `h${nivelTitulo}` as ElementType;

  const alternar = (clave: string) =>
    setAbiertos((a) => (a.includes(clave) ? a.filter((x) => x !== clave) : unoALaVez ? [clave] : [...a, clave]));

  return (
    <ul className={`acordeon ${className}`}>
      {items.map((it, i) => {
        const clave = claves[i];
        const abierto = abiertos.includes(clave);
        const idBoton = `${base}-boton-${clave}`;
        const idPanel = `${base}-panel-${clave}`;
        return (
          <li key={clave} className="acordeon__item">
            <Titulo className="acordeon__titulo">
              <button
                type="button"
                id={idBoton}
                className="acordeon__boton"
                aria-expanded={abierto}
                aria-controls={idPanel}
                onClick={() => alternar(clave)}
              >
                <span>{it.titulo}</span>
                <Icono nombre="chevron" className="acordeon__chevron" />
              </button>
            </Titulo>
            <div className="acordeon__pista" data-abierto={abierto ? "true" : "false"}>
              <div className="acordeon__interior" id={idPanel} role="region" aria-labelledby={idBoton}>
                <div className="acordeon__contenido">{it.contenido}</div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
