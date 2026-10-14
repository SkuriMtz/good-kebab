import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { TableroPanel, type ConversacionPanel, type ResumenAviso } from "@/components/dashboard/TableroPanel";
import { esIdAgente } from "@/lib/agentes";
import { cargarCuenta } from "@/lib/cuenta";
import { createClient } from "@/lib/supabase/server";

/**
 * La casa del panel: barra superior, menú lateral (cajón en celular) y
 * barra inferior, con los datos reales de la cuenta. Cada página del panel
 * (Resumen y Correo, Conversaciones, Agentes) se pinta adentro.
 * Solo lee lo que ya existía, con RLS: cada quien ve lo suyo.
 */
export default async function PanelLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // El middleware ya redirige a /entrar sin sesión; esto es una segunda barrera
  if (!user) redirect("/entrar");

  const [cuenta, { data: convs }, { data: resumenes }] = await Promise.all([
    cargarCuenta(supabase, user.id),
    supabase
      .from("conversaciones")
      .select("id, agente, titulo, actualizado_en, participantes, tema")
      .eq("owner_id", user.id)
      .order("actualizado_en", { ascending: false })
      .limit(60),
    supabase.from("resumenes_correo").select("id, remitente, asunto, creado_en").order("creado_en", { ascending: false }).limit(5),
  ]);

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const texto = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  const email = user.email ?? "";
  const proveedores = (user.app_metadata?.providers as string[] | undefined) ?? [];

  return (
    <TableroPanel
      datos={{
        email,
        nombre: texto(meta.full_name) ?? texto(meta.name) ?? email.split("@")[0] ?? "Tu cuenta",
        foto: texto(meta.avatar_url) ?? texto(meta.picture),
        conGoogle: proveedores.includes("google"),
        plan: cuenta.plan,
        usados: cuenta.usados,
        activos: cuenta.activos,
        elegidos: cuenta.elegidos,
        negocio: cuenta.negocio,
        conversaciones: ((convs ?? []) as ConversacionPanel[]).filter((c) => esIdAgente(c.agente)),
        resumenes: (resumenes ?? []) as ResumenAviso[],
      }}
    >
      {children}
    </TableroPanel>
  );
}
