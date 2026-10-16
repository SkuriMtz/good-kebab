"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Barra de negocios de /para-quien-es: píldoras que llevan a cada bloque y
 * se quedan fijas debajo de la barra del sitio (como la sub-barra de las
 * páginas de funciones de GitHub). Marca con aria-current el negocio que
 * estás leyendo y, en celular, lo desliza a la vista.
 */
export function Navegacion({ negocios }: { negocios: { id: string; nombre: string; numero: string }[] }) {
  const [actual, setActual] = useState<string | null>(null);
  const desliza = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const bloques = negocios
      .map((n) => document.getElementById(n.id))
      .filter((b): b is HTMLElement => Boolean(b));
    // Cuenta como "leyendo" el bloque que cruza la franja del 35% al 45% de la pantalla.
    // Se lleva la cuenta de todos (los avisos llegan por tandas) y gana el primero en orden.
    const dentro = new Map<string, boolean>();
    const io = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((e) => dentro.set(e.target.id, e.isIntersecting));
        const leyendo = bloques.find((b) => dentro.get(b.id));
        if (leyendo) setActual(leyendo.id);
        else if (bloques[0] && bloques[0].getBoundingClientRect().top > window.innerHeight * 0.45) setActual(null);
      },
      { rootMargin: "-35% 0px -55% 0px" },
    );
    bloques.forEach((b) => io.observe(b));
    return () => io.disconnect();
  }, [negocios]);

  // En celular la fila se desliza: centra la píldora del negocio actual
  useEffect(() => {
    const cont = desliza.current;
    if (!cont || !actual || cont.scrollWidth <= cont.clientWidth) return;
    const pildora = cont.querySelector<HTMLElement>(`[data-negocio="${actual}"]`);
    if (!pildora) return;
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    cont.scrollTo({
      left: pildora.offsetLeft + pildora.offsetWidth / 2 - cont.clientWidth / 2,
      behavior: quieto ? "auto" : "smooth",
    });
  }, [actual]);

  return (
    <nav aria-label="Tipos de negocio" className="inf-subnav">
      <div className="inf-subnav__desliza" ref={desliza}>
        <ul className="inf-subnav__lista">
          {negocios.map((n) => (
            <li key={n.id}>
              <a
                href={`#${n.id}`}
                data-negocio={n.id}
                className="inf-subnav__enlace"
                aria-current={actual === n.id ? "location" : undefined}
              >
                <span className="etiqueta" aria-hidden="true">
                  {n.numero}
                </span>
                {n.nombre}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
