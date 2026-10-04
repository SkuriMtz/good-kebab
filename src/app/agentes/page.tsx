import type { Metadata } from "next";
import Link from "next/link";
import { Arrow, PillLink } from "@/components/Buttons";
import { Claqueta, EncabezadoPagina } from "@/components/Encabezado";
import { EquipoEnFoco } from "@/components/EquipoEnFoco";
import { Reveal } from "@/components/Reveal";
import { Sitio } from "@/components/Sitio";
import { AgentesGaleria } from "@/components/agentes/AgentesGaleria";

export const metadata: Metadata = { title: "Agentes" };

/** Los cuatro agentes: el enfoque de nombres, el acordeón con su ficha y el acceso al chat. */
export default function Agentes() {
  return (
    <Sitio fichas={false}>
      <section data-capitulo="Agentes" className="seccion seccion--primera">
        <EncabezadoPagina
          izquierda="4 agentes"
          derecha="Atención, Correo, Clientes y Oficina"
          titulo={
            <>
              ¿Qué le encargas <em>hoy?</em>
            </>
          }
          texto="Pasa el cursor por cada uno para conocerlo. Haz clic para ver todo lo que hace, una conversación de ejemplo y en qué plan está."
          acciones={<PillLink href="/pruebalo">Habla con los agentes</PillLink>}
        />
      </section>

      {/* El equipo en foco: los nombres que se enfocan uno por uno (bloque oscuro) */}
      <div className="pt-[88px] lg:pt-[120px]">
        <Reveal className="bloque-oscuro mx-auto max-w-[96rem] px-6 py-20 sm:px-10 sm:py-24 lg:py-32">
          <EquipoEnFoco />
        </Reveal>
      </div>

      {/* El acordeón con los personajes; cada uno abre su ficha */}
      <section data-capitulo="Conócelos" className="seccion">
        <Claqueta n={2} izquierda="Conócelos" derecha="Uno por uno" />
        <div className="relative mt-16 lg:mt-20">
          <p className="firma pointer-events-none absolute -top-12 right-[8%] hidden rotate-3 lg:block" aria-hidden="true">
            haz clic
            <svg className="ml-1 inline-block h-8 w-9 align-top" viewBox="0 0 36 32" fill="none">
              <path
                d="M2 6c9-4 19-2 24 6 2.5 4 3 9 2.2 15M24 22.5l4.4 5.5 4.6-5.2"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </p>
          <AgentesGaleria />
        </div>
      </section>

      {/* Acceso al chat */}
      <div className="pt-[120px] lg:pt-[176px]">
        <section data-capitulo="Pruébalos" className="bloque-pastel bloque-pastel--cielo mx-auto max-w-[96rem]">
          <div className="mx-auto flex max-w-[760px] flex-col items-center px-6 py-20 text-center sm:py-24">
            <Reveal as="h2" className="titulo">
              Pruébalos <em>en el chat.</em>
            </Reveal>
            <Reveal as="p" delay={120} className="texto-suave mt-5 max-w-[440px]">
              Escríbeles lo que necesitas, como en cualquier chat, o arma un grupo con los que quieras.
            </Reveal>
            <Reveal delay={200} className="mt-9 flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
              <PillLink href="/pruebalo" className="btn-pill--grande">
                Habla con los agentes
              </PillLink>
              <Link href="/precios" className="btn-ghost">
                Ver precios
                <Arrow />
              </Link>
            </Reveal>
          </div>
        </section>
      </div>
    </Sitio>
  );
}
