"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";

const ANCHO_ACCION = 88; // lo que se asoma el botón de borrar
const UMBRAL = 0.5; // mitad del botón para quedarse abierta
const VELOCIDAD = 0.11; // px/ms: un deslizón rápido basta

/**
 * Fila que se desliza a la izquierda con el dedo para mostrar "Borrar"
 * (como en las apps de mensajería). Con mouse o teclado no se desliza: ahí
 * está el botón ✕ de la fila. Solo mueve transform; al soltar, se acomoda
 * con la curva de entrada (0.2s). Un toque fuera la vuelve a cerrar.
 */
export function Deslizar({ children, onBorrar, etiqueta }: { children: ReactNode; onBorrar: () => void; etiqueta: string }) {
  const [abierta, setAbierta] = useState(false);
  const pistaRef = useRef<HTMLDivElement>(null);
  const agarre = useRef<{ x0: number; y0: number; t0: number; base: number; dx: number; activo: boolean; id: number } | null>(null);

  const poner = (x: number, animar: boolean) => {
    const el = pistaRef.current;
    if (!el) return;
    el.dataset.animar = animar ? "" : "no";
    el.style.transform = x ? `translateX(${x}px)` : "";
  };

  const abajo = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" || agarre.current) return;
    agarre.current = { x0: e.clientX, y0: e.clientY, t0: performance.now(), base: abierta ? -ANCHO_ACCION : 0, dx: 0, activo: false, id: e.pointerId };
  };

  const mueve = (e: ReactPointerEvent<HTMLDivElement>) => {
    const a = agarre.current;
    if (!a || e.pointerId !== a.id) return;
    const dx = e.clientX - a.x0;
    const dy = e.clientY - a.y0;
    if (!a.activo) {
      // Hasta que el gesto sea claramente de lado, el scroll vertical manda
      if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) {
        agarre.current = null;
        return;
      }
      if (Math.abs(dx) < 8) return;
      a.activo = true;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* sin captura sigue funcionando */
      }
    }
    let x = a.base + dx;
    // Más allá del borde, con resistencia (no un tope seco)
    if (x > 0) x = x * 0.2;
    if (x < -ANCHO_ACCION) x = -ANCHO_ACCION + (x + ANCHO_ACCION) * 0.3;
    a.dx = x;
    poner(x, false);
  };

  const suelta = () => {
    const a = agarre.current;
    agarre.current = null;
    if (!a || !a.activo) return;
    const v = (a.dx - a.base) / Math.max(1, performance.now() - a.t0);
    const abrir = v < -VELOCIDAD || (v <= VELOCIDAD && a.dx < -ANCHO_ACCION * UMBRAL);
    setAbierta(abrir);
    poner(abrir ? -ANCHO_ACCION : 0, true);
  };

  const cerrar = () => {
    setAbierta(false);
    poner(0, true);
  };

  return (
    <div className="deslizar" data-abierta={abierta ? "" : undefined} onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && abierta && cerrar()}>
      <button
        type="button"
        className="deslizar__accion"
        tabIndex={abierta ? 0 : -1}
        aria-hidden={abierta ? undefined : true}
        onClick={() => {
          cerrar();
          onBorrar();
        }}
      >
        Borrar
        <span className="sr-only"> {etiqueta}</span>
      </button>
      <div
        ref={pistaRef}
        className="deslizar__pista"
        onPointerDown={abajo}
        onPointerMove={mueve}
        onPointerUp={suelta}
        onPointerCancel={suelta}
        onClickCapture={(e) => {
          // Un toque con la fila abierta solo la cierra
          if (abierta) {
            e.preventDefault();
            e.stopPropagation();
            cerrar();
          }
        }}
      >
        {children}
      </div>
    </div>
  );
}
