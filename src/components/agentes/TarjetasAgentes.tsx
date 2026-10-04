import type { CSSProperties } from "react";
import { Arrow } from "../Buttons";
import { BotonFicha } from "./BotonFicha";
import { Personaje } from "./Personaje";
import { PERSONAJES } from "@/lib/personajes";
import { AGENTES_INFO } from "@/lib/agentes";

/**
 * Los cuatro agentes como tarjetas pintadas con su color (notas adhesivas).
 * Cada una abre la ficha del agente: todo lo que hace, una conversación de
 * ejemplo y en qué plan está.
 */
export function TarjetasAgentes() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {AGENTES_INFO.map((a) => (
        <li key={a.id}>
          <BotonFicha
            agente={a.id}
            className="tarjeta-agente en-acento"
            style={{ "--acento": PERSONAJES[a.id].color } as CSSProperties}
            ariaLabel={`${a.nombre}, ${a.area}: ver su ficha`}
          >
            <span className="flex items-start justify-between gap-4">
              <span className="marca-agente marca-agente--grande" style={{ "--agente": "rgb(0 0 0 / 0.08)" } as CSSProperties}>
                <Personaje agente={a.id} avatar />
              </span>
              <span className="pill pill--blanca">
                Ver su ficha
                <Arrow className="!h-3.5 !w-3.5" />
              </span>
            </span>
            <span className="t-titulo mt-6 block">{a.nombre}</span>
            <span className="mt-1 block text-[0.9375rem] font-medium text-tenue">
              {a.area} · {a.abarca}
            </span>
            <span className="t-cuerpo mt-3 block">{a.lema}</span>
          </BotonFicha>
        </li>
      ))}
    </ul>
  );
}
