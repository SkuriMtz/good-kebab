import type { CSSProperties } from "react";
import { Enlace } from "@/components/panel/Piezas";
import type { Dia } from "@/lib/estadisticas";
import { enlaceNegocio } from "@/lib/estadisticas-negocio";
import { cuenta, DIAS_CORTOS, DIAS_LARGOS, fechaConDia, hora, rangoHora } from "./formato";

/*
 * Mapa de calor: día de la semana × hora. Cada casilla lleva a la actividad
 * de esa hora (?vista=actividad&hora=). El tono va de 0 a 4 (un solo color,
 * con su escala "Menos … Más"), y cada casilla dice su número al pasar el
 * cursor. Para el teclado y el lector de pantalla, la rejilla se salta: abajo
 * van un resumen y los días y horas con más movimiento como enlaces.
 */

export type PropsCalor = {
  calor: number[][];
  diasTop: { dia: Dia; total: number }[];
  horasTop: { hora: number; total: number }[];
  /** Raíz de los enlaces ("/panel" o "/pruebalo"). */
  base: string;
};

/** Las horas que llevan etiqueta arriba. */
const MARCAS = [0, 6, 12, 18];

export function Calor({ calor, diasTop, horasTop, base }: PropsCalor) {
  const enlaceHora = (hora: number) => enlaceNegocio({ tipo: "hora", hora }, base);
  const enlaceDia = (dia: Dia) => enlaceNegocio({ tipo: "dia", dia }, base);
  const maximo = Math.max(1, ...calor.flat());
  const nivel = (v: number) => (v === 0 ? 0 : Math.min(4, Math.ceil((v / maximo) * 4)));
  const total = calor.flat().reduce((t, v) => t + v, 0);
  let pico = { d: 0, h: 0, v: 0 };
  calor.forEach((fila, d) => fila.forEach((v, h) => v > pico.v && (pico = { d, h, v })));

  return (
    <div className="neg-calor">
      <div className="neg-calor__rejilla" aria-hidden="true">
        <span />
        <div className="neg-calor__horas">
          {MARCAS.map((h) => (
            <span key={h} style={{ "--col": h } as CSSProperties}>
              {hora(h).replace(" a. m.", " a.m.").replace(" p. m.", " p.m.")}
            </span>
          ))}
        </div>
        {calor.map((fila, d) => (
          <div key={d} className="neg-calor__fila">
            <span className="neg-calor__dia">{DIAS_CORTOS[d]}</span>
            <div className="neg-calor__casillas">
              {fila.map((v, h) => (
                <Enlace
                  key={h}
                  href={enlaceHora(h)}
                  tabIndex={-1}
                  className="neg-calor__casilla"
                  data-nivel={nivel(v)}
                  data-tip={`${DIAS_CORTOS[d]} · ${rangoHora(h)}: ${v}`}
                >
                  {null}
                </Enlace>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="neg-calor__escala" aria-hidden="true">
        <span>Menos</span>
        {[0, 1, 2, 3, 4].map((n) => (
          <i key={n} data-nivel={n} />
        ))}
        <span>Más</span>
      </div>

      <p className="pc-oculto">
        {total
          ? `En el periodo hubo ${cuenta(total, "mensaje o correo", "mensajes y correos")}. Lo más movido: los ${DIAS_LARGOS[pico.d]} de ${rangoHora(pico.h)}, con ${pico.v}.`
          : "Todavía no hay movimiento en este periodo."}
      </p>

      {(diasTop.length > 0 || horasTop.length > 0) && (
        <div className="neg-calor__top">
          {horasTop.length > 0 && (
            <div>
              <h3 className="neg-mini">Las horas con más movimiento</h3>
              <ul className="neg-pastillas">
                {horasTop.map((h) => (
                  <li key={h.hora}>
                    <Enlace href={enlaceHora(h.hora)} className="neg-pastilla">
                      {rangoHora(h.hora)} <span className="neg-pastilla__num">{h.total}</span>
                    </Enlace>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {diasTop.length > 0 && (
            <div>
              <h3 className="neg-mini">Los días con más movimiento</h3>
              <ul className="neg-pastillas">
                {diasTop.map((d) => (
                  <li key={d.dia}>
                    <Enlace href={enlaceDia(d.dia)} className="neg-pastilla">
                      {fechaConDia(d.dia)} <span className="neg-pastilla__num">{d.total}</span>
                    </Enlace>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
