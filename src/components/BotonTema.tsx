"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons";
import { EVENTO_TEMA, ponerTema, temaActual, temaGuardado, type Tema } from "@/lib/tema";

/**
 * Botón de modo claro/oscuro (sol o luna). Si la persona nunca eligió,
 * sigue al sistema también cuando este cambia.
 */
export function BotonTema({ className = "" }: { className?: string }) {
  const [tema, setTema] = useState<Tema>("oscuro");

  useEffect(() => {
    setTema(temaActual());
    const alCambiar = (e: Event) => setTema((e as CustomEvent<Tema>).detail);
    const sistema = window.matchMedia("(prefers-color-scheme: light)");
    const alCambiarSistema = () => {
      if (!temaGuardado()) ponerTema(sistema.matches ? "claro" : "oscuro", false);
    };
    window.addEventListener(EVENTO_TEMA, alCambiar);
    sistema.addEventListener("change", alCambiarSistema);
    return () => {
      window.removeEventListener(EVENTO_TEMA, alCambiar);
      sistema.removeEventListener("change", alCambiarSistema);
    };
  }, []);

  const siguiente: Tema = tema === "oscuro" ? "claro" : "oscuro";
  return (
    <button
      type="button"
      className={`boton-tema ${className}`}
      onClick={() => ponerTema(siguiente)}
      aria-label={siguiente === "claro" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={siguiente === "claro" ? "Modo claro" : "Modo oscuro"}
    >
      <HugeiconsIcon icon={tema === "oscuro" ? Sun03Icon : Moon02Icon} size={18} strokeWidth={1.6} />
    </button>
  );
}
