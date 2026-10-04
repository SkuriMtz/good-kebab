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
        titulo={
          <>
            Empieza <span className="pastilla">gratis</span>. Crece cuando quieras.
          </>
        }
        texto="Free para conocer a Clara. One para sumar a Lola, tu atención por WhatsApp. Max para tener a todo el equipo."
      />

      <section aria-label="Planes" className="contenedor pb-16 lg:pb-20">
        <Planes />
      </section>

      <section className="seccion border-t border-[var(--linea)]">
        <div className="contenedor flex flex-col items-center text-center">
          <h2 className="t-seccion">Pruébalos antes de decidir.</h2>
          <p className="t-editorial mt-4 max-w-[560px]">
            Habla con los cuatro agentes en el chat de demostración, o revisa las preguntas frecuentes.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <BotonLink href="/pruebalo" tam="grande">
              Habla con los agentes
            </BotonLink>
            <BotonLink href="/preguntas" variante="suave" tam="grande">
              Preguntas frecuentes
            </BotonLink>
          </div>
        </div>
      </section>
    </Sitio>
  );
}
