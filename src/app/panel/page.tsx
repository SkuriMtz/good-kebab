import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { aFecha } from "@/components/dashboard/actividad";
import { Resumen } from "@/components/dashboard/Resumen";
import { armarResumen, diaLocal, inicioGrafica, type FilaConversacion, type FilaResumenCorreo } from "@/components/dashboard/resumenReal";
import { esIdAgente, type IdAgente } from "@/lib/agentes";
import { cargarCuenta } from "@/lib/cuenta";
import { createClient } from "@/lib/supabase/server";
import { Panel } from "./Panel";

export const metadata: Metadata = { title: "Panel" };

/** Lee todas las filas de una consulta en tandas de 1,000 (el tope de Supabase), hasta 20 tandas. */
async function todas<T>(pedir: (desde: number, hasta: number) => PromiseLike<{ data: T[] | null }>) {
  const filas: T[] = [];
  for (let i = 0; i < 20; i++) {
    const { data } = await pedir(i * 1000, i * 1000 + 999);
    if (!data?.length) break;
    filas.push(...data);
    if (data.length < 1000) break;
  }
  return filas;
}

type FilaMensaje = { creado_en: string; agente: string | null; conversaciones: { agente: string } | { agente: string }[] | null };

async function cargarActividad(supabase: SupabaseClient, userId: string, ahora: Date) {
  // Desde el lunes de hace 25 semanas (con medio día de margen por la zona horaria)
  const desde = new Date(aFecha(inicioGrafica(diaLocal(ahora.toISOString()))).getTime() - 12 * 3_600_000).toISOString();
  const [mensajes, resumenes, { data: convs }] = await Promise.all([
    todas<FilaMensaje>((a, b) =>
      supabase
        .from("mensajes")
        .select("creado_en, agente, conversaciones(agente)")
        .eq("rol", "assistant")
        .gte("creado_en", desde)
        .order("creado_en", { ascending: true })
        .range(a, b),
    ),
    // RLS: solo regresan los resúmenes del negocio de quien inició sesión
    todas<FilaResumenCorreo>((a, b) =>
      supabase
        .from("resumenes_correo")
        .select("id, remitente, asunto, resumen, accion_sugerida, creado_en")
        .gte("creado_en", desde)
        .order("creado_en", { ascending: false })
        .range(a, b),
    ),
    supabase
      .from("conversaciones")
      .select("id, agente, titulo, tema, participantes, actualizado_en")
      .eq("owner_id", userId)
      .order("actualizado_en", { ascending: false })
      .limit(8),
  ]);

  // Quién contestó: el agente del mensaje (en grupos) o el de la conversación
  const agenteDe = (m: FilaMensaje): IdAgente | null => {
    if (esIdAgente(m.agente)) return m.agente;
    const c = Array.isArray(m.conversaciones) ? m.conversaciones[0] : m.conversaciones;
    return c && esIdAgente(c.agente) ? c.agente : null;
  };

  return {
    mensajes: mensajes.map((m) => ({ creado_en: m.creado_en, agente: agenteDe(m) })),
    resumenes,
    conversaciones: (convs ?? []) as FilaConversacion[],
  };
}

/**
 * /panel: el Resumen con los datos reales de la cuenta.
 * /panel?vista=correo: Clara (resumir un correo, Gmail e historial).
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
  if (searchParams.vista === "correo") return <Panel email={user.email ?? ""} conGoogle={conGoogle} />;

  const ahora = new Date();
  const [cuenta, actividad] = await Promise.all([cargarCuenta(supabase, user.id), cargarActividad(supabase, user.id, ahora)]);
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const completo = typeof meta.full_name === "string" ? meta.full_name : typeof meta.name === "string" ? meta.name : "";

  const datos = armarResumen({
    ahora: ahora.toISOString(),
    nombre: completo.split(" ")[0] ?? "",
    correo: user.email ?? "",
    negocio: cuenta.negocio,
    planId: cuenta.plan.id,
    activos: cuenta.activos,
    usados: cuenta.usados,
    conGoogle,
    ...actividad,
  });

  return <Resumen datos={datos} verEquipo={{ etiqueta: "Ver tu equipo", href: "/panel/agentes" }} />;
}
