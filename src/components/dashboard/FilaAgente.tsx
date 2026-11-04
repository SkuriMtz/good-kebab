"use client";

import type { CSSProperties, ReactNode } from "react";
import { Personaje } from "@/components/agentes/Personaje";
import { Icono } from "@/components/base/Iconos";
import { Insignia } from "@/components/base/Insignia";
import { AGENTE_POR_ID, type IdAgente } from "@/lib/agentes";

/**
 * Un agente en la vista Agentes, como tarjeta grande y redondeada: su
 * personaje, nombre y área, qué hace, lo de esta semana (`datos`), lo que
 * sabe hacer, su estado y las acciones. `bloqueado` lo atenúa (su plan no
 * lo incluye) sin esconder lo que haría; `enfocado` lo marca cuando se
 * llegó desde otra parte (?agente=lola).
 */
export function FilaAgente({
  id,
  insignias,
  estado,
  acciones,
  datos,
  bloqueado = false,
  enfocado = false,
}: {
  id: IdAgente;
  insignias?: ReactNode;
  estado?: ReactNode;
  acciones?: ReactNode;
  datos?: ReactNode;
  bloqueado?: boolean;
  enfocado?: boolean;
}) {
  const info = AGENTE_POR_ID[id];
  return (
    <li
      className={`pnl-ficha${bloqueado ? " pnl-ficha--bloqueada" : ""}${enfocado ? " pnl-ficha--enfocada" : ""}`}
      id={`agente-${id}`}
      style={{ "--agente": `var(--agente-${id})` } as CSSProperties}
      aria-current={enfocado ? "true" : undefined}
    >
      <div className="pnl-ficha__cabeza">
        <span className="pnl-ficha__personaje" aria-hidden="true">
          <Personaje agente={id} />
        </span>
        <div className="pnl-ficha__nombres">
          <h2 className="pnl-ficha__nombre">{info.nombre}</h2>
          <p className="pnl-ficha__area">
            {info.area} · {info.abarca}
          </p>
          {insignias ? <div className="pnl-ficha__insignias">{insignias}</div> : null}
        </div>
      </div>
      <p className="pnl-ficha__lema">{info.lema}</p>
      {datos ? <div className="pnl-ficha__datos">{datos}</div> : null}
      <ul className="pnl-ficha__capacidades" aria-label={`Lo que hace ${info.nombre}`}>
        {info.capacidades.map((c) => (
          <li key={c}>
            <Icono nombre="check" tam={16} />
            {c}
          </li>
        ))}
      </ul>
      {estado ? <div className="pnl-ficha__meta">{estado}</div> : null}
      {acciones ? <div className="pnl-ficha__acciones">{acciones}</div> : null}
    </li>
  );
}
