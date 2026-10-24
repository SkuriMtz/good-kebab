"use client";

import { useId, type ReactNode } from "react";
import { Icono } from "@/components/base/Iconos";
import { Insignia } from "@/components/base/Insignia";
import { AGENTE_POR_ID } from "@/lib/agentes";
import { nombresAgentes } from "./nombres";
import { Accionable, MarcaAgente, PilaAgentes } from "./Piezas";
import type { AgenteLateral, ElementoNav, GrupoLateral, IdVista } from "./tipos";

/**
 * El menú lateral: como la columna de repositorios del dashboard de GitHub,
 * pero con lo de Atendel. Arriba las secciones (la activa con relleno
 * sutil; lo que no existe todavía con "Pronto"), luego "Tus agentes" con su
 * personaje y lo que están haciendo, y "Grupos" con sus integrantes.
 * En celular vive dentro del cajón.
 */
export function Lateral({
  nav,
  activa,
  agentes,
  accionAgentes,
  grupos,
  accionGrupos,
  vacioGrupos,
  pie,
}: {
  nav: ElementoNav[];
  activa: IdVista;
  agentes: AgenteLateral[];
  /** "Ver todos" junto a "Tus agentes". */
  accionAgentes?: ReactNode;
  grupos: GrupoLateral[];
  /** El botón "Nuevo" junto a "Grupos". */
  accionGrupos?: ReactNode;
  vacioGrupos?: ReactNode;
  pie?: ReactNode;
}) {
  const base = useId().replace(/:/g, "");
  return (
    <div className="dash-lateral__contenido">
      <nav aria-label="Secciones de Atendel">
        <ul className="dash-nav">
          {nav.map((n) => {
            const actual = n.id === activa;
            if (n.pronto) {
              return (
                <li key={n.id}>
                  <span className="dash-nav__elemento" aria-disabled="true">
                    <Icono nombre={n.icono} tam={16} />
                    <span className="dash-nav__texto">{n.etiqueta}</span>
                    <Insignia tono="pronto" etiqueta="Pronto: todavía no está disponible">
                      Pronto
                    </Insignia>
                  </span>
                </li>
              );
            }
            return (
              <li key={n.id}>
                <Accionable accion={n} className="dash-nav__elemento" actual={actual}>
                  <Icono nombre={n.icono} tam={16} />
                  <span className="dash-nav__texto">{n.etiqueta}</span>
                  {n.contador ? <Insignia contador={n.contador} etiqueta={n.etiquetaContador} /> : null}
                </Accionable>
              </li>
            );
          })}
        </ul>
      </nav>

      <section aria-labelledby={`${base}-agentes`} className="dash-lateral__bloque">
        <div className="dash-lateral__cabeza">
          <h2 id={`${base}-agentes`} className="dash-lateral__titulo">
            Tus agentes
          </h2>
          {accionAgentes}
        </div>
        <ul className="dash-lista-lateral">
          {agentes.map((a) => {
            const info = AGENTE_POR_ID[a.id];
            return (
              <li key={a.id}>
                <Accionable
                  accion={a}
                  className={`dash-fila-lateral${a.bloqueado ? " dash-fila-lateral--bloqueada" : ""}`}
                  etiqueta={a.bloqueado ? `${info.nombre}, ${info.area}: ${a.bloqueado}` : undefined}
                >
                  <MarcaAgente id={a.id} tam={20} />
                  <span className="dash-fila-lateral__nombre">{info.nombre}</span>
                  <span className="dash-fila-lateral__area">{a.bloqueado ?? info.area}</span>
                  {a.bloqueado ? <Icono nombre="candado" tam={16} className="dash-fila-lateral__fin" /> : null}
                </Accionable>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby={`${base}-grupos`} className="dash-lateral__bloque">
        <div className="dash-lateral__cabeza">
          <h2 id={`${base}-grupos`} className="dash-lateral__titulo">
            Grupos
          </h2>
          {accionGrupos}
        </div>
        {grupos.length ? (
          <ul className="dash-lista-lateral">
            {grupos.map((g) => (
              <li key={g.id}>
                <Accionable accion={g} className="dash-fila-lateral dash-fila-lateral--grupo" etiqueta={`${g.nombre}: ${nombresAgentes(g.agentes)}${g.sinLeer ? `, ${g.sinLeer} sin leer` : ""}`}>
                  <PilaAgentes ids={g.agentes} tam={20} />
                  <span className="dash-fila-lateral__nombre">{g.nombre}</span>
                  {g.sinLeer ? <Insignia contador={g.sinLeer} solida etiqueta={`${g.sinLeer} sin leer`} className="dash-fila-lateral__fin" /> : null}
                </Accionable>
              </li>
            ))}
          </ul>
        ) : (
          vacioGrupos
        )}
      </section>

      {pie}
    </div>
  );
}
