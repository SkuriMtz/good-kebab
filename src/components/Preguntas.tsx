"use client";

import { useId, useState } from "react";

type Pregunta = { p: string; r: string };

/** Preguntas frecuentes: se abre una a la vez. */
export function Preguntas({ preguntas }: { preguntas: Pregunta[] }) {
  const [abierta, setAbierta] = useState<number | null>(0);
  const base = useId();

  return (
    <ul className="border-b hairline">
      {preguntas.map((q, i) => {
        const abierto = abierta === i;
        const id = `${base}-${i}`;
        return (
          <li key={q.p} className="border-t hairline">
            <h3>
              <button
                type="button"
                className="pregunta"
                aria-expanded={abierto}
                aria-controls={id}
                onClick={() => setAbierta(abierto ? null : i)}
              >
                <span className="pregunta__texto">{q.p}</span>
                <span className="pregunta__signo" aria-hidden="true">
                  +
                </span>
              </button>
            </h3>
            <div id={id} className="respuesta" data-open={abierto ? "true" : "false"} role="region" aria-label={q.p}>
              <div className="overflow-hidden">
                <p className="max-w-[620px] pb-7 text-body text-silver">{q.r}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
