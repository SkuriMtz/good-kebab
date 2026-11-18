import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PaginaDocumento } from "@/components/legal/PaginaDocumento";
import { t } from "@/i18n";
import { idiomaServidor } from "@/i18n/servidor";
import type { Politica } from "@/legal/politicas";
import { legalesCompletos } from "@/lib/legal";
import { metadatosDe } from "@/lib/seo";

/** Título y descripción de la página de un documento, en el idioma del sitio. */
export async function metadatosLegal(id: Politica): Promise<Metadata> {
  const idioma = await idiomaServidor();
  const doc = t(idioma).legal.docs[id];
  return metadatosDe(idioma, [doc.nombre, doc.resumen]);
}

/** La página de un documento del Centro de privacidad (404 mientras falten los datos del responsable). */
export async function PaginaLegal({ id }: { id: Politica }) {
  if (!legalesCompletos()) notFound();
  const idioma = await idiomaServidor();
  return <PaginaDocumento actual={id} idioma={idioma} />;
}
