"use client";

import { useEffect, useState } from "react";
import { AgenteModal } from "./AgenteModal";
import { esIdAgente, type IdAgente } from "@/lib/agentes";
import { EVENTO_ELEGIR_AGENTE } from "@/lib/eventos";

/**
 * Hace que cualquier página pueda abrir la ficha de un agente: escucha el
 * aviso del menú y de las tarjetas, y también "?ficha=lola" en la dirección.
 * Mientras está montado, marca la página con data-fichas para que el menú
 * abra la ficha aquí mismo en vez de ir a otra página.
 */
export function useFichas() {
  const [abierto, setAbierto] = useState<IdAgente | null>(null);

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-fichas", "");
    const alPedir = (e: Event) => {
      const id = (e as CustomEvent).detail;
      if (esIdAgente(id)) setAbierto(id);
    };
    window.addEventListener(EVENTO_ELEGIR_AGENTE, alPedir);
    const pedida = new URLSearchParams(window.location.search).get("ficha");
    if (esIdAgente(pedida)) setAbierto(pedida);
    return () => {
      html.removeAttribute("data-fichas");
      window.removeEventListener(EVENTO_ELEGIR_AGENTE, alPedir);
    };
  }, []);

  return [abierto, setAbierto] as const;
}

/** La ficha de agente para las páginas que no tienen el acordeón. */
export function FichasAgentes() {
  const [abierto, setAbierto] = useFichas();
  return <AgenteModal agente={abierto} onClose={() => setAbierto(null)} />;
}
