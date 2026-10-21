"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Icono } from "./base/Iconos";
import { EVENTO_TEMA, ponerTema, temaActual, type Tema } from "@/lib/tema";

type Variante = "icono" | "fila" | "segmentado";

/**
 * Modo claro / oscuro, en tres formas:
 * - "icono": botón cuadrado con borde (como los botones de ícono de la barra
 *   de GitHub). Enseña el sol en oscuro y la luna en claro.
 * - "fila": una fila a lo ancho con su nombre (menú del celular).
 * - "segmentado": dos opciones, Oscuro y Claro, con una píldora que se
 *   desliza a la elegida (pie de página).
 * Lo visible (qué ícono, dónde está la píldora) lo decide el CSS con
 * html[data-tema], que ya está puesto antes de pintar: no hay parpadeo.
 */
export function BotonTema({ className = "", variante = "icono" }: { className?: string; variante?: Variante }) {
  const [tema, setTema] = useState<Tema>("oscuro");
  const refGrupo = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTema(temaActual());
    const alCambiar = (e: Event) => setTema((e as CustomEvent<Tema>).detail);
    window.addEventListener(EVENTO_TEMA, alCambiar);
    return () => window.removeEventListener(EVENTO_TEMA, alCambiar);
  }, []);

  const siguiente: Tema = tema === "oscuro" ? "claro" : "oscuro";
  const etiqueta = siguiente === "claro" ? "Cambiar a modo claro" : "Cambiar a modo oscuro";

  // Los dos íconos viven juntos; el CSS enseña uno y esconde el otro (opacidad y escala)
  const iconos = (
    <span className="tema-icono" aria-hidden="true">
      <Icono nombre="sol" tam={16} className="tema-icono__sol" />
      <Icono nombre="luna" tam={16} className="tema-icono__luna" />
    </span>
  );

  if (variante === "segmentado") {
    // Grupo de radio: flechas para moverse, como cualquier selector del sistema
    const alTeclear = (e: KeyboardEvent<HTMLDivElement>) => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
      e.preventDefault();
      ponerTema(siguiente);
      window.requestAnimationFrame(() =>
        refGrupo.current?.querySelector<HTMLButtonElement>(`[data-opcion="${siguiente}"]`)?.focus(),
      );
    };
    return (
      <div ref={refGrupo} role="radiogroup" aria-label="Modo de color" className={`tema-seg ${className}`} onKeyDown={alTeclear}>
        <span className="tema-seg__pildora" aria-hidden="true" />
        {(["oscuro", "claro"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={tema === t}
            tabIndex={tema === t ? 0 : -1}
            data-opcion={t}
            className="tema-seg__opcion"
            onClick={() => ponerTema(t)}
          >
            <Icono nombre={t === "oscuro" ? "luna" : "sol"} tam={16} />
            {t === "oscuro" ? "Oscuro" : "Claro"}
          </button>
        ))}
      </div>
    );
  }

  if (variante === "fila") {
    return (
      <button type="button" className={`tema-fila ${className}`} onClick={() => ponerTema(siguiente)} aria-label={etiqueta}>
        <span className="tema-fila__texto">
          <span className="tema-fila__en-oscuro">Modo claro</span>
          <span className="tema-fila__en-claro">Modo oscuro</span>
        </span>
        <span className="tema-fila__icono">{iconos}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className={`boton-borde ${className}`}
      onClick={() => ponerTema(siguiente)}
      aria-label={etiqueta}
      title={siguiente === "claro" ? "Modo claro" : "Modo oscuro"}
    >
      {iconos}
    </button>
  );
}
