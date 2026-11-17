"use client";

import { useEffect, useRef, useState } from "react";

/**
 * La barra fija bajo el encabezado de /privacidad: dice en qué sección vas
 * ("01  Identidad y domicilio…") y, al abrirla, deja saltar a cualquiera.
 */
export function BarraSecciones({ secciones }: { secciones: { id: string; titulo: string }[] }) {
  const [actual, setActual] = useState(0);
  const [abierta, setAbierta] = useState(false);
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const titulos = secciones.map((s) => document.getElementById(s.id)).filter((e): e is HTMLElement => Boolean(e));
    const revisar = () => {
      // La sección actual: la última cuyo título ya pasó por debajo de la barra
      const linea = Math.max(140, window.innerHeight * 0.3);
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

  useEffect(() => {
    if (!abierta) return;
    const cerrar = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !caja.current?.contains(e.target as Node)) setAbierta(false);
    };
    document.addEventListener("mousedown", cerrar);
    document.addEventListener("keydown", cerrar);
    return () => {
      document.removeEventListener("mousedown", cerrar);
      document.removeEventListener("keydown", cerrar);
    };
  }, [abierta]);

  const num = (i: number) => String(i + 1).padStart(2, "0");
  const titulo = (t: string) => t.replace(/^\d+\.\s*/, "");
  const s = secciones[actual];
  if (!s) return null;
  return (
    <div className="legal__secciones" ref={caja}>
      <button type="button" className="legal__secciones-boton" aria-expanded={abierta} aria-controls="legal-secciones-lista" onClick={() => setAbierta((a) => !a)}>
        <span className="legal__num">{num(actual)}</span>
        <span className="legal__secciones-actual">{titulo(s.titulo)}</span>
        <svg className="legal__flecha" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {abierta ? (
        <ol id="legal-secciones-lista" className="legal__secciones-lista">
          {secciones.map((x, i) => (
            <li key={x.id}>
              <a href={`#${x.id}`} aria-current={i === actual ? "true" : undefined} onClick={() => setAbierta(false)}>
                <span className="legal__num">{num(i)}</span>
                {titulo(x.titulo)}
              </a>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

/** "Descargar PDF": abre la impresión del navegador, que deja guardarlo como PDF (la hoja de impresión quita barras y pie). */
export function BotonPdf() {
  return (
    <button type="button" className="legal__pdf" onClick={() => window.print()}>
      Descargar PDF
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M8 2.5v8M4.5 7.5 8 11l3.5-3.5M3 13.5h10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
