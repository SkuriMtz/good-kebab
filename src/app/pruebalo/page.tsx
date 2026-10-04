import type { Metadata } from "next";
import Link from "next/link";
import { Arrow } from "@/components/Buttons";
import { ChatDemo } from "@/components/ChatDemo";
import { Sitio } from "@/components/Sitio";

export const metadata: Metadata = { title: "Pruébalo" };

/** El chat con los agentes a pantalla completa: chats, grupos y la barra para escribir. */
export default function Pruebalo() {
  return (
    <Sitio>
      <section data-capitulo="Pruébalo" className="px-3 pt-[84px] sm:px-5">
        <div className="mx-auto max-w-[96rem]">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-2 pb-3 pt-1 sm:px-3">
            <h1 className="text-[1.0625rem] font-semibold tracking-[-0.03em]">
              Pruébalo{" "}
              <span className="hidden font-normal text-ash md:inline">· escríbeles, usa @ para mencionar o / para una acción</span>
            </h1>
            <p className="flex items-center gap-4 text-[0.8125rem] text-ash">
              <span>
                <span className="sm:hidden">Respuestas de ejemplo.</span>
                <span className="hidden sm:inline">Demostración: las respuestas son de ejemplo.</span>
              </span>
              <Link href="/entrar" className="btn-ghost !min-h-0 !text-[0.8125rem] !text-bone">
                Probarlo de verdad
                <Arrow />
              </Link>
            </p>
          </div>
          <ChatDemo completa />
        </div>
      </section>
    </Sitio>
  );
}
