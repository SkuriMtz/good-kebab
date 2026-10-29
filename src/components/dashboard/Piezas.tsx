"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { Personaje } from "@/components/agentes/Personaje";
import { Icono, type NombreIcono } from "@/components/base/Iconos";
import type { IdAgente } from "@/lib/agentes";
import { completa, fechaDe, relativo } from "./tiempo";
import type { Accion } from "./tipos";

/* ---------------------------------------------------------------------
   Piezas chicas del dashboard. Todo con tokens de la base; el estilo
   vive en src/estilos/dashboard.css (prefijo .dash-).
   --------------------------------------------------------------------- */

type TamMarca = 20 | 24 | 28 | 32 | 40 | 64;
// Tamaños de la marca de agente de la base (clases completas para Tailwind)
const CLASE_TAM: Record<TamMarca, string> = {
  20: "marca-agente--20",
  24: "marca-agente--24",
  28: "marca-agente--28",
  32: "marca-agente--32",
  40: "marca-agente--40",
  64: "marca-agente--64",
};

/** El personaje de un agente en su círculo con un velo de su color (su "avatar"). */
export function MarcaAgente({ id, tam = 32, className = "" }: { id: IdAgente; tam?: TamMarca; className?: string }) {
  return (
    <span className={`dash-marca marca-agente ${CLASE_TAM[tam]} ${className}`} style={{ "--agente": `var(--agente-${id})` } as CSSProperties} aria-hidden="true">
      <Personaje agente={id} avatar />
    </span>
  );
}

/** Dos o más personajes encimados (un grupo, un relevo entre agentes). */
export function PilaAgentes({ ids, tam = 24, className = "" }: { ids: readonly IdAgente[]; tam?: TamMarca; className?: string }) {
  return (
    <span className={`dash-pila ${className}`} aria-hidden="true">
      {ids.map((id) => (
        <MarcaAgente key={id} id={id} tam={tam} />
      ))}
    </span>
  );
}

/**
 * Lo que lleva a algún lado: un enlace (href) o un botón que cambia de vista
 * (alElegir). Sin ninguno de los dos, es texto: nada finge que funciona.
 */
export function Accionable({
  accion,
  className = "",
  children,
  etiqueta,
  actual,
}: {
  accion: Accion;
  className?: string;
  children: ReactNode;
  etiqueta?: string;
  actual?: boolean;
}) {
  if (accion.href) {
    return (
      <Link href={accion.href} className={className} aria-label={etiqueta} aria-current={actual ? "page" : undefined} onClick={accion.alElegir}>
        {children}
      </Link>
    );
  }
  if (accion.alElegir) {
    return (
      <button type="button" className={className} onClick={accion.alElegir} aria-label={etiqueta} aria-current={actual ? "page" : undefined}>
        {children}
      </button>
    );
  }
  return <span className={className}>{children}</span>;
}

/** Hora relativa ("hace 12 min") con la fecha completa al pasar el cursor. Reserva su espacio mientras llega la hora. */
export function Hora({ item, ahora, className = "" }: { item: { fecha?: string; haceMin?: number }; ahora: Date | null; className?: string }) {
  const fecha = fechaDe(item, ahora);
  return (
    <time className={`dash-hora cifras ${className}`} dateTime={fecha?.toISOString()} title={completa(fecha)}>
      {relativo(fecha, ahora)}
    </time>
  );
}

/** Encabezado de un bloque: título, contador opcional y una acción a la derecha. */
export function CabezaBloque({
  id,
  titulo,
  extra,
  accion,
  nivel = 2,
}: {
  id?: string;
  titulo: string;
  extra?: ReactNode;
  accion?: ReactNode;
  nivel?: 2 | 3;
}) {
  const H = nivel === 2 ? "h2" : "h3";
  return (
    <div className="dash-cabeza">
      <H id={id} className="dash-cabeza__titulo">
        {titulo}
        {extra}
      </H>
      {accion ? <div className="dash-cabeza__accion">{accion}</div> : null}
    </div>
  );
}

/** Enlace de texto azul con flecha (la acción secundaria de un bloque: "Ver todas"). */
export function EnlaceMas({ accion, children, etiqueta }: { accion: Accion; children: ReactNode; etiqueta?: string }) {
  return (
    <Accionable accion={accion} className="dash-enlace" etiqueta={etiqueta}>
      {children}
      <Icono nombre="chevron-derecha" tam={16} />
    </Accionable>
  );
}

/**
 * Estado vacío: un ícono de contorno (sin círculo de color), qué es este
 * lugar, por qué está vacío y qué hacer. Nunca un hueco en blanco.
 */
export function Vacio({
  icono,
  agente,
  titulo,
  texto,
  accion,
  compacto = false,
}: {
  icono?: NombreIcono;
  agente?: IdAgente;
  titulo: string;
  texto: ReactNode;
  accion?: ReactNode;
  compacto?: boolean;
}) {
  return (
    <div className={`dash-vacio${compacto ? " dash-vacio--compacto" : ""}`}>
      {agente ? <MarcaAgente id={agente} tam={40} /> : icono ? <Icono nombre={icono} tam={24} className="dash-vacio__icono" /> : null}
      <p className="dash-vacio__titulo">{titulo}</p>
      <p className="dash-vacio__texto">{texto}</p>
      {accion ? <div className="dash-vacio__accion">{accion}</div> : null}
    </div>
  );
}
