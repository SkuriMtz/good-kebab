"use client";

import { Escena } from "./Escena";
import type { EscenaInicio } from "@/lib/inicio";

/**
 * El fondo de figuras del inicio. Recibe el nombre de la escena (una de las
 * 8 de src/lib/inicio.ts) y hace el cambio solo: los triangulitos se
 * sueltan y vuelan a formar la figura nueva.
 *
 * Esta es la interfaz que comparten los dos motores (el de la v7 y el de
 * Three.js). Por ahora usa el motor de la v7 con figuras provisionales; la
 * figura de cada escena se elige en FORMA_INICIO (escenas.ts).
 */
export function FondoFiguras({ escena }: { escena: EscenaInicio }) {
  return <Escena escena={escena} />;
}
