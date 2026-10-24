import type { ReactNode } from "react";
import { Boton, claseBotonBase, type TamBoton, type VarianteBoton } from "./base/Boton";
import { Giro, Icono } from "./base/Iconos";

/*
 * Puente entre los nombres de antes y los botones de la base común
 * (src/components/base/Boton.tsx). Los usos existentes siguen funcionando:
 * - primario → principal (azul de acción desde la base 4b, uno por pantalla)
 * - suave    → sutil (azul cielo con borde)
 * - texto / borde → fantasma (transparente)
 * Código nuevo: usa <Boton> de "@/components/base/Boton" directamente.
 */

export type Variante = "primario" | "suave" | "texto" | "borde";

const A_BASE: Record<Variante, VarianteBoton> = {
  primario: "principal",
  suave: "sutil",
  texto: "fantasma",
  borde: "fantasma",
};

export const claseBoton = (variante: Variante = "primario", tam?: "grande" | "chico") =>
  claseBotonBase(A_BASE[variante], (tam ?? "normal") as TamBoton);

/** Flecha → para los botones que llevan a otra página. */
export function Arrow({ className = "" }: { className?: string }) {
  return <Icono nombre="flecha" tam={16} className={`flecha ${className}`} />;
}

/** Indicador de carga: un círculo que gira. */
export function Spinner({ className = "" }: { className?: string }) {
  return <Giro className={className} />;
}

/** Palomita para las listas de "lo que incluye" o "lo que hace". */
export function Check({ className = "h-4 w-4", color }: { className?: string; color?: string }) {
  return (
    <svg className={className} style={color ? { color } : undefined} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8.4 6.4 11.5 13 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Un enlace con forma de botón (usa el <Boton> de la base). */
export function BotonLink({
  href,
  children,
  variante = "primario",
  tam,
  flecha = false,
  className = "",
}: {
  href: string;
  children: ReactNode;
  variante?: Variante;
  tam?: "grande" | "chico";
  flecha?: boolean;
  className?: string;
}) {
  return (
    <Boton href={href} variante={A_BASE[variante]} tam={tam ?? "normal"} flecha={flecha} className={className}>
      {children}
    </Boton>
  );
}
