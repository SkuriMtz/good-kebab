import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PaginaDocumento } from "@/components/legal/PaginaDocumento";
import { t } from "@/i18n";
import { idiomaServidor } from "@/i18n/servidor";
import { legalesCompletos } from "@/lib/legal";
import { metadatosDe } from "@/lib/seo";
import { TERMINOS } from "@/legal/terminos";
import { TERMS } from "@/legal/terminos.en";

export async function generateMetadata(): Promise<Metadata> {
  const idioma = await idiomaServidor();
  return metadatosDe(idioma, t(idioma).meta.terminos);
}

/** /terminos: en español o inglés según la cookie del sitio (vale el español). 404 mientras falten los datos del responsable. */
export default async function Pagina() {
  if (!legalesCompletos()) notFound();
  const idioma = await idiomaServidor();
  return (
    <PaginaDocumento
      actual="terminos"
      idioma={idioma}
      es={{
        etiqueta: "Legal · Términos",
        titulo: "Términos y Condiciones de Uso",
        tipo: "Condiciones generales",
        texto: TERMINOS,
      }}
      en={{
        etiqueta: "Legal · Terms",
        titulo: "Terms and Conditions of Use",
        tipo: "General conditions",
        texto: TERMS,
      }}
    />
  );
}
