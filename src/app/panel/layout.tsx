import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { ArmazonPanel } from "@/components/dashboard/ArmazonPanel";
import { nombresAgentes } from "@/components/dashboard/nombres";
import { esIdAgente, type IdAgente } from "@/lib/agentes";
import { cargarCuenta } from "@/lib/cuenta";
import { createClient } from "@/lib/supabase/server";

/**
 * El armazón del panel (barra superior, menú lateral, pie) con los datos
 * reales de la cuenta. Se queda puesto al moverse entre Resumen,
 * Conversaciones, Agentes y Correo. Solo lee: plan, equipo, uso, negocio y
 * los grupos de chat (RLS deja ver a cada quien solo lo suyo).
 */
export default async function PanelLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // El middleware ya redirige a /entrar sin sesión; esto es una segunda barrera
  if (!user) redirect("/entrar");

  const [cuenta, { data: convs }] = await Promise.all([
    cargarCuenta(supabase, user.id),
    supabase
      .from("conversaciones")
      .select("id, titulo, participantes, tema, actualizado_en")
      .eq("owner_id", user.id)
      .order("actualizado_en", { ascending: false })
      .limit(40),
  ]);

  const grupos = (convs ?? [])
    .map((c) => ({ ...c, agentes: ((c.participantes as unknown[] | null) ?? []).filter(esIdAgente) as IdAgente[] }))
    .filter((c) => c.agentes.length >= 2)
    .slice(0, 6)
    .map((c) => ({ id: String(c.id), nombre: (c.tema as string | null) || nombresAgentes(c.agentes), agentes: c.agentes }));

  const meta = user.user_metadata ?? {};
  const nombre = (meta.full_name as string | undefined) || (meta.name as string | undefined) || user.email || "Tu cuenta";
  const foto = (meta.avatar_url as string | undefined) || (meta.picture as string | undefined) || null;
  const proveedores = (user.app_metadata?.providers as string[] | undefined) ?? [];

  return (
    <ArmazonPanel
      datos={{
        correo: user.email ?? "",
        nombre,
        foto,
        planId: cuenta.plan.id,
        activos: cuenta.activos,
        negocio: cuenta.negocio,
        conGoogle: proveedores.includes("google"),
        grupos,
      }}
    >
      {children}
    </ArmazonPanel>
  );
}
