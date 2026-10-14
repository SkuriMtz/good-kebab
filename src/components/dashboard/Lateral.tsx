"use client";

import Link from "next/link";
import { useId } from "react";
import { Icono, type NombreIcono } from "@/components/base/Iconos";
import { Insignia } from "@/components/base/Insignia";
import { PuntoEstado, type TonoEstado } from "@/components/base/PuntoEstado";
import { AGENTE_POR_ID, type IdAgente } from "@/lib/agentes";
import { CaraAgente, CarasAgentes, EnlaceAccion } from "./piezas";
import type { Accion } from "./tipos";

export type ElementoNav = {
  id: string;
  etiqueta: string;
  icono: NombreIcono;
  href?: string;
  contador?: number;
  /** Todavía no existe: se ve, pero no se puede elegir. */
  pronto?: boolean;
};

export type AgenteLateral = {
  id: IdAgente;
  tono: TonoEstado;
  texto: string;
  pulso?: boolean;
  bloqueado?: boolean;
  accion?: Accion;
};

export type GrupoLateral = { id: string; nombre: string; agentes: IdAgente[]; sinLeer?: number; accion: Accion };

/**
 * El menú lateral (y su copia en el cajón del celular): las secciones, tus
 * agentes con su estado y tus grupos. La sección activa lleva relleno
 * sutil y una marquita azul a la izquierda (indica dónde estás).
 */
export function Lateral({
  nav,
  activo,
  alNavegar,
  agentes,
  grupos,
  grupoNuevo,
  alElegir,
}: {
  nav: ElementoNav[];
  activo: string;
  alNavegar?: (id: string) => void;
  agentes: AgenteLateral[];
  grupos: GrupoLateral[];
  /** Crear grupo (o por qué todavía no se puede). */
  grupoNuevo?: { accion?: Accion; nota?: string };
  /** Se llama después de elegir algo (el cajón se cierra). */
  alElegir?: () => void;
}) {
  const base = useId().replace(/:/g, "");
  return (
    <div className="tb-lateral__contenido">
      <nav aria-label="Secciones">
        <ul className="tb-nav">
          {nav.map((n) => {
            const actual = n.id === activo;
            const dentro = (
              <>
                <Icono nombre={n.icono} tam={16} />
                <span className="tb-nav__texto">{n.etiqueta}</span>
                {n.pronto ? <Insignia tono="pronto">Pronto</Insignia> : null}
                {!n.pronto && n.contador ? <Insignia contador={n.contador} etiqueta={`${n.contador} sin leer`} /> : null}
              </>
            );
            return (
              <li key={n.id}>
                {n.pronto ? (
                  <span className="tb-nav__elemento" aria-disabled="true">
                    {dentro}
                  </span>
                ) : n.href ? (
                  <Link href={n.href} className="tb-nav__elemento" aria-current={actual ? "page" : undefined} onClick={alElegir}>
                    {dentro}
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="tb-nav__elemento"
                    aria-current={actual ? "page" : undefined}
                    onClick={() => {
                      alNavegar?.(n.id);
                      alElegir?.();
                    }}
                  >
                    {dentro}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <section aria-labelledby={`${base}-agentes`} className="tb-lateral__grupo">
        <h2 id={`${base}-agentes`} className="tb-lateral__titulo">
          Tus agentes
        </h2>
        <ul className="tb-agentes">
          {agentes.map((a) => {
            const info = AGENTE_POR_ID[a.id];
            const dentro = (
              <>
                <CaraAgente id={a.id} tam={28} className={a.bloqueado ? "tb-cara--apagada" : ""} />
                <span className="tb-agentes__texto">
                  <span className="tb-agentes__nombre">
                    {info.nombre}
                    <span className="tb-agentes__area">{info.area}</span>
                  </span>
                  <PuntoEstado tono={a.tono} etiqueta={a.texto} mostrarEtiqueta pulso={a.pulso} />
                </span>
              </>
            );
            return (
              <li key={a.id}>
                {a.accion ? (
                  <EnlaceAccion accion={a.accion} alPulsar={alElegir} className="tb-agentes__fila">
                    {dentro}
                  </EnlaceAccion>
                ) : (
                  <span className="tb-agentes__fila">{dentro}</span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby={`${base}-grupos`} className="tb-lateral__grupo">
        <h2 id={`${base}-grupos`} className="tb-lateral__titulo">
          Grupos
        </h2>
        {grupos.length ? (
          <ul className="tb-grupos">
            {grupos.map((g) => (
              <li key={g.id}>
                <EnlaceAccion accion={g.accion} alPulsar={alElegir} className="tb-grupos__fila">
                  <CarasAgentes ids={g.agentes} tam={20} />
                  <span className="tb-grupos__nombre">{g.nombre}</span>
                  {g.sinLeer ? <Insignia tono="azul" contador={g.sinLeer} etiqueta={`${g.sinLeer} sin leer`} /> : null}
                </EnlaceAccion>
              </li>
            ))}
          </ul>
        ) : (
          <p className="tb-lateral__nota">Todavía no tienes grupos.</p>
        )}
        {grupoNuevo?.accion ? (
          <EnlaceAccion accion={grupoNuevo.accion} alPulsar={alElegir} className="tb-lateral__nuevo">
            <Icono nombre="mas" tam={16} />
            {grupoNuevo.accion.etiqueta}
          </EnlaceAccion>
        ) : grupoNuevo?.nota ? (
          <p className="tb-lateral__nota">
            <Icono nombre="candado" tam={14} />
            {grupoNuevo.nota}
          </p>
        ) : null}
      </section>
    </div>
  );
}
