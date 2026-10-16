"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Icono } from "./base/Iconos";
import { EVENTO_TEMA, ponerTema, temaActual, type Tema } from "@/lib/tema";

const OPCIONES: { id: Tema; etiqueta: string; icono: "luna" | "sol" }[] = [
  { id: "oscuro", etiqueta: "Oscuro", icono: "luna" },
  { id: "claro", etiqueta: "Claro", icono: "sol" },
];

/**
 * Modo claro / oscuro (se guarda en atendel-tema-v5; ver src/lib/tema.ts).
 * - `icono` (barra): botón de ícono de 32px con borde, como los de la barra
 *   del dashboard de GitHub. Muestra el sol en oscuro y la luna en claro.
 * - `selector` (pie y hoja del celular): control segmentado en píldora con
 *   "Oscuro" y "Claro"; la marca se desliza (solo transform, 0.2s).
 * Lo que se ve lo decide CSS con data-tema de <html>, así no parpadea antes
 * de que cargue JavaScript; el estado de React solo da la lectura accesible.
 */
export function BotonTema({
  className = "",
  variante = "icono",
  etiquetadoPor,
}: {
  className?: string;
  variante?: "icono" | "selector";
  /** id del texto que nombra al selector (si no, se llama "Tema"). */
  etiquetadoPor?: string;
}) {
  const [tema, setTema] = useState<Tema>("oscuro");
  const opcionesRef = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    setTema(temaActual());
    const alCambiar = (e: Event) => setTema((e as CustomEvent<Tema>).detail);
    window.addEventListener(EVENTO_TEMA, alCambiar);
    return () => window.removeEventListener(EVENTO_TEMA, alCambiar);
  }, []);

  if (variante === "selector") {
    // Radios: las flechas cambian de opción (y de tema), como un grupo de radio nativo
    const alTeclear = (e: KeyboardEvent<HTMLDivElement>) => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
      e.preventDefault();
      const i = OPCIONES.findIndex((o) => o.id === tema);
      const paso = e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 1;
      const j = (i + paso + OPCIONES.length) % OPCIONES.length;
      ponerTema(OPCIONES[j].id);
      opcionesRef.current[j]?.focus();
    };
    return (
      <div
        role="radiogroup"
        aria-label={etiquetadoPor ? undefined : "Tema"}
        aria-labelledby={etiquetadoPor}
        className={`selector-tema ${className}`}
        onKeyDown={alTeclear}
      >
        <span className="selector-tema__marca" aria-hidden="true" />
        {OPCIONES.map((o, i) => (
          <button
            key={o.id}
            ref={(el) => {
              opcionesRef.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={tema === o.id}
            tabIndex={tema === o.id ? 0 : -1}
            className={`selector-tema__opcion selector-tema__opcion--${o.id}`}
            onClick={() => ponerTema(o.id)}
          >
            <Icono nombre={o.icono} tam={16} />
            <span>{o.etiqueta}</span>
          </button>
        ))}
      </div>
    );
  }

  const siguiente: Tema = tema === "oscuro" ? "claro" : "oscuro";
  return (
    <button
      type="button"
      className={`tema-boton ${className}`}
      onClick={() => ponerTema(siguiente)}
      aria-label={siguiente === "claro" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={siguiente === "claro" ? "Modo claro" : "Modo oscuro"}
    >
      <Icono nombre="sol" tam={16} className="tema-boton__sol" />
      <Icono nombre="luna" tam={16} className="tema-boton__luna" />
    </button>
  );
}
