import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { ArmazonPanel, type ConversacionPanel, type ResumenPanel } from "@/components/dashboard/ArmazonPanel";
import { esIdAgente } from "@/lib/agentes";
import { cargarCuenta } from "@/lib/cuenta";
import { createClient } from "@/lib/supabase/server";

/**
 * El armazón del panel (barra, menú lateral, cajón en celular) alrededor de
 * todas las páginas de /panel: Resumen, Correo, Agentes y el chat.
 * Solo lee (RLS: cada quien ve lo suyo); no cambia nada de los datos.
 */
export default async function PanelLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // El middleware ya redirige a /entrar sin sesión; esto es una segunda barrera
  if (!user) redirect("/entrar");

  const [cuenta, { data: convs }, { data: res }] = await Promise.all([
    cargarCuenta(supabase, user.id),
    supabase
      .from("conversaciones")
      .select("id, agente, titulo, actualizado_en, participantes")
      .eq("owner_id", user.id)
      .order("actualizado_en", { ascending: false })
      .limit(30),
    supabase
      .from("resumenes_correo")
      .select("id, remitente, asunto, resumen, accion_sugerida, creado_en")
      .order("creado_en", { ascending: false })
      .limit(10),
  ]);

  const conversaciones = ((convs ?? []) as ConversacionPanel[]).filter((c) => esIdAgente(c.agente));
  const resumenes = (res ?? []) as ResumenPanel[];
  const hace24 = Date.now() - 24 * 60 * 60 * 1000;
  const nuevos = resumenes.filter((r) => new Date(r.creado_en).getTime() > hace24).length;
  const meta = user.user_metadata ?? {};
  const nombre = (typeof meta.full_name === "string" && meta.full_name) || (typeof meta.name === "string" && meta.name) || null;
  const foto = (typeof meta.avatar_url === "string" && meta.avatar_url) || null;
  const proveedores = (user.app_metadata?.providers as string[] | undefined) ?? [];

  return (
    <ArmazonPanel
      email={user.email ?? ""}
      nombre={nombre}
      foto={foto}
      planId={cuenta.plan.id}
      activos={cuenta.activos}
      conGoogle={proveedores.includes("google")}
      conversaciones={conversaciones}
      resumenes={resumenes}
      nuevos={nuevos}
    >
      {children}
    </ArmazonPanel>
  );
}
