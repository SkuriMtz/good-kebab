"use client";

import { createContext, useContext } from "react";

/** Lo que las piezas del dashboard pueden pedirle al armazón (abrir la paleta o los atajos). */
export const ContextoTablero = createContext<{ abrirPaleta: () => void; abrirAtajos: () => void; esMac: boolean }>({
  abrirPaleta: () => {},
  abrirAtajos: () => {},
  esMac: false,
});

export const useTablero = () => useContext(ContextoTablero);
