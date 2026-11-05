"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Icono } from "@/components/base/Iconos";
import type { IdAgente } from "@/lib/agentes";
import { PilaAgentes } from "./Mensajes";

export type OpcionAgente = {
  id: string;
  etiqueta: string;
  detalle?: string;
  agentes: IdAgente[];
  /** No está en el plan: se ve apagada con el plan que la trae ("Con Atendel One"). */
  bloqueado?: string;
  /** Una acción al final de la lista ("Nuevo grupo…"). */
  accion?: boolean;
};

/**
 * "Todo el equipo ▾" debajo de la caja: elige con quién hablar. Botón que
 * abre una lista (listbox) anclada a él; con teclado: flechas, Enter y Esc.
 * La lista crece desde el botón (origen arriba a la izquierda), 150ms.
 */
export function SelectorAgente({ opciones, activa, alElegir }: { opciones: OpcionAgente[]; activa: string; alElegir: (id: string) => void }) {
  const [abierto, setAbierto] = useState(false);
  const [cursor, setCursor] = useState(0);
  const id = useId();
  const raiz = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const lista = useRef<HTMLUListElement>(null);
  const actual = opciones.find((o) => o.id === activa) ?? opciones[0];
  const elegibles = opciones.map((o, i) => (o.bloqueado ? -1 : i)).filter((i) => i >= 0);

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: PointerEvent) => {
      if (!raiz.current?.contains(e.target as Node)) setAbierto(false);
    };
    window.addEventListener("pointerdown", fuera);
    lista.current?.focus({ preventScroll: true });
    return () => window.removeEventListener("pointerdown", fuera);
  }, [abierto]);

  const abrir = () => {
    const i = opciones.findIndex((o) => o.id === activa);
    setCursor(i >= 0 ? i : (elegibles[0] ?? 0));
    setAbierto(true);
  };
  const cerrar = (devolver = true) => {
    setAbierto(false);
    if (devolver) boton.current?.focus({ preventScroll: true });
  };
  const elegir = (i: number) => {
    const o = opciones[i];
    if (!o || o.bloqueado) return;
    cerrar();
    alElegir(o.id);
  };
  const mover = (paso: number) => {
    const pos = elegibles.indexOf(cursor);
    const sig = elegibles[(pos + paso + elegibles.length) % elegibles.length];
    if (sig !== undefined) setCursor(sig);
  };

  return (
    <div ref={raiz} className="pc-selector">
      <button
        ref={boton}
        type="button"
        className="pc-selector__boton"
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-controls={`${id}-lista`}
        onClick={() => (abierto ? cerrar() : abrir())}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            abrir();
          }
        }}
      >
        <span className="pc-oculto">Con quién hablas: </span>
        {actual.etiqueta}
        <Icono nombre="chevron" tam={14} trazo={2} />
      </button>
      {abierto ? (
        <ul
          ref={lista}
          id={`${id}-lista`}
          className="pc-selector__lista"
          role="listbox"
          tabIndex={-1}
          aria-label="Con quién hablas"
          aria-activedescendant={`${id}-${cursor}`}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              mover(1);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              mover(-1);
            } else if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              elegir(cursor);
            } else if (e.key === "Escape") {
              e.preventDefault();
              cerrar();
            } else if (e.key === "Tab") {
              cerrar(false);
            }
          }}
        >
          {opciones.map((o, i) => (
            <li
              key={o.id}
              id={`${id}-${i}`}
              role="option"
              aria-selected={o.id === activa}
              aria-disabled={o.bloqueado ? true : undefined}
              className={`pc-selector__opcion${o.accion ? " pc-selector__opcion--accion" : ""}`}
              data-cursor={i === cursor ? "" : undefined}
              onPointerEnter={() => !o.bloqueado && setCursor(i)}
              onClick={() => elegir(i)}
            >
              {o.accion ? (
                <span className="pc-selector__mas" aria-hidden="true">
                  <Icono nombre="mas" tam={16} />
                </span>
              ) : (
                <PilaAgentes agentes={o.agentes} tam={o.agentes.length > 1 ? 18 : 22} />
              )}
              <span className="pc-selector__textos">
                <span className="pc-selector__nombre">{o.etiqueta}</span>
                {o.bloqueado || o.detalle ? <span className="pc-selector__detalle">{o.bloqueado ?? o.detalle}</span> : null}
              </span>
              {o.bloqueado ? <Icono nombre="candado" tam={14} /> : o.id === activa ? <Icono nombre="check" tam={16} trazo={2} /> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
