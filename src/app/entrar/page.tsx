import type { Metadata } from "next";
import { Sitio } from "@/components/Sitio";
import { Login } from "./Login";

export const metadata: Metadata = { title: "Entrar" };

export default function EntrarPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <Sitio>
      <Login errorInicial={searchParams?.error === "login"} />
    </Sitio>
  );
}
