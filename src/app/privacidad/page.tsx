import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PaginaDocumento } from "@/components/legal/PaginaDocumento";
import { t } from "@/i18n";
import { idiomaServidor } from "@/i18n/servidor";
import { legalesCompletos } from "@/lib/legal";
import { metadatosDe } from "@/lib/seo";
import { AVISO_PRIVACIDAD } from "@/legal/aviso-privacidad";

export async function generateMetadata(): Promise<Metadata> {
  const idioma = await idiomaServidor();
  return metadatosDe(idioma, t(idioma).meta.privacidad);
}

/** /privacidad: el Aviso de Privacidad Integral (src/legal/aviso-privacidad.ts). 404 mientras falten los datos del responsable. */
export default async function Pagina() {
  if (!legalesCompletos()) notFound();
  return (
    <PaginaDocumento
      actual="privacidad"
      etiqueta="Legal · Privacidad"
      titulo="Aviso de Privacidad"
      tipo="Aviso integral"
      texto={AVISO_PRIVACIDAD}
      entrada="Atendel es una plataforma de asistencia para negocios basada en inteligencia artificial. Este Aviso de Privacidad explica qué datos personales tratamos, para qué, con quién los compartimos y cómo puedes ejercer tus derechos."
    />
  );
}
