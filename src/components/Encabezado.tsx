import type { ReactNode } from "react";

/** Marca un texto de ejemplo que falta revisar. */
export function Borrador({ children = "Texto de ejemplo · revísalo" }: { children?: ReactNode }) {
  return <span className="borrador">{children}</span>;
}

/**
 * Encabezado de una página: etiqueta en ámbar y título enorme a la
 * izquierda; el texto y las acciones abajo, alineados igual.
 */
export function EncabezadoPagina({
  etiqueta,
  titulo,
  texto,
  acciones,
}: {
  etiqueta?: ReactNode;
  titulo: ReactNode;
  texto?: ReactNode;
  acciones?: ReactNode;
}) {
  return (
    <header className="contenedor pb-[var(--spacing-60)] pt-[var(--spacing-36)] lg:pb-[var(--spacing-96)] lg:pt-[var(--spacing-96)]">
      {etiqueta ? <p className="t-etiqueta">{etiqueta}</p> : null}
      <h1 className="t-display mt-[var(--spacing-18)] max-w-[15ch]">{titulo}</h1>
      {texto || acciones ? (
        <div className="mt-[var(--spacing-36)] flex flex-col gap-[var(--spacing-24)] lg:flex-row lg:items-end lg:justify-between">
          {texto ? <p className="t-editorial max-w-[520px]">{texto}</p> : <span />}
          {acciones ? <div className="flex flex-wrap items-center gap-[var(--spacing-12)]">{acciones}</div> : null}
        </div>
      ) : null}
    </header>
  );
}

/** Encabezado de una sección: etiqueta en ámbar, título y texto. */
export function EncabezadoSeccion({ etiqueta, titulo, texto, id }: { etiqueta?: ReactNode; titulo: ReactNode; texto?: ReactNode; id?: string }) {
  return (
    <div>
      {etiqueta ? <p className="t-etiqueta">{etiqueta}</p> : null}
      <h2 id={id} className="t-seccion mt-[var(--spacing-18)] max-w-[18ch]">
        {titulo}
      </h2>
      {texto ? <p className="t-cuerpo mt-[var(--spacing-18)] max-w-[520px]">{texto}</p> : null}
    </div>
  );
}
