import type { Metadata } from "next";
import { BotonLink } from "@/components/Buttons";
import { ChatDemo } from "@/components/ChatDemo";
import { Sitio } from "@/components/Sitio";

export const metadata: Metadata = { title: "Pruébalo" };

/** El chat con los agentes a pantalla completa: chats, grupos y la barra para escribir. */
export default function Pruebalo() {
  return (
    <Sitio>
      <section className="contenedor pb-[var(--spacing-60)] pt-[var(--spacing-12)]">
        <div className="mb-[var(--spacing-18)] flex flex-wrap items-end justify-between gap-x-[var(--spacing-24)] gap-y-[var(--spacing-12)]">
          <div>
            <h1 className="t-etiqueta">Pruébalo</h1>
            <p className="t-chico mt-[var(--spacing-6)]">
              Escríbeles, usa @ para mencionar o / para una acción. Demostración: las respuestas son de ejemplo.
            </p>
          </div>
          <BotonLink href="/entrar" variante="suave" flecha>
            Probarlo de verdad
          </BotonLink>
        </div>
        <ChatDemo completa />
      </section>
    </Sitio>
  );
}
