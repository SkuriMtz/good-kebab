import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { ArmazonReal } from "@/components/panel/ArmazonReal";
import { esIdAgente, type IdAgente } from "@/lib/agentes";
import { cargarCuenta } from "@/lib/cuenta";
import { cargarPendientes, opcionesPendientes } from "@/lib/pendientes";
import { createClient } from "@/lib/supabase/server";
import type { ChatMenu } from "@/components/panel/Armazon";

/**
 * El armazón del panel nuevo (menú de 288px con Fijados y Recientes, y el
 * pie con tu cuenta) con los datos reales de la cuenta. Se queda puesto al
 * moverse entre el Inicio (que es un chat nuevo), las conversaciones y las
 * secciones. Solo lee: plan, equipo, las conversaciones y los pendientes
 * (src/lib/pendientes.ts, contados igual en todas partes). RLS deja ver a
 * cada quien solo lo suyo.
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
    supabase
      .from("conversaciones")
      .select("id, agente, titulo, tema, participantes, actualizado_en")
      .eq("owner_id", user.id)
      .order("actualizado_en", { ascending: false })
      .limit(40),
    // Las mismas 5 filas que pide el Inicio: la lectura se comparte (cache)
    cargarPendientes(user.id, opcionesPendientes(cuenta.plan.id, conGoogle, cuenta.activos), 5),
  ]);

  // Fijados: los grupos con nombre. Recientes: todo lo demás (también "Todo el equipo")
  const fijados: ChatMenu[] = [];
  const recientes: ChatMenu[] = [];
  for (const c of convs ?? []) {
    const id = String(c.id);
    const agente = esIdAgente(c.agente) ? c.agente : null;
    const grupo = ((c.participantes as unknown[] | null) ?? []).filter(esIdAgente) as IdAgente[];
    const agentes = grupo.length >= 2 ? grupo : agente ? [agente] : [];
    if (!agentes.length) continue;
    const titulo = ((c.tema as string | null) || (c.titulo as string | null) || "Conversación").replace(/\s+/g, " ").trim();
    const item = { id, titulo, href: `/panel?c=${encodeURIComponent(id)}`, agentes };
    if (grupo.length >= 2 && c.tema) fijados.push(item);
    else if (recientes.length < 20) recientes.push(item);
  }

  const meta = user.user_metadata ?? {};
  const completo = (meta.full_name as string | undefined) || (meta.name as string | undefined) || user.email || "Tu cuenta";
  const nombre = completo.includes("@") ? completo.split("@")[0] : completo.split(" ")[0];

  return (
    <ArmazonReal
      datos={{
        nombre,
        nombreCompleto: completo.includes("@") ? nombre : completo,
        correo: user.email ?? "",
        plan: cuenta.plan.nombre.replace(/^Atendel\s+/, ""),
        usados: cuenta.usados,
        total: cuenta.plan.mensajesMes,
        gmail: conGoogle,
        activos: cuenta.activos,
        pendientes: pendientes.total,
        fijados,
        recientes,
      }}
    >
      {children}
    </ArmazonReal>
  );
}
