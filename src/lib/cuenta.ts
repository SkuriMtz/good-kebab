import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { esIdAgente, type IdAgente } from "./agentes";
import { mesActual, planDe, type Plan } from "./planes";

export type Cuenta = {
  plan: Plan;
  /** Agentes que la persona eligió para su equipo. */
  elegidos: IdAgente[];
  /** Agentes que de verdad puede usar (lo elegido que su plan permite). */
  activos: IdAgente[];
  usados: number;
  negocio: string;
};

/**
 * Lee el plan, el equipo y el uso del mes del usuario con sesión.
 * RLS garantiza que cada quien solo lee lo suyo.
 */
export async function cargarCuenta(supabase: SupabaseClient, userId: string): Promise<Cuenta> {
  const [sus, eleg, uso, neg] = await Promise.all([
    supabase.from("suscripciones").select("plan").eq("owner_id", userId).maybeSingle(),
    supabase.from("agentes_elegidos").select("agentes").eq("owner_id", userId).maybeSingle(),
    supabase.from("uso_mensual").select("mensajes").eq("owner_id", userId).eq("mes", mesActual()).maybeSingle(),
    supabase.from("negocios").select("nombre").eq("owner_id", userId).limit(1).maybeSingle(),
  ]);

  const plan = planDe(sus.data?.plan);
  // Sin elección guardada: todo lo que su plan incluye
  const elegidos = eleg.data ? (eleg.data.agentes as unknown[]).filter(esIdAgente) : [...plan.agentes];
  const permitidos = plan.agentes.filter((id) => elegidos.includes(id));
  // Si lo que eligió antes ya no está en su plan, se queda con todo lo que el plan incluye
  const activos = plan.id === "free" || !permitidos.length ? [...plan.agentes] : permitidos;

  return {
    plan,
    elegidos,
    activos,
    usados: uso.data?.mensajes ?? 0,
    negocio: neg.data?.nombre ?? "tu negocio",
  };
}
