"use client";

import type { ReactNode } from "react";
import { EVENTO_LISTA } from "@/lib/inicio";

/**
 * "Únete a la lista": la píldora violeta. Abre el formulario de la lista de
 * espera ahí mismo (DialogoLista) y, si la página no lo tiene o no hay
 * JavaScript, lleva a /lista.
 */
export function BotonLista({ children = "Únete a la lista", className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <a
      href="/lista"
      className={`pildora ${className}`}
      onClick={(e) => {
        if (!document.documentElement.hasAttribute("data-lista")) return;
        e.preventDefault();
        window.dispatchEvent(new CustomEvent(EVENTO_LISTA));
      }}
    >
      <span className="pildora__texto">{children}</span>
    </a>
  );
}
