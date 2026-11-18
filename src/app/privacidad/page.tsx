import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PaginaDocumento } from "@/components/legal/PaginaDocumento";
import { t } from "@/i18n";
import { idiomaServidor } from "@/i18n/servidor";
import { legalesCompletos } from "@/lib/legal";
import { metadatosDe } from "@/lib/seo";
import { AVISO_PRIVACIDAD } from "@/legal/aviso-privacidad";
import { PRIVACY_NOTICE } from "@/legal/aviso-privacidad.en";

export async function generateMetadata(): Promise<Metadata> {
  const idioma = await idiomaServidor();
  return metadatosDe(idioma, t(idioma).meta.privacidad);
}

/** /privacidad: en español o inglés según la cookie del sitio (vale el español). 404 mientras falten los datos del responsable. */
export default async function Pagina() {
  if (!legalesCompletos()) notFound();
  const idioma = await idiomaServidor();
  return (
    <PaginaDocumento
      actual="privacidad"
      idioma={idioma}
      es={{
        etiqueta: "Legal · Privacidad",
        titulo: "Aviso de Privacidad",
        tipo: "Aviso integral",
        texto: AVISO_PRIVACIDAD,
        entrada:
          "Atendel es una plataforma de asistencia para negocios basada en inteligencia artificial. Este Aviso de Privacidad explica qué datos personales tratamos, para qué, con quién los compartimos y cómo puedes ejercer tus derechos.",
      }}
      en={{
        etiqueta: "Legal · Privacy",
        titulo: "Privacy Notice",
        tipo: "Comprehensive notice",
        texto: PRIVACY_NOTICE,
        entrada:
          "Atendel is an AI-based business assistance platform. This Privacy Notice explains what personal data we process, what for, who we share it with and how you can exercise your rights.",
      }}
    />
  );
}
