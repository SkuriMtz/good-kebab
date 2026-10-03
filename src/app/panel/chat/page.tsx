import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { esIdAgente } from "@/lib/agentes";
import { cargarCuenta } from "@/lib/cuenta";
import { createClient } from "@/lib/supabase/server";
import { Chat, type Conversacion } from "./Chat";

export const metadata: Metadata = { title: "Hablar con mi equipo" };

export default async function ChatPage({ searchParams }: { searchParams: { agente?: string; c?: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const [cuenta, { data: convs }] = await Promise.all([
    cargarCuenta(supabase, user.id),
    supabase
      .from("conversaciones")
      .select("id, agente, titulo, actualizado_en, participantes, tema")
      .eq("owner_id", user.id)
      .order("actualizado_en", { ascending: false })
      .limit(60),
  ]);

  const conversaciones = ((convs ?? []) as Conversacion[]).filter((c) => esIdAgente(c.agente));
  const pedido = searchParams.agente;
  const agenteInicial = esIdAgente(pedido) ? pedido : (cuenta.activos[0] ?? "clara");

  return (
    <Chat
      key={`${searchParams.agente ?? ""}-${searchParams.c ?? ""}`}
      email={user.email ?? ""}
      planId={cuenta.plan.id}
      activos={cuenta.activos}
      usadosIniciales={cuenta.usados}
      conversacionesIniciales={conversaciones}
      agenteInicial={agenteInicial}
      conversacionInicial={typeof searchParams.c === "string" ? searchParams.c : null}
    />
  );
}
