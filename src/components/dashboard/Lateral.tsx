"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { Icono } from "@/components/base/Iconos";
import { Insignia } from "@/components/base/Insignia";
import { PuntoEstado } from "@/components/base/PuntoEstado";
import { Accionable, MarcaAgente, PilaAgentes } from "./Piezas";
import type { ElementoNav, IdVista, NovedadLateral, SubElementoNav } from "./tipos";

/**
 * El menú lateral: íconos de línea y nombres; la sección activa con fondo
 * suave y una barrita a la izquierda. Los grupos (Chat, Agentes, Ajustes)
 * se abren con su › y adentro llevan a cada agente, cada chat en grupo o
 * cada ajuste. En tableta (o encogido) queda solo el riel de íconos; en
 * celular vive dentro del cajón. Al pie: Novedades, el uso del plan y la
 * versión.
 */
export function Lateral({ nav, activa, pie }: { nav: ElementoNav[]; activa: IdVista; pie?: ReactNode }) {
  return (
    <div className="pnl-lateral__contenido">
      <nav aria-label="Secciones de Atendel">
        <ul className="pnl-nav">
          {nav.map((n) => (
            <Grupo key={n.id} n={n} actual={n.id === activa} />
          ))}
        </ul>
      </nav>
      {pie ? <div className="pnl-lateral__pie">{pie}</div> : null}
    </div>
  );
}

function Grupo({ n, actual }: { n: ElementoNav; actual: boolean }) {
  const id = useId().replace(/:/g, "");
  const hijos = n.hijos ?? [];
  const conHijos = hijos.length > 0;
  const [abierto, setAbierto] = useState(actual);
  // Al llegar a una sección, su grupo se abre (y se queda como la persona lo deje)
  useEffect(() => {
    if (actual) setAbierto(true);
  }, [actual]);

  if (n.pronto) {
    return (
      <li>
        <span className="pnl-nav__elemento pnl-nav__elemento--pronto" aria-disabled="true">
          <Icono nombre={n.icono} tam={20} className="pnl-nav__icono" />
          <span className="pnl-nav__texto">{n.etiqueta}</span>
          <Insignia tono="pronto" etiqueta="Pronto: todavía no está disponible">
            Pronto
          </Insignia>
          <span className="pnl-nav__globo" aria-hidden="true">
            {n.etiqueta} (pronto)
          </span>
        </span>
      </li>
    );
  }

  return (
    <li className={conHijos ? "pnl-nav__grupo--con-hijos" : undefined}>
      <div className="pnl-nav__fila">
        <Accionable
          accion={n}
          className="pnl-nav__elemento"
          actual={actual}
          etiqueta={n.contador ? `${n.etiqueta}: ${n.etiquetaContador ?? n.contador}` : undefined}
        >
          <Icono nombre={n.icono} tam={20} className="pnl-nav__icono" />
          <span className="pnl-nav__texto">{n.etiqueta}</span>
          {n.contador ? <Insignia contador={n.contador} solida={actual} oculta /> : null}
          <span className="pnl-nav__globo" aria-hidden="true">
            {n.etiqueta}
          </span>
        </Accionable>
        {conHijos ? (
          <button
            type="button"
            className="pnl-nav__abrir"
            aria-expanded={abierto}
            aria-controls={`${id}-hijos`}
            aria-label={abierto ? `Cerrar ${n.etiqueta}` : `Abrir ${n.etiqueta}`}
            onClick={() => setAbierto((v) => !v)}
          >
            <Icono nombre="chevron-derecha" tam={16} />
          </button>
        ) : null}
      </div>
      {conHijos ? (
        <ul id={`${id}-hijos`} className="pnl-nav__hijos" hidden={!abierto}>
          {hijos.map((h) => (
            <li key={h.id}>
              <Hijo h={h} />
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function Hijo({ h }: { h: SubElementoNav }) {
  if (h.pronto) {
    return (
      <span className="pnl-nav__hijo pnl-nav__elemento--pronto" aria-disabled="true">
        {h.icono ? <Icono nombre={h.icono} tam={16} /> : null}
        <span className="pnl-nav__texto">{h.etiqueta}</span>
        <Insignia tono="pronto">Pronto</Insignia>
      </span>
    );
  }
  const lectura = [h.etiqueta, h.estado?.etiqueta ?? h.detalle, h.contador ? `${h.contador} sin leer` : null].filter(Boolean).join(", ");
  return (
    <Accionable accion={h} className={`pnl-nav__hijo${h.bloqueado ? " pnl-nav__hijo--bloqueado" : ""}`} actual={h.actual} etiqueta={lectura}>
      {h.agente ? <MarcaAgente id={h.agente} tam={20} /> : h.agentes ? <PilaAgentes ids={h.agentes} tam={20} /> : h.icono ? <Icono nombre={h.icono} tam={16} /> : null}
      <span className="pnl-nav__texto">{h.etiqueta}</span>
      {h.contador ? <Insignia contador={h.contador} solida oculta /> : null}
      {h.bloqueado ? (
        <Icono nombre="candado" tam={16} />
      ) : h.estado ? (
        <PuntoEstado tono={h.estado.tono} etiqueta={h.estado.etiqueta} pulso={h.estado.pulso} />
      ) : h.detalle ? (
        <span className="pnl-nav__detalle">{h.detalle}</span>
      ) : null}
    </Accionable>
  );
}

/** "Novedades" al pie del menú: tres filas que llevan a lo nuevo, y la versión. */
export function Novedades({ novedades, version }: { novedades: NovedadLateral[]; version?: string }) {
  const id = useId().replace(/:/g, "");
  if (!novedades.length) return null;
  return (
    <>
      <section className="pnl-novedades" aria-labelledby={`${id}-nov`}>
        <h2 id={`${id}-nov`} className="pnl-novedades__titulo">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path d="M12 3.5 21 19 3 19Z" fill="none" stroke="var(--c-marca)" strokeWidth="1.75" strokeLinejoin="round" />
          </svg>
          Novedades
        </h2>
        <ul className="pnl-novedades__lista">
          {novedades.map((n) => (
            <li key={n.id}>
              <Accionable accion={n} className="pnl-novedad">
                <span>{n.titulo}</span>
                <span className="pnl-novedad__flecha" aria-hidden="true">
                  <Icono nombre="chevron-derecha" tam={16} />
                </span>
              </Accionable>
            </li>
          ))}
        </ul>
      </section>
      {version ? <p className="pnl-version">Atendel · versión {version}</p> : null}
    </>
  );
}
