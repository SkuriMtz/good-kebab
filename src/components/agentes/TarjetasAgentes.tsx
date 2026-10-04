import type { CSSProperties } from "react";
import { BotonFicha } from "./BotonFicha";
import { Personaje } from "./Personaje";
import { PERSONAJES } from "@/lib/personajes";
import { AGENTES_INFO } from "@/lib/agentes";

/**
 * Los cuatro agentes como tarjetas de equipo: su retrato, el área en
 * violeta y el nombre grande. Sin cajas: flotan sobre el negro. Cada una
 * abre la ficha del agente.
 */
export function TarjetasAgentes() {
  return (
    <ul className="grid grid-cols-2 gap-x-[var(--spacing-18)] gap-y-[var(--spacing-36)] lg:grid-cols-4 lg:gap-x-[var(--spacing-24)]">
      {AGENTES_INFO.map((a) => (
        <li key={a.id}>
          <BotonFicha agente={a.id} className="tarjeta-agente" ariaLabel={`${a.nombre}, ${a.area}: ver su ficha`}>
            <span className="retrato" style={{ "--agente": PERSONAJES[a.id].color } as CSSProperties}>
              <Personaje agente={a.id} avatar />
            </span>
            <span className="t-rol mt-[var(--spacing-6)]">{a.area}</span>
            <span className="t-titulo tarjeta-agente__nombre">{a.nombre}</span>
            <span className="t-chico">{a.abarca}</span>
          </BotonFicha>
        </li>
      ))}
    </ul>
  );
}
