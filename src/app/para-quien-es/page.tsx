import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { BotonLink } from "@/components/Buttons";
import { Borrador, EncabezadoPagina } from "@/components/Encabezado";
import { Sitio } from "@/components/Sitio";
import { Personaje } from "@/components/agentes/Personaje";
import { AGENTE_POR_ID } from "@/lib/agentes";
import { SEGMENTOS } from "@/lib/contenido";
import { PERSONAJES } from "@/lib/personajes";

export const metadata: Metadata = { title: "Para quién es" };

/** Para quién es: un bloque por tipo de negocio en dos columnas que alternan: quién es y cómo le ayuda cada agente. */
export default function ParaQuienEs() {
  return (
    <Sitio>
      <EncabezadoPagina
        etiqueta="Para quién es · Negocios que atienden personas"
        titulo={
          <>
            Clínicas, estéticas, consultorios <span className="resalta">y negocios de servicios.</span>
          </>
        }
        texto="Si tu negocio vive de atender, agendar y que tus clientes regresen, el equipo de Atendel hace esa parte contigo."
        acciones={<BotonLink href="/pruebalo">Habla con los agentes</BotonLink>}
      />

      <nav aria-label="Tipos de negocio" className="contenedor flex flex-wrap gap-[var(--spacing-6)]">
        {SEGMENTOS.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="chip">
            {s.nombre}
          </a>
        ))}
      </nav>

      {SEGMENTOS.map((s, i) => (
        <section key={s.id} id={s.id} aria-labelledby={`${s.id}-titulo`} className="seccion">
          <div className="contenedor dos-columnas !items-start">
            <div className={i % 2 ? "lg:order-2" : undefined}>
              <h2 id={`${s.id}-titulo`} className="t-display break-words">
                {s.nombre}
              </h2>
              <p className="t-editorial mt-[var(--spacing-24)] max-w-[480px]">{s.intro}</p>
              <p className="mt-[var(--spacing-18)]">
                <Borrador />
              </p>
            </div>
            <ul className="flex flex-col gap-[var(--spacing-30)] lg:pt-[var(--spacing-18)]">
              {s.ayuda.map(([id, texto]) => {
                const a = AGENTE_POR_ID[id];
                return (
                  <li key={id} className="grid grid-cols-[48px_minmax(0,1fr)] items-start gap-[var(--spacing-18)]">
                    <span className="marca-agente" style={{ "--agente": PERSONAJES[a.id].color } as CSSProperties}>
                      <Personaje agente={a.id} avatar />
                    </span>
                    <span>
                      <span className="t-rol block">{a.area}</span>
                      <span className="t-sub mt-1 block">{a.nombre}</span>
                      <span className="t-cuerpo mt-[var(--spacing-6)] block">{texto}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      ))}

      <section className="seccion">
        <div className="contenedor">
          <p className="t-etiqueta">Pruébalo</p>
          <h2 className="t-display mt-[var(--spacing-18)] max-w-[14ch]">
            Pruébalo con <span className="resalta">tu negocio en mente.</span>
          </h2>
          <div className="mt-[var(--spacing-36)] flex flex-wrap items-center gap-[var(--spacing-12)]">
            <BotonLink href="/pruebalo">Habla con los agentes</BotonLink>
            <BotonLink href="/precios" variante="suave" flecha>
              Ver precios
            </BotonLink>
          </div>
        </div>
      </section>
    </Sitio>
  );
}
