import type { SupabaseClient } from "@supabase/supabase-js";
import { esIdAgente } from "@/lib/agentes";
import { APP_POR_ID } from "@/lib/conexiones/catalogo";
import { armarHecho } from "@/lib/hecho";
import type { IdApp } from "@/lib/nucleo-tipos";
import { cargarPendientes, negociosDe, opcionesPendientes } from "@/lib/pendientes";
import { cuandoEnPalabras } from "@/lib/tareas-tiempo";
import { haceTexto, type FilaHecha, type FilaTeNecesita, type FilaViene } from "@/components/panel/Hoy";
import { nombreRemitente } from "@/components/panel/remitente";

/**
 * Lo que lleva «Hoy» en /panel (solo lee; RLS deja ver a cada quien lo suyo):
 * - Te necesita: lo que espera tu OK (src/lib/pendientes.ts) y lo que Atendel
 *   dejó por revisar (archivos, informes y la revisión del día).
 * - Lo que viene: las próximas corridas de Tareas.
 * - Lo que ya hice: lo último que se terminó (el mismo armado que Hecho).
 * El total de «Te necesita» se cuenta igual que el número del menú.
 */
export type DatosHoy = {
  teNecesita: FilaTeNecesita[];
  total: number;
  /** De ese total: lo que espera tu OK (acciones, WhatsApp, envíos, correos) y lo que hay en la Oficina por revisar. */
  totalOk: number;
  totalOficina: number;
  viene: FilaViene[];
  hecho: FilaHecha[];
};

const corto = (t: string, max: number) => {
  const limpio = t.replace(/\s+/g, " ").trim();
  return limpio.length > max ? `${limpio.slice(0, max - 1).trimEnd()}…` : limpio;
};
const mayuscula = (t: string) => t.charAt(0).toLocaleUpperCase("es-MX") + t.slice(1);

export async function cargarHoy(
  supabase: SupabaseClient,
  userId: string,
  cuenta: { plan: { id: string }; activos: readonly string[] },
  conGoogle: boolean,
  ahora: number,
): Promise<DatosHoy> {
  const ids = await negociosDe(supabase, userId);
  const [pend, archivos, trabajos, rev, tareas, msjs, convs, res, arch, envios] = await Promise.all([
    cargarPendientes(userId, opcionesPendientes(cuenta.plan.id, conGoogle, cuenta.activos), 5),
    supabase.from("archivos").select("id, nombre, agente, creado_en", { count: "exact" }).eq("owner_id", userId).eq("revision", "revisar").order("creado_en", { ascending: false }).limit(5),
    supabase.from("trabajos").select("id, agente, titulo, detalle, creado_en", { count: "exact" }).eq("owner_id", userId).eq("revision", "revisar").order("creado_en", { ascending: false }).limit(5),
    supabase.from("revisiones").select("id, faltan").eq("owner_id", userId).is("leido_en", null).gt("faltan", 0).order("fecha", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("tareas").select("id, titulo, proxima, zona").eq("owner_id", userId).eq("activa", true).not("proxima", "is", null).order("proxima", { ascending: true }).limit(3),
    supabase.from("mensajes").select("conversacion_id, rol, contenido, agente, creado_en").eq("owner_id", userId).order("creado_en", { ascending: false }).limit(150),
    supabase.from("conversaciones").select("id, agente").eq("owner_id", userId).order("actualizado_en", { ascending: false }).limit(60),
    supabase.from("resumenes_correo").select("id, remitente, asunto, creado_en").in("negocio_id", ids).order("creado_en", { ascending: false }).limit(10),
    supabase.from("archivos").select("id, nombre, agente, conversacion_id, creado_en").eq("owner_id", userId).order("creado_en", { ascending: false }).limit(15),
    supabase.from("envios").select("id, agente, destinatarios, estado, creado_en, resuelto_en, archivos(nombre)").eq("owner_id", userId).in("estado", ["aprobado", "enviado"]).order("creado_en", { ascending: false }).limit(10),
  ]);

  const quien = (d: { nombre: string }[]) => d.map((x) => x.nombre).filter(Boolean).join(", ");
  const filas: FilaTeNecesita[] = [
    ...pend.acciones.map((a) => ({ id: `a-${a.id}`, titulo: corto(a.resumen, 120), detalle: `En ${APP_POR_ID[a.app as IdApp]?.nombre ?? "tu app"}`, href: "/panel?vista=pendientes" })),
    ...pend.whatsapp.map((w) => ({ id: `w-${w.id}`, titulo: `${w.nombre || `+${w.telefono}`} te escribió por WhatsApp`, detalle: corto(w.texto, 100), agente: "lola" as const, href: "/panel?vista=pendientes" })),
    ...pend.envios.map((e) => ({
      id: `e-${e.id}`,
      titulo: e.archivo ? `Mandar «${corto(e.archivo, 60)}» por WhatsApp` : "Mandar un mensaje por WhatsApp",
      detalle: quien(e.destinatarios) ? `A ${corto(quien(e.destinatarios), 80)}` : corto(e.mensaje, 100),
      agente: esIdAgente(e.agente) ? e.agente : undefined,
      href: "/panel?vista=pendientes",
    })),
    ...pend.lista.map((c) => ({
      id: `c-${c.id}`,
      titulo: corto(`Contestar a ${nombreRemitente(c.remitente)}${c.asunto ? `: ${c.asunto}` : ""}`, 120),
      detalle: corto(c.accion_sugerida, 100),
      agente: "clara" as const,
      href: "/panel?vista=pendientes",
    })),
    ...(archivos.data ?? []).map((a) => ({ id: `f-${a.id}`, titulo: corto(String(a.nombre), 120), detalle: "Para revisar y aprobar", agente: esIdAgente(a.agente) ? a.agente : undefined, href: "/panel?vista=oficina" })),
    ...(trabajos.data ?? []).map((t) => ({
      id: `t-${t.id}`,
      titulo: corto(String(t.titulo), 120),
      detalle: t.detalle ? corto(String(t.detalle), 100) : "Lo hizo por su cuenta. Espera tu revisión",
      agente: esIdAgente(t.agente) ? t.agente : undefined,
      href: "/panel?vista=oficina",
    })),
    ...(rev.data ? [{ id: `r-${rev.data.id}`, titulo: "Revisión del día", detalle: `${Number(rev.data.faltan)} ${Number(rev.data.faltan) === 1 ? "cosa por ver" : "cosas por ver"}`, href: "/panel?vista=oficina" }] : []),
    ...pend.pasos.filter((p) => !p.listo).map((p) => ({ id: `p-${p.id}`, titulo: p.titulo, detalle: corto(p.detalle, 100), href: p.href })),
  ];
  const totalOk = pend.total ?? 0;
  const totalOficina = (archivos.count ?? 0) + (trabajos.count ?? 0) + (rev.data ? 1 : 0);
  const total = totalOk + totalOficina;

  const viene: FilaViene[] = (tareas.data ?? []).flatMap((t) => (t.proxima ? [{ id: String(t.id), titulo: corto(String(t.titulo), 100), cuando: mayuscula(cuandoEnPalabras(String(t.proxima), String(t.zona))) }] : []));

  const hecho: FilaHecha[] = armarHecho(msjs.data ?? [], convs.data ?? [], res.data ?? [], arch.data ?? [], envios.data ?? [])
    .slice(0, 5)
    .map((h) => ({ id: h.id, titulo: corto(h.titulo, 110), agente: h.agente, hace: haceTexto(h.en, ahora), href: h.href }));

  return { teNecesita: filas, total, totalOk, totalOficina, viene, hecho };
}
