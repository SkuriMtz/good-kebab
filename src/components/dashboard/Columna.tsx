"use client";

import type { Plan } from "@/lib/planes";
import { Accionable } from "./Piezas";
import type { Accion } from "./tipos";

const formato = new Intl.NumberFormat("es-MX");

/**
 * Al pie del lateral: una línea con el uso del plan y su barrita (como
 * "Getting started 1/3"). Lleva a ver el plan; nunca a cambiarlo.
 */
export function UsoPlan({ plan, usados, accion }: { plan: Plan; usados: number; accion: Accion }) {
  const pct = Math.min(100, (usados / plan.mensajesMes) * 100);
  return (
    <Accionable
      accion={accion}
      className="dash-uso"
      etiqueta={`${plan.nombre}: ${formato.format(usados)} de ${formato.format(plan.mensajesMes)} mensajes usados este mes`}
    >
      <span className="dash-uso__linea">
        <span className="dash-uso__plan">{plan.nombre}</span>
        <span>
          <span className="cifras">
            {formato.format(usados)} / {formato.format(plan.mensajesMes)}
          </span>{" "}
          mensajes
        </span>
      </span>
      <span className="dash-avance__barra dash-uso__barra" aria-hidden="true">
        <span style={{ width: `${pct}%` }} />
      </span>
    </Accionable>
  );
}
