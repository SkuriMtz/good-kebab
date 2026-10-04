"use client";

import { useId, useState } from "react";

type Pregunta = { p: string; r: string };

/** Preguntas frecuentes: se abre una a la vez. */
export function Preguntas({ preguntas }: { preguntas: Pregunta[] }) {
  const [abierta, setAbierta] = useState<number | null>(0);
  const base = useId();

  return (
    <ul className="faq">
      {preguntas.map((q, i) => {
        const abierto = abierta === i;
        const id = `${base}-${i}`;
        return (
          <li key={q.p} className="faq__item">
            <h3>
              <button
                type="button"
                className="faq__boton"
                aria-expanded={abierto}
                aria-controls={id}
                onClick={() => setAbierta(abierto ? null : i)}
              >
                {q.p}
                <svg className="faq__icono h-5 w-5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M5 7.5 10 12.5 15 7.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </h3>
            <div id={id} role="region" aria-label={q.p} hidden={!abierto}>
              <p className="faq__respuesta">{q.r}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
