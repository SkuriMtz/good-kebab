import type { Metadata } from "next";
import { BotonLink } from "@/components/Buttons";
import { Preguntas } from "@/components/Preguntas";
import { Sitio } from "@/components/Sitio";
import { PREGUNTAS } from "@/lib/contenido";

export const metadata: Metadata = { title: "Preguntas frecuentes" };

/** Preguntas frecuentes: el título a la izquierda (fijo al bajar en computadora) y las respuestas a la derecha. */
export default function PreguntasFrecuentes() {
  return (
    <Sitio>
      <section className="contenedor dos-columnas !items-start pb-[var(--spacing-96)] pt-[var(--spacing-36)] lg:pb-[var(--spacing-120)] lg:pt-[var(--spacing-96)]">
        <div className="lg:sticky lg:top-[calc(var(--barra-h)+var(--spacing-36))]">
          <p className="t-etiqueta">Preguntas frecuentes</p>
          <h1 className="t-display mt-[var(--spacing-18)]">
            Lo que <span className="resalta">nos preguntan.</span>
          </h1>
          <div className="mt-[var(--spacing-36)] flex flex-wrap items-center gap-[var(--spacing-12)]">
            <BotonLink href="/pruebalo">Habla con los agentes</BotonLink>
            <BotonLink href="/precios" variante="suave" flecha>
              Ver precios
            </BotonLink>
          </div>
        </div>
        <div id="preguntas">
          <Preguntas preguntas={PREGUNTAS} />
        </div>
      </section>
    </Sitio>
  );
}
