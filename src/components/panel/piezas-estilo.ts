/*
 * Funciones de estilo de las piezas del panel que también se usan desde
 * componentes que arma el servidor (Hoy, PorAprobar…). Van aparte de
 * Piezas.tsx porque ese archivo es solo del navegador ("use client") y el
 * servidor no puede llamar funciones de ahí.
 */

export type Variante = "principal" | "suave" | "borde" | "fantasma";

/**
 * Retraso de la entrada escalonada: 40ms entre tarjetas al principio y
 * cada vez menos (no es un metrónomo), con tope en ~240ms: lo del final
 * llega con las últimas y nada bloquea los clics.
 */
export function retrasoEscalon(i: number) {
  return Math.min(240, Math.round(40 * Math.pow(Math.max(0, i), 0.85)));
}

export const claseBoton = (variante: Variante = "suave", chico = false) => `pc-boton pc-boton--${variante}${chico ? " pc-boton--chico" : ""}`;
