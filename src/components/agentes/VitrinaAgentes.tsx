"use client";

import { useId, useState } from "react";
import { Pestanas } from "@/components/base/Pestanas";
import { ConversacionEjemplo } from "./ConversacionEjemplo";
import { Personaje } from "./Personaje";
import { DETALLE } from "./detalle";
import { AGENTE_POR_ID, AGENTES_INFO, type IdAgente } from "@/lib/agentes";

/**
 * Las conversaciones de ejemplo de los cuatro agentes (estilo diseno/vercel):
 * pestañas en píldora con el personaje de cada uno y, debajo, UNA tarjeta
 * fina (anillo doble, radio 6px) con la conversación tal como se ve en el
 * producto. Solo cambia lo de adentro; los mensajes entran uno tras otro.
 * Los datos salen de detalle.ts (nombres de ejemplo, así se dice arriba).
 */
export function VitrinaAgentes() {
  const [activa, setActiva] = useState<IdAgente>("lola");
  const a = AGENTE_POR_ID[activa];
  const detalle = DETALLE[activa];
  const idPanel = `${useId().replace(/:/g, "")}-vitrina`;

  return (
    <div className="vitrina">
      <Pestanas
        etiqueta="Elige un agente"
        activa={activa}
        alCambiar={(id) => setActiva(id as IdAgente)}
        idPanelExterno={idPanel}
        alineacion="izquierda"
        pestanas={AGENTES_INFO.map((ag) => ({
          id: ag.id,
          adorno: <Personaje agente={ag.id} avatar />,
          etiqueta: ag.nombre,
        }))}
      />

      <div
        id={idPanel}
        role="tabpanel"
        className="vitrina__tarjeta tarjeta-fina"
        aria-label={`Conversación de ejemplo con ${a.nombre}`}
      >
        <div className="vitrina__barra" aria-hidden="true">
          <span className="terminal__puntos">
            <span />
            <span />
            <span />
          </span>
          <span className="etiqueta etiqueta--tenue">
            {a.nombre} · {detalle.canal}
          </span>
        </div>
        <ConversacionEjemplo key={activa} agente={activa} animar />
      </div>
    </div>
  );
}
