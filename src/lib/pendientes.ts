import "server-only";
import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { IdAgente } from "./agentes";
import { textoCompletoDeAccion } from "./datos-fuera";
import { CAMPOS_PERFIL } from "./nucleo-tipos";
import { pasosPanel, type PasoPanel } from "./pasos";
import { createClient } from "./supabase/server";

/**
 * Lo que espera algo de ti en el panel, contado igual en todas partes (el
 * número del menú, el Inicio y la vista Pendientes):
 * - los correos que Altair resumió con una acción sugerida: no nula, no
 *   vacía y que no empiece con "ninguna" (conteo exacto en la base), y
 * - los primeros pasos que faltan.
 * Solo lee; RLS deja ver a cada quien solo lo suyo. Con `cache`, el layout
 * y la página comparten la misma lectura en cada visita.
 */

export type CorreoPendiente = { id: string; remitente: string | null; asunto: string | null; accion_sugerida: string; creado_en: string };
/** Un envío que dejó un agente (proponer_envio_whatsapp) y espera tu visto bueno. */
export type EnvioPendiente = { id: string; agente: string | null; destinatarios: { nombre: string }[]; mensaje: string; archivo: string | null; creado_en: string };

/** Un mensaje de un cliente por WhatsApp que espera tu decisión (migración 0022). */
export type WhatsappPendiente = {
  id: string;
  telefono: string;
  nombre: string | null;
  texto: string;
  /** Lo que Aura propone contestar (puede no haber). */
  borrador: string | null;
  motivo: string | null;
  creado_en: string;
  /** Pasaron más de 24 horas: WhatsApp ya no deja contestarle libre. */
  vencido: boolean;
};

/**
 * Algo que Atendel dejó listo para hacer en una app y espera tu OK (migración 0023). `texto`: lo que
 * sale completo (el texto de un correo, las notas de una cita…), porque el resumen lo corta.
 */
export type AccionPendiente = { id: string; app: string; resumen: string; motivo: string | null; texto: string; creado_en: string };

export type Pendientes = {
  /** Correos con una acción sugerida (exacto). null si no se pudo leer. */
  correos: number | null;
  /** Los más recientes de esos correos (hasta `filas`). */
  lista: CorreoPendiente[];
  /** Los primeros pasos que faltan. */
  pasos: PasoPanel[];
  /** Los envíos por WhatsApp que esperan tu visto bueno. */
  envios: EnvioPendiente[];
  /** Los mensajes de clientes por WhatsApp que esperan tu OK. */
  whatsapp: WhatsappPendiente[];
  /** Lo que Atendel dejó listo para hacer en tus apps (citas, correos, tareas…). */
  acciones: AccionPendiente[];
  /** Todos los pasos (para el círculo de avance). */
  todosLosPasos: PasoPanel[];
  /** correos + pasos + envíos + WhatsApp + acciones; null si no se pudieron leer los correos. */
  total: number | null;
};

