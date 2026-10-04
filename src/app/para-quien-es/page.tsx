import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { BotonLink } from "@/components/Buttons";
import { Borrador, EncabezadoPagina } from "@/components/Encabezado";
import { Sitio } from "@/components/Sitio";
import { Personaje } from "@/components/agentes/Personaje";
import { PERSONAJES } from "@/lib/personajes";
import { AGENTE_POR_ID } from "@/lib/agentes";
import { SEGMENTOS } from "@/lib/contenido";

export const metadata: Metadata = { title: "Para quién es" };

/** El color de cada tipo de negocio sale de la paleta de los agentes. */
const COLOR: Record<(typeof SEGMENTOS)[number]["pastel"], string> = {
  durazno: "var(--agente-lola)",
  mantequilla: "var(--agente-iris)",
  cielo: "var(--agente-clara)",
  menta: "var(--agente-victor)",
};

/** Para quién es: un bloque por tipo de negocio; de un lado quién es, del otro cómo le ayuda cada agente. */
export default function ParaQuienEs() {
  return (
    <Sitio>
      <EncabezadoPagina
        titulo="Clínicas, estéticas, consultorios y negocios de servicios."
        texto="Si tu negocio vive de atender, agendar y que tus clientes regresen, el equipo de Atendel hace esa parte contigo."
        acciones={
          <BotonLink href="/pruebalo" tam="grande">
            Habla con los agentes
          </BotonLink>
        }
      />

      <nav aria-label="Tipos de negocio" className="contenedor -mt-4 flex flex-wrap justify-center gap-2 pb-12 lg:pb-16">
        {SEGMENTOS.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="chip">
            {s.nombre}
          </a>
        ))}
      </nav>

      {SEGMENTOS.map((s, i) => (
        <section key={s.id} id={s.id} aria-labelledby={`${s.id}-titulo`} className="seccion border-t border-[var(--linea)]">
          <div className="contenedor grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div className={i % 2 ? "lg:order-2" : undefined}>
              <h2 id={`${s.id}-titulo`} className="t-seccion">
                {s.nombre}
              </h2>
              <p className="t-editorial mt-4 max-w-[520px]">{s.intro}</p>
              <p className="mt-5">
                <Borrador />
              </p>
            </div>
            <div className="panel-color en-acento" style={{ "--acento": COLOR[s.pastel] } as CSSProperties}>
              <ul className="tarjeta mockup !p-0">
                {s.ayuda.map(([id, texto], k) => {
                  const a = AGENTE_POR_ID[id];
                  return (
                    <li
                      key={id}
                      className={`grid grid-cols-[40px_minmax(0,1fr)] items-start gap-4 px-5 py-4 ${k ? "border-t border-[var(--linea)]" : ""}`}
                    >
                      <span className="marca-agente marca-agente--chica" style={{ "--agente": PERSONAJES[a.id].color } as CSSProperties}>
                        <Personaje agente={a.id} avatar />
                      </span>
                      <span>
                        <span className="block font-semibold">
                          {a.nombre} <span className="font-normal text-tenue">— {a.area}</span>
                        </span>
                        <span className="t-cuerpo mt-1 block">{texto}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </section>
      ))}

      <section className="seccion border-t border-[var(--linea)]">
        <div className="contenedor flex flex-col items-center text-center">
          <h2 className="t-seccion">Pruébalo con tu negocio en mente.</h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <BotonLink href="/pruebalo" tam="grande">
              Habla con los agentes
            </BotonLink>
            <BotonLink href="/precios" variante="suave" tam="grande">
              Ver precios
            </BotonLink>
          </div>
        </div>
      </section>
    </Sitio>
  );
}
