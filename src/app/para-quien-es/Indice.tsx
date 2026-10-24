"use client";

import { useEffect, useState } from "react";

/**
 * Índice de /para-quien-es (como el "En esta página" de una documentación).
 * En computadora se queda fijo a la izquierda y marca el negocio que estás
 * leyendo; en celular es una fila de enlaces arriba de la lectura.
 */
export function Indice({ negocios }: { negocios: { id: string; nombre: string }[] }) {
  const [actual, setActual] = useState<string | null>(null);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const bloques = negocios
      .map((n) => document.getElementById(n.id))
      .filter((el): el is HTMLElement => el !== null);
    // Cuenta como "leyendo" el bloque que cruza la franja alta de la pantalla
    const io = new IntersectionObserver(
      (entradas) => {
        const visible = entradas.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActual(visible.target.id);
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    bloques.forEach((b) => io.observe(b));
    return () => io.disconnect();
  }, [negocios]);

  return (
    <nav aria-labelledby="indice-titulo" className="pqe-indice">
      <p id="indice-titulo" className="etiqueta pqe-indice__titulo">
        En esta página
      </p>
      <ol className="pqe-indice__lista">
        {negocios.map((n, i) => (
          <li key={n.id}>
            <a href={`#${n.id}`} className="pqe-indice__enlace" aria-current={actual === n.id ? "location" : undefined}>
              <span className="pqe-indice__numero" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              {n.nombre}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
