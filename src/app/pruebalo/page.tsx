import type { Metadata } from "next";
import { BotonLink } from "@/components/Buttons";
import { ChatDemo } from "@/components/ChatDemo";
import { Sitio } from "@/components/Sitio";

export const metadata: Metadata = { title: "Pruébalo" };

/** El chat con los agentes a pantalla completa: chats, grupos y la barra para escribir. */
export default function Pruebalo() {
  return (
    <Sitio>
      <section className="contenedor pb-12 pt-6 sm:pt-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div>
            <h1 className="text-[1.75rem] font-bold leading-tight tracking-[-0.025em]">Pruébalo</h1>
            <p className="t-chico mt-1">
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
