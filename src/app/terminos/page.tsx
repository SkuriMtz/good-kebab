import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Sitio } from "@/components/Sitio";
import { PaginaLegal } from "@/components/legal/PaginaLegal";
import { t } from "@/i18n";
import { idiomaServidor } from "@/i18n/servidor";
import { DATOS_LEGALES, legalesCompletos } from "@/lib/legal";
import { metadatosDe } from "@/lib/seo";
import { terminosEs } from "@/legal/textos-es";
import { termsEn } from "@/legal/textos-en";

export async function generateMetadata(): Promise<Metadata> {
  const idioma = await idiomaServidor();
  return metadatosDe(idioma, t(idioma).meta.terminos);
}

/** /terminos: no se publica (404) mientras falten los datos del responsable en src/lib/legal.ts. */
export default async function Pagina() {
  if (!legalesCompletos()) notFound();
  const idioma = await idiomaServidor();
  const doc = (idioma === "es" ? terminosEs : termsEn)(DATOS_LEGALES);
  return (
    <Sitio>
      <PaginaLegal doc={doc} idioma={idioma} id="terminos" />
    </Sitio>
  );
}
