import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { BotonLink, Check, claseBoton } from "@/components/Buttons";
import { EncabezadoPagina } from "@/components/Encabezado";
import { Sitio } from "@/components/Sitio";
import { BotonFicha } from "@/components/agentes/BotonFicha";
import { ConversacionEjemplo } from "@/components/agentes/ConversacionEjemplo";
import { Personaje } from "@/components/agentes/Personaje";
import { TarjetasAgentes } from "@/components/agentes/TarjetasAgentes";
import { DETALLE } from "@/components/agentes/detalle";
import { AGENTES_INFO } from "@/lib/agentes";
import { PERSONAJES } from "@/lib/personajes";

export const metadata: Metadata = { title: "Agentes" };

/*
 * Agentes: el encabezado, las cuatro tarjetas (cada una abre su ficha) y un
 * bloque por agente en dos columnas que alternan de lado: lo que hace de un
 * lado; su retrato y una conversación de ejemplo del otro.
 */
export default function Agentes() {
  return (
    <Sitio>
      <EncabezadoPagina
        escena="logoDerecha"
        etiqueta="Atención, Correo, Clientes y Oficina"
        titulo={
          <>
            ¿Qué le encargas <span className="resalta">hoy?</span>
          </>
        }
        texto="Haz clic en cada uno para ver todo lo que hace, una conversación de ejemplo y en qué plan está."
        acciones={<BotonLink href="/pruebalo">Habla con los agentes</BotonLink>}
      />

      <section aria-label="Los cuatro agentes" className="contenedor pb-[var(--spacing-60)] lg:pb-[var(--spacing-96)]">
        <TarjetasAgentes />
      </section>

      {AGENTES_INFO.map((a, i) => (
        <section key={a.id} id={a.id} aria-labelledby={`${a.id}-titulo`} className="seccion">
          <div className="contenedor dos-columnas !items-start">
            <div className={i % 2 ? "lg:order-2" : undefined}>
              <p className="t-etiqueta">
                {a.area} · {a.abarca}
              </p>
              <h2 id={`${a.id}-titulo`} className="t-display mt-[var(--spacing-18)]">
                {a.nombre}
              </h2>
              <p className="t-editorial mt-[var(--spacing-18)] max-w-[480px]">{a.lema}</p>
              <h3 className="t-etiqueta mt-[var(--spacing-36)]">Lo que hace</h3>
              <ul className="lista-check mt-[var(--spacing-18)]">
                {a.capacidades.map((c) => (
                  <li key={c} className="t-editorial">
                    <Check className="h-4 w-4" />
                    {c}
                  </li>
                ))}
              </ul>
              <p className="t-cuerpo mt-[var(--spacing-36)] max-w-[520px]">{DETALLE[a.id].descripcion}</p>
              <div className="mt-[var(--spacing-36)] flex flex-wrap items-center gap-[var(--spacing-12)]">
                <BotonFicha agente={a.id} className={claseBoton("suave")}>
                  Ver su ficha
                </BotonFicha>
                <BotonLink href={`/pruebalo?con=${a.id}`} variante="texto" flecha>
                  Háblale a {a.nombre}
                </BotonLink>
              </div>
            </div>
            <div className="flex flex-col gap-[var(--spacing-36)]">
              <span className="retrato max-w-[320px]" style={{ "--agente": PERSONAJES[a.id].color } as CSSProperties}>
                <Personaje agente={a.id} avatar />
              </span>
              <ConversacionEjemplo agente={a.id} />
            </div>
          </div>
        </section>
      ))}

      {/* Acceso al chat */}
      <section className="seccion">
        <div className="contenedor">
          <p className="t-etiqueta">El chat</p>
          <h2 className="t-display mt-[var(--spacing-18)] max-w-[14ch]">
            Pruébalos <span className="resalta">en el chat.</span>
          </h2>
          <div className="mt-[var(--spacing-36)] flex flex-col gap-[var(--spacing-24)] lg:flex-row lg:items-end lg:justify-between">
            <p className="t-editorial max-w-[480px]">
              Escríbeles lo que necesitas, como en cualquier chat, o arma un grupo con los que quieras.
            </p>
            <div className="flex flex-wrap items-center gap-[var(--spacing-12)]">
              <BotonLink href="/pruebalo">Habla con los agentes</BotonLink>
              <BotonLink href="/precios" variante="suave" flecha>
                Ver precios
              </BotonLink>
            </div>
          </div>
        </div>
      </section>
    </Sitio>
  );
}
