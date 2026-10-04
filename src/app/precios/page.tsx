import type { Metadata } from "next";
import { BotonLink } from "@/components/Buttons";
import { EncabezadoPagina } from "@/components/Encabezado";
import { Planes } from "@/components/Planes";
import { Sitio } from "@/components/Sitio";

export const metadata: Metadata = { title: "Precios" };

/** Los tres planes: Free (gratis), One (medio) y Max (completo). Los precios aún no se publican. */
export default function Precios() {
  return (
    <Sitio>
      <EncabezadoPagina
        escena="globoDerecha"
        etiqueta="Precios · Free → One → Max"
        titulo={
          <>
            Empieza gratis. <span className="resalta">Crece cuando quieras.</span>
          </>
        }
        texto="Free para conocer a Clara. One para sumar a Lola, tu atención por WhatsApp. Max para tener a todo el equipo."
      />

      <section aria-label="Planes" className="contenedor pb-[var(--spacing-60)] lg:pb-[var(--spacing-96)]">
        <Planes />
      </section>

      <section className="seccion">
        <div className="contenedor">
          <p className="t-etiqueta">Antes de decidir</p>
          <h2 className="t-display mt-[var(--spacing-18)] max-w-[14ch]">
            Pruébalos antes <span className="resalta">de decidir.</span>
          </h2>
          <div className="mt-[var(--spacing-36)] flex flex-col gap-[var(--spacing-24)] lg:flex-row lg:items-end lg:justify-between">
            <p className="t-editorial max-w-[480px]">
              Habla con los cuatro agentes en el chat de demostración, o revisa las preguntas frecuentes.
            </p>
            <div className="flex flex-wrap items-center gap-[var(--spacing-12)]">
              <BotonLink href="/pruebalo">Habla con los agentes</BotonLink>
              <BotonLink href="/preguntas" variante="suave" flecha>
                Preguntas frecuentes
              </BotonLink>
            </div>
          </div>
        </div>
      </section>
    </Sitio>
  );
}
