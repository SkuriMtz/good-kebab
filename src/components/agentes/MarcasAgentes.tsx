import type { CSSProperties } from "react";
import { Personaje } from "./Personaje";
import { PERSONAJES } from "@/lib/personajes";
import { AGENTES_INFO } from "@/lib/agentes";

/** Los cuatro agentes acomodados como el logo (dos por dos): la imagen de la portada. */
export function MarcasAgentes() {
  return (
    <ul className="grid grid-cols-2 gap-[var(--spacing-12)] sm:gap-[var(--spacing-18)]" aria-hidden="true">
      {AGENTES_INFO.map((a) => (
        <li key={a.id} className="retrato" style={{ "--agente": PERSONAJES[a.id].color } as CSSProperties}>
          <Personaje agente={a.id} avatar />
        </li>
      ))}
    </ul>
  );
}
