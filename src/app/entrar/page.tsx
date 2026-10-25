import type { Metadata } from "next";
import { Sitio } from "@/components/Sitio";
import { Login } from "./Login";
import { metadatos } from "@/lib/seo";

export const metadata: Metadata = metadatos(
  "Entrar",
  "Entra a Atendel con tu correo, sin contraseña. Si es tu primera vez, tu cuenta se crea al entrar con el plan Free.",
);

export default function EntrarPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <Sitio>
      <Login errorInicial={searchParams?.error === "login"} />
    </Sitio>
  );
}
