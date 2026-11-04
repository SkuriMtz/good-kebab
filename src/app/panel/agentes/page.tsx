import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { esIdAgente, IDS_AGENTES, type IdAgente } from "@/lib/agentes";
import { cargarCuenta } from "@/lib/cuenta";
import { createClient } from "@/lib/supabase/server";
import { MisAgentes } from "./MisAgentes";

export const metadata: Metadata = { title: "Agentes" };

/** /panel/agentes (?agente=lola marca a ese agente): el equipo, lo de esta semana y el plan. */
export default async function MisAgentesPage({ searchParams }: { searchParams: { agente?: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const hace7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [cuenta, semana, correos] = await Promise.all([
    cargarCuenta(supabase, user.id),
    // Lo de esta semana: conversaciones de cada agente y correos que resumió Clara (RLS: solo lo suyo)
    supabase.from("conversaciones").select("agente, participantes").eq("owner_id", user.id).gte("actualizado_en", hace7).limit(1000),
    supabase.from("resumenes_correo").select("id", { count: "exact", head: true }).gte("creado_en", hace7),
  ]);
  const filas = semana.error ? null : ((semana.data ?? []) as { agente: string; participantes: string[] | null }[]);
  const estaSemana = Object.fromEntries(
    IDS_AGENTES.map((id) => [id, filas === null ? null : filas.filter((c) => c.agente === id || (c.participantes ?? []).includes(id)).length]),
  ) as Record<IdAgente, number | null>;
  const pedido = searchParams.agente;

  return (
    <MisAgentes
      userId={user.id}
      planId={cuenta.plan.id}
      elegidosIniciales={cuenta.elegidos}
      usados={cuenta.usados}
      enfocado={esIdAgente(pedido) ? pedido : undefined}
      estaSemana={estaSemana}
      correosSemana={correos.error ? null : (correos.count ?? 0)}
    />
  );
}
