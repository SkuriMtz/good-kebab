import type { Metadata } from "next";
import Link from "next/link";
import { Arrow, PillLink } from "@/components/Buttons";
import { Claqueta } from "@/components/Encabezado";
import { Preguntas } from "@/components/Preguntas";
import { Reveal } from "@/components/Reveal";
import { Sitio } from "@/components/Sitio";
import { PREGUNTAS } from "@/lib/contenido";

export const metadata: Metadata = { title: "Preguntas frecuentes" };

/** Preguntas frecuentes: el título fijo a un lado, las respuestas al otro. */
export default function PreguntasFrecuentes() {
  return (
    <Sitio>
      <section data-capitulo="Preguntas" className="seccion seccion--primera grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-[120px]">
            <Claqueta n={1} izquierda="Preguntas frecuentes" />
            <Reveal as="h1" className="titulo titulo--xl mt-6">
              Lo que <em>nos preguntan.</em>
            </Reveal>
            <Reveal delay={120} className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <PillLink href="/pruebalo">Habla con los agentes</PillLink>
              <Link href="/precios" className="btn-ghost">
                Ver precios
                <Arrow />
              </Link>
            </Reveal>
          </div>
        </div>
        <div className="lg:col-span-7">
          <Preguntas preguntas={PREGUNTAS} />
        </div>
      </section>
    </Sitio>
  );
}
