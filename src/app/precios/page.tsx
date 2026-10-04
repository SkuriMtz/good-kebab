import type { Metadata } from "next";
import Link from "next/link";
import { Arrow, PillLink } from "@/components/Buttons";
import { EncabezadoPagina } from "@/components/Encabezado";
import { Planes } from "@/components/Planes";
import { Reveal } from "@/components/Reveal";
import { Sitio } from "@/components/Sitio";

export const metadata: Metadata = { title: "Precios" };

/** Los tres planes: Free (gratis), One (medio) y Max (completo). Los precios aún no se publican. */
export default function Precios() {
  return (
    <Sitio>
      <section data-capitulo="Precios" className="seccion seccion--primera">
        <EncabezadoPagina
          izquierda="Precios"
          derecha="Free → One → Max"
          titulo={
            <>
              Empieza gratis. <em>Crece cuando quieras.</em>
            </>
          }
          texto="Free para conocer a Clara. One para sumar a Lola, tu atención por WhatsApp. Max para tener a todo el equipo."
        />
        <div className="mt-14 lg:mt-20">
          <Planes />
        </div>
      </section>

      <div className="pt-[120px] lg:pt-[176px]">
        <section data-capitulo="Antes de decidir" className="bloque-pastel bloque-pastel--mantequilla mx-auto max-w-[96rem]">
          <div className="mx-auto flex max-w-[760px] flex-col items-center px-6 py-20 text-center sm:py-24">
            <Reveal as="h2" className="titulo">
              Pruébalos antes <em>de decidir.</em>
            </Reveal>
            <Reveal as="p" delay={120} className="texto-suave mt-5 max-w-[440px]">
              Habla con los cuatro agentes en el chat de demostración, o revisa las preguntas frecuentes.
            </Reveal>
            <Reveal delay={200} className="mt-9 flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
              <PillLink href="/pruebalo">Habla con los agentes</PillLink>
              <Link href="/preguntas" className="btn-ghost">
                Preguntas frecuentes
                <Arrow />
              </Link>
            </Reveal>
          </div>
        </section>
      </div>
    </Sitio>
  );
}
