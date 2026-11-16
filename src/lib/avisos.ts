import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { IdAgente } from "./agentes";
import { cargarCuenta } from "./cuenta";

/**
 * AVISOS EN EL CHAT: Atendel te escribe en tu propio chat lo que hizo y lo
 * que necesita de ti (un WhatsApp que contestó, algo que espera tu OK, una
 * tarea hecha, el trabajo de la mañana). Todo va a una conversación
 * "Avisos de Atendel" que sube hasta arriba en Recientes; ahí mismo le
 * puedes contestar como en cualquier chat.
 * Con el cliente de servicio: todo filtra por dueño.
 */

export const TEMA_AVISOS = "Avisos de Atendel";

/** Lo que escribió un cliente o salió de una app va citado en el aviso: sin enlaces que alguien pueda meter. */
export const citar = (t: unknown, max = 600) =>
  (typeof t === "string" ? t.replace(/\s+/g, " ").trim().slice(0, max) : "").replace(/[[\]]/g, (c) => (c === "[" ? "(" : ")"));

/** Igual que `citar`, pero conserva los renglones (para resultados largos, como una tarea). */
export const citarLineas = (t: unknown, max = 900) =>
  (typeof t === "string" ? t.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, max) : "").replace(/[[\]]/g, (c) => (c === "[" ? "(" : ")"));

/** El botón "Aprobar y hacer" de algo que espera tu OK, y el de "Volver a conectar" una app. */
const APROBAR = /^\/panel\?(aprobar=[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|conectar=[a-z_]{2,40})$/;

/** Los únicos enlaces que puede llevar un aviso; cualquier otro se queda como texto. */
const ENLACES_AVISO = new Set([
  "/panel?vista=pendientes",
  "/panel?vista=oficina",
  "/panel?vista=tareas",
  "/panel?vista=negocio&tab=apps",
  "/panel?vista=ajustes&seccion=notificaciones",
  "/panel?vista=ajustes&seccion=uso",
  "/panel?vista=ajustes&seccion=plan",
  "/panel?vista=ajustes&seccion=cuenta",
  "/panel?vista=ajustes&seccion=atendel",
]);

/** La conversación «Avisos de Atendel» del dueño (la crea si no hay). */
export async function chatDeAvisos(admin: SupabaseClient, dueno: string, agente: IdAgente): Promise<string | null> {
  const { data: hay } = await admin
    .from("conversaciones")
    .select("id")
    .eq("owner_id", dueno)
    .eq("tema", TEMA_AVISOS)
    .order("creado_en", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (hay?.id) return String(hay.id);
  // Con todo su equipo, como cualquier chat nuevo
  const { activos } = await cargarCuenta(admin, dueno);
  const equipo: IdAgente[] = activos.length ? [...activos] : [agente];
  const { data: nueva } = await admin
    .from("conversaciones")
    .insert({ owner_id: dueno, agente: equipo[0], titulo: TEMA_AVISOS, participantes: equipo.length >= 2 ? equipo : null, tema: TEMA_AVISOS })
    .select("id")
    .single();
  return nueva?.id ? String(nueva.id) : null;
}

/** Escribe el aviso en el chat «Avisos de Atendel». Devuelve el id de esa conversación (o null si no se pudo). */
export async function avisarEnChat(admin: SupabaseClient, dueno: string, aviso: { agente: IdAgente; texto: string }, conversacion?: string | null): Promise<string | null> {
  const texto = aviso.texto
    .replace(/\[([^\]\n]{1,120})\]\(([^)\s]{0,300})\)/g, (todo: string, t: string, url: string) => (ENLACES_AVISO.has(url) || APROBAR.test(url) ? todo : t))
    .trim()
    .slice(0, 4000);
  if (!texto) return null;
  try {
    const id = conversacion ?? (await chatDeAvisos(admin, dueno, aviso.agente));
    if (!id) return null;
    const { error } = await admin.from("mensajes").insert({ conversacion_id: id, owner_id: dueno, rol: "assistant", agente: aviso.agente, contenido: texto });
    if (error) return null;
    await admin.from("conversaciones").update({ actualizado_en: new Date().toISOString() }).eq("id", id).eq("owner_id", dueno);
    return id;
  } catch (e) {
    console.error("Aviso en el chat falló:", e instanceof Error ? e.message : e);
    return null;
  }
}
