import { DATOS_LEGALES } from "@/lib/legal";
import type { Idioma } from "@/i18n";
import type { Documento } from "@/legal/textos-es";

const ETIQUETAS = {
  es: {
    actualizado: "Última actualización",
    indice: "En este documento",
    aria: "Índice del documento",
    locale: "es-MX",
  },
  en: {
    actualizado: "Last updated",
    indice: "In this document",
    aria: "Document index",
    locale: "en-US",
  },
} as const;

/** "2026-11-17" → fecha larga en el idioma (en UTC, para que no se corra un día). */
function fechaLarga(iso: string, locale: string) {
  const f = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(f.getTime())) return iso;
  return f.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Pinta un documento legal (aviso de privacidad o términos) con el estilo de
 * las páginas públicas sobrias: título, resumen, fecha, índice con anclas y
 * las secciones en una columna de lectura de ~70 caracteres.
 */
export function PaginaLegal({
  doc,
  idioma,
  id,
}: {
  doc: Documento;
  idioma: Idioma;
  id: string;
}) {
  const E = ETIQUETAS[idioma];
  return (
    <section className="pagina-sobria" aria-labelledby={`${id}-titulo`}>
      <div className="pagina-legal__columna">
        <header className="pagina-legal__cabecera">
          <h1 id={`${id}-titulo`} className="t-grande">
            {doc.titulo}
          </h1>
          {doc.nota ? (
            <p className="pagina-legal__nota t-chico">{doc.nota}</p>
          ) : null}
          <p className="t-intro">{doc.resumen}</p>
          <p className="t-chico pagina-legal__fecha">
            {E.actualizado}:{" "}
            <time dateTime={DATOS_LEGALES.actualizado}>
              {fechaLarga(DATOS_LEGALES.actualizado, E.locale)}
            </time>
          </p>
        </header>

        <nav className="pagina-legal__indice" aria-label={E.aria}>
          <p className="etiqueta">{E.indice}</p>
          <ol>
            {doc.secciones.map((s, i) => (
              <li key={i}>
                <a href={`#${id}-${i + 1}`}>{s.titulo}</a>
              </li>
            ))}
          </ol>
        </nav>

        {doc.secciones.map((s, i) => (
          <section
            key={i}
            id={`${id}-${i + 1}`}
            className="pagina-legal__seccion"
            aria-labelledby={`${id}-${i + 1}-t`}
          >
            <h2 id={`${id}-${i + 1}-t`}>{s.titulo}</h2>
            {s.parrafos?.length ? (
              <div className="d-parrafos">
                {s.parrafos.map((p, j) => (
                  <p key={j}>{p}</p>
                ))}
              </div>
            ) : null}
            {s.lista?.length ? (
              <ul className="pagina-legal__lista">
                {s.lista.map((l, j) => (
                  <li key={j}>{l}</li>
                ))}
              </ul>
            ) : null}
            {s.despues?.length ? (
              <div className="d-parrafos">
                {s.despues.map((p, j) => (
                  <p key={j}>{p}</p>
                ))}
              </div>
            ) : null}
          </section>
        ))}
      </div>
    </section>
  );
}
