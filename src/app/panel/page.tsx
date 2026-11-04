import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ActividadPanel, PendientesPanel, ResumenPanel, type ConversacionReal, type CuentasResumen, type ResumenReal } from "@/components/dashboard/ResumenPanel";
import { VistaEstadisticas } from "@/components/dashboard/estadisticas/VistaEstadisticas";
import { esIdAgente } from "@/lib/agentes";
import { cargarCuenta } from "@/lib/cuenta";
import { cargarEstadisticas, periodoDe } from "@/lib/estadisticas";
import { cargarPendientes, opcionesPendientes } from "@/lib/pendientes";
import { createClient } from "@/lib/supabase/server";
import { Panel } from "./Panel";

export const metadata: Metadata = { title: "Panel" };

const DIA = 24 * 60 * 60 * 1000;

/**
 * /panel: el inicio del panel con los datos reales de la cuenta.
 * /panel?vista=pendientes (&tipo=correos|pasos, &de=remitente): lo que espera algo de ti.
 * /panel?vista=estadisticas: las estadísticas de tu equipo.
 * /panel?vista=correo: Correo con Clara (modo de prueba, Gmail e historial).
 * /panel?vista=actividad (&hora=10): la actividad completa, o la de esa hora del día.
 * Solo lee (RLS deja ver a cada quien solo lo suyo); no cambia datos ni la API.
 */
export default async function PanelPage({ searchParams }: { searchParams: { vista?: string; tipo?: string; de?: string; periodo?: string; hora?: string } }) {
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

  // Actividad: solo lo último que pasó (conversaciones y correos resumidos)
  if (searchParams.vista === "actividad") {
    const [convs, resumenes] = await Promise.all([
      supabase
        .from("conversaciones")
        .select("id, agente, titulo, actualizado_en, participantes, tema")
        .eq("owner_id", user.id)
        .order("actualizado_en", { ascending: false })
        .limit(20),
      supabase.from("resumenes_correo").select("id, remitente, asunto, resumen, accion_sugerida, creado_en").order("creado_en", { ascending: false }).limit(12),
    ]);
    const hora = Number(searchParams.hora);
    return (
      <ActividadPanel
        conversaciones={((convs.data ?? []) as ConversacionReal[]).filter((c) => esIdAgente(c.agente))}
        resumenes={(resumenes.data ?? []) as ResumenReal[]}
        hora={searchParams.hora !== undefined && Number.isInteger(hora) && hora >= 0 && hora <= 23 ? hora : undefined}
      />
    );
  }

  const datosCuenta = await cargarCuenta(supabase, user.id);
  const enPendientes = searchParams.vista === "pendientes";
  // Los pendientes se cuentan igual que en el menú (src/lib/pendientes.ts); en su vista se listan más
  const pendientesPromesa = cargarPendientes(user.id, opcionesPendientes(datosCuenta.plan.id, conGoogle, datosCuenta.activos), enPendientes ? 100 : 5);
  const comun = { planId: datosCuenta.plan.id, activos: datosCuenta.activos, conGoogle };

  if (enPendientes) {
    return <PendientesPanel {...comun} pendientes={await pendientesPromesa} tipo={searchParams.tipo} de={searchParams.de} />;
  }

  // El inicio: las cuentas de la semana (contra la anterior) solo se piden aquí
  const ahora = Date.now();
  const hace7 = new Date(ahora - 7 * DIA).toISOString();
  const hace14 = new Date(ahora - 14 * DIA).toISOString();
  const cuenta = (consulta: PromiseLike<{ count: number | null; error: unknown }>) => Promise.resolve(consulta).then((r) => (r.error ? null : (r.count ?? 0)));

  const [pendientes, semana, mensajes7, mensajes14, nuevas7, nuevas14, correos7, correos14] = await Promise.all([
    pendientesPromesa,
    // Lo que hizo cada agente esta semana: sus conversaciones de los últimos 7 días
    supabase.from("conversaciones").select("agente, participantes").eq("owner_id", user.id).gte("actualizado_en", hace7).limit(1000),
    cuenta(supabase.from("mensajes").select("id", { count: "exact", head: true }).eq("owner_id", user.id).gte("creado_en", hace7)),
    cuenta(supabase.from("mensajes").select("id", { count: "exact", head: true }).eq("owner_id", user.id).gte("creado_en", hace14).lt("creado_en", hace7)),
    cuenta(supabase.from("conversaciones").select("id", { count: "exact", head: true }).eq("owner_id", user.id).gte("creado_en", hace7)),
    cuenta(supabase.from("conversaciones").select("id", { count: "exact", head: true }).eq("owner_id", user.id).gte("creado_en", hace14).lt("creado_en", hace7)),
    cuenta(supabase.from("resumenes_correo").select("id", { count: "exact", head: true }).gte("creado_en", hace7)),
    cuenta(supabase.from("resumenes_correo").select("id", { count: "exact", head: true }).gte("creado_en", hace14).lt("creado_en", hace7)),
  ]);

  const meta = user.user_metadata ?? {};
  const nombreCompleto = (meta.full_name as string | undefined) || (meta.name as string | undefined);

  const cuentas: CuentasResumen = {
    semana: semana.error ? null : ((semana.data ?? []) as { agente: string; participantes: string[] | null }[]),
    mensajes: [mensajes7, mensajes14],
    nuevas: [nuevas7, nuevas14],
    correos: [correos7, correos14],
  };

  return (
    <ResumenPanel
      {...comun}
      pendientes={pendientes}
      nombre={nombreCompleto ? nombreCompleto.split(" ")[0] : undefined}
      negocio={datosCuenta.negocio}
      usados={datosCuenta.usados}
      cuentas={cuentas}
    />
  );
}
