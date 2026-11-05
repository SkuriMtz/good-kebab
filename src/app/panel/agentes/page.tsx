import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { esIdAgente } from "@/lib/agentes";
import { cargarCuenta } from "@/lib/cuenta";
import { createClient } from "@/lib/supabase/server";
import { MisAgentes } from "./MisAgentes";

export const metadata: Metadata = { title: "Agentes" };

/** /panel/agentes (?agente=lola marca a ese agente): tu equipo y quién está en él. */
export default async function MisAgentesPage({ searchParams }: { searchParams: { agente?: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const cuenta = await cargarCuenta(supabase, user.id);
  const proveedores = (user.app_metadata?.providers as string[] | undefined) ?? [];
  const pedido = searchParams.agente;

  return (
    <MisAgentes
      userId={user.id}
      planId={cuenta.plan.id}
      elegidosIniciales={cuenta.elegidos}
      enfocado={esIdAgente(pedido) ? pedido : undefined}
      conGoogle={proveedores.includes("google")}
    />
  );
}
