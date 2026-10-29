import type { Metadata } from "next";
import { Sitio } from "@/components/Sitio";
import { Login } from "./Login";
import { t } from "@/i18n";
import { idiomaServidor } from "@/i18n/servidor";
import { metadatosDe } from "@/lib/seo";

export function generateMetadata(): Metadata {
  const idioma = idiomaServidor();
  return metadatosDe(idioma, t(idioma).meta.entrar);
}

export default function EntrarPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <Sitio>
      <Login errorInicial={searchParams?.error === "login"} />
    </Sitio>
  );
}
