import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { VistaNegocio } from "@/components/dashboard/estadisticas-negocio/VistaNegocio";
import { ActividadReal, type ConvActividad, type ResumenActividad } from "@/components/panel/Actividad";
import { Hecho } from "@/components/panel/Hecho";
import { OficinaReal, type ItemOficina, type Revision, type TipoArchivo } from "@/components/panel/Oficina";
import { partesDe } from "@/components/panel/RevisionDiaria";
import { limpiarAjustes } from "@/lib/ajustes";
import { armarHecho } from "@/lib/hecho";
import { Seccion } from "@/components/panel/Secciones";
import { CitasReal, PendientesReal } from "@/components/panel/SeccionesReal";
import { TuNegocio, pestanaDe } from "@/components/panel/negocio/TuNegocio";
import { saludoDeHora } from "@/components/panel/pedidos";
import { esIdAgente } from "@/lib/agentes";
import { cargarCuenta } from "@/lib/cuenta";
import { leerUso } from "@/lib/uso";
import { bloqueoConHora } from "@/lib/uso-estado";
import { inicioDia, periodoDe, sumarDias } from "@/lib/estadisticas";
import { cargarNegocio } from "@/lib/estadisticas-negocio";
import { cargarPendientes, correosFiltrados, negociosDe, opcionesPendientes } from "@/lib/pendientes";
import { createClient } from "@/lib/supabase/server";
import { Chat, type Conversacion } from "./chat/Chat";
import { Panel } from "./Panel";

export const metadata: Metadata = { title: "Panel" };

type Parametros = { vista?: string; tipo?: string; de?: string; accion?: string; periodo?: string; c?: string; agente?: string; pide?: string; area?: string; hora?: string; dia?: string; tab?: string; conectada?: string; error?: string; app?: string };

