import type { ElementType, HTMLAttributes, ReactNode } from "react";

// Clases completas para que Tailwind no las descarte al compilar
const TONO = { cuerpo: "", cielo: "etiqueta--cielo", tenue: "etiqueta--tenue", texto: "etiqueta--texto" } as const;

/**
 * Etiqueta en Mona Sans Mono 12/500, mayúsculas, tracking 0.015em.
 * Se usa como sello de hora y de canal ("WHATSAPP · 23:14"), nunca como adorno.
 * tono: "cuerpo" (#a4aea6, por defecto), "cielo" (#8dd6ff), "tenue" o "texto".
 * Acepta los atributos de siempre (data-*, aria-*, title…), que pasan al elemento.
 */
export function Etiqueta({
  as: Elemento = "p",
  tono = "cuerpo",
  className = "",
  children,
  ...resto
}: {
  as?: ElementType;
  tono?: "cuerpo" | "cielo" | "tenue" | "texto";
  className?: string;
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "className" | "children">) {
  const clase = ["etiqueta", TONO[tono], className].filter(Boolean).join(" ");
  return (
    <Elemento {...resto} className={clase}>
      {children}
    </Elemento>
  );
}