export const cargarPendientes = cache(async function cargarPendientes(
  userId: string,
  opciones: string, // "planId|conGmail|lola,clara" (texto, para que `cache` lo reconozca)
  filas: number,
): Promise<Pendientes> {
  const [planId, google, lista] = opciones.split("|");
  const activos = (lista ? lista.split(",") : []) as IdAgente[];
  const supabase = await createClient();
  // resumenes_correo no tiene owner_id: además de RLS, se filtra por los negocios de la persona
  const ids = await negociosDe(supabase, userId);

  // El mismo filtro para contar y para listar: no nula, no vacía y que no empiece con "ninguna"
  // Lo de WhatsApp que espera tu decisión, y lo que Aura no alcanzó a terminar (más de 3 minutos)
  const atorados = new Date(Date.now() - 3 * 60_000).toISOString();
  const [cuenta, correos, conversaciones, grupos, perfil, apps, envios, whatsapp, acciones] = await Promise.all([
    supabase
      .from("resumenes_correo")
      .select("id", { count: "exact", head: true })
      .in("negocio_id", ids)
      .not("accion_sugerida", "is", null)
      .neq("accion_sugerida", "")
      .not("accion_sugerida", "ilike", "ninguna%"),
    filas > 0
      ? supabase
          .from("resumenes_correo")
          .select("id, remitente, asunto, accion_sugerida, creado_en")
          .in("negocio_id", ids)
          .not("accion_sugerida", "is", null)
          .neq("accion_sugerida", "")
          .not("accion_sugerida", "ilike", "ninguna%")
          .order("creado_en", { ascending: false })
          .limit(filas)
      : Promise.resolve({ data: [] as CorreoPendiente[], error: null }),
    supabase.from("conversaciones").select("id", { count: "exact", head: true }).eq("owner_id", userId),
    // Un grupo: una conversación con participantes (siempre de 2 a 4 agentes)
    supabase.from("conversaciones").select("id", { count: "exact", head: true }).eq("owner_id", userId).not("participantes", "is", null),
    // Tu negocio (migración 0006): el perfil y las apps conectadas. Si la tabla aún no existe, el paso sale por hacer
    supabase.from("perfil_negocio").select(CAMPOS_PERFIL.join(", ")).eq("owner_id", userId).maybeSingle(),
    supabase.from("conexiones").select("proveedor", { count: "exact", head: true }).eq("owner_id", userId).eq("estado", "activa"),
    // Los envíos que dejó un agente (migración 0009); si la tabla aún no existe, no hay
    supabase.from("envios").select("id, agente, destinatarios, mensaje, creado_en, archivos(nombre)").eq("owner_id", userId).eq("estado", "por_aprobar").order("creado_en", { ascending: false }).limit(20),
    supabase
      .from("whatsapp_mensajes")
      .select("id, telefono, nombre, texto, borrador, motivo, creado_en", { count: "exact" })
      .eq("owner_id", userId)
      .eq("direccion", "entrante")
      .or(`estado.in.(esperando_ok,sin_respuesta,error),and(estado.in.(recibido,pensando),creado_en.lt."${atorados}")`)
      .order("creado_en", { ascending: false })
      .limit(Math.max(filas, 20)),
    supabase
      .from("acciones")
      .select("id, app, resumen, motivo, args, creado_en", { count: "exact" })
      .eq("owner_id", userId)
      .eq("estado", "esperando")
      .order("creado_en", { ascending: false })
      .limit(Math.max(filas, 20)),
  ]);
  const listaAcciones: AccionPendiente[] = acciones.error
    ? []
    : (acciones.data ?? []).map((a) => ({
        id: String(a.id),
        app: String(a.app),
        resumen: String(a.resumen),
        motivo: typeof a.motivo === "string" ? a.motivo : null,
        texto: textoCompletoDeAccion(a.args),
        creado_en: String(a.creado_en),
      }));
  const totalAcciones = acciones.error ? 0 : (acciones.count ?? listaAcciones.length);
  const listaWhatsapp: WhatsappPendiente[] = whatsapp.error
    ? []
    : (whatsapp.data ?? []).map((w) => ({
        id: String(w.id),
        telefono: String(w.telefono),
        nombre: typeof w.nombre === "string" ? w.nombre : null,
        texto: String(w.texto ?? ""),
        borrador: typeof w.borrador === "string" ? w.borrador : null,
        motivo: typeof w.motivo === "string" ? w.motivo : null,
        creado_en: String(w.creado_en),
        vencido: Date.now() - new Date(String(w.creado_en)).getTime() > 24 * 3_600_000,
      }));
  const totalWhatsapp = whatsapp.error ? 0 : (whatsapp.count ?? listaWhatsapp.length);
  const listaEnvios: EnvioPendiente[] = envios.error
    ? []
    : (envios.data ?? []).map((e) => {
        const arch = (e as { archivos?: { nombre?: string } | { nombre?: string }[] | null }).archivos;
        const nombreArch = Array.isArray(arch) ? arch[0]?.nombre : arch?.nombre;
        return {
          id: String(e.id),
          agente: (e.agente as string | null) ?? null,
          destinatarios: Array.isArray(e.destinatarios) ? (e.destinatarios as { nombre?: unknown }[]).map((d) => ({ nombre: typeof d?.nombre === "string" ? d.nombre : "" })) : [],
          mensaje: String(e.mensaje ?? ""),
          archivo: nombreArch ?? null,
          creado_en: String(e.creado_en),
        };
      });
  const filaPerfil = (perfil.error ? null : perfil.data) as Record<string, unknown> | null;
  const camposPerfil = CAMPOS_PERFIL.filter((c) => typeof filaPerfil?.[c] === "string" && (filaPerfil[c] as string).trim().length > 0).length;

  const todosLosPasos = pasosPanel({
    activos,
    conGmail: google === "1",
    conConversaciones: (conversaciones.count ?? 0) > 0,
    conGrupo: (grupos.count ?? 0) > 0,
    conGrupos: planId !== "free",
    camposPerfil,
    conApp: !apps.error && (apps.count ?? 0) > 0,
  });
  const pasos = todosLosPasos.filter((p) => !p.listo);
  const n = cuenta.error ? null : (cuenta.count ?? 0);

  return {
    correos: n,
    lista: correos.error ? [] : ((correos.data ?? []) as CorreoPendiente[]),
    pasos,
    envios: listaEnvios,
    whatsapp: listaWhatsapp,
    acciones: listaAcciones,
    todosLosPasos,
    total: n === null ? null : n + pasos.length + listaEnvios.length + totalWhatsapp + totalAcciones,
  };
});

