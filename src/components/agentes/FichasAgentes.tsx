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

/** La ficha de los agentes, disponible en todas las páginas del sitio. */
export function FichasAgentes() {
  const [abierto, setAbierto] = useFichas();

  const cerrar = () => {
    setAbierto(null);
    // Si se abrió desde la dirección (?ficha=lola), se quita para que no vuelva a abrirse al recargar
    const url = new URL(window.location.href);
    if (url.searchParams.has("ficha")) {
      url.searchParams.delete("ficha");
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    }
  };

  return <AgenteModal agente={abierto} onClose={cerrar} />;
}