/**
 * /panel: el panel nuevo con los datos reales de la cuenta. Solo lee (RLS
 * deja ver a cada quien solo lo suyo); no cambia datos ni la API.
 * - /panel (&agente=lola, &pide=texto, &area=citas): el Inicio, que ES un chat nuevo.
 * - /panel?c=ID: esa conversación, en el mismo lugar.
 * - ?vista=pendientes (&tipo=correos|pasos, &de=remitente, &accion=…): el tablero.
 * - ?vista=citas (&de=cliente, &dia=AAAA-MM-DD): la agenda de Lola (vacía hasta conectar WhatsApp).
 * - ?vista=negocio (&tab=perfil|documentos|apps; al regresar del permiso &conectada=app o &error=código&app=app): Tu negocio.
 * - ?vista=estadisticas (&periodo=7d|30d|mes): cómo va el negocio (VistaNegocio, del trabajador B).
 * - ?vista=pendientes&tab=hecho (o ?vista=hecho): la pestaña Hecho de Pendientes, lo que el
 *   equipo ya terminó (pedidos con respuesta y correos resumidos).
 * - ?vista=actividad (&hora=10 o &dia=AAAA-MM-DD): lo que pasó (se llega desde Estadísticas).
 * - ?vista=correo (&de=remitente): Correo con Clara (modo de prueba, Gmail e historial).
 * - ?vista=oficina: lo que tu equipo te dejó (archivos) para revisar, aprobar o pedir cambios.
 * - ?vista=ajustes: el Inicio con la ventana de Ajustes abierta (la abre el armazón).
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

  if (searchParams.vista === "oficina") {
    const [{ data }, { data: rev }, { data: filaAjustes }, { data: hechos }] = await Promise.all([
      supabase.from("archivos").select("id, nombre, tipo, agente, conversacion_id, creado_en, revision").eq("owner_id", user.id).order("creado_en", { ascending: false }).limit(100),
      // La revisión diaria más reciente (la arma la base de datos sola, migración 0015)
      supabase.from("revisiones").select("id, fecha, creado_en, partes, faltan, leido_en").eq("owner_id", user.id).order("fecha", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("ajustes_cuenta").select("datos").eq("owner_id", user.id).maybeSingle(),
      // Lo que hicieron por su cuenta (migración 0016)
      supabase.from("trabajos").select("id, agente, titulo, detalle, partes, revision, creado_en").eq("owner_id", user.id).order("creado_en", { ascending: false }).limit(50),
    ]);
    const aj = limpiarAjustes(filaAjustes?.datos);
    const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: aj.zonaHoraria }).format(new Date());
    const TIPOS: TipoArchivo[] = ["pptx", "xlsx", "docx", "pdf"];
    const REVISIONES: Revision[] = ["revisar", "aprobado", "cambios"];
    const items: ItemOficina[] = (data ?? []).map((a) => ({
      id: String(a.id),
      nombre: String(a.nombre),
      tipo: TIPOS.find((t) => t === a.tipo) ?? "pptx",
      agente: esIdAgente(a.agente) ? a.agente : null,
      en: String(a.creado_en),
      revision: REVISIONES.find((r) => r === a.revision) ?? "revisar",
      abrir: `/api/archivos/${a.id}`,
      conversacion: a.conversacion_id ? String(a.conversacion_id) : undefined,
      tabla: "archivos" as const,
    }));
    for (const t of hechos ?? []) {
      const partes = (Array.isArray(t.partes) ? t.partes : []).flatMap((p) => {
        const x = p as { titulo?: unknown; texto?: unknown };
        return typeof x.titulo === "string" && typeof x.texto === "string" ? [{ titulo: x.titulo, texto: x.texto }] : [];
      });
      if (!partes.length) continue;
      items.push({
        id: String(t.id),
        nombre: String(t.titulo),
        tipo: "informe",
        agente: esIdAgente(t.agente) ? t.agente : null,
        en: String(t.creado_en),
        revision: REVISIONES.find((r) => r === t.revision) ?? "revisar",
        detalle: t.detalle ? String(t.detalle) : undefined,
        vista: { tipo: "texto", partes },
        tabla: "trabajos",
      });
    }
    items.sort((a, b) => b.en.localeCompare(a.en));
    return (
      <OficinaReal
        items={items}
        ahora={Date.now()}
        hoy={hoy}
        hora={aj.horaRevision}
        zona={aj.zonaHoraria}
        activa={aj.revisionDiaria === "activa"}
        revision={
          rev
            ? { id: String(rev.id), fecha: String(rev.fecha), creado: String(rev.creado_en), partes: partesDe(rev.partes), faltan: Number(rev.faltan) || 0, leida: rev.leido_en !== null }
            : null
        }
      />
    );
  }

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

  if (searchParams.vista === "hecho" || (searchParams.vista === "pendientes" && searchParams.tab === "hecho")) {
    // Lo que el equipo ya terminó: cada pedido con respuesta y los correos que Clara resumió
    const ids = await negociosDe(supabase, user.id);
    const [{ data: msjs }, { data: convs }, { data: res }, { data: archivos }, { data: envios }] = await Promise.all([
      supabase.from("mensajes").select("conversacion_id, rol, contenido, agente, creado_en").eq("owner_id", user.id).order("creado_en", { ascending: false }).limit(400),
      supabase.from("conversaciones").select("id, agente").eq("owner_id", user.id).order("actualizado_en", { ascending: false }).limit(200),
      supabase.from("resumenes_correo").select("id, remitente, asunto, creado_en").in("negocio_id", ids).order("creado_en", { ascending: false }).limit(30),
      // Lo que armó tu equipo y lo que aprobaste mandar (migración 0009; sin ella, nada)
      supabase.from("archivos").select("id, nombre, agente, conversacion_id, creado_en").eq("owner_id", user.id).order("creado_en", { ascending: false }).limit(60),
      supabase.from("envios").select("id, agente, destinatarios, estado, creado_en, resuelto_en, archivos(nombre)").eq("owner_id", user.id).in("estado", ["aprobado", "enviado"]).order("creado_en", { ascending: false }).limit(40),
    ]);
    return <Hecho items={armarHecho(msjs ?? [], convs ?? [], res ?? [], archivos ?? [], envios ?? [])} ahora={Date.now()} base="/panel?vista=pendientes" />;
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
  const bloqueo = bloqueoConHora(await leerUso(supabase, user.id, cuenta.plan));

  if (searchParams.vista === "negocio") return <TuNegocio tab={pestanaDe(searchParams.tab)} plan={cuenta.plan.id} conectada={texto(searchParams.conectada, 40)} error={texto(searchParams.error, 40)} app={texto(searchParams.app, 40)} />;

  if (searchParams.vista === "citas") return <CitasReal conLola={cuenta.activos.includes("lola")} de={texto(searchParams.de)} dia={texto(searchParams.dia, 10)} />;

  if (searchParams.vista === "pendientes") {
    // Los pendientes se cuentan igual que en el menú (src/lib/pendientes.ts); en su vista se listan más
    const pendientes = await cargarPendientes(user.id, opcionesPendientes(cuenta.plan.id, conGoogle, cuenta.activos), 100);
    // Con ?de= o ?accion= (desde Estadísticas o Correo) se busca en la base, no solo en los 100 más recientes
    const de = texto(searchParams.de);
    const accion = texto(searchParams.accion);
    const filtrados = de || accion ? await correosFiltrados(user.id, { de, accion }) : null;
    return (
      <PendientesReal
        correos={filtrados ?? pendientes.lista}
        pasos={pendientes.pasos}
        envios={pendientes.envios}
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
      bloqueoInicial={bloqueo}
      conversacionesIniciales={conversaciones}
      agenteInicial={agente}
      conversacionInicial={texto(searchParams.c, 100) ?? null}
      textoInicial={texto(searchParams.pide, 2000)}
      saludo={nombre ? `${saludoDeHora()}, ${nombre}` : saludoDeHora()}
      conGoogle={conGoogle}
    />
  );
}
