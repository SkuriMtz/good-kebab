"use client";

import type { ReactNode } from "react";
import type { IdAgente } from "@/lib/agentes";
import { EVENTO_ELEGIR_AGENTE } from "@/lib/eventos";

/** Abre la ficha de un agente (la misma del acordeón y del menú). */
export function BotonFicha({ agente, children, className = "btn-pill btn-pill--suave" }: { agente: IdAgente; children: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new CustomEvent(EVENTO_ELEGIR_AGENTE, { detail: agente }))}
    >
      {children}
    </button>
  );
}
