"use client";

import { Children, cloneElement, isValidElement, useEffect, useRef, type CSSProperties, type ReactElement, type ReactNode } from "react";

/**
 * "Texts reveal" de transitions.dev (18-texts-reveal.md): cada línea sube un
 * poco, desenfocada, y se asienta en orden (la de arriba primero). Al salir de
 * la pantalla se apaga con un fundido corto, sin repetir el escalonado al revés.
 * Cada hijo directo es una línea; su lugar en la fila marca su retraso (--i).
 */
export function Aparece({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bloque = ref.current;
    if (!bloque) return;
    let salida: ReturnType<typeof setTimeout> | undefined;
    const mostrar = () => {
      clearTimeout(salida);
      bloque.classList.remove("is-hiding");
      bloque.classList.remove("is-shown");
      void bloque.offsetHeight;
      bloque.classList.add("is-shown");
    };
    const ocultar = () => {
      if (!bloque.classList.contains("is-shown")) return;
      bloque.classList.add("is-hiding");
      bloque.classList.remove("is-shown");
      salida = setTimeout(() => bloque.classList.remove("is-hiding"), 200);
    };
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? mostrar() : ocultar()), { rootMargin: "-18% 0px -18% 0px" });
    io.observe(bloque);
    return () => {
      io.disconnect();
      clearTimeout(salida);
    };
  }, []);

  let i = 0;
  const lineas = Children.map(children, (hijo) => {
    if (!isValidElement(hijo)) return hijo;
    const el = hijo as ReactElement<{ className?: string; style?: CSSProperties }>;
    return cloneElement(el, {
      className: `${el.props.className ?? ""} t-stagger-line`,
      style: { ...el.props.style, "--i": i++ } as CSSProperties,
    });
  });

  return (
    <div ref={ref} className={`t-stagger ${className}`}>
      {lineas}
    </div>
  );
}
