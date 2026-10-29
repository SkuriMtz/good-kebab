"use client";

import { useCallback, useEffect, useRef, useState, type FocusEvent, type ReactNode } from "react";

/**
 * Algo que flota y NO es un menú (avisos, resultados de búsqueda, una
 * ayuda): mismo panel y movimiento que <Menu> (.menu__panel: radio 14,
 * borde, sombra flotante; entra con opacidad + escala 0.98→1 + 4px), pero
 * con role="dialog" y sin la navegación de menú.
 *
 * - `usePopover()`: abrir y cerrar como el menú: clic afuera, Esc (el foco
 *   vuelve al disparador) y Tab hacia afuera lo cierran.
 * - `<Popover>`: el envoltorio (raíz + disparador + panel). En una barra de
 *   vidrio o en el producto el panel sale sólido (`.menu--solido`).
 */
export function usePopover<T extends HTMLElement = HTMLButtonElement>() {
  const [abierto, setAbierto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const disparador = useRef<T>(null);

  const cerrar = useCallback((devolverFoco = false) => {
    setAbierto(false);
    if (devolverFoco) disparador.current?.focus();
  }, []);

  useEffect(() => {
    if (!abierto) return;
    const alTocar = (e: PointerEvent) => {
      if (!raiz.current?.contains(e.target as Node)) cerrar(false);
    };
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      cerrar(Boolean(raiz.current?.contains(document.activeElement)));
    };
    document.addEventListener("pointerdown", alTocar);
    document.addEventListener("keydown", alTeclear);
    return () => {
      document.removeEventListener("pointerdown", alTocar);
      document.removeEventListener("keydown", alTeclear);
    };
  }, [abierto, cerrar]);

  const alSalirFoco = (e: FocusEvent) => {
    if (abierto && e.relatedTarget && !raiz.current?.contains(e.relatedTarget as Node)) cerrar(false);
  };

  return { abierto, setAbierto, cerrar, raiz, disparador, alSalirFoco };
}

/** Envoltorio de un popover: `disparador(props)` recibe lo que necesita el botón. */
export function Popover({
  id,
  etiqueta,
  disparador,
  children,
  alineacion = "inicio",
  solido = true,
  className = "",
  classNamePanel = "",
}: {
  id: string;
  /** Nombre del panel para lectores de pantalla. */
  etiqueta: string;
  disparador: (props: {
    ref: React.RefObject<HTMLButtonElement>;
    "aria-expanded": boolean;
    "aria-controls": string;
    "aria-haspopup": "dialog";
    onClick: () => void;
  }) => ReactNode;
  children: ReactNode | ((cerrar: (devolverFoco?: boolean) => void) => ReactNode);
  alineacion?: "inicio" | "fin";
  solido?: boolean;
  className?: string;
  classNamePanel?: string;
}) {
  const { abierto, setAbierto, cerrar, raiz, disparador: ref, alSalirFoco } = usePopover<HTMLButtonElement>();
  return (
    <div ref={raiz} className={`menu${alineacion === "fin" ? " menu--fin" : ""}${solido ? " menu--solido" : ""} ${className}`} onBlur={alSalirFoco}>
      {disparador({ ref, "aria-expanded": abierto, "aria-controls": id, "aria-haspopup": "dialog", onClick: () => setAbierto((v) => !v) })}
      <div id={id} role="dialog" aria-label={etiqueta} className={`menu__panel popover ${classNamePanel}`} data-abierto={abierto ? "true" : undefined}>
        {typeof children === "function" ? children(cerrar) : children}
      </div>
    </div>
  );
}
