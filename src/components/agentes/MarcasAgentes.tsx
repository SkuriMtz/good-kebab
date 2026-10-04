import type { CSSProperties } from "react";
import { Personaje } from "./Personaje";
import { PERSONAJES } from "@/lib/personajes";
import { AGENTES_INFO } from "@/lib/agentes";

/** Los cuatro agentes en fila, cada uno en un círculo blanco con el filo de su color. */
export function MarcasAgentes({ grande = false }: { grande?: boolean }) {
  return (
    <ul className="flex items-center justify-center gap-2" aria-hidden="true">
      {AGENTES_INFO.map((a) => (
        <li
          key={a.id}
          className={`marca-agente${grande ? " marca-agente--grande" : ""}`}
          style={{ "--agente": PERSONAJES[a.id].color } as CSSProperties}
        >
          <Personaje agente={a.id} avatar />
        </li>
      ))}
    </ul>
  );
}
