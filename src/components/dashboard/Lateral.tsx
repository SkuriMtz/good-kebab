"use client";

import { useId, type ReactNode } from "react";
import { AGENTE_POR_ID } from "@/lib/agentes";
import { Icono } from "@/components/base/Iconos";
import { Insignia } from "@/components/base/Insignia";
import { PuntoEstado } from "@/components/base/PuntoEstado";
import { Cara, Caras } from "./Caras";
import { Destinable } from "./Navegacion";
import type { AgenteLateral, ElementoNav, GrupoLateral, IdSeccion } from "./tipos";

/**
 * El menú lateral (y el contenido del cajón en celular): las secciones, tus
 * agentes con su estado y tus grupos. Lo que todavía no existe lleva la
 * insignia "Pronto" y no se puede tocar. La sección en la que estás tiene un
 * relleno sutil (no una raya de color).
 */
export function Lateral({
  nav,
  seccion,
  agentes,
  grupos,
  vacioGrupos,
  alIr,
  pie,
}: {
  nav: ElementoNav[];
  seccion: IdSeccion;
  agentes: AgenteLateral[];
  grupos: GrupoLateral[];
  /** Qué decir si todavía no hay grupos. */
  vacioGrupos?: ReactNode;
  /** Antes de navegar (en el cajón: cerrarlo). */
  alIr?: () => void;
  pie?: ReactNode;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <div className="dash-lateral__contenido">
      <nav aria-label="Secciones">
        <ul className="dash-nav">
          {nav.map((n) => {
            const actual = n.id === seccion;
            if (n.pronto || !n.destino) {
              return (
                <li key={n.id}>
                  <span className="dash-nav__enlace" aria-disabled="true">
                    <Icono nombre={n.icono} tam={16} />
                    <span className="dash-nav__texto">{n.etiqueta}</span>
                    <Insignia tono="pronto" etiqueta={`${n.etiqueta}: pronto`}>
                      Pronto
                    </Insignia>
                  </span>
                </li>
              );
            }
            return (
              <li key={n.id}>
                <Destinable destino={n.destino} className="dash-nav__enlace" aria-current={actual ? "page" : undefined} alIr={alIr}>
                  <Icono nombre={n.icono} tam={16} />
                  <span className="dash-nav__texto">{n.etiqueta}</span>
                  {n.contador ? <Insignia contador={n.contador} etiqueta={n.etiquetaContador} /> : null}
                </Destinable>
              </li>
            );
          })}
        </ul>
      </nav>

      <section aria-labelledby={`${id}-agentes`} className="dash-lateral__seccion">
        <h2 id={`${id}-agentes`} className="dash-lateral__titulo">
          Tus agentes
        </h2>
        <ul className="dash-nav">
          {agentes.map((a) => {
            const info = AGENTE_POR_ID[a.id];
            return (
              <li key={a.id}>
                <Destinable
                  destino={a.destino}
                  className={`dash-agente${a.bloqueado ? " dash-agente--bloqueado" : ""}`}
                  alIr={alIr}
                  aria-label={`${info.nombre}, ${info.area}: ${a.bloqueado ?? a.estado}`}
                >
                  <Cara agente={a.id} />
                  <span className="dash-agente__texto">
                    <span className="dash-agente__nombre">
                      {info.nombre}
                      <span className="dash-agente__area">{info.area}</span>
                    </span>
                    {a.bloqueado ? (
                      <span className="dash-agente__estado">
                        <Icono nombre="candado" tam={12} />
                        {a.bloqueado}
                      </span>
                    ) : (
                      <PuntoEstado tono={a.tono} etiqueta={a.estado} mostrarEtiqueta pulso={a.pulso} className="dash-agente__estado" />
                    )}
                  </span>
                </Destinable>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby={`${id}-grupos`} className="dash-lateral__seccion">
        <h2 id={`${id}-grupos`} className="dash-lateral__titulo">
          Grupos
        </h2>
        {grupos.length ? (
          <ul className="dash-nav">
            {grupos.map((g) => (
              <li key={g.id}>
                <Destinable destino={g.destino} className="dash-nav__enlace dash-grupo" alIr={alIr}>
                  <Caras agentes={g.agentes} />
                  <span className="dash-nav__texto">{g.nombre}</span>
                  {g.sinLeer ? <Insignia contador={g.sinLeer} etiqueta={`${g.sinLeer} sin leer`} /> : null}
                </Destinable>
              </li>
            ))}
          </ul>
        ) : (
          <p className="dash-lateral__vacio">{vacioGrupos ?? "Todavía no tienes grupos."}</p>
        )}
      </section>

      {pie ? <div className="dash-lateral__pie">{pie}</div> : null}
    </div>
  );
}
