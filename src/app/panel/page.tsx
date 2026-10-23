import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ActividadPanel, ResumenPanel, type ConversacionReal, type ResumenReal } from "@/components/dashboard/ResumenPanel";
import { esIdAgente } from "@/lib/agentes";
import { cargarCuenta } from "@/lib/cuenta";
import { createClient } from "@/lib/supabase/server";
import { Panel } from "./Panel";

export const metadata: Metadata = { title: "Panel" };

/**
 * /panel: el Resumen del dashboard con los datos reales de la cuenta.
 * /panel?vista=correo: Correo con Clara (modo de prueba, Gmail e historial).
 * /panel?vista=actividad: la actividad completa (como "Feed").
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

  const [cuenta, convs, resumenes] = await Promise.all([
    cargarCuenta(supabase, user.id),
    supabase
      .from("conversaciones")
      .select("id, agente, titulo, actualizado_en, participantes, tema")
      .eq("owner_id", user.id)
      .order("actualizado_en", { ascending: false })
      .limit(20),
    supabase
      .from("resumenes_correo")
      .select("id, remitente, asunto, resumen, accion_sugerida, creado_en")
      .order("creado_en", { ascending: false })
      .limit(12),
  ]);

  const conversaciones = ((convs.data ?? []) as ConversacionReal[]).filter((c) => esIdAgente(c.agente));

  if (searchParams.vista === "actividad") {
    return <ActividadPanel conversaciones={conversaciones} resumenes={(resumenes.data ?? []) as ResumenReal[]} />;
  }

  const meta = user.user_metadata ?? {};
  const nombreCompleto = (meta.full_name as string | undefined) || (meta.name as string | undefined);

  return (
    <ResumenPanel
      nombre={nombreCompleto ? nombreCompleto.split(" ")[0] : undefined}
      planId={cuenta.plan.id}
      activos={cuenta.activos}
      conGoogle={conGoogle}
      conversaciones={conversaciones}
      resumenes={(resumenes.data ?? []) as ResumenReal[]}
    />
  );
}
