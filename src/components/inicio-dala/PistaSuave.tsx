"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Píxeles por segundo de la fila de logos. */
const VELOCIDAD = 46;
/** Segundos que tarda en frenar o en volver a arrancar (casi del todo). */
const CALMA = 0.6;

/**
 * La pista de la fila de logos: se desliza sola y, con el mouse encima, se
 * frena poco a poco en vez de pararse de golpe (y vuelve a arrancar igual de
 * suave). Solo se mueve mientras se ve en pantalla; con "reducir movimiento"
 * queda quieta. Los hijos van dos veces (la copia, oculta para lectores de
 * pantalla), así la vuelta no se nota.
 */
export function PistaSuave({ children }: { children: ReactNode }) {
  const pista = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = pista.current;
    const ventana = el?.parentElement;
    if (!el || !ventana) return;
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)");
    let x = 0;
    let v = VELOCIDAD;
    let meta = VELOCIDAD;
    let visible = false;
    let ultimo = 0;
    let id = 0;

    const paso = (t: number) => {
      const dt = Math.min(0.1, Math.max(0, (t - ultimo) / 1000));
      ultimo = t;
      v += (meta - v) * (1 - Math.exp((-3 * dt) / CALMA));
      const mitad = el.scrollWidth / 2;
      if (mitad > 0) x = (x + v * dt) % mitad;
      el.style.transform = `translate3d(${-x}px, 0, 0)`;
      id = requestAnimationFrame(paso);
    };
    const parar = () => {
      cancelAnimationFrame(id);
      id = 0;
    };
    const decidir = () => {
      if (quieto.matches) {
        parar();
        el.style.transform = "";
        x = 0;
      } else if (visible && !id) {
        ultimo = performance.now();
        id = requestAnimationFrame(paso);
      } else if (!visible) parar();
    };

    const encima = (e: PointerEvent) => {
      if (e.pointerType === "mouse") meta = 0;
    };
    const fuera = () => {
      meta = VELOCIDAD;
    };
    const mira = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      decidir();
    });
    mira.observe(ventana);
    ventana.addEventListener("pointerenter", encima);
    ventana.addEventListener("pointerleave", fuera);
    quieto.addEventListener("change", decidir);
    return () => {
      parar();
      mira.disconnect();
      ventana.removeEventListener("pointerenter", encima);
      ventana.removeEventListener("pointerleave", fuera);
      quieto.removeEventListener("change", decidir);
    };
  }, []);

  return (
    <div ref={pista} className="ini-apps__pista">
      {children}
    </div>
  );
}
