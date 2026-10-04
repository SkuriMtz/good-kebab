import type { Metadata } from "next";
import { BotonLink } from "@/components/Buttons";
import { Preguntas } from "@/components/Preguntas";
import { Sitio } from "@/components/Sitio";
import { Revela } from "@/components/escena/Revela";
import { Tetra } from "@/components/escena/Tetra";
import { GARANTIAS, PREGUNTAS } from "@/lib/contenido";

const COLORES = ["#2fd6a8", "#8052ff", "#ffb829"];

export const metadata: Metadata = { title: "Preguntas frecuentes" };

/**
 * Preguntas frecuentes: el título a la izquierda (fijo al bajar en computadora) y las respuestas a la derecha.
 * Abajo, "Tus datos": cómo se cuida la información, con el candado de triangulitos.
 */
export default function PreguntasFrecuentes() {
  return (
    <Sitio>
      <section className="contenedor dos-columnas !items-start pb-[var(--spacing-96)] pt-[var(--spacing-36)] lg:pb-[var(--spacing-120)] lg:pt-[var(--spacing-96)]">
        <div className="lg:sticky lg:top-[calc(var(--barra-h)+var(--spacing-36))]">
          <p className="t-etiqueta">Preguntas frecuentes</p>
          <h1 className="t-display mt-[var(--spacing-18)]">
            Lo que <span className="resalta">nos preguntan.</span>
          </h1>
          <div className="mt-[var(--spacing-36)] flex flex-wrap items-center gap-[var(--spacing-12)]">
            <BotonLink href="/pruebalo">Habla con los agentes</BotonLink>
            <BotonLink href="/precios" variante="suave" flecha>
              Ver precios
            </BotonLink>
          </div>
        </div>
        <div id="preguntas">
          <Preguntas preguntas={PREGUNTAS} />
        </div>
      </section>

      <section id="seguridad" className="encabezado-escena contenedor" data-escena="candadoDerecha">
        <Revela className="encabezado-escena__texto">
          <p className="t-etiqueta">Tus datos</p>
          <h2 className="d-grande mt-[var(--spacing-18)]">Cada negocio ve solo lo suyo</h2>
          <ul className="mt-[var(--spacing-36)] flex flex-col gap-[var(--spacing-30)]">
            {GARANTIAS.map(([titulo, texto], i) => (
              <li key={titulo} className="grid grid-cols-[44px_minmax(0,1fr)] gap-[var(--spacing-18)]">
                <Tetra color={COLORES[i]} className="h-11 w-11" />
                <span>
                  <span className="t-sub block">{titulo}</span>
                  <span className="d-parrafos d-parrafos--chico !mt-1 block max-w-[440px]">{texto}</span>
                </span>
              </li>
            ))}
          </ul>
        </Revela>
      </section>
    </Sitio>
  );
}
