import type { Metadata } from "next";
import Link from "next/link";
import { ChatDemo } from "@/components/ChatDemo";
import { Sitio } from "@/components/Sitio";

export const metadata: Metadata = { title: "Pruébalo" };

/** El chat con los agentes a pantalla completa: chats, grupos y la barra para escribir. */
export default function Pruebalo() {
  return (
    <Sitio>
      <section data-capitulo="Pruébalo" className="px-[var(--orilla)] pt-[76px]">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-dashed hairline pb-3 pt-1">
          <h1 className="etiqueta">
            <span className="etiqueta--brasa">Pruébalo</span>{" "}
            <span className="etiqueta--suave hidden md:inline">— escríbeles, usa @ para mencionar o / para una acción</span>
          </h1>
          <p className="flex items-center gap-4">
            <span className="etiqueta etiqueta--suave">
              <span className="sm:hidden">Respuestas de ejemplo</span>
              <span className="hidden sm:inline">Demostración: las respuestas son de ejemplo</span>
            </span>
            <Link href="/entrar" className="etiqueta underline decoration-dashed underline-offset-4 hover:decoration-solid">
              Probarlo de verdad
            </Link>
          </p>
        </div>
        <div className="pt-3">
          <ChatDemo completa />
        </div>
      </section>
    </Sitio>
  );
}
