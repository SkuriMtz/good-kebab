import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { ArmazonPanel, type GrupoPanel } from "@/components/dashboard/ArmazonPanel";
import { esIdAgente } from "@/lib/agentes";
import { cargarCuenta } from "@/lib/cuenta";
import { createClient } from "@/lib/supabase/server";

/**
 * El armazón del dashboard para todo /panel (Resumen, Correo, Agentes y el
 * chat): barra superior, menú lateral, cajón en celular y pie. Lee la cuenta
 * real (plan, equipo, grupos); cada página pone su contenido.
 */
export default async function PanelLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // El middleware ya redirige sin sesión; esto es una segunda barrera
  if (!user) redirect("/entrar");

  const [cuenta, { data: convs }] = await Promise.all([
    cargarCuenta(supabase, user.id),
    supabase
      .from("conversaciones")
      .select("id, titulo, tema, participantes, actualizado_en")
      .eq("owner_id", user.id)
      .not("participantes", "is", null)
      .order("actualizado_en", { ascending: false })
      .limit(8),
  ]);

  const grupos: GrupoPanel[] = (convs ?? []).map((c) => ({
    id: c.id as string,
    nombre: ((c.tema as string | null) || (c.titulo as string)) ?? "Grupo",
    agentes: ((c.participantes as unknown[]) ?? []).filter(esIdAgente),
  }));

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const nombre = typeof meta.full_name === "string" ? meta.full_name : typeof meta.name === "string" ? meta.name : "";
  const foto = typeof meta.avatar_url === "string" ? meta.avatar_url : typeof meta.picture === "string" ? meta.picture : null;
  const proveedores = (user.app_metadata?.providers as string[] | undefined) ?? [];

  return (
    <ArmazonPanel
      usuario={{ nombre: nombre || user.email || "Tu cuenta", correo: user.email ?? "", foto }}
      planId={cuenta.plan.id}
      activos={cuenta.activos}
      conGoogle={proveedores.includes("google")}
      grupos={grupos}
    >
      {children}
    </ArmazonPanel>
  );
}
