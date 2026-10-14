import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ConversacionPanel, ResumenPanel } from "@/components/dashboard/ArmazonPanel";
import { esIdAgente } from "@/lib/agentes";
import { cargarCuenta } from "@/lib/cuenta";
import { createClient } from "@/lib/supabase/server";
import { Panel } from "./Panel";

export const metadata: Metadata = { title: "Panel" };

/** /panel: el Resumen (y, con ?vista=correo, el correo con Clara). Solo lee datos. */
export default async function PanelPage({ searchParams }: { searchParams: { vista?: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // El middleware ya redirige a /entrar sin sesión; esto es una segunda barrera
  if (!user) redirect("/entrar");

  const [cuenta, { data: convs, count: totalConversaciones }, { data: res, count: totalResumenes }] = await Promise.all([
    cargarCuenta(supabase, user.id),
    supabase
      .from("conversaciones")
      .select("id, agente, titulo, actualizado_en, participantes", { count: "exact" })
      .eq("owner_id", user.id)
      .order("actualizado_en", { ascending: false })
      .limit(20),
    // RLS se encarga de que solo regresen los resúmenes del negocio de quien inició sesión
    supabase
      .from("resumenes_correo")
      .select("id, remitente, asunto, resumen, accion_sugerida, creado_en", { count: "exact" })
      .order("creado_en", { ascending: false })
      .limit(30),
  ]);

  const proveedores = (user.app_metadata?.providers as string[] | undefined) ?? [];
  const meta = user.user_metadata ?? {};
  const nombre = (typeof meta.full_name === "string" && meta.full_name) || (typeof meta.name === "string" && meta.name) || null;

  return (
    <Panel
      vista={searchParams.vista === "correo" ? "correo" : "resumen"}
      email={user.email ?? ""}
      nombre={nombre}
      conGoogle={proveedores.includes("google")}
      planId={cuenta.plan.id}
      usados={cuenta.usados}
      activos={cuenta.activos}
      negocio={cuenta.negocio}
      conversaciones={((convs ?? []) as ConversacionPanel[]).filter((c) => esIdAgente(c.agente))}
      resumenes={(res ?? []) as ResumenPanel[]}
      totales={{ conversaciones: totalConversaciones ?? 0, resumenes: totalResumenes ?? 0 }}
    />
  );
}
