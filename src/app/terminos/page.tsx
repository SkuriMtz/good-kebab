import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PaginaDocumento } from "@/components/legal/PaginaDocumento";
import { t } from "@/i18n";
import { idiomaServidor } from "@/i18n/servidor";
import { legalesCompletos } from "@/lib/legal";
import { metadatosDe } from "@/lib/seo";
import { TERMINOS } from "@/legal/terminos";

export async function generateMetadata(): Promise<Metadata> {
  const idioma = await idiomaServidor();
  return metadatosDe(idioma, t(idioma).meta.terminos);
}

/** /terminos: los Términos y Condiciones de Uso (src/legal/terminos.ts). 404 mientras falten los datos del responsable. */
export default async function Pagina() {
  if (!legalesCompletos()) notFound();
  return (
    <PaginaDocumento
      actual="terminos"
      etiqueta="Legal · Términos"
      titulo="Términos y Condiciones de Uso"
      tipo="Condiciones generales"
      texto={TERMINOS}
    />
  );
}