/** Los negocios de la persona (resumenes_correo se filtra por negocio_id, como en Estadísticas). */
export async function negociosDe(supabase: SupabaseClient, userId: string): Promise<string[]> {
  const { data, error } = await supabase.from("negocios").select("id").eq("owner_id", userId);
  if (error) console.error("pendientes: no se pudieron leer los negocios", error.code, error.message);
  const ids = (data ?? []).map((n) => String(n.id));
  // Sin negocios no hay resúmenes: un id que no existe evita un in() vacío
  return ids.length ? ids : [SIN_NEGOCIO];
}

const SIN_NEGOCIO = "00000000-0000-0000-0000-000000000000";

/** Escapa un texto para usarlo dentro de un patrón ilike. */
const paraIlike = (t: string) => t.replace(/[\\%_]/g, (c) => `\\${c}`);

/**
 * Los correos con acción de un remitente (?de=) o con una acción (?accion=),
 * buscados en la base sobre los últimos 90 días (no solo en los 100 más
 * recientes): así un remitente de hace 3 semanas no sale vacío. El filtro
 * exacto (nombre del remitente, acción normalizada) lo hace la vista.
 */
export async function correosFiltrados(userId: string, f: { de?: string; accion?: string }): Promise<CorreoPendiente[] | null> {
  const supabase = await createClient();
  const ids = await negociosDe(supabase, userId);
  let q = supabase
    .from("resumenes_correo")
    .select("id, remitente, asunto, accion_sugerida, creado_en")
    .in("negocio_id", ids)
    .not("accion_sugerida", "is", null)
    .neq("accion_sugerida", "")
    .not("accion_sugerida", "ilike", "ninguna%")
    .gte("creado_en", new Date(Date.now() - 90 * 86_400_000).toISOString());
  if (f.de) q = q.ilike("remitente", `%${paraIlike(f.de)}%`);
  const { data, error } = await q.order("creado_en", { ascending: false }).limit(1000);
  if (error) return null;
  return (data ?? []) as CorreoPendiente[];
}

/** Las opciones de `cargarPendientes` en texto. */
export const opcionesPendientes = (planId: string, conGmail: boolean, activos: readonly string[]) => `${planId}|${conGmail ? "1" : "0"}|${activos.join(",")}`;
