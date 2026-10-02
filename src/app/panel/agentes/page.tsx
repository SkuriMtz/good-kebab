import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cargarCuenta } from "@/lib/cuenta";
import { createClient } from "@/lib/supabase/server";
import { MisAgentes } from "./MisAgentes";

export const metadata: Metadata = { title: "Mis agentes" };

export default async function MisAgentesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const cuenta = await cargarCuenta(supabase, user.id);
  return (
    <MisAgentes
      email={user.email ?? ""}
      userId={user.id}
      planId={cuenta.plan.id}
      elegidosIniciales={cuenta.elegidos}
      usados={cuenta.usados}
    />
  );
}
