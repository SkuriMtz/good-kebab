"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { Boton } from "@/components/base/Boton";
import { Icono } from "@/components/base/Iconos";
import { Insignia } from "@/components/base/Insignia";
import { Personaje } from "@/components/agentes/Personaje";
import type { IdAgente } from "@/lib/agentes";
import type { Accion, Vacio as DatosVacio } from "./tipos";

/** Tamaños de los avatares de la base (tokens --avatar-*). */
type Tam = 20 | 24 | 28 | 32 | 40 | 64;

/** El personaje de un agente dentro de su círculo de color (su identidad). */
export function CaraAgente({ id, tam = 28, className = "" }: { id: IdAgente; tam?: Tam; className?: string }) {
  return (
    <span
      className={`tb-cara ${className}`}
      style={{ "--agente": `var(--agente-${id})`, "--tam": `var(--avatar-${tam})` } as CSSProperties}
      aria-hidden="true"
    >
      <Personaje agente={id} avatar />
    </span>
  );
}

/** Varios agentes encimados (grupos), como una pila de avatares. */
export function CarasAgentes({ ids, tam = 28 }: { ids: IdAgente[]; tam?: Tam }) {
  if (ids.length === 1) return <CaraAgente id={ids[0]} tam={tam} />;
  return (
    <span className="tb-caras" aria-hidden="true">
      {ids.slice(0, 3).map((id) => (
        <CaraAgente key={id} id={id} tam={tam} className="tb-caras__una" />
      ))}
    </span>
  );
}

/**
 * Una acción como enlace (`href`, con next/link; los "#ancla" se quedan en la
 * página) o como botón (`alElegir`, la demostración cambia de vista).
 */
export function EnlaceAccion({
  accion,
  className = "",
  children,
  alPulsar,
  ...resto
}: {
  accion: Accion;
  className?: string;
  children?: ReactNode;
  /** Además de la acción (ej. cerrar el cajón al navegar). */
  alPulsar?: () => void;
  "aria-label"?: string;
  "aria-describedby"?: string;
}) {
  const contenido = children ?? accion.etiqueta;
  if (accion.href) {
    return (
      <Link href={accion.href} className={className} onClick={alPulsar} {...resto}>
        {contenido}
      </Link>
    );
  }
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        accion.alElegir?.();
        alPulsar?.();
      }}
      {...resto}
    >
      {contenido}
    </button>
  );
}

/** Una acción con aspecto de botón de la base. */
export function BotonAccion({
  accion,
  variante = "sutil",
  className = "",
}: {
  accion: Accion;
  variante?: "principal" | "sutil" | "fantasma";
  className?: string;
}) {
  const icono = accion.icono ? <Icono nombre={accion.icono} /> : undefined;
  if (accion.href) {
    return (
      <Boton href={accion.href} variante={variante} tam="compacto" icono={icono} className={className}>
        {accion.etiqueta}
      </Boton>
    );
  }
  return (
    <Boton variante={variante} tam="compacto" icono={icono} onClick={accion.alElegir} className={className}>
      {accion.etiqueta}
    </Boton>
  );
}

/** Encabezado de una sección del dashboard: título y, a la derecha, un enlace. */
export function CabezaSeccion({ id, titulo, accion, extra }: { id: string; titulo: ReactNode; accion?: Accion; extra?: ReactNode }) {
  return (
    <div className="tb-cabeza">
      <h2 id={id} className="tb-cabeza__titulo">
        {titulo}
      </h2>
      {extra}
      {accion ? (
        <EnlaceAccion accion={accion} className="tb-enlace">
          {accion.etiqueta}
          <Icono nombre="chevron-derecha" tam={16} />
        </EnlaceAccion>
      ) : null}
    </div>
  );
}

/**
 * Estado vacío: qué es este lugar y qué hacer para que se llene. Sin
 * ilustraciones ni íconos en círculos: un ícono de contorno, el texto y la salida.
 */
export function Vacio({ vacio, icono = "reloj", compacto = false }: { vacio: DatosVacio; icono?: Parameters<typeof Icono>[0]["nombre"]; compacto?: boolean }) {
  return (
    <div className={`tb-vacio${compacto ? " tb-vacio--compacto" : ""}`}>
      <Icono nombre={icono} tam={compacto ? 20 : 24} className="tb-vacio__icono" />
      <div className="tb-vacio__texto">
        <p className="tb-vacio__titulo">
          {vacio.titulo}
          {vacio.pronto ? <Insignia tono="pronto">Pronto</Insignia> : null}
        </p>
        <p className="tb-vacio__detalle">{vacio.texto}</p>
        {vacio.accion ? <BotonAccion accion={vacio.accion} variante="sutil" className="tb-vacio__accion" /> : null}
      </div>
    </div>
  );
}

/** Marca discreta de "Datos de ejemplo" (en todo lo que no es real). */
export function DatosDeEjemplo() {
  return <Insignia tono="pronto">Datos de ejemplo</Insignia>;
}

/** Encabezado de una vista (Citas, Correo, Agentes…): título, una línea y acciones. */
export function EncabezadoVista({
  titulo,
  texto,
  ejemplo = false,
  children,
}: {
  titulo: string;
  texto?: ReactNode;
  ejemplo?: boolean;
  children?: ReactNode;
}) {
  return (
    <header className="tb-encabezado">
      <div className="tb-encabezado__texto">
        <h1 className="t-app-titulo-grande tb-encabezado__titulo">
          {titulo}
          {ejemplo ? <DatosDeEjemplo /> : null}
        </h1>
        {texto ? <p className="tb-encabezado__detalle">{texto}</p> : null}
      </div>
      {children ? <div className="tb-encabezado__acciones">{children}</div> : null}
    </header>
  );
}
