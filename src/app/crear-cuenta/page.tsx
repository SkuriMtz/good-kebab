import type { Metadata } from "next";
import { FormularioAcceso } from "@/components/acceso/FormularioAcceso";
import { t } from "@/i18n";
import { idiomaServidor } from "@/i18n/servidor";
import { metadatosDe } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const idioma = await idiomaServidor();
  return metadatosDe(idioma, t(idioma).meta.crear);
}

export default function CrearCuentaPage() {
  return <FormularioAcceso modo="crear" />;
}
