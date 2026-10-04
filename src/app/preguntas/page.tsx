import type { Metadata } from "next";
import Link from "next/link";
import { PillLink } from "@/components/Buttons";
import { Claqueta } from "@/components/Encabezado";
import { Preguntas } from "@/components/Preguntas";
import { Reveal } from "@/components/Reveal";
import { Sitio } from "@/components/Sitio";
import { PREGUNTAS } from "@/lib/contenido";

export const metadata: Metadata = { title: "Preguntas frecuentes" };

/** Preguntas frecuentes: el título fijo a la izquierda, las respuestas a la derecha, divididas con rayas punteadas. */
export default function PreguntasFrecuentes() {
  return (
    <Sitio>
      <section data-capitulo="Preguntas" className="sala sala--primera grid grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-[18px]">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-[110px]">
            <Claqueta n={1} izquierda="Preguntas frecuentes" />
            <Reveal as="h1" className="display mt-6 !text-[clamp(2.75rem,5.6vw,6rem)]">
              Lo que <em>nos preguntan.</em>
            </Reveal>
            <Reveal delay={120} className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
              <PillLink href="/pruebalo">Habla con los agentes</PillLink>
              <Link href="/precios" className="btn-ghost">
                Ver precios
              </Link>
            </Reveal>
          </div>
        </div>
        <div id="preguntas" className="lg:col-span-7">
          <Preguntas preguntas={PREGUNTAS} />
        </div>
      </section>
    </Sitio>
  );
}
