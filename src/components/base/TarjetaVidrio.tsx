import type { ElementType, HTMLAttributes, ReactNode } from "react";

/**
 * Tarjeta de vidrio: fondo blanco translúcido (0.06 → 0.2), borde 1px
 * rgba(255,255,255,0.1), radio 24px, backdrop-filter blur(20px), sin
 * sombras. En modo claro pasa a blanca con borde #d1d9e0 (tokens).
 *
 * - nivel: "normal" (0.06), "fuerte" (0.1) o "frost" (0.2, para ventanas
 *   flotantes como las fichas de agente).
 * - destacada: borde #8c93fb (plan recomendado o elemento elegido). Con mesura.
 * - relleno: "normal" (24px), "amplio" (24px en celular, 40px en computadora) o "ninguno".
 * - as: la etiqueta HTML (div, article, li, section…).
 */
export function TarjetaVidrio({
  as: Etiqueta = "div",
  nivel = "normal",
  destacada = false,
  relleno = "normal",
  className = "",
  children,
  ...resto
}: {
  as?: ElementType;
  nivel?: "normal" | "fuerte" | "frost";
  destacada?: boolean;
  relleno?: "normal" | "amplio" | "ninguno";
  className?: string;
  children: ReactNode;
} & HTMLAttributes<HTMLElement>) {
  const clases = [
    "vidrio",
    nivel === "fuerte" ? "vidrio--fuerte" : nivel === "frost" ? "vidrio--frost" : "",
    destacada ? "vidrio--destacada" : "",
    relleno === "normal" ? "vidrio--relleno" : "",
    relleno === "amplio" ? "vidrio--relleno vidrio--relleno-amplio" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <Etiqueta className={clases} {...resto}>
      {children}
    </Etiqueta>
  );
}
