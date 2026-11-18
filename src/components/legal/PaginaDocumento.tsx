import Link from "next/link";
import type { ReactNode } from "react";
import {
  BotonPdf,
  EncabezadoLegal,
  IndiceSecciones,
  SelectorIdioma,
} from "@/components/legal/BarraSecciones";
import { DocumentoMd, seccionesMd } from "@/components/legal/DocumentoMd";
import { serifPanel } from "@/components/panel/fuente";
import type { Idioma } from "@/i18n";
import { ETIQUETAS_LEGALES, POLITICAS, type Politica } from "@/legal/politicas";
import { DATOS_LEGALES } from "@/lib/legal";
import { CORREO_CONTACTO } from "@/lib/sitio";

/** "2026-11-17" → fecha larga en el idioma (en UTC, para que no se corra un día). */
const fecha = (iso: string, locale: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

type Version = {
  etiqueta: string;
  titulo: string;
  tipo: string;
  texto: string;
  entrada?: ReactNode;
};

/**
 * Página de un documento legal (/privacidad, /terminos, /cookies) con la cara
 * de Atendel, en español o inglés (la cookie del sitio; se cambia en la
 * ficha). Encabezado fijo (logo al centro que se compacta al bajar,
 * «Políticas» a la derecha y una línea fina con la sección en la que vas),
 * título en serif, ficha (vigencia, tipo, idioma), índice a un lado y pie
 * de una línea. Siempre en claro. Vale el texto en español.
 */
export function PaginaDocumento({
  actual,
  idioma,
  es,
  en,
}: {
  actual: Politica;
  idioma: Idioma;
  es: Version;
  en: Version;
}) {
  const v = idioma === "en" ? en : es;
  const E = ETIQUETAS_LEGALES[idioma];
  const secciones = seccionesMd(v.texto);
  return (
    <div className={`legal ${serifPanel.variable}`} lang={idioma}>
      <a href="#legal-contenido" className="legal__saltar">
        {E.saltar}
      </a>
      <EncabezadoLegal actual={actual} secciones={secciones} idioma={idioma} />

      <main id="legal-contenido" tabIndex={-1} className="legal__main">
        <div className="legal__cabeza">
          <p className="legal__etiqueta">{v.etiqueta}</p>
          <h1>{v.titulo}</h1>
          <BotonPdf texto={E.pdf} />
        </div>

        <dl className="legal__ficha">
          <div>
            <dt>{E.vigente}</dt>
            <dd>
              <time dateTime={DATOS_LEGALES.actualizado}>
                {fecha(DATOS_LEGALES.actualizado, E.locale)}
              </time>
            </dd>
          </div>
          <div>
            <dt>{E.tipo}</dt>
            <dd>
              <span className="legal__chip">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                >
                  <path
                    d="M4.5 1.75h4.75L12.5 5v9.25h-8zM9 1.75V5.5h3.5M6.5 8.5h4M6.5 11h4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                  />
                </svg>
                {v.tipo}
              </span>
            </dd>
          </div>
          <div>
            <dt>{E.idioma}</dt>
            <dd>
              <SelectorIdioma idioma={idioma} etiqueta={E.idioma} />
            </dd>
          </div>
        </dl>
        {E.nota ? <p className="legal__nota">{E.nota}</p> : null}

        <div className="legal__columnas">
          <IndiceSecciones secciones={secciones} titulo={E.contenido} />
          <div className="legal__cuerpo">
            {v.entrada ? <p className="legal__entrada">{v.entrada}</p> : null}
            <DocumentoMd texto={v.texto} soloCuerpo />
          </div>
        </div>
      </main>

      <footer className="legal__pie">
        <p>© 2026 Atendel</p>
        <nav aria-label={E.pieAria}>
          {POLITICAS.filter((p) => p.id !== actual).map((p) => (
            <Link key={p.id} href={p.href}>
              {p.nombre[idioma]}
            </Link>
          ))}
          <Link href="/contacto">{E.contacto}</Link>
          <a href={`mailto:${CORREO_CONTACTO}`}>{CORREO_CONTACTO}</a>
        </nav>
      </footer>
    </div>
  );
}
