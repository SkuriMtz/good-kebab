"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

export type ElementoIndice = {
  /** "#lola" (sección de esta página) o "/agentes/lola" (otra página). */
  href: string;
  etiqueta: string;
  /** Texto chico bajo la etiqueta (el área del agente). */
  detalle?: string;
  /** Algo pequeño antes del texto: el personaje del agente. */
  adorno?: ReactNode;
  /** Es la página en la que estás. */
  actual?: boolean;
  /** Secciones de esa página (solo se muestran bajo la página actual). */
  hijos?: ElementoIndice[];
};


/**
 * Índice lateral al estilo de la documentación: fijo a la izquierda mientras
 * bajas, con la sección en la que estás resaltada (relleno sutil y una línea
 * azul a la izquierda). En celular se vuelve una fila de píldoras fija bajo
 * la barra, que se desliza de lado y centra la sección activa.
 */
export function IndiceLateral({ titulo, elementos }: { titulo: string; elementos: ElementoIndice[] }) {
  const [activa, setActiva] = useState<string | null>(null);
  const filaRef = useRef<HTMLUListElement>(null);

  // Las secciones de esta página que se vigilan (en orden)
  const anclas = elementos.flatMap((e) => [e, ...(e.actual ? e.hijos ?? [] : [])]).filter((e) => e.href.startsWith("#"));
  const claves = anclas.map((e) => e.href).join(",");

  useEffect(() => {
    const ids = claves ? claves.split(",").map((h) => h.slice(1)) : [];
    if (!ids.length) return;
    let pendiente = 0;
    const medir = () => {
      pendiente = 0;
      let actual: string | null = null;
      // Una sección está "activa" cuando su título ya pasó el primer tercio de la pantalla
      const linea = Math.max(200, window.innerHeight * 0.3);
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= linea) actual = `#${id}`;
      }
      // Al llegar al final de la página, la última sección es la activa
      const final = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (final) actual = `#${ids[ids.length - 1]}`;
      setActiva(actual);
    };
    const alBajar = () => {
      if (!pendiente) pendiente = requestAnimationFrame(medir);
    };
    medir();
    window.addEventListener("scroll", alBajar, { passive: true });
    window.addEventListener("resize", alBajar, { passive: true });
    return () => {
      cancelAnimationFrame(pendiente);
      window.removeEventListener("scroll", alBajar);
      window.removeEventListener("resize", alBajar);
    };
  }, [claves]);

  // En celular, la píldora activa se centra en la fila
  useEffect(() => {
    const fila = filaRef.current;
    if (!fila || fila.scrollWidth <= fila.clientWidth) return;
    const el = fila.querySelector<HTMLElement>('[data-activo="true"]');
    if (!el) return;
    const destino = el.offsetLeft + el.offsetWidth / 2 - fila.clientWidth / 2;
    fila.scrollTo({ left: Math.max(0, destino) });
  }, [activa]);

  const enlace = (e: ElementoIndice, hijo = false) => {
    const esAncla = e.href.startsWith("#");
    // La página actual se marca solo si ninguna de sus secciones está activa
    const activo = esAncla ? activa === e.href : Boolean(e.actual) && !(e.hijos ?? []).some((h) => h.href === activa);
    const contenido = (
      <>
        {e.adorno ? <span className="indice__adorno">{e.adorno}</span> : null}
        <span className="indice__texto">
          <span className="indice__etiqueta">{e.etiqueta}</span>
          {e.detalle ? <span className="indice__detalle">{e.detalle}</span> : null}
        </span>
      </>
    );
    const props = {
      className: `indice__enlace${hijo ? " indice__enlace--hijo" : ""}`,
      "data-activo": activo ? "true" : undefined,
      "data-pagina": !esAncla && e.actual ? "true" : undefined,
      "aria-current": activo ? (esAncla ? ("location" as const) : ("page" as const)) : undefined,
    };
    return esAncla ? (
      <a href={e.href} {...props}>
        {contenido}
      </a>
    ) : (
      <Link href={e.href} {...props}>
        {contenido}
      </Link>
    );
  };

  return (
    <nav className="indice" aria-label={titulo}>
      <p className="indice__titulo etiqueta etiqueta--tenue">{titulo}</p>
      <ul className="indice__lista" ref={filaRef}>
        {elementos.map((e) => (
          <li key={e.href} className="indice__elemento">
            {enlace(e)}
            {e.actual && e.hijos?.length ? (
              <ul className="indice__hijos">
                {e.hijos.map((h) => (
                  <li key={h.href}>{enlace(h, true)}</li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </nav>
  );
}
