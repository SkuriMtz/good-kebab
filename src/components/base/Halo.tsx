import type { CSSProperties } from "react";

// Clases completas para que Tailwind no las descarte al compilar
const VARIANTE = { halo: "", haz: "halo--haz", rastro: "halo--rastro" } as const;

/**
 * Atmósfera de la guía (nunca en botones, tarjetas ni texto; siempre
 * difuminada; opacidad máxima 0.6, más suave en modo claro):
 * - "halo": el halo morado de la portada. radial-gradient de
 *   rgba(167,162,255,0.5) a transparente, blur(60px). Va detrás del título.
 * - "haz" (violet beam): lavado violeta → azul para separar dos secciones oscuras.
 * - "rastro" (green trace): de neutro a verde. Raro: solo para pasar a una
 *   sección de acción.
 * Se posiciona en absoluto dentro de un padre con la clase "con-halo"
 * (o <Seccion halo>). x / y son el centro (por defecto 50% / 50%).
 */
export function Halo({
  variante = "halo",
  x,
  y,
  ancho,
  proporcion,
  suave = false,
  className = "",
  style,
}: {
  variante?: "halo" | "haz" | "rastro";
  /** Centro horizontal (ej. "50%", "20%", "320px"). */
  x?: string;
  /** Centro vertical (ej. "40%", "0px"). */
  y?: string;
  /** Ancho (ej. "min(960px, 130vw)"). */
  ancho?: string;
  /** Proporción ancho / alto (ej. "16 / 10"). */
  proporcion?: string;
  /** Más tenue (60% de la opacidad del modo). */
  suave?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const vars = {
    ...(x ? { "--halo-x": x } : null),
    ...(y ? { "--halo-y": y } : null),
    ...(ancho ? { "--halo-ancho": ancho } : null),
    ...(proporcion ? { "--halo-proporcion": proporcion } : null),
    ...style,
  } as CSSProperties;
  const clases = ["halo", VARIANTE[variante], suave ? "halo--suave" : "", className]
    .filter(Boolean)
    .join(" ");
  return <div className={clases} style={vars} aria-hidden="true" />;
}
