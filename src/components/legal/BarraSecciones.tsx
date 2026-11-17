"use client";

import { useEffect, useState } from "react";

/**
 * Índice de /privacidad: en compu va a un lado, fijo, y marca la sección
 * en la que vas; en celular es un "Contenido" que se abre arriba del texto.
 */
export function IndiceSecciones({ secciones }: { secciones: { id: string; titulo: string }[] }) {
  const [actual, setActual] = useState(0);

  useEffect(() => {
    const titulos = secciones.map((s) => document.getElementById(s.id)).filter((e): e is HTMLElement => Boolean(e));
    const revisar = () => {
      // La sección actual: la última cuyo título ya pasó el primer tercio de la pantalla
      const linea = window.innerHeight * 0.3;
      let i = 0;
      titulos.forEach((t, k) => {
        if (t.getBoundingClientRect().top <= linea) i = k;
      });
      setActual(i);
    };
    revisar();
    window.addEventListener("scroll", revisar, { passive: true });
    return () => window.removeEventListener("scroll", revisar);
  }, [secciones]);

  const titulo = (t: string) => t.replace(/^\d+\.\s*/, "");
  const lista = (
    <ol>
      {secciones.map((s, i) => (
        <li key={s.id}>
          <a href={`#${s.id}`} aria-current={i === actual ? "location" : undefined}>
            {titulo(s.titulo)}
          </a>
        </li>
      ))}
    </ol>
  );
  return (
    <>
      <nav className="legal__indice" aria-label="Contenido">
        <p className="legal__indice-titulo">Contenido</p>
        {lista}
      </nav>
      <details className="legal__indice-movil">
        <summary>Contenido</summary>
        <nav aria-label="Contenido">{lista}</nav>
      </details>
    </>
  );
}

/** "Descargar PDF": abre la impresión del navegador, que deja guardarlo como PDF (la hoja de impresión deja solo el texto). */
export function BotonPdf() {
  return (
    <button type="button" className="legal__pdf" onClick={() => window.print()}>
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M8 2.5v8M4.5 7.5 8 11l3.5-3.5M3 13.5h10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Descargar PDF
    </button>
  );
}
