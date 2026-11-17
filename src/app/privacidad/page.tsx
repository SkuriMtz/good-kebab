import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/Logo";
import { BarraSecciones, BotonPdf } from "@/components/legal/BarraSecciones";
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

const PIE = [
  { titulo: "Producto", enlaces: [{ href: "/agentes", texto: "Agentes" }, { href: "/precios", texto: "Precios" }, { href: "/pruebalo", texto: "Pruébalo" }, { href: "/para-quien-es", texto: "Para quién es" }] },
  { titulo: "Ayuda", enlaces: [{ href: "/preguntas", texto: "Preguntas" }, { href: "/contacto", texto: "Contacto" }] },
  { titulo: "Términos y políticas", enlaces: [{ href: "/privacidad", texto: "Aviso de privacidad" }, { href: "/terminos", texto: "Términos de uso" }] },
  { titulo: "Tu cuenta", enlaces: [{ href: "/entrar", texto: "Entrar" }, { href: "/crear-cuenta", texto: "Crear cuenta" }] },
];

/**
 * /privacidad: el Aviso de Privacidad Integral en su propia página, con
 * estilo de documento legal: encabezado propio, barra de la sección en la
 * que vas, título, "Descargar PDF", ficha (vigencia, tipo, para quién,
 * idioma), el texto en serif y un pie oscuro. Siempre en claro y en
 * español (es el texto que vale). El texto: src/legal/aviso-privacidad.ts.
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
        <nav className="legal__pildoras" aria-label="Atendel">
          <Link href="/agentes" className="legal__pildora">
            Agentes
          </Link>
          <Link href="/precios" className="legal__pildora">
            Precios
          </Link>
          <Link href="/preguntas" className="legal__pildora legal__solo-ancho">
            Preguntas
          </Link>
        </nav>
        <Link href="/" className="legal__logo" aria-label="Atendel, inicio">
          <Logo />
        </Link>
        <nav className="legal__pildoras legal__pildoras--der" aria-label="Cuenta">
          <Link href="/entrar" className="legal__pildora legal__solo-ancho">
            Entrar
          </Link>
          <Link href="/crear-cuenta" className="legal__pildora legal__pildora--llena">
            Crear cuenta
          </Link>
        </nav>
      </header>
      <BarraSecciones secciones={secciones} />

      <main id="legal-contenido" tabIndex={-1}>
        <div className="legal__hero">
          <Link href="/" className="legal__volver">
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path d="M15 9H3m5-5L3 9l5 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Atendel
          </Link>
          <h1>Aviso de Privacidad</h1>
          <BotonPdf />
        </div>

        <dl className="legal__ficha">
          <div>
            <dt>Vigente desde</dt>
            <dd>
              <time dateTime={DATOS_LEGALES.actualizado}>{fecha(DATOS_LEGALES.actualizado)}</time>
            </dd>
          </div>
          <div>
            <dt>Tipo</dt>
            <dd>
              <span className="legal__chip">Aviso integral</span>
            </dd>
          </div>
          <div>
            <dt>Para quién</dt>
            <dd>
              <span className="legal__chip legal__chip--azul">Usuarios y sus clientes</span>
            </dd>
          </div>
          <div>
            <dt>Idioma</dt>
            <dd>Español</dd>
          </div>
        </dl>

        <div className="legal__cuerpo">
          <p className="legal__entrada">
            Atendel es una plataforma de asistencia para negocios basada en inteligencia artificial. Este Aviso de Privacidad explica qué datos personales tratamos, para qué, con quién los compartimos y cómo puedes ejercer tus derechos.
          </p>
          <DocumentoMd texto={AVISO_PRIVACIDAD} soloCuerpo />
        </div>
      </main>

      <footer className="legal__pie">
        <div className="legal__pie-grupos">
          {PIE.map((g) => (
            <details key={g.titulo}>
              <summary>
                {g.titulo}
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </summary>
              <ul>
                {g.enlaces.map((e) => (
                  <li key={e.href}>
                    <Link href={e.href}>{e.texto}</Link>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
        <div className="legal__pie-final">
          <p>© 2026 Atendel</p>
          <p>
            <a href={`mailto:${CORREO_CONTACTO}`}>{CORREO_CONTACTO}</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
