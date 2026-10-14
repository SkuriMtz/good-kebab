"use client";

import Link from "next/link";
import { createContext, useContext, type HTMLAttributes, type ReactNode } from "react";
import type { Destino } from "./tipos";

/**
 * El dashboard vive en dos lugares: en /panel cada sección es una ruta, y en
 * /pruebalo cada sección es una vista de la misma página (cambia sin
 * recargar). Los componentes no saben cuál de los dos es: piden ir a un
 * `Destino` y el proveedor decide.
 */

type Contexto = { ir: (destino: Destino) => void };

const NavegacionCtx = createContext<Contexto>({ ir: () => {} });

export function ProveedorNavegacion({ ir, children }: { ir: (destino: Destino) => void; children: ReactNode }) {
  return <NavegacionCtx.Provider value={{ ir }}>{children}</NavegacionCtx.Provider>;
}

export function useIr() {
  return useContext(NavegacionCtx).ir;
}

export const esRuta = (d: Destino): d is { href: string } => "href" in d;

type PropsDestinable = {
  destino?: Destino;
  className?: string;
  children: ReactNode;
  /** Se llama antes de navegar (ej. cerrar el cajón o un menú). */
  alIr?: () => void;
  [dato: `data-${string}`]: string | undefined;
} & Omit<HTMLAttributes<HTMLElement>, "className" | "children" | "onClick">;

/**
 * Algo que lleva a otra parte: con ruta es un enlace (next/link); con vista
 * es un botón que cambia la vista. Sin destino, solo pinta su contenido.
 */
export function Destinable({ destino, className = "", children, alIr, ...resto }: PropsDestinable) {
  const ir = useIr();
  if (!destino) return <span className={className}>{children}</span>;
  if (esRuta(destino)) {
    return (
      <Link href={destino.href} className={className} onClick={() => alIr?.()} {...resto}>
        {children}
      </Link>
    );
  }
  return (
    <button
      type="button"
      className={className}
      {...resto}
      onClick={() => {
        alIr?.();
        ir(destino);
      }}
    >
      {children}
    </button>
  );
}
