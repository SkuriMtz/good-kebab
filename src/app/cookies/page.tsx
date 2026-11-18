import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PaginaDocumento } from "@/components/legal/PaginaDocumento";
import { t } from "@/i18n";
import { idiomaServidor } from "@/i18n/servidor";
import { legalesCompletos } from "@/lib/legal";
import { metadatosDe } from "@/lib/seo";
import { COOKIES } from "@/legal/cookies";
import { COOKIES_EN } from "@/legal/cookies.en";

export async function generateMetadata(): Promise<Metadata> {
  const idioma = await idiomaServidor();
  return metadatosDe(idioma, t(idioma).meta.cookies);
}

/** /cookies: en español o inglés según la cookie del sitio (vale el español). 404 mientras falten los datos del responsable. */
export default async function Pagina() {
  if (!legalesCompletos()) notFound();
  const idioma = await idiomaServidor();
  return (
    <PaginaDocumento
      actual="cookies"
      idioma={idioma}
      es={{
        etiqueta: "Legal · Cookies",
        titulo: "Política de Cookies",
        tipo: "Cookies y tecnologías similares",
        texto: COOKIES,
      }}
      en={{
        etiqueta: "Legal · Cookies",
        titulo: "Cookie Policy",
        tipo: "Cookies and similar technologies",
        texto: COOKIES_EN,
      }}
    />
  );
}
