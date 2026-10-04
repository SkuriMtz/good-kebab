"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import type { IdAgente } from "@/lib/agentes";
import { EVENTO_ELEGIR_AGENTE } from "@/lib/eventos";

const pedirFicha = (agente: IdAgente) => window.dispatchEvent(new CustomEvent(EVENTO_ELEGIR_AGENTE, { detail: agente }));

/** Botón que abre la ficha de un agente en la misma página. */
export function BotonFicha({
  agente,
  children,
  className = "btn btn--suave",
  style,
  ariaLabel,
}: {
  agente: IdAgente;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
}) {
  return (
    <button type="button" className={className} style={style} aria-label={ariaLabel} onClick={() => pedirFicha(agente)}>
      {children}
    </button>
  );
}

/**
 * Enlace a la ficha de un agente (/agentes?ficha=lola). Si la página puede
 * abrir la ficha ahí mismo, la abre sin cambiar de página.
 */
export function EnlaceFicha({ agente, children, className = "" }: { agente: IdAgente; children: ReactNode; className?: string }) {
  return (
    <Link
      href={`/agentes?ficha=${agente}`}
      className={className}
      onClick={(e) => {
        if (!document.documentElement.hasAttribute("data-fichas")) return;
        e.preventDefault();
        pedirFicha(agente);
      }}
    >
      {children}
    </Link>
  );
}
