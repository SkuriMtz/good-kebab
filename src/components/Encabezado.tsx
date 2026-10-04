import type { ReactNode } from "react";

/** Marca un texto de ejemplo que falta revisar. */
export function Borrador({ children = "Texto de ejemplo · revísalo" }: { children?: ReactNode }) {
  return <span className="borrador">{children}</span>;
}

/**
 * Encabezado de una página, centrado: lo de arriba (p. ej. las marcas de los
 * agentes), el título grande, la entradilla en serif y las acciones.
 */
export function EncabezadoPagina({
  arriba,
  titulo,
  texto,
  acciones,
}: {
  arriba?: ReactNode;
  titulo: ReactNode;
  texto?: ReactNode;
  acciones?: ReactNode;
}) {
  return (
    <header className="contenedor pb-12 pt-12 text-center sm:pt-16 lg:pb-16 lg:pt-20">
      {arriba ? <div className="mb-6 flex justify-center">{arriba}</div> : null}
      <h1 className="t-display mx-auto max-w-[18ch]">{titulo}</h1>
      {texto ? <p className="t-editorial t-editorial--grande mx-auto mt-5 max-w-[640px]">{texto}</p> : null}
      {acciones ? <div className="mt-8 flex flex-wrap items-center justify-center gap-3">{acciones}</div> : null}
    </header>
  );
}

/** Encabezado de una sección: etiqueta, título y entradilla. */
export function EncabezadoSeccion({
  etiqueta,
  titulo,
  texto,
  centrado = false,
  id,
}: {
  etiqueta?: ReactNode;
  titulo: ReactNode;
  texto?: ReactNode;
  centrado?: boolean;
  id?: string;
}) {
  return (
    <div className={centrado ? "mx-auto max-w-[760px] text-center" : "max-w-[760px]"}>
      {etiqueta ? <p className="t-etiqueta">{etiqueta}</p> : null}
      <h2 id={id} className="t-seccion mt-3">
        {titulo}
      </h2>
      {texto ? <p className={`t-editorial mt-4 ${centrado ? "mx-auto" : ""} max-w-[620px]`}>{texto}</p> : null}
    </div>
  );
}
