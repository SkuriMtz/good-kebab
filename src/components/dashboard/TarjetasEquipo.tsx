"use client";

import { Boton } from "@/components/base/Boton";
import { Icono } from "@/components/base/Iconos";
import { Insignia } from "@/components/base/Insignia";
import { PuntoEstado, type TonoEstado } from "@/components/base/PuntoEstado";
import { AGENTE_POR_ID, type IdAgente } from "@/lib/agentes";
import { BotonAccion, CaraAgente } from "./piezas";
import type { Accion } from "./tipos";

export type Miembro = {
  id: IdAgente;
  estado: { tono: TonoEstado; texto: string; pulso?: boolean };
  /** ¿Su plan lo incluye? */
  incluido: boolean;
  /** ¿Está en el equipo (aparece en el chat)? */
  enEquipo: boolean;
  /** Lo que hizo últimamente (demostración) o sus números (panel). */
  logros?: string[];
  hablar?: Accion;
  /** Su plan no lo incluye: el plan que lo trae y a dónde ver precios. */
  bloqueado?: { texto: string; accion: Accion };
};

/**
 * El equipo en tarjetas grandes (vista Agentes): personaje, qué hace, lo
 * que lleva hecho y, si el plan deja elegir (Max), el interruptor "En tu
 * equipo". El plan no se cambia aquí: quien no lo tiene ve "Con Atendel One"
 * y un enlace a los precios.
 */
export function TarjetasEquipo({
  miembros,
  puedeElegir,
  guardando,
  alAlternar,
}: {
  miembros: Miembro[];
  puedeElegir: boolean;
  guardando?: IdAgente | null;
  alAlternar?: (id: IdAgente) => void;
}) {
  return (
    <ul className="tb-equipo">
      {miembros.map((m) => {
        const a = AGENTE_POR_ID[m.id];
        return (
          <li key={m.id}>
            <article className="tb-caja tb-miembro" data-bloqueado={m.bloqueado ? "true" : undefined} aria-labelledby={`miembro-${m.id}`}>
              <div className="tb-miembro__cabeza">
                <CaraAgente id={m.id} tam={64} className={m.bloqueado ? "tb-cara--apagada" : ""} />
                <div className="tb-miembro__nombres">
                  <h2 id={`miembro-${m.id}`} className="tb-miembro__nombre">
                    {a.nombre}
                  </h2>
                  <p className="tb-miembro__area">
                    {a.area} · {a.abarca}
                  </p>
                  {m.bloqueado ? (
                    <span className="tb-miembro__candado">
                      <Icono nombre="candado" tam={14} />
                      {m.bloqueado.texto}
                    </span>
                  ) : (
                    <PuntoEstado tono={m.estado.tono} etiqueta={m.estado.texto} mostrarEtiqueta pulso={m.estado.pulso} />
                  )}
                </div>
              </div>

              <p className="tb-miembro__lema">{a.lema}</p>

              <ul className="tb-miembro__capacidades" aria-label={`Lo que hace ${a.nombre}`}>
                {a.capacidades.map((c) => (
                  <li key={c}>
                    <Icono nombre="check" tam={14} />
                    {c}
                  </li>
                ))}
              </ul>

              {m.logros?.length ? (
                <div className="tb-miembro__logros">
                  <p className="tb-miembro__subtitulo">Últimamente</p>
                  <ul>
                    {m.logros.map((l) => (
                      <li key={l}>{l}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="tb-miembro__pie">
                {m.bloqueado ? (
                  <BotonAccion accion={m.bloqueado.accion} variante="sutil" />
                ) : puedeElegir ? (
                  <Boton
                    variante={m.enEquipo ? "sutil" : "fantasma"}
                    tam="compacto"
                    aria-pressed={m.enEquipo}
                    cargando={guardando === m.id}
                    disabled={Boolean(guardando) && guardando !== m.id}
                    icono={<Icono nombre={m.enEquipo ? "check" : "mas"} />}
                    onClick={() => alAlternar?.(m.id)}
                  >
                    {m.enEquipo ? "En tu equipo" : "Agregar al equipo"}
                  </Boton>
                ) : (
                  <Insignia tono="exito" conPunto>
                    En tu equipo
                  </Insignia>
                )}
                {m.enEquipo && m.hablar ? <BotonAccion accion={m.hablar} variante="fantasma" className="tb-miembro__hablar" /> : null}
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
