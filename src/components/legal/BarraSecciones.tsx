"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Marca } from "@/components/Logo";
import { useCambiarIdioma } from "@/i18n/Idioma";
import { IDIOMAS, NOMBRE_IDIOMA, t, type Idioma } from "@/i18n";
import { CENTRO_PRIVACIDAD, POLITICAS, type Politica } from "@/legal/politicas";

type Seccion = { id: string; titulo: string };

/** La sección en la que vas: la última cuyo título ya pasó el primer tercio de la pantalla. */
function useSeccionActual(secciones: Seccion[]) {
  const [actual, setActual] = useState(0);
  useEffect(() => {
    const titulos = secciones
      .map((s) => document.getElementById(s.id))
      .filter((e): e is HTMLElement => Boolean(e));
    const revisar = () => {
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
  return actual;
}

/** Cierra un menú al dar clic fuera o con Escape. */
function useCerrarFuera(abierto: boolean, cerrar: () => void) {
  const caja = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!abierto) return;
    const alEvento = (e: MouseEvent | KeyboardEvent) => {
      if (
        e instanceof KeyboardEvent
          ? e.key === "Escape"
          : !caja.current?.contains(e.target as Node)
      )
        cerrar();
    };
    document.addEventListener("mousedown", alEvento);
    document.addEventListener("keydown", alEvento);
    return () => {
      document.removeEventListener("mousedown", alEvento);
      document.removeEventListener("keydown", alEvento);
    };
  }, [abierto, cerrar]);
  return caja;
}

const Flecha = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    width="14"
    height="14"
    viewBox="0 0 16 16"
    aria-hidden="true"
  >
    <path
      d="M4 6l4 4 4-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Lo de arriba de las páginas legales (fijo al bajar):
 * - Izquierda: volver al inicio.
 * - Centro: logo y nombre de Atendel; al bajar, el nombre se va y queda el logo.
 * - Derecha: «Políticas» (cambiar entre Privacidad, Términos y Cookies) y Entrar.
 * - Debajo, una línea fina con la sección en la que vas («01  …»), que se abre.
 */
export function EncabezadoLegal({
  actual,
  secciones,
  idioma,
}: {
  actual: Politica;
  secciones: Seccion[];
  idioma: Idioma;
}) {
  const L = t(idioma).legal;
  const E = L.etiquetas;
  const [compacto, setCompacto] = useState(false);
  const [politicas, setPoliticas] = useState(false);
  const [lista, setLista] = useState(false);
  const enSeccion = useSeccionActual(secciones);
  const cajaPoliticas = useCerrarFuera(politicas, () => setPoliticas(false));
  const cajaLista = useCerrarFuera(lista, () => setLista(false));

  useEffect(() => {
    const revisar = () => setCompacto(window.scrollY > 24);
    revisar();
    window.addEventListener("scroll", revisar, { passive: true });
    return () => window.removeEventListener("scroll", revisar);
  }, []);

  const num = (i: number) => String(i + 1).padStart(2, "0");
  const titulo = (t: string) => t.replace(/^\d+\.\s*/, "");
  const s = secciones[enSeccion];

  return (
    <div
      className="legal__arriba"
      data-compacto={compacto ? "true" : undefined}
    >
      <header className="legal__barra">
        <div className="legal__izq">
          <Link href="/" className="legal__pildora">
            <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
              <path
                d="M13 8H3m4-4L3 8l4 4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="legal__solo-ancho">{E.inicio}</span>
          </Link>
        </div>

        <Link href="/" className="legal__logo" aria-label="Atendel, inicio">
          <Marca className="legal__logo-marca" />
          <span className="legal__logo-nombre" aria-hidden="true">
            Atendel
          </span>
        </Link>

        <nav className="legal__der" aria-label="Atendel">
          <div className="legal__politicas" ref={cajaPoliticas}>
            <button
              type="button"
              className="legal__pildora"
              aria-expanded={politicas}
              aria-controls="legal-politicas"
              onClick={() => setPoliticas((a) => !a)}
            >
              {E.politicas}
              <Flecha className="legal__flecha" />
            </button>
            {politicas ? (
              <ul id="legal-politicas" className="legal__menu">
                <li>
                  <Link href={CENTRO_PRIVACIDAD} onClick={() => setPoliticas(false)}>
                    {E.centro}
                  </Link>
                </li>
                {POLITICAS.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={p.href}
                      aria-current={p.id === actual ? "page" : undefined}
                      onClick={() => setPoliticas(false)}
                    >
                      {L.docs[p.id].nombre}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <Link href="/entrar" className="legal__pildora legal__pildora--azul">
            {E.entrar}
          </Link>
        </nav>
      </header>

      {s ? (
        <div className="legal__linea" ref={cajaLista}>
          <button
            type="button"
            className="legal__linea-boton"
            aria-expanded={lista}
            aria-controls="legal-secciones"
            onClick={() => setLista((a) => !a)}
          >
            <span className="legal__num">{num(enSeccion)}</span>
            <span className="legal__linea-actual">{titulo(s.titulo)}</span>
            <Flecha className="legal__flecha" />
          </button>
          {lista ? (
            <ol id="legal-secciones" className="legal__linea-lista">
              {secciones.map((x, i) => (
                <li key={x.id}>
                  <a
                    href={`#${x.id}`}
                    aria-current={i === enSeccion ? "location" : undefined}
                    onClick={() => setLista(false)}
                  >
                    <span className="legal__num">{num(i)}</span>
                    {titulo(x.titulo)}
                  </a>
                </li>
              ))}
            </ol>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** Índice a un lado (en compu) que marca la sección en la que vas. */
export function IndiceSecciones({
  secciones,
  titulo: tituloIndice,
}: {
  secciones: Seccion[];
  titulo: string;
}) {
  const actual = useSeccionActual(secciones);
  const titulo = (t: string) => t.replace(/^\d+\.\s*/, "");
  return (
    <nav className="legal__indice" aria-label={tituloIndice}>
      <p className="legal__indice-titulo">{tituloIndice}</p>
      <ol>
        {secciones.map((s, i) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              aria-current={i === actual ? "location" : undefined}
            >
              {titulo(s.titulo)}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** "Descargar PDF": abre la impresión del navegador, que deja guardarlo como PDF (la hoja de impresión deja solo el texto). */
export function BotonPdf({ texto }: { texto: string }) {
  return (
    <button type="button" className="legal__pdf" onClick={() => window.print()}>
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <path
          d="M8 2.5v8M4.5 7.5 8 11l3.5-3.5M3 13.5h10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {texto}
    </button>
  );
}

/** El idioma del documento: Español o English (guarda la cookie del sitio y vuelve a pedir la página). */
export function SelectorIdioma({
  idioma,
  etiqueta,
}: {
  idioma: Idioma;
  etiqueta: string;
}) {
  const { cambiar, cambiando } = useCambiarIdioma();
  return (
    <span
      className="legal__idioma"
      data-cambiando={cambiando ? "true" : undefined}
    >
      <select
        aria-label={etiqueta}
        value={idioma}
        onChange={(e) => cambiar(e.target.value as Idioma)}
      >
        {IDIOMAS.map((i) => (
          <option key={i} value={i} lang={i}>
            {NOMBRE_IDIOMA[i]}
          </option>
        ))}
      </select>
      <Flecha className="legal__idioma-flecha" />
    </span>
  );
}
