"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { Icono } from "@/components/base/Iconos";

/** Ancho del botón "Borrar" que queda a la vista al deslizar. */
const ANCHO = 88;
/** Movimiento mínimo antes de decidir que es un deslizamiento (y no un toque o scroll). */
const UMBRAL = 10;

/**
 * Deslizar para borrar (Grupo 2 · G2-T5), para las conversaciones del panel.
 * - Con el dedo: se desliza a la izquierda y aparece "Borrar" en rojo. Si se
 *   suelta a la mitad, se queda abierto; si se lleva hasta el fondo (o se
 *   lanza rápido), borra sin preguntar más. Tocar fuera la vuelve a cerrar.
 * - Con mouse o teclado: la ✕ de la fila (aparece al pasar el cursor o al
 *   enfocarla) pregunta antes de borrar.
 * Solo se mueve con transform; sin librerías. Inspirado en
 * componentes-pendientes/deslizar-para-borrar (que se queda ahí).
 */
export function FilaDeslizable({
  children,
  etiqueta,
  onBorrar,
}: {
  children: ReactNode;
  /** Nombre de lo que se borra (para lectores de pantalla). */
  etiqueta: string;
  /** `preguntar`: false cuando la persona ya eligió "Borrar" con el dedo. */
  onBorrar: (preguntar: boolean) => void;
}) {
  const raiz = useRef<HTMLLIElement>(null);
  const sup = useRef<HTMLDivElement>(null);
  const toque = useRef<{ id: number; x0: number; y0: number; desde: number; moviendo: boolean; t: number; x: number } | null>(null);
  /** El clic que llega al soltar un deslizamiento se descarta. */
  const tragar = useRef(false);
  const [abierta, setAbierta] = useState(false);
  const [arrastra, setArrastra] = useState(false);
  const [saliendo, setSaliendo] = useState(false);

  const mover = (x: number) => {
    if (sup.current) sup.current.style.transform = x ? `translateX(${x}px)` : "";
  };

  // Tocar fuera de la fila la cierra
  useEffect(() => {
    if (!abierta) return;
    const fuera = (e: PointerEvent) => {
      if (!raiz.current?.contains(e.target as Node)) {
        setAbierta(false);
        mover(0);
      }
    };
    document.addEventListener("pointerdown", fuera);
    return () => document.removeEventListener("pointerdown", fuera);
  }, [abierta]);

  const borrarYa = () => {
    const ancho = raiz.current?.offsetWidth ?? 320;
    setSaliendo(true);
    mover(-ancho);
    window.setTimeout(() => onBorrar(false), 200);
  };

  const abajo = (e: ReactPointerEvent) => {
    if (e.pointerType === "mouse" || saliendo) return;
    toque.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, desde: abierta ? -ANCHO : 0, moviendo: false, t: performance.now(), x: abierta ? -ANCHO : 0 };
  };
  const mueve = (e: ReactPointerEvent) => {
    const t = toque.current;
    if (!t || t.id !== e.pointerId) return;
    const dx = e.clientX - t.x0;
    const dy = e.clientY - t.y0;
    if (!t.moviendo) {
      if (Math.abs(dx) < UMBRAL || Math.abs(dx) < Math.abs(dy)) return;
      t.moviendo = true;
      setArrastra(true);
      try {
        sup.current?.setPointerCapture(e.pointerId);
      } catch {
        /* sin captura también funciona */
      }
    }
    const ancho = raiz.current?.offsetWidth ?? 320;
    let x = t.desde + dx;
    // Hacia la derecha no pasa de 0 (con resistencia); hacia la izquierda, hasta el ancho
    if (x > 0) x = x * 0.2;
    x = Math.max(x, -ancho);
    t.x = x;
    mover(x);
  };
  const arriba = (e: ReactPointerEvent) => {
    const t = toque.current;
    if (!t || t.id !== e.pointerId) return;
    toque.current = null;
    setArrastra(false);
    if (!t.moviendo) return;
    tragar.current = true;
    window.setTimeout(() => (tragar.current = false), 0);
    const ancho = raiz.current?.offsetWidth ?? 320;
    const velocidad = (t.x - t.desde) / Math.max(1, performance.now() - t.t);
    if (t.x < -ancho * 0.6) {
      borrarYa();
      return;
    }
    const abrir = velocidad < -0.5 || (velocidad <= 0.5 && t.x < -ANCHO / 2);
    setAbierta(abrir);
    mover(abrir ? -ANCHO : 0);
  };

  return (
    <li
      ref={raiz}
      className="charla__desliza"
      data-arrastra={arrastra ? "" : undefined}
      data-abierta={abierta || saliendo ? "" : undefined}
    >
      <div className="charla__desliza-fondo" aria-hidden={!abierta}>
        <button type="button" className="charla__desliza-borrar" tabIndex={abierta ? 0 : -1} onClick={borrarYa}>
          <Icono nombre="cerrar" tam={20} />
          Borrar
        </button>
      </div>
      <div
        ref={sup}
        className="charla__desliza-sup"
        onPointerDown={abajo}
        onPointerMove={mueve}
        onPointerUp={arriba}
        onPointerCancel={arriba}
        onClickCapture={(e) => {
          // Un deslizamiento no abre la conversación; un toque con la fila abierta solo la cierra
          if (tragar.current || abierta) {
            e.preventDefault();
            e.stopPropagation();
            if (abierta) {
              setAbierta(false);
              mover(0);
            }
          }
        }}
      >
        {children}
        <button type="button" className="charla__borrar" aria-label={`Borrar ${etiqueta}`} onClick={() => onBorrar(true)}>
          <Icono nombre="cerrar" tam={16} />
        </button>
      </div>
    </li>
  );
}
