"use client";

import { useRef, useState, type PointerEvent } from "react";
import { numero } from "./actividad";

/**
 * Mini gráfica (sparkline) de una métrica: la línea en gris y los últimos
 * 7 días en azul, terminando en un punto (hoy). Al pasar el cursor, una
 * línea vertical sigue al puntero y dice el valor de ese día.
 * El valor siempre se lee también fuera de la gráfica (la cifra grande y
 * el `aria-label`): la gráfica acompaña, no esconde nada.
 */
export function MiniGrafica({
  valores,
  etiqueta,
  dias,
  alto = 32,
  className = "",
}: {
  valores: number[];
  /** Qué se ve, para lectores de pantalla ("Tareas de Lola, últimos 30 días"). */
  etiqueta: string;
  /** Nombre de cada día para la lectura al pasar el cursor (mismo largo que `valores`). */
  dias?: string[];
  alto?: number;
  className?: string;
}) {
  const caja = useRef<HTMLDivElement>(null);
  const [punto, setPunto] = useState<number | null>(null);

  const n = valores.length;
  const ancho = 100;
  const max = Math.max(1, ...valores);
  const margen = 3; // que la línea y el punto no se corten arriba y abajo
  const x = (i: number) => (n <= 1 ? ancho : (i / (n - 1)) * ancho);
  const y = (v: number) => alto - margen - (v / max) * (alto - margen * 2);
  const linea = valores.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(2)} ${y(v).toFixed(2)}`).join(" ");
  const corte = Math.max(0, n - 7);
  const reciente = valores
    .slice(corte)
    .map((v, i) => `${i ? "L" : "M"}${x(corte + i).toFixed(2)} ${y(v).toFixed(2)}`)
    .join(" ");
  const minimo = Math.min(...valores);
  const lectura = n ? `${etiqueta}: de ${numero(minimo)} a ${numero(Math.max(...valores))} por día; hoy ${numero(valores[n - 1])}.` : etiqueta;

  const mover = (e: PointerEvent<HTMLDivElement>) => {
    const r = caja.current?.getBoundingClientRect();
    if (!r || n < 2) return;
    const i = Math.round(((e.clientX - r.left) / r.width) * (n - 1));
    setPunto(Math.min(n - 1, Math.max(0, i)));
  };

  const izquierda = punto === null ? 0 : (x(punto) / ancho) * 100;

  return (
    <div
      ref={caja}
      className={`tb-mini ${className}`}
      style={{ height: alto }}
      role="img"
      aria-label={lectura}
      onPointerMove={mover}
      onPointerLeave={() => setPunto(null)}
    >
      <svg viewBox={`0 0 ${ancho} ${alto}`} preserveAspectRatio="none" aria-hidden="true" className="tb-mini__svg">
        <path d={linea} className="tb-mini__linea" vectorEffect="non-scaling-stroke" />
        <path d={reciente} className="tb-mini__reciente" vectorEffect="non-scaling-stroke" />
      </svg>
      {/* El punto de hoy (fuera del SVG para que no se deforme) */}
      {n ? <span className="tb-mini__hoy" style={{ top: y(valores[n - 1]) }} aria-hidden="true" /> : null}
      <span className="tb-mini__guia" data-visible={punto !== null || undefined} style={{ transform: `translateX(${izquierda}%)` }} aria-hidden="true">
        <span className="tb-mini__valor cifras" data-lado={izquierda < 25 ? "inicio" : izquierda > 75 ? "fin" : undefined}>
          {punto !== null ? (
            <>
              <strong>{numero(valores[punto])}</strong>
              {dias?.[punto] ? ` · ${dias[punto]}` : null}
            </>
          ) : null}
        </span>
      </span>
    </div>
  );
}
