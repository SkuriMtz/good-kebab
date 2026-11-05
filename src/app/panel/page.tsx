import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { VistaNegocio } from "@/components/dashboard/estadisticas-negocio/VistaNegocio";
import { ActividadReal, type ConvActividad, type ResumenActividad } from "@/components/panel/Actividad";
import { Seccion } from "@/components/panel/Secciones";
import { AjustesReal, CitasReal, PendientesReal } from "@/components/panel/SeccionesReal";
import { TuNegocio, pestanaDe } from "@/components/panel/negocio/TuNegocio";
import { saludoDeHora } from "@/components/panel/pedidos";
import { esIdAgente } from "@/lib/agentes";
import { cargarCuenta } from "@/lib/cuenta";
import { inicioDia, periodoDe, sumarDias } from "@/lib/estadisticas";
import { cargarNegocio } from "@/lib/estadisticas-negocio";
import { cargarPendientes, correosFiltrados, negociosDe, opcionesPendientes } from "@/lib/pendientes";
import { createClient } from "@/lib/supabase/server";
import { Chat, type Conversacion } from "./chat/Chat";
import { Panel } from "./Panel";

export const metadata: Metadata = { title: "Panel" };

type Parametros = { vista?: string; tipo?: string; de?: string; accion?: string; periodo?: string; c?: string; agente?: string; pide?: string; area?: string; hora?: string; dia?: string; tab?: string; conectada?: string };

/**
 * /panel: el panel nuevo con los datos reales de la cuenta. Solo lee (RLS
 * deja ver a cada quien solo lo suyo); no cambia datos ni la API.
 * - /panel (&agente=lola, &pide=texto, &area=citas): el Inicio, que ES un chat nuevo.
 * - /panel?c=ID: esa conversación, en el mismo lugar.
 * - ?vista=pendientes (&tipo=correos|pasos, &de=remitente, &accion=…): el tablero.
 * - ?vista=citas (&de=cliente, &dia=AAAA-MM-DD): la agenda de Lola (vacía hasta conectar WhatsApp).
 * - ?vista=negocio (&tab=perfil|documentos|apps, &conectada=app al regresar del permiso): Tu negocio.
 * - ?vista=estadisticas (&periodo=7d|30d|mes): cómo va el negocio (VistaNegocio, del trabajador B).
 * - ?vista=actividad (&hora=10 o &dia=AAAA-MM-DD): lo que pasó (se llega desde Estadísticas).
 * - ?vista=correo (&de=remitente): Correo con Clara (modo de prueba, Gmail e historial).
 * - ?vista=ajustes: el plan (solo se ve), la apariencia, el correo y el equipo.
 */
