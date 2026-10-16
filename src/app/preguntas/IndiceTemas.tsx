"use client";

import { useEffect, useState } from "react";

/**
 * Índice de temas (columna izquierda de las preguntas): enlaces a cada grupo,
 * con el tema que se está leyendo marcado (aria-current="location") por un
 * IntersectionObserver. Lo usan el inicio y /preguntas.
 */
export type EntradaIndice = { id: string; nombre: string; cuenta?: number };

export function IndiceTemas({ entradas, etiqueta }: { entradas: EntradaIndice[]; etiqueta: string }) {
  const [actual, setActual] = useState(entradas[0]?.id ?? "");
  const claves = entradas.map((e) => e.id).join("|");

  useEffect(() => {
    const ids = claves.split("|");
    const els = ids.map((id) => document.getElementById(id)).filter((x): x is HTMLElement => Boolean(x));
    if (!els.length || typeof IntersectionObserver === "undefined") return;
    const visibles = new Map<string, boolean>();
    const io = new IntersectionObserver(
      (registros) => {
        for (const r of registros) visibles.set(r.target.id, r.isIntersecting);
        const primero = ids.find((id) => visibles.get(id));
        if (primero) setActual(primero);
      },
      // "Leyendo" = lo que cruza la franja alta de la pantalla
      { rootMargin: "-20% 0px -55% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [claves]);

  return (
    <nav aria-label={etiqueta} className="temas">
      <ul className="temas__lista">
        {entradas.map((e) => (
          <li key={e.id}>
            <a
              href={`#${e.id}`}
              className="temas__enlace"
              aria-current={actual === e.id ? "location" : undefined}
              onClick={() => setActual(e.id)}
            >
              <span>{e.nombre}</span>
              {e.cuenta !== undefined ? (
                <span className="temas__cuenta">
                  {e.cuenta}
                  <span className="sr-only"> {e.cuenta === 1 ? "pregunta" : "preguntas"}</span>
                </span>
              ) : null}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
