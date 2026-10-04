import type { Metadata } from "next";
import Link from "next/link";
import { PillLink } from "@/components/Buttons";
import { Claqueta, EncabezadoPagina } from "@/components/Encabezado";
import { EquipoEnFoco } from "@/components/EquipoEnFoco";
import { Reveal } from "@/components/Reveal";
import { Sitio } from "@/components/Sitio";
import { AgentesGaleria } from "@/components/agentes/AgentesGaleria";
import { BotonFicha } from "@/components/agentes/BotonFicha";
import { Personaje } from "@/components/agentes/Personaje";
import { DETALLE } from "@/components/agentes/detalle";
import { AGENTES_INFO } from "@/lib/agentes";

export const metadata: Metadata = { title: "Agentes" };

/*
 * Agentes: el encabezado, los nombres que se enfocan, el acordeón (con su
 * ficha) y una sala por agente: su nombre a la izquierda, el personaje al
 * centro como pieza de museo y lo que hace a la derecha.
 */
export default function Agentes() {
  return (
    <Sitio fichas={false}>
      <section data-capitulo="Agentes" className="sala sala--primera">
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

      {/* Los nombres que se enfocan uno por uno */}
      <section data-capitulo="El equipo" className="sala sala--completa">
        <Reveal>
          <EquipoEnFoco />
        </Reveal>
      </section>

      {/* El acordeón con los personajes; cada uno abre su ficha */}
      <section data-capitulo="Conócelos" className="sala">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <Claqueta n={2} izquierda="Conócelos" derecha="Uno por uno" />
          <p className="firma pointer-events-none hidden lg:block" aria-hidden="true">
            Haz clic
            <svg className="ml-1 inline-block h-6 w-7 align-top" viewBox="0 0 36 32" fill="none">
              <path
                d="M2 6c9-4 19-2 24 6 2.5 4 3 9 2.2 15M24 22.5l4.4 5.5 4.6-5.2"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </p>
        </div>
        <div className="mt-8 lg:mt-10">
          <AgentesGaleria />
        </div>
      </section>

      {/* Una sala por agente */}
      {AGENTES_INFO.map((a, i) => (
        <section key={a.id} id={a.id} data-capitulo={a.nombre} className="sala sala--completa">
          <div className="vitrina">
            <div>
              <Claqueta n={i + 3} izquierda={a.area} derecha={a.abarca} />
              <Reveal as="h2" className="display mt-6 !text-[clamp(3.5rem,9vw,9.5rem)]">
                {a.nombre}
              </Reveal>
              <Reveal as="p" delay={100} className="cuerpo mt-6 max-w-[460px]">
                {a.lema}
              </Reveal>
            </div>
            <div className="vitrina__objeto">
              <Personaje agente={a.id} className="flota h-auto w-[72%] max-w-[380px]" />
            </div>
            <Reveal delay={150}>
              <p className="etiqueta etiqueta--brasa">Lo que hace</p>
              <ul className="mt-4 border-t border-dashed hairline">
                {a.capacidades.map((c) => (
                  <li key={c} className="etiqueta border-b border-dashed hairline py-4">
                    {c}
                  </li>
                ))}
              </ul>
              <p className="texto-suave mt-6">{DETALLE[a.id].descripcion}</p>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                <BotonFicha agente={a.id}>Ver su ficha</BotonFicha>
                <Link href="/pruebalo" className="btn-ghost">
                  Háblale a {a.nombre}
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      ))}

      {/* Acceso al chat */}
      <section data-capitulo="Pruébalos" className="sala sala--completa">
        <Reveal as="p" className="etiqueta etiqueta--brasa">
          El chat
        </Reveal>
        <Reveal as="h2" delay={60} className="display mt-6 max-w-[12ch] !text-[clamp(3.25rem,9vw,9.5rem)]">
          Pruébalos <em>en el chat.</em>
        </Reveal>
        <div className="mt-12 grid gap-8 border-t border-dashed hairline pt-8 lg:grid-cols-12 lg:gap-[18px]">
          <Reveal as="p" delay={120} className="cuerpo lg:col-span-5">
            Escríbeles lo que necesitas, como en cualquier chat, o arma un grupo con los que quieras.
          </Reveal>
          <Reveal delay={200} className="flex flex-col items-start gap-4 lg:col-span-5 lg:col-start-8">
            <PillLink href="/pruebalo" className="btn-pill--ancha">
              Habla con los agentes
            </PillLink>
            <Link href="/precios" className="btn-ghost">
              Ver precios
            </Link>
          </Reveal>
        </div>
      </section>
    </Sitio>
  );
}
