import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/Logo";
import { BotonPdf, IndiceSecciones } from "@/components/legal/BarraSecciones";
import { DocumentoMd, seccionesMd } from "@/components/legal/DocumentoMd";
import { serifPanel } from "@/components/panel/fuente";
import { t } from "@/i18n";
import { idiomaServidor } from "@/i18n/servidor";
import { DATOS_LEGALES, legalesCompletos } from "@/lib/legal";
import { metadatosDe } from "@/lib/seo";
import { CORREO_CONTACTO } from "@/lib/sitio";
import { AVISO_PRIVACIDAD } from "@/legal/aviso-privacidad";

export async function generateMetadata(): Promise<Metadata> {
  const idioma = await idiomaServidor();
  return metadatosDe(idioma, t(idioma).meta.privacidad);
}

/** "2026-11-17" → "17 de noviembre de 2026" (en UTC, para que no se corra un día). */
const fecha = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });


/**
 * /privacidad: el Aviso de Privacidad Integral en su propia página, con la
 * cara de Atendel: encabezado sencillo, título en serif (como el panel),
 * texto en Geist, índice a un lado que marca dónde vas y un pie de una
 * línea. Siempre en claro y en español (es el texto que vale).
 * El texto: src/legal/aviso-privacidad.ts.
 */
export default async function Pagina() {
  if (!legalesCompletos()) notFound();
  const secciones = seccionesMd(AVISO_PRIVACIDAD);
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
          <Link href="/terminos" className="legal__solo-ancho">
            Términos
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
          <p className="legal__etiqueta">Legal · Privacidad</p>
          <h1>Aviso de Privacidad</h1>
          <p className="legal__meta">
            Vigente desde <time dateTime={DATOS_LEGALES.actualizado}>{fecha(DATOS_LEGALES.actualizado)}</time>
            <span aria-hidden="true"> · </span>Aviso integral<span aria-hidden="true"> · </span>Español
          </p>
          <BotonPdf />
        </div>

        <div className="legal__columnas">
          <IndiceSecciones secciones={secciones} />
          <div className="legal__cuerpo">
            <p className="legal__entrada">
              Atendel es una plataforma de asistencia para negocios basada en inteligencia artificial. Este Aviso de Privacidad explica qué datos personales tratamos, para qué, con quién los compartimos y cómo puedes ejercer tus derechos.
            </p>
            <DocumentoMd texto={AVISO_PRIVACIDAD} soloCuerpo />
          </div>
        </div>
      </main>

      <footer className="legal__pie">
        <p>© 2026 Atendel</p>
        <nav aria-label="Más de Atendel">
          <Link href="/terminos">Términos de uso</Link>
          <Link href="/contacto">Contacto</Link>
          <a href={`mailto:${CORREO_CONTACTO}`}>{CORREO_CONTACTO}</a>
        </nav>
      </footer>
    </div>
  );
}
