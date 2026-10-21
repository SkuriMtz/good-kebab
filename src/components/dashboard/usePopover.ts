"use client";

import { useCallback, useEffect, useRef, useState, type FocusEvent } from "react";

/**
 * Abrir y cerrar algo que flota (avisos, resultados de búsqueda) igual que
 * el <Menu> de la base: clic afuera, Esc (el foco vuelve al disparador) y
 * Tab hacia afuera lo cierran.
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