export default async function PanelPage({ searchParams }: { searchParams: Parametros }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // El middleware ya redirige a /entrar sin sesión; esto es una segunda barrera
  if (!user) redirect("/entrar");

  const proveedores = (user.app_metadata?.providers as string[] | undefined) ?? [];
  const conGoogle = proveedores.includes("google");
  const texto = (v: unknown, max = 200) => (typeof v === "string" && v ? v.slice(0, max) : undefined);

  if (searchParams.vista === "correo") return <Panel conGoogle={conGoogle} de={texto(searchParams.de)} />;

  if (searchParams.vista === "estadisticas") {
    // Estadísticas centradas en el negocio (trabajador B): su vista trae su propio buscador
    const periodo = periodoDe(searchParams.periodo);
    const datos = await cargarNegocio(supabase, user.id, periodo, cargarCuenta(supabase, user.id));
    return (
      <Seccion buscador={false}>
        <VistaNegocio datos={datos} periodo={periodo} base="/panel" />
      </Seccion>
    );
  }

  if (searchParams.vista === "actividad") {
    // Lo de un día (&dia=) o de una hora del día (&hora=, se mira más atrás para encontrarla)
    const dia = searchParams.dia && /^\d{4}-\d{2}-\d{2}$/.test(searchParams.dia) ? searchParams.dia : undefined;
    const h = Number(searchParams.hora);
    const hora = searchParams.hora !== undefined && Number.isInteger(h) && h >= 0 && h <= 23 ? h : undefined;
    const tope = dia || hora !== undefined ? 200 : 30;
    let qConv = supabase.from("conversaciones").select("id, agente, titulo, actualizado_en").eq("owner_id", user.id);
    // resumenes_correo se filtra también por los negocios de la persona (RLS ya protege; defensa en profundidad)
    const ids = await negociosDe(supabase, user.id);
    let qRes = supabase.from("resumenes_correo").select("id, remitente, asunto, accion_sugerida, creado_en").in("negocio_id", ids);
    if (dia) {
      const desde = inicioDia(dia).toISOString();
      const hasta = inicioDia(sumarDias(dia, 1)).toISOString();
      qConv = qConv.gte("actualizado_en", desde).lt("actualizado_en", hasta);
      qRes = qRes.gte("creado_en", desde).lt("creado_en", hasta);
    }
    const [convs, resumenes] = await Promise.all([qConv.order("actualizado_en", { ascending: false }).limit(tope), qRes.order("creado_en", { ascending: false }).limit(tope)]);
    return (
      <ActividadReal
        conversaciones={((convs.data ?? []) as ConvActividad[]).filter((c) => esIdAgente(c.agente))}
        resumenes={(resumenes.data ?? []) as ResumenActividad[]}
        hora={hora}
        dia={dia}
      />
    );
  }

  const cuenta = await cargarCuenta(supabase, user.id);

  if (searchParams.vista === "negocio") return <TuNegocio tab={pestanaDe(searchParams.tab)} plan={cuenta.plan.id} conectada={texto(searchParams.conectada, 40)} />;

  if (searchParams.vista === "citas") return <CitasReal conLola={cuenta.activos.includes("lola")} de={texto(searchParams.de)} dia={texto(searchParams.dia, 10)} />;

  if (searchParams.vista === "ajustes") {
    return <AjustesReal plan={cuenta.plan.nombre} usados={cuenta.usados} total={cuenta.plan.mensajesMes} conGoogle={conGoogle} activos={cuenta.activos} correo={user.email ?? ""} />;
  }

  const enPendientes = searchParams.vista === "pendientes";
  // Los pendientes se cuentan igual que en el menú (src/lib/pendientes.ts); en su vista se listan más
  const pendientes = await cargarPendientes(user.id, opcionesPendientes(cuenta.plan.id, conGoogle, cuenta.activos), enPendientes ? 100 : 5);

  if (enPendientes) {
    // Con ?de= o ?accion= (desde Estadísticas o Correo) se busca en la base, no solo en los 100 más recientes
    const de = texto(searchParams.de);
    const accion = texto(searchParams.accion);
    const filtrados = de || accion ? await correosFiltrados(user.id, { de, accion }) : null;
    return (
      <PendientesReal
        correos={filtrados ?? pendientes.lista}
        pasos={pendientes.pasos}
        totalCorreos={pendientes.correos}
        tipo={texto(searchParams.tipo)}
        de={texto(searchParams.de)}
        accion={texto(searchParams.accion)}
      />
    );
  }

  // El Inicio y las conversaciones: el chat
  const { data: convs } = await supabase
    .from("conversaciones")
    .select("id, agente, titulo, actualizado_en, participantes, tema")
    .eq("owner_id", user.id)
    .order("actualizado_en", { ascending: false })
    .limit(60);
  const conversaciones = ((convs ?? []) as Conversacion[]).filter((c) => esIdAgente(c.agente));
  const meta = user.user_metadata ?? {};
  const completo = (meta.full_name as string | undefined) || (meta.name as string | undefined);
  const nombre = completo ? completo.split(" ")[0] : undefined;
  const agente = esIdAgente(searchParams.agente) ? searchParams.agente : null;

  return (
    <Chat
      planId={cuenta.plan.id}
      activos={cuenta.activos}
      usadosIniciales={cuenta.usados}
      conversacionesIniciales={conversaciones}
      agenteInicial={agente}
      conversacionInicial={texto(searchParams.c, 100) ?? null}
      textoInicial={texto(searchParams.pide, 2000)}
      saludo={nombre ? `${saludoDeHora()}, ${nombre}` : saludoDeHora()}
      pendientes={pendientes.total}
      conGoogle={conGoogle}
    />
  );
}
