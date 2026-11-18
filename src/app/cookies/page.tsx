import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PaginaDocumento } from "@/components/legal/PaginaDocumento";
import { t } from "@/i18n";
import { idiomaServidor } from "@/i18n/servidor";
import { legalesCompletos } from "@/lib/legal";
import { metadatosDe } from "@/lib/seo";
import { COOKIES } from "@/legal/cookies";

export async function generateMetadata(): Promise<Metadata> {
  const idioma = await idiomaServidor();
  return metadatosDe(idioma, t(idioma).meta.cookies);
}

/** /cookies: la Política de Cookies y Tecnologías Similares (src/legal/cookies.ts). 404 mientras falten los datos del responsable. */
export default async function Pagina() {
  if (!legalesCompletos()) notFound();
  return (
    <PaginaDocumento
      actual="cookies"
      etiqueta="Legal · Cookies"
      titulo="Política de Cookies"
      tipo="Cookies y tecnologías similares"
      texto={COOKIES}
    />
  );
}
