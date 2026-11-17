import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { BotonPdf, IndiceSecciones } from "@/components/legal/BarraSecciones";
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
 * Página de un documento legal (/privacidad, /terminos) con la cara de
 * Atendel: encabezado sencillo, título en serif (como el panel), texto en
 * Geist, índice a un lado que marca dónde vas y un pie de una línea.
 * Siempre en claro y en español (es el texto que vale).
 */
export function PaginaDocumento({
  etiqueta,
  titulo,
  tipo,
  texto,
  entrada,
  otro,
}: {
  etiqueta: string;
  titulo: string;
  tipo: string;
  texto: string;
  entrada?: ReactNode;
  otro: { href: string; texto: string };
}) {
  const secciones = seccionesMd(texto);
  return (
    <div className={`legal ${serifPanel.variable}`} lang="es">
      <a href="#legal-contenido" className="legal__saltar">
        Saltar al contenido
      </a>
      <header className="legal__barra">
        <Link href="/" className="legal__logo" aria-label="Atendel, inicio">
          <Logo />
        </Link>
        <nav className="legal__nav" aria-label="Atendel">
          <Link href={otro.href} className="legal__solo-ancho">
            {otro.texto}
          </Link>
          <Link href="/contacto" className="legal__solo-ancho">
            Contacto
          </Link>
          <Link href="/entrar" className="legal__entrar">
            Entrar
          </Link>
        </nav>
      </header>

      <main id="legal-contenido" tabIndex={-1} className="legal__main">
        <div className="legal__cabeza">
          <p className="legal__etiqueta">{etiqueta}</p>
          <h1>{titulo}</h1>
          <p className="legal__meta">
            Vigente desde{" "}
            <time dateTime={DATOS_LEGALES.actualizado}>
              {fecha(DATOS_LEGALES.actualizado)}
            </time>
            <span aria-hidden="true"> · </span>
            {tipo}
            <span aria-hidden="true"> · </span>Español
          </p>
          <BotonPdf />
        </div>

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
        <nav aria-label="Más de Atendel">
          <Link href={otro.href}>{otro.texto}</Link>
          <Link href="/contacto">Contacto</Link>
          <a href={`mailto:${CORREO_CONTACTO}`}>{CORREO_CONTACTO}</a>
        </nav>
      </footer>
    </div>
  );
}
