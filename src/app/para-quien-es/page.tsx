import type { Metadata } from "next";
import Link from "next/link";
import { Arrow, PillLink } from "@/components/Buttons";
import { Borrador, Claqueta, EncabezadoPagina } from "@/components/Encabezado";
import { Reveal } from "@/components/Reveal";
import { Sitio } from "@/components/Sitio";
import { Personaje } from "@/components/agentes/Personaje";
import { AGENTE_POR_ID } from "@/lib/agentes";
import { SEGMENTOS } from "@/lib/contenido";

export const metadata: Metadata = { title: "Para quién es" };

/** Para quién es: cada tipo de negocio, en su bloque de color, y cómo le ayuda cada agente. */
export default function ParaQuienEs() {
  return (
    <Sitio>
      <section data-capitulo="Para quién es" className="seccion seccion--primera">
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

      <div className="flex flex-col gap-4 pt-[88px] sm:gap-5 lg:pt-[120px]">
        {SEGMENTOS.map((s, i) => (
          <section
            key={s.id}
            id={s.id}
            data-capitulo={s.nombre}
            className={`bloque-pastel bloque-pastel--${s.pastel} mx-auto w-[calc(100%-24px)] max-w-[96rem] sm:w-[calc(100%-40px)] lg:w-[calc(100%-48px)]`}
          >
            <div className="mx-auto grid max-w-[calc(var(--ancho)+3rem)] gap-10 px-6 py-14 sm:max-w-[calc(var(--ancho)+5rem)] sm:px-10 sm:py-20 lg:max-w-[calc(var(--ancho)+8rem)] lg:grid-cols-12 lg:gap-12 lg:px-16 lg:py-24">
              <div className={`lg:col-span-5 ${i % 2 ? "lg:order-2" : ""}`}>
                <Claqueta n={i + 2} izquierda={s.nombre} />
                <Reveal as="h2" className="titulo mt-6">
                  {s.nombre}
                </Reveal>
                <Reveal as="p" delay={100} className="texto-suave mt-5 max-w-[420px]">
                  {s.intro}
                </Reveal>
                <p className="mt-5">
                  <Borrador />
                </p>
              </div>
              <ul className={`flex flex-col gap-3 lg:col-span-7 ${i % 2 ? "lg:order-1" : ""}`}>
                {s.ayuda.map(([id, texto], k) => {
                  const a = AGENTE_POR_ID[id];
                  return (
                    <Reveal as="li" key={id} delay={k * 70} className="tarjeta flex items-start gap-4 p-5 sm:p-6">
                      <Personaje agente={a.id} avatar className="h-11 w-11 shrink-0" />
                      <span>
                        <span className="block text-[1rem] font-semibold tracking-[-0.02em]">
                          {a.nombre} <span className="font-normal text-ash">· {a.area}</span>
                        </span>
                        <span className="texto-suave mt-1 block">{texto}</span>
                      </span>
                    </Reveal>
                  );
                })}
              </ul>
            </div>
          </section>
        ))}
      </div>

      <div className="pt-[120px] lg:pt-[176px]">
        <section data-capitulo="Empieza" className="bloque-oscuro mx-auto max-w-[96rem]">
          <div className="mx-auto flex max-w-[760px] flex-col items-center px-6 py-20 text-center sm:py-28">
            <Reveal as="h2" className="titulo titulo--xl">
              Pruébalo con <em>tu negocio en mente.</em>
            </Reveal>
            <Reveal delay={150} className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
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
