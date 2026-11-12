"use client";

import type { ReactNode, RefObject, UIEvent } from "react";
import type { IdAgente } from "@/lib/agentes";
import { FondoFragmentos } from "./FondoFragmentos";
import { PilaAgentes } from "./Mensajes";

/**
 * La conversación abierta, en el mismo lugar que el Inicio: una cabecera
 * delgada (con quién hablas y qué está pasando), los mensajes en una
 * columna centrada de 720px que se desplaza sola y la caja fija abajo con
 * las mismas medidas que en el Inicio. La forma es la misma en /panel
 * (IA de verdad) y en /pruebalo (guion local).
 */
export function Conversacion({
  agentes,
  titulo,
  sub,
  acciones,
  children,
  caja,
  legal,
  aviso,
  scrollRef,
  alDesplazar,
}: {
  agentes: readonly IdAgente[];
  titulo: ReactNode;
  /** Debajo del título: "Lola está escribiendo…", el área o el grupo. */
  sub: ReactNode;
  acciones?: ReactNode;
  children: ReactNode;
  caja: ReactNode;
  legal?: ReactNode;
  /** Arriba de la caja (límite del plan, un error). */
  aviso?: ReactNode;
  scrollRef?: RefObject<HTMLDivElement>;
  alDesplazar?: (e: UIEvent<HTMLDivElement>) => void;
}) {
  return (
    <div className="pc-conv">
      <FondoFragmentos proteger={[".pc-conv__cabeza", ".pc-conv__pie"]} />
      <header className="pc-conv__cabeza">
        <PilaAgentes agentes={agentes} tam={24} />
        <div className="pc-conv__cabeza-texto">
          <p className="pc-conv__titulo">{titulo}</p>
          <p className="pc-conv__sub" aria-live="polite">
            {sub}
          </p>
        </div>
        {acciones ? <div className="pc-conv__acciones">{acciones}</div> : null}
      </header>
      <div ref={scrollRef} className="pc-conv__mensajes" data-lenis-prevent onScroll={alDesplazar}>
        <div className="pc-conv__columna">{children}</div>
      </div>
      <div className="pc-conv__pie">
        {aviso ? <div className="pc-conv__aviso">{aviso}</div> : null}
        <div className="pc-conv__caja">{caja}</div>
        {legal ? <p className="pc-conv__legal">{legal}</p> : null}
      </div>
    </div>
  );
}
