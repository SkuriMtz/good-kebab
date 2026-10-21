import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ResumenPanel, type ConversacionReal, type ResumenReal } from "@/components/dashboard/ResumenPanel";
import { esIdAgente, type IdAgente } from "@/lib/agentes";
import { cargarCuenta } from "@/lib/cuenta";
import { createClient } from "@/lib/supabase/server";
import { Panel } from "./Panel";

export const metadata: Metadata = { title: "Panel" };

/** Primer día del mes en curso (UTC), para contar lo de este mes. */
function inicioDelMes() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
}

/**
 * /panel: el Resumen del dashboard con los datos reales de la cuenta.
 * /panel?vista=correo: Correo con Clara (modo de prueba, Gmail e historial).
 * Solo lee (RLS deja ver a cada quien solo lo suyo); no cambia datos ni la API.
 */
export default async function PanelPage({ searchParams }: { searchParams: { vista?: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // El middleware ya redirige a /entrar sin sesión; esto es una segunda barrera
  if (!user) redirect("/entrar");

  const proveedores = (user.app_metadata?.providers as string[] | undefined) ?? [];
  const conGoogle = proveedores.includes("google");

  if (searchParams.vista === "correo") return <Panel conGoogle={conGoogle} />;

  const desde = inicioDelMes();
  const [cuenta, convs, resumenes, totalResumenes, convsMes, resumenesMes] = await Promise.all([
    cargarCuenta(supabase, user.id),
    supabase
      .from("conversaciones")
      .select("id, agente, titulo, actualizado_en, participantes, tema")
      .eq("owner_id", user.id)
      .order("actualizado_en", { ascending: false })
      .limit(200),
    supabase
      .from("resumenes_correo")
      .select("id, remitente, asunto, resumen, accion_sugerida, creado_en")
      .order("creado_en", { ascending: false })
      .limit(12),
    supabase.from("resumenes_correo").select("id", { count: "exact", head: true }),
    supabase.from("conversaciones").select("id", { count: "exact", head: true }).eq("owner_id", user.id).gte("actualizado_en", desde),
    supabase.from("resumenes_correo").select("id", { count: "exact", head: true }).gte("creado_en", desde),
  ]);

  const conversaciones = ((convs.data ?? []) as ConversacionReal[]).filter((c) => esIdAgente(c.agente));
  const porAgente: Partial<Record<IdAgente, number>> = {};
  conversaciones.forEach((c) => {
    const ids = (c.participantes ?? []).filter(esIdAgente);
    (ids.length >= 2 ? ids : [c.agente as IdAgente]).forEach((id) => {
      porAgente[id] = (porAgente[id] ?? 0) + 1;
    });
  });

  const meta = user.user_metadata ?? {};
  const nombreCompleto = (meta.full_name as string | undefined) || (meta.name as string | undefined);

  return (
    <ResumenPanel
      nombre={nombreCompleto ? nombreCompleto.split(" ")[0] : undefined}
      planId={cuenta.plan.id}
      usados={cuenta.usados}
      activos={cuenta.activos}
      negocio={cuenta.negocio}
      conGoogle={conGoogle}
      conversaciones={conversaciones}
      totalConversaciones={conversaciones.length}
      porAgente={porAgente}
      resumenes={(resumenes.data ?? []) as ResumenReal[]}
      totalResumenes={totalResumenes.count ?? 0}
      mes={{ conversaciones: convsMes.count ?? 0, resumenes: resumenesMes.count ?? 0 }}
    />
  );
}
