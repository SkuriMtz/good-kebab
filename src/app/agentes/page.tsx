import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { BotonLink, Check, claseBoton } from "@/components/Buttons";
import { EncabezadoPagina } from "@/components/Encabezado";
import { Sitio } from "@/components/Sitio";
import { BotonFicha } from "@/components/agentes/BotonFicha";
import { ConversacionEjemplo } from "@/components/agentes/ConversacionEjemplo";
import { MarcasAgentes } from "@/components/agentes/MarcasAgentes";
import { Personaje } from "@/components/agentes/Personaje";
import { PERSONAJES } from "@/lib/personajes";
import { TarjetasAgentes } from "@/components/agentes/TarjetasAgentes";
import { DETALLE } from "@/components/agentes/detalle";
import { AGENTES_INFO } from "@/lib/agentes";

export const metadata: Metadata = { title: "Agentes" };

/*
 * Agentes: el encabezado, las cuatro tarjetas (cada una abre su ficha) y un
 * bloque por agente: lo que hace a un lado y, en su color, una conversación
 * de ejemplo. Los bloques alternan de lado.
 */
export default function Agentes() {
  return (
    <Sitio>
      <EncabezadoPagina
        arriba={<MarcasAgentes grande />}
        titulo={
          <>
            ¿Qué le <span className="pastilla">encargas</span> hoy?
          </>
        }
        texto="Atención, Correo, Clientes y Oficina. Haz clic en cada uno para ver todo lo que hace, una conversación de ejemplo y en qué plan está."
        acciones={
          <BotonLink href="/pruebalo" tam="grande">
            Habla con los agentes
          </BotonLink>
        }
      />

      <section aria-label="Los cuatro agentes" className="contenedor pb-16 lg:pb-20">
        <TarjetasAgentes />
      </section>

      {AGENTES_INFO.map((a, i) => (
        <section key={a.id} id={a.id} aria-labelledby={`${a.id}-titulo`} className="seccion border-t border-[var(--linea)]">
          <div className="contenedor grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div className={i % 2 ? "lg:order-2" : undefined}>
              <p className="pill">
                {a.area} · {a.abarca}
              </p>
              <h2 id={`${a.id}-titulo`} className="t-seccion mt-4">
                {a.nombre}
              </h2>
              <p className="t-editorial mt-3 max-w-[520px]">{a.lema}</p>
              <h3 className="t-etiqueta mt-8">Lo que hace</h3>
              <ul className="lista-check mt-3">
                {a.capacidades.map((c) => (
                  <li key={c}>
                    <Check className="h-4 w-4 text-enlace" />
                    {c}
                  </li>
                ))}
              </ul>
              <p className="t-cuerpo mt-6 max-w-[560px]">{DETALLE[a.id].descripcion}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <BotonFicha agente={a.id} className={claseBoton("suave")}>
                  Ver su ficha
                </BotonFicha>
                <BotonLink href={`/pruebalo?con=${a.id}`} variante="texto" flecha>
                  Háblale a {a.nombre}
                </BotonLink>
              </div>
            </div>
            <div className="panel-color en-acento" style={{ "--acento": PERSONAJES[a.id].color } as CSSProperties}>
              <div className="mb-4 flex items-center gap-3">
                <span className="marca-agente" style={{ "--agente": "rgb(0 0 0 / 0.08)" } as CSSProperties}>
                  <Personaje agente={a.id} avatar />
                </span>
                <p className="font-semibold">Conversación de ejemplo</p>
              </div>
              <ConversacionEjemplo agente={a.id} />
            </div>
          </div>
        </section>
      ))}

      {/* Acceso al chat */}
      <section className="seccion border-t border-[var(--linea)]">
        <div className="contenedor flex flex-col items-center text-center">
          <h2 className="t-seccion">Pruébalos en el chat.</h2>
          <p className="t-editorial mt-4 max-w-[560px]">
            Escríbeles lo que necesitas, como en cualquier chat, o arma un grupo con los que quieras.
          </p>
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
