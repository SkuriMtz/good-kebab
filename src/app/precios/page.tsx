import type { Metadata } from "next";
import Link from "next/link";
import { PillLink } from "@/components/Buttons";
import { EncabezadoPagina } from "@/components/Encabezado";
import { Planes } from "@/components/Planes";
import { Reveal } from "@/components/Reveal";
import { Sitio } from "@/components/Sitio";

export const metadata: Metadata = { title: "Precios" };

/** Los tres planes: Free (gratis), One (medio) y Max (completo). Los precios aún no se publican. */
export default function Precios() {
  return (
    <Sitio>
      <section data-capitulo="Precios" className="sala sala--primera">
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
        <div className="mt-16 lg:mt-24">
          <Planes />
        </div>
      </section>

      <section data-capitulo="Antes de decidir" className="sala sala--completa">
        <Reveal as="p" className="etiqueta etiqueta--brasa">
          Antes de decidir
        </Reveal>
        <Reveal as="h2" delay={60} className="display mt-6 max-w-[13ch] !text-[clamp(3.25rem,9vw,9.5rem)]">
          Pruébalos antes <em>de decidir.</em>
        </Reveal>
        <div className="mt-12 grid gap-8 border-t border-dashed hairline pt-8 lg:grid-cols-12 lg:gap-[18px]">
          <Reveal as="p" delay={120} className="cuerpo lg:col-span-5">
            Habla con los cuatro agentes en el chat de demostración, o revisa las preguntas frecuentes.
          </Reveal>
          <Reveal delay={200} className="flex flex-col items-start gap-4 lg:col-span-5 lg:col-start-8">
            <PillLink href="/pruebalo" className="btn-pill--ancha">
              Habla con los agentes
            </PillLink>
            <Link href="/preguntas" className="btn-ghost">
              Preguntas frecuentes
            </Link>
          </Reveal>
        </div>
      </section>
    </Sitio>
  );
}
