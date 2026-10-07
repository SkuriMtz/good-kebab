"use client";

import { useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { IconoBasura } from "./Piezas";

/** Distancia (px) a partir de la cual soltar borra; o un jalón rápido (px/ms). */
const UMBRAL = 96;
const VELOCIDAD = 0.6;

/**
 * Fila de la lista que se desliza a la izquierda para borrar (con el dedo).
 * Detrás aparece "Borrar" en rojo. Al soltar pasado el umbral (o con un
 * jalón rápido) llama a `alBorrar`, que confirma y devuelve si se borró; si
 * no, la fila regresa. Con mouse o teclado se usa el botón de la papelera.
 * Solo se anima transform; el gesto respeta el scroll vertical (pan-y).
 */
export function FilaDeslizable({
  children,
  alBorrar,
  etiqueta,
}: {
  children: ReactNode;
  alBorrar: () => Promise<boolean>;
  /** Para el botón de la papelera: "Borrar «Citas de mañana»". */
  etiqueta: string;
}) {
  const frente = useRef<HTMLDivElement>(null);
  const gesto = useRef<{ x: number; y: number; t: number; eje: "x" | "y" | null; dx: number; id: number } | null>(null);
  const movio = useRef(false);

  const poner = (x: number, suave: boolean) => {
    const el = frente.current;
    if (!el) return;
    if (suave) el.dataset.suave = "";
    else delete el.dataset.suave;
    el.style.transform = x ? `translateX(${x}px)` : "";
    el.parentElement?.toggleAttribute("data-deslizando", x < 0);
  };

  const borrar = async () => {
    const ancho = frente.current?.offsetWidth ?? 320;
    poner(-ancho, true);
    const listo = await alBorrar();
    if (!listo) poner(0, true);
  };

  const abajo = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" || gesto.current) return;
    gesto.current = { x: e.clientX, y: e.clientY, t: e.timeStamp, eje: null, dx: 0, id: e.pointerId };
    movio.current = false;
  };

  const mueve = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesto.current;
    if (!g || e.pointerId !== g.id) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (!g.eje) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      g.eje = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (g.eje === "x") {
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* sin captura sigue funcionando dentro de la fila */
        }
      }
    }
    if (g.eje !== "x") return;
    movio.current = true;
    // Solo hacia la izquierda; a la derecha, con resistencia
    g.dx = dx < 0 ? dx : dx * 0.2;
    poner(g.dx, false);
  };

  const suelta = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesto.current;
    if (!g || e.pointerId !== g.id) return;
    gesto.current = null;
    if (g.eje !== "x") return;
    const v = Math.abs(g.dx) / Math.max(1, e.timeStamp - g.t);
    if (g.dx < -UMBRAL || (g.dx < -24 && v > VELOCIDAD)) void borrar();
    else poner(0, true);
  };

  return (
    <li className="charla__deslizable">
      <span className="charla__deslizable-fondo" aria-hidden="true">
        <IconoBasura />
        Borrar
      </span>
      <div
        ref={frente}
        className="charla__deslizable-frente"
        onPointerDown={abajo}
        onPointerMove={mueve}
        onPointerUp={suelta}
        onPointerCancel={suelta}
        onClickCapture={(e) => {
          // Un deslizamiento no cuenta como clic para abrir la conversación
          if (movio.current) {
            e.preventDefault();
            e.stopPropagation();
            movio.current = false;
          }
        }}
      >
        {children}
        <button type="button" className="charla__papelera" aria-label={etiqueta} onClick={() => void alBorrar()}>
          <IconoBasura />
        </button>
      </div>
    </li>
  );
}
