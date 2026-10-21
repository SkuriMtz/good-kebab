"use client";

import type { ReactNode } from "react";
import { Icono } from "@/components/base/Iconos";
import { Insignia } from "@/components/base/Insignia";
import { AGENTE_POR_ID, type IdAgente } from "@/lib/agentes";
import { MarcaAgente } from "./Piezas";

/**
 * Un agente en la lista de la vista Agentes (como un renglón de la lista de
 * repositorios): su personaje, nombre y área, qué hace, lo que sabe hacer,
 * su estado y, a la derecha, las acciones. `bloqueado` lo atenúa (su plan
 * no lo incluye) sin esconder lo que haría.
 */
export function FilaAgente({
  id,
  insignias,
  estado,
  acciones,
  bloqueado = false,
}: {
  id: IdAgente;
  insignias?: ReactNode;
  estado?: ReactNode;
  acciones?: ReactNode;
  bloqueado?: boolean;
}) {
  const info = AGENTE_POR_ID[id];
  return (
    <li className={`dash-agente${bloqueado ? " dash-agente--bloqueado" : ""}`} id={`agente-${id}`}>
      <MarcaAgente id={id} tam={40} className="dash-agente__marca" />
      <div className="dash-agente__cuerpo">
        <div className="dash-agente__linea">
          <h2 className="dash-agente__nombre">{info.nombre}</h2>
          <Insignia>{info.area}</Insignia>
          {insignias}
        </div>
        <p className="dash-agente__lema">{info.lema}</p>
        <ul className="dash-agente__capacidades" aria-label={`Lo que hace ${info.nombre}`}>
          {info.capacidades.map((c) => (
            <li key={c}>
              <Icono nombre="check" tam={16} />
              {c}
            </li>
          ))}
        </ul>
        {estado ? <div className="dash-agente__meta">{estado}</div> : null}
      </div>
      {acciones ? <div className="dash-agente__acciones">{acciones}</div> : null}
    </li>
  );
}
