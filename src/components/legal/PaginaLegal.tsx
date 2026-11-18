import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PaginaDocumento } from "@/components/legal/PaginaDocumento";
import { idiomaServidor } from "@/i18n/servidor";
import { DOCUMENTOS } from "@/legal/documentos";
import { POLITICAS, type Politica } from "@/legal/politicas";
import { legalesCompletos } from "@/lib/legal";
import { metadatosDe } from "@/lib/seo";

const datos = (id: Politica) => POLITICAS.find((p) => p.id === id)!;

/** Título y descripción de la página de un documento, en el idioma del sitio. */
export async function metadatosLegal(id: Politica): Promise<Metadata> {
  const idioma = await idiomaServidor();
  const p = datos(id);
  return metadatosDe(idioma, [p.nombre[idioma], p.resumen[idioma]]);
}

/** La página de un documento del Centro de privacidad (404 mientras falten los datos del responsable). */
export async function PaginaLegal({ id }: { id: Politica }) {
  if (!legalesCompletos()) notFound();
  const idioma = await idiomaServidor();
  const d = DOCUMENTOS[id];
  return <PaginaDocumento actual={id} idioma={idioma} es={d.es} en={d.en} />;
}
