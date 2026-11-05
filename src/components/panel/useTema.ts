"use client";

import { useEffect, useState } from "react";
import { EVENTO_TEMA, temaActual, type Tema } from "@/lib/tema";

/** El modo actual (claro u oscuro), al día cuando alguien lo cambia. */
export function useTema() {
  const [tema, setTema] = useState<Tema>("oscuro");
  useEffect(() => {
    setTema(temaActual());
    const alCambiar = (e: Event) => setTema((e as CustomEvent<Tema>).detail);
    window.addEventListener(EVENTO_TEMA, alCambiar);
    return () => window.removeEventListener(EVENTO_TEMA, alCambiar);
  }, []);
  return tema;
}
