"use client";

import type { ReactNode } from "react";
import { Marca } from "@/components/Logo";

/**
 * El Inicio del panel ES un chat nuevo, con la distribución del de Claude
 * (medida sobre la captura del dueño): el saludo en serif con la marca, el
 * aviso de una línea (lo que espera tu visto bueno), la caja alta de 653px,
 * la fila de abajo (con quién hablas a la izquierda; plan y uso a la
 * derecha) y, más abajo, "Trabajo reciente" en tres tarjetas.
 */
export function Inicio({
  saludo,
  caja,
  selector,
  uso,
  franja,
  recientes,
}: {
  saludo: string;
  caja: ReactNode;
  selector: ReactNode;
  uso: ReactNode;
  /** El aviso arriba de la caja (FranjaPendientes): sin pendientes no sale. */
  franja?: ReactNode;
  /** "Trabajo reciente" (TrabajoReciente): sin nada hecho no sale. */
  recientes?: ReactNode;
}) {
  return (
    <div className="pc-inicio">
      <div className="pc-inicio__centro">
        <h1 className="pc-saludo">
          <Marca className="pc-saludo__marca pc-logo-entra" />
          <span>{saludo}</span>
        </h1>
        {franja}
        <div className="pc-inicio__caja">{caja}</div>
        <div className="pc-inicio__fila">
          <div className="pc-inicio__izq">{selector}</div>
          <div className="pc-inicio__der">{uso}</div>
        </div>
        {recientes}
      </div>
    </div>
  );
}
