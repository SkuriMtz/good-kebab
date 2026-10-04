import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

/**
 * Encabezado de sección: el número (01, 02…) en una pastilla, el nombre de
 * la sección y un dato extra, como la claqueta de una toma.
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

/** Encabezado de una página: claqueta, título grande, texto y acciones. */
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
    <div className="grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-12">
      <div className="lg:col-span-7">
        <Claqueta n={n} izquierda={izquierda} derecha={derecha} />
        <Reveal as="h1" className="titulo titulo--xl mt-6">
          {titulo}
        </Reveal>
      </div>
      {texto || acciones ? (
        <Reveal delay={120} className="flex flex-col items-start gap-6 lg:col-span-5 lg:pb-2">
          {texto ? <p className="texto-suave max-w-[440px]">{texto}</p> : null}
          {acciones ? <div className="flex flex-wrap items-center gap-x-6 gap-y-3">{acciones}</div> : null}
        </Reveal>
      ) : null}
    </div>
  );
}
