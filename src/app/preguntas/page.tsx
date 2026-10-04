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
      <section className="contenedor grid gap-10 pb-16 pt-12 sm:pt-16 lg:grid-cols-12 lg:gap-12 lg:pb-24 lg:pt-20">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-[calc(var(--barra-h)+32px)]">
            <p className="t-etiqueta">Preguntas frecuentes</p>
            <h1 className="t-display mt-3 !text-[clamp(2.25rem,1.5rem+3vw,3.75rem)]">
              Lo que nos <span className="pastilla">preguntan</span>.
            </h1>
            <div className="mt-8 flex flex-wrap gap-3">
              <BotonLink href="/pruebalo">Habla con los agentes</BotonLink>
              <BotonLink href="/precios" variante="suave">
                Ver precios
              </BotonLink>
            </div>
          </div>
        </div>
        <div id="preguntas" className="lg:col-span-7">
          <Preguntas preguntas={PREGUNTAS} />
        </div>
      </section>
    </Sitio>
  );
}
