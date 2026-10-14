"use client";

import { useEffect, useState } from "react";
import { EVENTO_TEMA, ponerTema, temaActual, type Tema } from "@/lib/tema";

/** El modo actual (claro u oscuro) y cómo cambiarlo. Se entera si otro botón lo cambia. */
export function useTema() {
  const [tema, setTema] = useState<Tema>("oscuro");
  useEffect(() => {
    setTema(temaActual());
    const alCambiar = (e: Event) => setTema((e as CustomEvent<Tema>).detail);
    window.addEventListener(EVENTO_TEMA, alCambiar);
    return () => window.removeEventListener(EVENTO_TEMA, alCambiar);
  }, []);
  const siguiente: Tema = tema === "oscuro" ? "claro" : "oscuro";
  return { tema, siguiente, alternar: () => ponerTema(siguiente) };
}
