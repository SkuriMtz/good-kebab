import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { ArmazonPanel } from "@/components/dashboard/ArmazonPanel";
import { nombresAgentes } from "@/components/dashboard/nombres";
import { esIdAgente, type IdAgente } from "@/lib/agentes";
import { cargarCuenta } from "@/lib/cuenta";
import { cargarPendientes, opcionesPendientes } from "@/lib/pendientes";
import { createClient } from "@/lib/supabase/server";
import { VERSION } from "@/lib/version";

/**
 * El armazón del panel (barra superior, menú lateral, pie) con los datos
 * reales de la cuenta. Se queda puesto al moverse entre Resumen,
 * Chat, Agentes, Pendientes, Estadísticas y Correo. Solo lee: plan, equipo,
 * uso, negocio, los grupos de chat y los pendientes (src/lib/pendientes.ts,
 * contados igual que en el Inicio). RLS deja ver a cada quien solo lo suyo.
 */
export default async function PanelLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // El middleware ya redirige a /entrar sin sesión; esto es una segunda barrera
  if (!user) redirect("/entrar");

  const proveedores = (user.app_metadata?.providers as string[] | undefined) ?? [];
  const conGoogle = proveedores.includes("google");
  const cuenta = await cargarCuenta(supabase, user.id);

  const [{ data: convs }, pendientes] = await Promise.all([
    // Los chats en grupo del menú (una conversación con participantes es un grupo)
    supabase
      .from("conversaciones")
      .select("id, participantes, tema, actualizado_en")
      .eq("owner_id", user.id)
      .not("participantes", "is", null)
      .order("actualizado_en", { ascending: false })
      .limit(6),
    // El número de "Pendientes" y los primeros pasos, contados igual que en el Inicio y en Pendientes
    // (con las mismas 5 filas que pide el Inicio, la lectura se comparte)
    cargarPendientes(user.id, opcionesPendientes(cuenta.plan.id, conGoogle, cuenta.activos), 5),
  ]);

  const grupos = (convs ?? [])
    .map((c) => ({ ...c, agentes: ((c.participantes as unknown[] | null) ?? []).filter(esIdAgente) as IdAgente[] }))
    .filter((c) => c.agentes.length >= 2)
    .map((c) => ({ id: String(c.id), nombre: (c.tema as string | null) || nombresAgentes(c.agentes), agentes: c.agentes }));

  const meta = user.user_metadata ?? {};
  const nombre = (meta.full_name as string | undefined) || (meta.name as string | undefined) || user.email || "Tu cuenta";
  const foto = (meta.avatar_url as string | undefined) || (meta.picture as string | undefined) || null;

  return (
    <ArmazonPanel
      datos={{
        correo: user.email ?? "",
        nombre,
        foto,
        planId: cuenta.plan.id,
        activos: cuenta.activos,
        negocio: cuenta.negocio,
        usados: cuenta.usados,
        conGoogle,
        grupos,
        pasos: pendientes.todosLosPasos,
        pendientes: pendientes.total,
        version: VERSION,
      }}
    >
      {children}
    </ArmazonPanel>
  );
}
