"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons";
import { EVENTO_TEMA, ponerTema, temaActual, type Tema } from "@/lib/tema";

/**
 * Botón de modo claro/oscuro (luna o sol). `conTexto` lo muestra como una
 * fila con su nombre (para el menú del celular).
 */
export function BotonTema({ className = "", conTexto = false }: { className?: string; conTexto?: boolean }) {
  const [tema, setTema] = useState<Tema>("oscuro");

  useEffect(() => {
    setTema(temaActual());
    const alCambiar = (e: Event) => setTema((e as CustomEvent<Tema>).detail);
    window.addEventListener(EVENTO_TEMA, alCambiar);
    return () => window.removeEventListener(EVENTO_TEMA, alCambiar);
  }, []);

  const siguiente: Tema = tema === "oscuro" ? "claro" : "oscuro";
  const icono = <HugeiconsIcon icon={tema === "oscuro" ? Sun03Icon : Moon02Icon} size={18} strokeWidth={1.8} />;
  const etiqueta = siguiente === "claro" ? "Cambiar a modo claro" : "Cambiar a modo oscuro";

  if (conTexto) {
    return (
      <button type="button" className={`menu-movil__enlace w-full !text-base !font-medium ${className}`} onClick={() => ponerTema(siguiente)}>
        {siguiente === "claro" ? "Modo claro" : "Modo oscuro"}
        <span className="text-tenue">{icono}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className={`boton-icono ${className}`}
      onClick={() => ponerTema(siguiente)}
      aria-label={etiqueta}
      title={siguiente === "claro" ? "Modo claro" : "Modo oscuro"}
    >
      {icono}
    </button>
  );
}
