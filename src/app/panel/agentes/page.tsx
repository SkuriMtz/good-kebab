import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { esIdAgente, IDS_AGENTES, type IdAgente } from "@/lib/agentes";
import { cargarCuenta } from "@/lib/cuenta";
import { cargarEstadisticas, hayDatos } from "@/lib/estadisticas";
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

  const cuenta = await cargarCuenta(supabase, user.id);
  // Lo de cada agente en 7 días: las mismas cuentas que Estadísticas (RLS: solo lo suyo)
  const est = await cargarEstadisticas(supabase, user.id, "7d", cuenta).catch(() => null);
  const conDatos = est !== null && hayDatos(est);
  const estaSemana = Object.fromEntries(
    IDS_AGENTES.map((id) => {
      const fila = est?.porAgente.find((f) => f.agente === id);
      return [id, conDatos ? { mensajes: fila?.mensajes ?? 0, conversaciones: fila?.conversaciones ?? 0 } : null];
    }),
  ) as Record<IdAgente, { mensajes: number; conversaciones: number } | null>;
  const pedido = searchParams.agente;

  return (
    <MisAgentes
      userId={user.id}
      planId={cuenta.plan.id}
      elegidosIniciales={cuenta.elegidos}
      usados={cuenta.usados}
      enfocado={esIdAgente(pedido) ? pedido : undefined}
      estaSemana={estaSemana}
    />
  );
}
