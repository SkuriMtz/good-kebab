"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Icono } from "@/components/base/Iconos";
import { MODELOS, type IdModelo } from "@/lib/planes";

/**
 * El modelo, afuera de la caja (abajo a la derecha), como en la barra de
 * Claude: "Rápido  Día a día ⌄". Al picarle se abre el menú al estilo
 * Gemini: para qué sirve arriba, el modelo abajo, la palomita a la
 * izquierda y "Gasta más" en Avanzado. Teclado: flechas, Enter y Escape.
 * `hacia`: en el Inicio el menú sale hacia abajo; en la conversación, arriba.
 */
export function SelectorModelo({
  modelo,
  permitidos,
  alElegir,
  hacia = "abajo",
}: {
  modelo: IdModelo;
  permitidos: readonly IdModelo[];
  alElegir: (id: IdModelo) => void;
  hacia?: "abajo" | "arriba";
}) {
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(0);
  const raiz = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const filas = useRef<(HTMLButtonElement | null)[]>([]);
  const id = useId();
  const info = MODELOS[modelo];

  // Se cierra al picar afuera
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: PointerEvent) => {
      if (!raiz.current?.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("pointerdown", fuera);
    return () => document.removeEventListener("pointerdown", fuera);
  }, [abierto]);

  // Al abrir, el foco va al elegido
  useEffect(() => {
    if (abierto) filas.current[activo]?.focus();
  }, [abierto, activo]);

  const abrir = () => {
    setActivo(Math.max(0, permitidos.indexOf(modelo)));
    setAbierto(true);
  };
  const cerrar = (devolverFoco = true) => {
    setAbierto(false);
    if (devolverFoco) boton.current?.focus();
  };
  const elegir = (m: IdModelo) => {
    alElegir(m);
    cerrar();
  };
  const teclas = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      cerrar();
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const n = permitidos.length;
      setActivo((i) => (i + (e.key === "ArrowDown" ? 1 : n - 1)) % n);
    } else if (e.key === "Tab") cerrar(false);
  };

  return (
    <div ref={raiz} className="pc-modelo" data-hacia={hacia}>
      <button
        ref={boton}
        type="button"
        className="pc-modelo__boton"
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-controls={abierto ? id : undefined}
        aria-label={`Modelo: ${info.nombre}`}
        data-abierto={abierto ? "" : undefined}
        onClick={() => (abierto ? cerrar() : abrir())}
        onKeyDown={(e) => {
          if ((e.key === "ArrowDown" || e.key === "ArrowUp") && !abierto) {
            e.preventDefault();
            abrir();
          }
        }}
      >
        <span className="pc-modelo__nombre">{info.nombre}</span>
        <span className="pc-modelo__corto">{info.corto}</span>
        <Icono nombre="chevron" tam={14} trazo={2} />
      </button>
      {abierto ? (
        <div id={id} className="pc-modelo__menu" role="menu" aria-label="Modelos" onKeyDown={teclas}>
          {permitidos.map((m, i) => {
            const x = MODELOS[m];
            return (
              <button
                key={m}
                ref={(el) => {
                  filas.current[i] = el;
                }}
                type="button"
                role="menuitemradio"
                aria-checked={m === modelo}
                tabIndex={i === activo ? 0 : -1}
                className="pc-modelo__fila"
                onPointerEnter={() => setActivo(i)}
                onClick={() => elegir(m)}
              >
                <span className="pc-modelo__check" aria-hidden="true">
                  {m === modelo ? <Icono nombre="check" tam={16} trazo={2} /> : null}
                </span>
                <span className="pc-modelo__textos">
                  <span className="pc-modelo__para">{x.detalle}</span>
                  <span className="pc-modelo__cual">{x.nombre}</span>
                </span>
                {x.aviso ? <span className="pc-modelo__aviso">{x.aviso}</span> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
