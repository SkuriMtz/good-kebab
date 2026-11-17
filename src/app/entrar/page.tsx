import type { Metadata } from "next";
import { FormularioAcceso } from "@/components/acceso/FormularioAcceso";
import { t } from "@/i18n";
import { idiomaServidor } from "@/i18n/servidor";
import { metadatosDe } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const idioma = await idiomaServidor();
  return metadatosDe(idioma, t(idioma).meta.entrar);
}

export default async function EntrarPage(props: { searchParams: Promise<{ error?: string }> }) {
  const searchParams = await props.searchParams;
  return <FormularioAcceso modo="entrar" errorInicial={searchParams?.error === "login"} />;
}
