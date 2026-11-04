import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ActividadPanel, AjustesPanel, PendientesPanel, ResumenPanel, type ConversacionReal, type ResumenReal } from "@/components/dashboard/ResumenPanel";
import { VistaEstadisticas } from "@/components/dashboard/estadisticas/VistaEstadisticas";
import { esIdAgente } from "@/lib/agentes";
import { cargarCuenta } from "@/lib/cuenta";
import { cargarEstadisticas, inicioDia, periodoDe, sumarDias } from "@/lib/estadisticas";
import { cargarPendientes, opcionesPendientes } from "@/lib/pendientes";
import { createClient } from "@/lib/supabase/server";
import { Panel } from "./Panel";

export const metadata: Metadata = { title: "Panel" };

/**
 * /panel: el inicio del panel con los datos reales de la cuenta.
 * /panel?vista=pendientes (&tipo=correos|pasos, &de=remitente): lo que espera algo de ti.
 * /panel?vista=estadisticas: las estadísticas de tu equipo.
 * /panel?vista=correo (&de=remitente): Correo con Clara (modo de prueba, Gmail e historial).
 * /panel?vista=ajustes: el plan (solo se ve), la apariencia, el correo y el equipo.
 * /panel?vista=actividad (&hora=10): la actividad completa, o la de esa hora del día.
 * Solo lee (RLS deja ver a cada quien solo lo suyo); no cambia datos ni la API.
 */
export default async function PanelPage({ searchParams }: { searchParams: { vista?: string; tipo?: string; de?: string; accion?: string; periodo?: string; hora?: string; dia?: string; agente?: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // El middleware ya redirige a /entrar sin sesión; esto es una segunda barrera
  if (!user) redirect("/entrar");

  const proveedores = (user.app_metadata?.providers as string[] | undefined) ?? [];
  const conGoogle = proveedores.includes("google");

  if (searchParams.vista === "correo") return <Panel conGoogle={conGoogle} de={typeof searchParams.de === "string" ? searchParams.de : undefined} />;

  if (searchParams.vista === "estadisticas") {
    const periodo = periodoDe(searchParams.periodo);
    const datos = await cargarEstadisticas(supabase, user.id, periodo, cargarCuenta(supabase, user.id));
    return <VistaEstadisticas datos={datos} periodo={periodo} base="/panel" />;
  }

  // Actividad: lo último que pasó (conversaciones y correos resumidos). Con &dia=, lo de ese día;
  // con &hora=, se mira más atrás para encontrar lo de esa hora.
  if (searchParams.vista === "actividad") {
    const dia = searchParams.dia && /^\d{4}-\d{2}-\d{2}$/.test(searchParams.dia) ? searchParams.dia : undefined;
    const tope = dia || searchParams.hora !== undefined ? 200 : 20;
    const desde = dia ? inicioDia(dia).toISOString() : null;
    const hasta = dia ? inicioDia(sumarDias(dia, 1)).toISOString() : null;
    let qConv = supabase.from("conversaciones").select("id, agente, titulo, actualizado_en, participantes, tema").eq("owner_id", user.id);
    let qRes = supabase.from("resumenes_correo").select("id, remitente, asunto, resumen, accion_sugerida, creado_en");
    if (desde && hasta) {
      qConv = qConv.gte("actualizado_en", desde).lt("actualizado_en", hasta);
      qRes = qRes.gte("creado_en", desde).lt("creado_en", hasta);
    }
    const [convs, resumenes] = await Promise.all([
      qConv.order("actualizado_en", { ascending: false }).limit(tope),
      qRes.order("creado_en", { ascending: false }).limit(dia || searchParams.hora !== undefined ? 200 : 12),
    ]);
    const hora = Number(searchParams.hora);
    return (
      <ActividadPanel
        conversaciones={((convs.data ?? []) as ConversacionReal[]).filter((c) => esIdAgente(c.agente))}
        resumenes={(resumenes.data ?? []) as ResumenReal[]}
        hora={searchParams.hora !== undefined && Number.isInteger(hora) && hora >= 0 && hora <= 23 ? hora : undefined}
        dia={dia}
        agente={esIdAgente(searchParams.agente) ? searchParams.agente : undefined}
      />
    );
  }

  const datosCuenta = await cargarCuenta(supabase, user.id);
  const enPendientes = searchParams.vista === "pendientes";
  // Los pendientes se cuentan igual que en el menú (src/lib/pendientes.ts); en su vista se listan más
  const pendientesPromesa = cargarPendientes(user.id, opcionesPendientes(datosCuenta.plan.id, conGoogle, datosCuenta.activos), enPendientes ? 100 : 5);
  const comun = { planId: datosCuenta.plan.id, activos: datosCuenta.activos, conGoogle };

  if (enPendientes) {
    return <PendientesPanel {...comun} pendientes={await pendientesPromesa} tipo={searchParams.tipo} de={searchParams.de} accion={searchParams.accion?.slice(0, 200)} />;
  }

  if (searchParams.vista === "ajustes") {
    return <AjustesPanel planId={datosCuenta.plan.id} usados={datosCuenta.usados} conGoogle={conGoogle} />;
  }

  // El inicio: los números de 7 días salen de las mismas estadísticas que su vista (solo se piden aquí)
  const [pendientes, est] = await Promise.all([pendientesPromesa, cargarEstadisticas(supabase, user.id, "7d", datosCuenta).catch(() => null)]);

  const meta = user.user_metadata ?? {};
  const nombreCompleto = (meta.full_name as string | undefined) || (meta.name as string | undefined);

  return (
    <ResumenPanel
      {...comun}
      pendientes={pendientes}
      nombre={nombreCompleto ? nombreCompleto.split(" ")[0] : undefined}
      negocio={datosCuenta.negocio}
      usados={datosCuenta.usados}
      est={est}
    />
  );
}
