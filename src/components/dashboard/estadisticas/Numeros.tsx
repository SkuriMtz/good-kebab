"use client";

import type { CSSProperties } from "react";
import { cambio, METRICAS, usoDelPlan, type DatosEstadisticas, type IdMetrica } from "@/lib/estadisticas";
import { Cifra, Tendencia } from "../Piezas";
import { cifra, cuenta } from "./formato";

/*
 * La fila de números de arriba: cada uno con su cambio contra el periodo
 * anterior (Cifra y Tendencia de Piezas.tsx). Al picar uno, la gráfica
 * cambia a esa métrica (aria-pressed), como en un panel de analítica.
 * El uso del plan se cuenta por mes: su % es de este mes y su cambio es
 * contra el mes pasado a la misma fecha, en cualquier periodo.
 */

export function Numeros({
  datos,
  metrica,
  onElegir,
  contra,
  elegibles = true,
}: {
  datos: DatosEstadisticas;
  metrica: IdMetrica;
  onElegir: (m: IdMetrica) => void;
  /** "vs. los 30 días antes". */
  contra: string;
  /** Sin gráfica (estado vacío), los números no se eligen: solo se leen. */
  elegibles?: boolean;
}) {
  const { plan } = datos;
  const uso = usoDelPlan(datos);
  const usoPct = uso.valor;

  return (
    <div className="est-numeros" role="group" aria-label={elegibles ? "Elige qué ver en la gráfica" : "Resumen del periodo"}>
      {METRICAS.map((m, i) => {
        const valor = datos.totales[m.id];
        const esUso = m.id === "uso";
        const detalle = esUso
          ? `${cifra(plan.usados)} de ${cifra(plan.limite)} mensajes usados este mes.${uso.delta === null ? "" : " El cambio es contra el mes pasado a la misma fecha."}`
          : valor === null
            ? "Sin datos todavía."
            : `${cuenta(valor, m.una, m.varias)}; el cambio es ${contra}.`;
        const contenido = (
          <>
            <span className="est-numero__etiqueta">
              {m.etiqueta}
              {esUso ? <span className="est-numero__cuando"> · este mes</span> : null}
            </span>
            <Cifra valor={esUso ? usoPct : valor} sufijo={esUso ? "%" : undefined} indice={i} className="est-numero__valor" />
            {esUso ? (
              <span className="est-numero__avance" aria-hidden="true">
                <span style={{ transform: `scaleX(${Math.min(1, (usoPct ?? 0) / 100)})` }} data-alto={(usoPct ?? 0) >= 80 || undefined} />
              </span>
            ) : null}
            <Tendencia delta={esUso ? uso.delta : cambio(valor, datos.totalesAnteriores[m.id])} />
            {esUso && uso.delta !== null ? <span className="sr-only">(el uso se compara contra el mes pasado a la misma fecha)</span> : null}
          </>
        );
        return elegibles ? (
          <button
            key={m.id}
            type="button"
            className="est-numero pnl-picable"
            aria-pressed={m.id === metrica}
            onClick={() => onElegir(m.id)}
            title={detalle}
            style={{ "--i": i } as CSSProperties}
          >
            {contenido}
          </button>
        ) : (
          <div key={m.id} className="est-numero" title={detalle}>
            {contenido}
          </div>
        );
      })}
    </div>
  );
}
