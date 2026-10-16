"use client";

import { useEffect, useRef, type ElementType, type HTMLAttributes, type ReactNode } from "react";

/**
 * Revelado al bajar de las secciones informativas (Grupo 4): cuando el bloque
 * entra a la pantalla, sus hijos directos suben 12px y aparecen en orden
 * (0.4s, cubic-bezier(0.16, 1, 0.3, 1), 80ms entre uno y otro). Pasa una sola
 * vez: no se esconde al salir. Cada hijo marca su lugar con style={{"--i": n}}.
 *
 * Solo se esconde con JavaScript (clase `js` en <html>): sin JS o con
 * "reducir movimiento", el contenido ya está ahí (ver informativas.css).
 */
export function Revelar({
  as: Elemento = "div",
  className = "",
  children,
  ...resto
}: {
  as?: ElementType;
  className?: string;
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "className" | "children">) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      el.classList.add("is-shown");
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting) return;
        el.classList.add("is-shown");
        io.disconnect();
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Elemento ref={ref} className={`inf-revela ${className}`} {...resto}>
      {children}
    </Elemento>
  );
}
