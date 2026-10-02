import type { Metadata } from "next";
import { Login } from "./Login";

export const metadata: Metadata = { title: "Entrar" };

export default function EntrarPage({ searchParams }: { searchParams: { error?: string } }) {
  return <Login errorInicial={searchParams?.error === "login"} />;
}
