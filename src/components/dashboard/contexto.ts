"use client";

import { createContext, useContext } from "react";

/**
 * ¿Esta página ya está dentro del armazón del dashboard? Lo usan las piezas
 * viejas del panel (la barra NavApp) para no pintarse dos veces.
 */
export const ContextoArmazon = createContext(false);

export const useEnArmazon = () => useContext(ContextoArmazon);
