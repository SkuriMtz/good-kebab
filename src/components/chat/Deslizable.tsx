"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { Icono } from "@/components/base/Iconos";

/** Lo que mide el botón "Borrar" que queda detrás de la fila. */
const ANCHO = 88;
/** Velocidad (px por ms) que basta para abrir o cerrar con un movimiento rápido. */
const RAPIDO = 0.11;

const limitar = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
/** Pasado el borde, la fila se resiste (se mueve cada vez menos). */
const resistir = (v: number) => (v < -ANCHO ? -ANCHO + (v + ANCHO) * 0.25 : v > 0 ? v * 0.25 : v);

/**
 * Fila de la lista de chats que se desliza a la izquierda para borrar (con el dedo).
 * Con mouse o teclado, la ✕ aparece al pasar el cursor o al llegar con Tab.
 * Mueve solo `transform` directo en el elemento (sin variables heredadas).
 */
export function Deslizable({
  children,
  etiqueta,
  alBorrar,
}: {
  children: ReactNode;
  /** Nombre de lo que se borra (para los lectores de pantalla). */
  etiqueta: string;
  alBorrar: () => void;
}) {
  const frenteRef = useRef<HTMLDivElement>(null);
  const filaRef = useRef<HTMLDivElement>(null);
  const toque = useRef<{ x: number; y: number; t: number; base: number; arrastra: boolean | null; ultimo: number; movio: boolean } | null>(
    null,
  );
  const [abierta, setAbierta] = useState(false);
  const movio = useRef(false);

  const mover = (x: number, animar: boolean) => {
    const el = frenteRef.current;
    if (!el) return;
    el.style.transition = animar ? "transform var(--dur-micro) var(--ease-entrada)" : "none";
    el.style.transform = x ? `translateX(${x}px)` : "";
  };

  // Tocar fuera cierra la fila
  useEffect(() => {
    if (!abierta) return;
    const fuera = (e: PointerEvent) => {
      if (!filaRef.current?.contains(e.target as Node)) {
        setAbierta(false);
        mover(0, true);
      }
    };
    document.addEventListener("pointerdown", fuera);
    return () => document.removeEventListener("pointerdown", fuera);
  }, [abierta]);

  const abajo = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "touch") return;
    movio.current = false;
    toque.current = { x: e.clientX, y: e.clientY, t: e.timeStamp, base: abierta ? -ANCHO : 0, arrastra: null, ultimo: 0, movio: false };
  };

  const mueve = (e: ReactPointerEvent<HTMLDivElement>) => {
    const t = toque.current;
    if (!t) return;
    const dx = e.clientX - t.x;
    const dy = e.clientY - t.y;
    if (t.arrastra === null) {
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
        t.arrastra = true;
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* sin captura sigue funcionando */
        }
      } else if (Math.abs(dy) > 8) {
        toque.current = null; // es scroll vertical
        return;
      } else return;
    }
    movio.current = true;
    t.ultimo = resistir(limitar(t.base + dx, -ANCHO * 2, ANCHO));
    mover(t.ultimo, false);
  };

  const arriba = (e: ReactPointerEvent<HTMLDivElement>) => {
    const t = toque.current;
    toque.current = null;
    if (!t || !t.arrastra) return;
    const v = (e.clientX - t.x) / Math.max(1, e.timeStamp - t.t);
    const abrir = v < -RAPIDO || (v <= RAPIDO && t.ultimo < -ANCHO / 2);
    setAbierta(abrir);
    mover(abrir ? -ANCHO : 0, true);
  };

  return (
    <div ref={filaRef} className="chat__deslizable" data-abierta={abierta ? "" : undefined}>
      <button
        type="button"
        className="chat__deslizable-borrar"
        aria-hidden={abierta ? undefined : true}
        tabIndex={abierta ? 0 : -1}
        onClick={() => {
          setAbierta(false);
          mover(0, true);
          alBorrar();
        }}
      >
        Borrar
      </button>
      <div
        ref={frenteRef}
        className="chat__deslizable-frente"
        onPointerDown={abajo}
        onPointerMove={mueve}
        onPointerUp={arriba}
        onPointerCancel={arriba}
        onClickCapture={(e) => {
          // Después de deslizar (o con la fila abierta) un toque solo la cierra
          if (movio.current || abierta) {
            e.preventDefault();
            e.stopPropagation();
            movio.current = false;
            if (abierta) {
              setAbierta(false);
              mover(0, true);
            }
          }
        }}
      >
        {children}
      </div>
      <button type="button" className="chat__quitar" aria-label={`Borrar ${etiqueta}`} onClick={alBorrar}>
        <Icono nombre="cerrar" tam={16} />
      </button>
    </div>
  );
}
