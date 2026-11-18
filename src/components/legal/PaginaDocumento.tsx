import Link from "next/link";
import type { ReactNode } from "react";
import { BotonPdf, EncabezadoLegal, IndiceSecciones } from "@/components/legal/BarraSecciones";
import { POLITICAS, type Politica } from "@/legal/politicas";
import { DocumentoMd, seccionesMd } from "@/components/legal/DocumentoMd";
import { serifPanel } from "@/components/panel/fuente";
import { DATOS_LEGALES } from "@/lib/legal";
import { CORREO_CONTACTO } from "@/lib/sitio";

/** "2026-11-17" → "17 de noviembre de 2026" (en UTC, para que no se corra un día). */
const fecha = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

/**
 * Página de un documento legal (/privacidad, /terminos, /cookies) con la cara
 * de Atendel: encabezado fijo (logo al centro que se compacta al bajar,
 * «Políticas» a la derecha y una línea fina con la sección en la que vas),
 * título en serif, ficha (vigencia, tipo, idioma), índice a un lado y un
 * pie de una línea.
 * Siempre en claro y en español (es el texto que vale).
 */
export function PaginaDocumento({
  actual,
  etiqueta,
  titulo,
  tipo,
  texto,
  entrada,
}: {
  actual: Politica;
  etiqueta: string;
  titulo: string;
  tipo: string;
  texto: string;
  entrada?: ReactNode;
}) {
  const secciones = seccionesMd(texto);
  return (
    <div className={`legal ${serifPanel.variable}`} lang="es">
      <a href="#legal-contenido" className="legal__saltar">
        Saltar al contenido
      </a>
      <EncabezadoLegal actual={actual} secciones={secciones} />

      <main id="legal-contenido" tabIndex={-1} className="legal__main">
        <div className="legal__cabeza">
          <p className="legal__etiqueta">{etiqueta}</p>
          <h1>{titulo}</h1>
          <BotonPdf />
        </div>

        <dl className="legal__ficha">
          <div>
            <dt>Vigente desde</dt>
            <dd>
              <time dateTime={DATOS_LEGALES.actualizado}>
                {fecha(DATOS_LEGALES.actualizado)}
              </time>
            </dd>
          </div>
          <div>
            <dt>Tipo</dt>
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
                {tipo}
              </span>
            </dd>
          </div>
          <div>
            <dt>Idioma</dt>
            <dd>
              <span className="legal__chip legal__chip--borde">Español</span>
            </dd>
          </div>
        </dl>

        <div className="legal__columnas">
          <IndiceSecciones secciones={secciones} />
          <div className="legal__cuerpo">
            {entrada ? <p className="legal__entrada">{entrada}</p> : null}
            <DocumentoMd texto={texto} soloCuerpo />
          </div>
        </div>
      </main>

      <footer className="legal__pie">
        <p>© 2026 Atendel</p>
        <nav aria-label="Políticas y contacto">
          {POLITICAS.filter((p) => p.id !== actual).map((p) => (
            <Link key={p.id} href={p.href}>
              {p.nombre}
            </Link>
          ))}
          <Link href="/contacto">Contacto</Link>
          <a href={`mailto:${CORREO_CONTACTO}`}>{CORREO_CONTACTO}</a>
        </nav>
      </footer>
    </div>
  );
}
