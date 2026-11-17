import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Sitio } from "@/components/Sitio";
import { DocumentoMd } from "@/components/legal/DocumentoMd";
import { t } from "@/i18n";
import { idiomaServidor } from "@/i18n/servidor";
import { legalesCompletos } from "@/lib/legal";
import { metadatosDe } from "@/lib/seo";
import { AVISO_PRIVACIDAD } from "@/legal/aviso-privacidad";

export async function generateMetadata(): Promise<Metadata> {
  const idioma = await idiomaServidor();
  return metadatosDe(idioma, t(idioma).meta.privacidad);
}

/**
 * /privacidad: el Aviso de Privacidad Integral (texto del dueño, en
 * src/legal/aviso-privacidad.ts). Va en español en los dos idiomas: es el
 * texto que vale. No se publica (404) mientras falten los datos del
 * responsable en src/lib/legal.ts.
 */
export default async function Pagina() {
  if (!legalesCompletos()) notFound();
  const idioma = await idiomaServidor();
  return (
    <Sitio>
      <section className="pagina-sobria">
        <DocumentoMd texto={AVISO_PRIVACIDAD} nota={idioma === "en" ? "This Privacy Notice is published in Spanish, which is the governing version." : undefined} />
      </section>
    </Sitio>
  );
}
