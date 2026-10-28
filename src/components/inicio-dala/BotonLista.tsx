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
      className={`boton-lista ${className}`}
      onClick={(e) => {
        // Sin la ventana en la página, o con Cmd/Ctrl/Shift (otra pestaña o ventana), el enlace normal
        if (!document.documentElement.hasAttribute("data-lista") || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        window.dispatchEvent(new CustomEvent(EVENTO_LISTA));
      }}
    >
      <span className="boton-lista__texto">{children}</span>
    </a>
  );
}
