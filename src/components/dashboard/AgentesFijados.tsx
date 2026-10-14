"use client";

import { Icono } from "@/components/base/Iconos";
import { PuntoEstado } from "@/components/base/PuntoEstado";
import { AGENTE_POR_ID } from "@/lib/agentes";
import { numero } from "./actividad";
import { MiniGrafica } from "./MiniGrafica";
import { CabezaSeccion, CaraAgente, EnlaceAccion } from "./piezas";
import type { Accion, AgenteFijado } from "./tipos";

/**
 * Los agentes "fijados" en una cuadrícula de dos columnas, como los
 * proyectos fijados de un perfil: nombre en azul (lleva a su página), su
 * estado, qué hace, y su cifra del mes con la mini gráfica de 30 días.
 * Toda la tarjeta se puede tocar (el enlace del nombre la cubre).
 */
export function AgentesFijados({ fijados, verEquipo }: { fijados: AgenteFijado[]; verEquipo?: Accion }) {
  return (
    <section aria-labelledby="fijados-titulo" className="tb-bloque">
      <CabezaSeccion id="fijados-titulo" titulo="Agentes fijados" accion={verEquipo} />
      <ul className="tb-fijados">
        {fijados.map((f) => {
          const a = AGENTE_POR_ID[f.id];
          return (
            <li key={f.id}>
              <article className="tb-fijado" data-bloqueado={f.bloqueado ? "true" : undefined}>
                <div className="tb-fijado__cabeza">
                  <CaraAgente id={f.id} tam={32} className={f.bloqueado ? "tb-cara--apagada" : ""} />
                  <div className="tb-fijado__nombres">
                    <h3 className="tb-fijado__nombre">
                      <EnlaceAccion accion={f.accion} className="tb-fijado__enlace" aria-label={`${a.nombre}: ${f.accion.etiqueta}`}>
                        {a.nombre}
                      </EnlaceAccion>
                    </h3>
                    <p className="tb-fijado__area">
                      {a.area} · {a.abarca}
                    </p>
                  </div>
                </div>
                <p className="tb-fijado__desc">{f.descripcion}</p>
                {f.cifra ? (
                  <div className="tb-fijado__pie">
                    <p className="tb-fijado__dato">
                      <span className="tb-fijado__cifra">{numero(f.cifra.valor)}</span>
                      <span className="tb-fijado__unidad">{f.cifra.etiqueta}</span>
                    </p>
                    {f.serie && f.serie.some((v) => v > 0) ? (
                      <MiniGrafica valores={f.serie} etiqueta={`${a.nombre}, ${f.cifra.etiqueta} por día`} className="tb-fijado__grafica" />
                    ) : null}
                  </div>
                ) : null}
                <div className="tb-fijado__extra">
                  {f.bloqueado ? (
                    <span className="tb-fijado__candado">
                      <Icono nombre="candado" tam={14} />
                      {f.bloqueado}
                    </span>
                  ) : (
                    <PuntoEstado tono={f.estado.tono} etiqueta={f.estado.texto} mostrarEtiqueta pulso={f.estado.pulso} />
                  )}
                  {f.secundaria ? <span className="tb-fijado__secundaria">{f.secundaria}</span> : null}
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
