import type { ElementType, ReactNode } from "react";
import { Etiqueta } from "./Etiqueta";

// Clases completas para que Tailwind no las descarte al compilar
const FONDO = { fondo: "seccion--fondo", portada: "seccion--portada", "fondo-2": "seccion--fondo-2", ninguno: "" } as const;

/**
 * Sección de página: ancho máximo 1200px centrado, orilla lateral
 * (20 / 24 / 32px) y separación vertical de 64px en celular a 96px en
 * computadora. El fondo es parte del ritmo de la página:
 * - "fondo"   → #0d1117 (la página)
 * - "portada" → #000 (solo la portada)
 * - "fondo-2" → #151a22 (franja secundaria; en claro #f6f8fa)
 * - "ninguno" → transparente (para dejar ver una escena o un halo)
 * `halo` agrega el contexto para poner <Halo> dentro sin desbordar de lado.
 */
export function Seccion({
  id,
  as: Etiquetado = "section",
  fondo = "fondo",
  espacio = "normal",
  halo = false,
  ancho = "normal",
  etiquetadaPor,
  className = "",
  classNameContenedor = "",
  children,
}: {
  id?: string;
  as?: ElementType;
  fondo?: "fondo" | "portada" | "fondo-2" | "ninguno";
  espacio?: "normal" | "compacto" | "ninguno";
  halo?: boolean;
  /** "normal" = 1200px; "angosto" = 760px (texto largo, preguntas). */
  ancho?: "normal" | "angosto";
  /** id del título que nombra la sección (aria-labelledby). */
  etiquetadaPor?: string;
  className?: string;
  classNameContenedor?: string;
  children: ReactNode;
}) {
  const clases = [
    espacio === "normal" ? "seccion" : espacio === "compacto" ? "seccion seccion--compacta" : "relative",
    FONDO[fondo],
    halo ? "con-halo" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <Etiquetado id={id} className={clases} aria-labelledby={etiquetadaPor}>
      <div className={`contenedor${ancho === "angosto" ? " contenedor--angosto" : ""} ${classNameContenedor}`}>
        {children}
      </div>
    </Etiquetado>
  );
}

/**
 * Encabezado de sección: adorno opcional arriba (el personaje del agente o un
 * ícono), etiqueta en Mono, título 40px/460 y texto 18px en gris perla
 * (máx. 640px). Centrado por defecto; "izquierda" para composiciones asimétricas.
 * Deja 48px antes del contenido de la sección.
 */
export function EncabezadoSeccion({
  adorno,
  etiqueta,
  titulo,
  texto,
  alineacion = "centro",
  nivel = 2,
  id,
  className = "",
}: {
  adorno?: ReactNode;
  etiqueta?: ReactNode;
  titulo: ReactNode;
  texto?: ReactNode;
  alineacion?: "centro" | "izquierda";
  nivel?: 1 | 2 | 3;
  /** id del título (para aria-labelledby de la sección). */
  id?: string;
  className?: string;
}) {
  const Titulo = `h${nivel}` as ElementType;
  return (
    <header className={`encabezado${alineacion === "izquierda" ? " encabezado--izquierda" : ""} ${className}`}>
      {adorno ? (
        <div className="encabezado__adorno" aria-hidden="true">
          {adorno}
        </div>
      ) : null}
      {etiqueta ? <Etiqueta>{etiqueta}</Etiqueta> : null}
      <Titulo id={id} className={nivel === 1 ? "t-grande" : "t-seccion"}>
        {titulo}
      </Titulo>
      {texto ? <p className="t-intro">{texto}</p> : null}
    </header>
  );
}
