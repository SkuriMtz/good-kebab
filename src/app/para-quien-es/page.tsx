import type { Metadata } from "next";
import Link from "next/link";
import { PillLink } from "@/components/Buttons";
import { Borrador, Claqueta, EncabezadoPagina } from "@/components/Encabezado";
import { Reveal } from "@/components/Reveal";
import { Sitio } from "@/components/Sitio";
import { Personaje } from "@/components/agentes/Personaje";
import { AGENTE_POR_ID } from "@/lib/agentes";
import { SEGMENTOS } from "@/lib/contenido";

export const metadata: Metadata = { title: "Para quién es" };

/** Para quién es: una sala por tipo de negocio; a la izquierda quién es, a la derecha cómo le ayuda cada agente. */
export default function ParaQuienEs() {
  return (
    <Sitio>
      <section data-capitulo="Para quién es" className="sala sala--primera">
        <EncabezadoPagina
          izquierda="Para quién es"
          derecha="Negocios que atienden personas"
          titulo={
            <>
              Clínicas, estéticas, consultorios <em>y negocios de servicios.</em>
            </>
          }
          texto="Si tu negocio vive de atender, agendar y que tus clientes regresen, el equipo de Atendel hace esa parte contigo."
          acciones={<PillLink href="/pruebalo">Habla con los agentes</PillLink>}
        />
      </section>

      {SEGMENTOS.map((s, i) => (
        <section key={s.id} id={s.id} data-capitulo={s.nombre} className="sala">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-[18px]">
            <div className="lg:col-span-5">
              <Claqueta n={i + 2} izquierda={s.nombre} />
              <Reveal as="h2" className="display mt-6 break-words !text-[clamp(2.5rem,4.9vw,5.25rem)]">
                {s.nombre}
              </Reveal>
              <Reveal as="p" delay={100} className="cuerpo mt-6 max-w-[480px]">
                {s.intro}
              </Reveal>
              <p className="mt-6">
                <Borrador />
              </p>
            </div>
            <ul className="border-t border-dashed hairline lg:col-span-6 lg:col-start-7">
              {s.ayuda.map(([id, texto], k) => {
                const a = AGENTE_POR_ID[id];
                return (
                  <Reveal
                    as="li"
                    key={id}
                    delay={k * 70}
                    className="grid grid-cols-[56px_minmax(0,1fr)] items-start gap-4 border-b border-dashed hairline py-6"
                  >
                    <Personaje agente={a.id} avatar className="h-12 w-12" />
                    <span>
                      <span className="etiqueta">
                        {a.nombre} <span className="etiqueta--suave">— {a.area}</span>
                      </span>
                      <span className="texto-suave mt-2 block">{texto}</span>
                    </span>
                  </Reveal>
                );
              })}
            </ul>
          </div>
        </section>
      ))}

      <section data-capitulo="Empieza" className="sala sala--completa">
        <Reveal as="p" className="etiqueta etiqueta--brasa">
          Pruébalo
        </Reveal>
        <Reveal as="h2" delay={60} className="display mt-6 max-w-[14ch] !text-[clamp(3.25rem,9vw,9.5rem)]">
          Pruébalo con <em>tu negocio en mente.</em>
        </Reveal>
        <div className="mt-12 flex flex-col items-start gap-4 border-t border-dashed hairline pt-8 sm:flex-row sm:items-center sm:gap-8">
          <PillLink href="/pruebalo" className="btn-pill--grande">
            Habla con los agentes
          </PillLink>
          <Link href="/precios" className="btn-ghost">
            Ver precios
          </Link>
        </div>
      </section>
    </Sitio>
  );
}
