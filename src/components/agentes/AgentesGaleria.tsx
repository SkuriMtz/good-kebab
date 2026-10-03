"use client";

import { useEffect, useState } from "react";
import AccordionGallery, { type AccordionItem } from "../AccordionGallery";
import { AgenteModal } from "./AgenteModal";
import { Personaje } from "./Personaje";
import { AGENTES_INFO, esIdAgente, type IdAgente } from "@/lib/agentes";
import { EVENTO_ELEGIR_AGENTE } from "@/lib/eventos";

/**
 * La sección de agentes: un acordeón con un panel por agente. Al pasar el
 * mouse (o tocar) se abre el panel con su nombre y una frase; al hacer clic
 * en el panel abierto aparece su ficha completa.
 * En celular el acordeón va en columna.
 */
export function AgentesGaleria() {
  const [abierto, setAbierto] = useState<IdAgente | null>(null);
  const [columna, setColumna] = useState(false);

  // El menú lateral puede pedir la ficha de un agente
  useEffect(() => {
    const alPedir = (e: Event) => {
      const id = (e as CustomEvent).detail;
      if (esIdAgente(id)) setAbierto(id);
    };
    window.addEventListener(EVENTO_ELEGIR_AGENTE, alPedir);
    return () => window.removeEventListener(EVENTO_ELEGIR_AGENTE, alPedir);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const leer = () => setColumna(mq.matches);
    leer();
    mq.addEventListener("change", leer);
    return () => mq.removeEventListener("change", leer);
  }, []);

  const items: AccordionItem[] = AGENTES_INFO.map((a) => ({
    label: a.nombre,
    railLabel: a.area,
    content: <Personaje agente={a.id} />,
    caption: (
      <>
        <span className="mb-2 block font-cond text-[1rem] uppercase tracking-[0.04em] text-ash">{a.area}</span>
        {a.lema}
        <span className="mt-3 block text-[0.8125rem] uppercase tracking-[0.05em] text-bone">Ver todo sobre {a.nombre} →</span>
      </>
    ),
  }));

  return (
    <>
      <AccordionGallery
        key={columna ? "columna" : "fila"}
        items={items}
        defaultIndex={0}
        orientation={columna ? "vertical" : "horizontal"}
        height={columna ? 440 : 560}
        gap={columna ? 10 : 14}
        radius={0}
        expandRatio={0.5}
        tilt={columna ? 0 : 6}
        grayscale={false}
        dim={0}
        accentColor="var(--color-signal)"
        overlayColor="var(--color-void)"
        textColor="var(--color-bone-white)"
        ariaLabel="Los agentes de Atendel"
        onOpen={(i) => setAbierto(AGENTES_INFO[i].id)}
      />
      <AgenteModal agente={abierto} onClose={() => setAbierto(null)} />
    </>
  );
}
