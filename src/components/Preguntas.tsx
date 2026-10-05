"use client";

import { Acordeon } from "./base/Acordeon";

type Pregunta = { p: string; r: string };

/** Preguntas frecuentes en el acordeón de la base: se abre una a la vez; la primera empieza abierta. */
export function Preguntas({ preguntas }: { preguntas: Pregunta[] }) {
  return (
    <Acordeon
      className="faq"
      unoALaVez
      abiertos={preguntas.length ? ["0"] : []}
      items={preguntas.map((q) => ({ titulo: q.p, contenido: <p>{q.r}</p> }))}
    />
  );
}
