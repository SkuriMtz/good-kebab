import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

/**
 * Encabezado de sección: el número (01, 02…) en brasa, el nombre de la
 * sección y un dato extra, como la etiqueta de una pieza de museo.
 */
export function Claqueta({ n, izquierda, derecha }: { n: number; izquierda: string; derecha?: string }) {
  return (
    <p className="numero-seccion">
      <span className="numero-seccion__n">{String(n).padStart(2, "0")}</span>
      <span className="font-medium text-bone">{izquierda}</span>
      {derecha ? <span className="numero-seccion__extra">{derecha}</span> : null}
    </p>
  );
}

/** Marca un texto de ejemplo que falta revisar. */
export function Borrador({ children = "Texto de ejemplo · revísalo" }: { children?: ReactNode }) {
  return <span className="borrador">{children}</span>;
}

/** Encabezado de una página: etiqueta, título enorme en mayúsculas a la izquierda; explicación y acciones a la derecha. */
export function EncabezadoPagina({
  n = 1,
  izquierda,
  derecha,
  titulo,
  texto,
  acciones,
}: {
  n?: number;
  izquierda: string;
  derecha?: string;
  titulo: ReactNode;
  texto?: ReactNode;
  acciones?: ReactNode;
}) {
  return (
    <div className="encabezado">
      <div>
        <Claqueta n={n} izquierda={izquierda} derecha={derecha} />
        <Reveal as="h1" className="display mt-6">
          {titulo}
        </Reveal>
      </div>
      {texto || acciones ? (
        <Reveal delay={120} className="flex flex-col items-start gap-7 lg:pb-2">
          {texto ? <p className="cuerpo max-w-[560px]">{texto}</p> : null}
          {acciones ? <div className="flex flex-wrap items-center gap-x-6 gap-y-3">{acciones}</div> : null}
        </Reveal>
      ) : null}
    </div>
  );
}
