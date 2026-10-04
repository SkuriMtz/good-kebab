import type { CSSProperties } from "react";
import { BotonLink } from "../Buttons";
import { BotonFicha } from "../agentes/BotonFicha";
import { Personaje } from "../agentes/Personaje";
import { Constelacion } from "./Constelacion";
import { ConversacionEnVivo } from "./ConversacionEnVivo";
import { AGENTES_INFO } from "@/lib/agentes";
import { PERSONAJES } from "@/lib/personajes";

/*
 * Tres direcciones para la portada de Atendel, inspiradas en el estilo de
 * diseno/design.md (negro, títulos enormes y delgados, una píldora violeta,
 * etiquetas en ámbar). Las tres usan los mismos textos reales; cambia qué
 * protagoniza la portada y cómo se acomoda.
 */

const ETIQUETA = "Para clínicas, consultorios y estéticas";
const TITULO = "Agentes de inteligencia artificial para negocios que atienden personas.";
const TEXTO =
  "Cuatro agentes de inteligencia artificial que atienden tu WhatsApp y tus citas, ordenan tu correo, traen de regreso a tus clientes y hacen el trabajo de oficina.";

function Acciones() {
  return (
    <div className="mt-[var(--spacing-36)] flex flex-wrap items-center gap-[var(--spacing-12)]">
      <BotonLink href="/pruebalo">Habla con los agentes</BotonLink>
      <BotonLink href="/agentes" variante="suave" flecha>
        Conoce a los agentes
      </BotonLink>
    </div>
  );
}

/** A · Constelación: el texto a la izquierda y, a la derecha, los cuatro agentes como una nube de triangulitos. */
export function PortadaA() {
  return (
    <section className="contenedor dos-columnas pb-[var(--spacing-60)] pt-[var(--spacing-36)] lg:min-h-[calc(100svh-var(--barra-h))] lg:pb-[var(--spacing-96)] lg:pt-[var(--spacing-30)]">
      <div className="relative z-10">
        <p className="t-etiqueta">{ETIQUETA}</p>
        <h1 className="t-display mt-[var(--spacing-18)]">{TITULO}</h1>
        <p className="t-editorial mt-[var(--spacing-24)] max-w-[480px]">{TEXTO}</p>
        <Acciones />
      </div>
      <div className="relative mx-auto aspect-square w-full max-w-[640px] lg:-mr-[var(--spacing-36)]">
        <Constelacion className="absolute inset-0 h-full w-full" />
      </div>
    </section>
  );
}

/** B · En vivo: el título enorme de lado a lado y, abajo, Lola contestando un WhatsApp que se escribe solo. */
export function PortadaB() {
  return (
    <section className="contenedor pb-[var(--spacing-60)] pt-[var(--spacing-36)] lg:pb-[var(--spacing-96)] lg:pt-[var(--spacing-60)]">
      <p className="t-etiqueta">{ETIQUETA}</p>
      <h1 className="t-display t-display--enorme mt-[var(--spacing-18)] max-w-[15ch] lg:!text-[6.25rem]">{TITULO}</h1>
      <div className="dos-columnas mt-[var(--spacing-60)] !items-start lg:mt-[var(--spacing-96)]">
        <div>
          <p className="t-editorial max-w-[480px]">{TEXTO}</p>
          <Acciones />
        </div>
        <div className="lg:justify-self-end">
          <ConversacionEnVivo />
        </div>
      </div>
    </section>
  );
}

/** C · El equipo: el título arriba y los cuatro agentes al frente, como retratos que abren su ficha. Polvo de triangulitos de fondo. */
export function PortadaC() {
  return (
    <section className="relative overflow-hidden">
      <Constelacion densidad={0.5} className="pointer-events-none absolute inset-0 h-full w-full opacity-70" />
      <div className="contenedor relative pb-[var(--spacing-60)] pt-[var(--spacing-36)] lg:pb-[var(--spacing-96)] lg:pt-[var(--spacing-60)]">
        <div className="flex flex-col gap-[var(--spacing-24)] lg:flex-row lg:items-end lg:justify-between lg:gap-[var(--spacing-96)]">
          <div>
            <p className="t-etiqueta">{ETIQUETA}</p>
            <h1 className="t-display mt-[var(--spacing-18)] max-w-[14ch]">{TITULO}</h1>
          </div>
          <div className="lg:max-w-[420px] lg:pb-[var(--spacing-12)]">
            <p className="t-editorial">{TEXTO}</p>
            <Acciones />
          </div>
        </div>
        <ul className="mt-[var(--spacing-60)] grid grid-cols-2 gap-x-[var(--spacing-18)] gap-y-[var(--spacing-36)] lg:mt-[var(--spacing-96)] lg:grid-cols-4 lg:gap-x-[var(--spacing-24)]">
          {AGENTES_INFO.map((a) => (
            <li key={a.id}>
              <BotonFicha agente={a.id} className="tarjeta-agente" ariaLabel={`${a.nombre}, ${a.area}: ver su ficha`}>
                <span className="retrato retrato--lleno" style={{ "--agente": PERSONAJES[a.id].color } as CSSProperties}>
                  <Personaje agente={a.id} avatar />
                </span>
                <span className="t-rol mt-[var(--spacing-6)]">{a.area}</span>
                <span className="t-titulo tarjeta-agente__nombre">{a.nombre}</span>
                <span className="t-chico">{a.lema}</span>
              </BotonFicha>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
