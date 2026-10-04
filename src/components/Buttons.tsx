import Link from "next/link";
import type { ReactNode } from "react";

/*
 * Botones del sistema de diseño (el estilo vive en globals.css):
 * - primario: el único botón lleno (azul), para la acción principal de la pantalla
 * - suave: tinte azul, la alternativa de menor compromiso
 * - texto: solo texto, para acciones terciarias
 * - borde: con borde fino, para acciones compactas
 * Los botones con efectos (texto que rueda, efecto magnético) están
 * guardados en componentes-pendientes/botones-con-efectos.
 */

export type Variante = "primario" | "suave" | "texto" | "borde";

export const claseBoton = (variante: Variante = "primario", tam?: "grande" | "chico") =>
  `btn btn--${variante}${tam ? ` btn--${tam}` : ""}`;

/** Flecha → para los botones que llevan a otra página. */
export function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg className={`flecha h-4 w-4 ${className}`} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Indicador de carga: un círculo que gira. */
export function Spinner({ className = "" }: { className?: string }) {
  return <span className={`girando ${className}`} aria-hidden="true" />;
}

/** Palomita para las listas de "lo que incluye" o "lo que hace". */
export function Check({ className = "h-4 w-4", color }: { className?: string; color?: string }) {
  return (
    <svg className={className} style={color ? { color } : undefined} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8.4 6.4 11.5 13 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Un enlace con forma de botón. */
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
    <Link href={href} className={`${claseBoton(variante, tam)} ${className}`}>
      {children}
      {flecha ? <Arrow /> : null}
    </Link>
  );
}
