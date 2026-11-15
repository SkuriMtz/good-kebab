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

/** Los únicos enlaces que puede llevar un aviso; cualquier otro se queda como texto. */
const ENLACES_AVISO = new Set(["/panel?vista=pendientes", "/panel?vista=oficina", "/panel?vista=tareas", "/panel?vista=negocio&tab=apps"]);

export async function avisarEnChat(admin: SupabaseClient, dueno: string, aviso: { agente: IdAgente; texto: string }): Promise<boolean> {
  const texto = aviso.texto
    .replace(/\[([^\]\n]{1,120})\]\(([^)\s]{0,300})\)/g, (todo: string, t: string, url: string) => (ENLACES_AVISO.has(url) ? todo : t))
    .trim()
    .slice(0, 4000);
  if (!texto) return false;
  try {
    const { data: hay } = await admin
      .from("conversaciones")
      .select("id")
      .eq("owner_id", dueno)
      .eq("tema", TEMA_AVISOS)
      .order("creado_en", { ascending: true })
      .limit(1)
      .maybeSingle();
    let id = hay?.id ? String(hay.id) : null;
    if (!id) {
      // Con todo su equipo, como cualquier chat nuevo
      const { activos } = await cargarCuenta(admin, dueno);
      const equipo: IdAgente[] = activos.length ? [...activos] : [aviso.agente];
      const { data: nueva } = await admin
        .from("conversaciones")
        .insert({ owner_id: dueno, agente: equipo[0], titulo: TEMA_AVISOS, participantes: equipo.length >= 2 ? equipo : null, tema: TEMA_AVISOS })
        .select("id")
        .single();
      id = nueva?.id ? String(nueva.id) : null;
    }
    if (!id) return false;
    const { error } = await admin.from("mensajes").insert({ conversacion_id: id, owner_id: dueno, rol: "assistant", agente: aviso.agente, contenido: texto });
    if (error) return false;
    await admin.from("conversaciones").update({ actualizado_en: new Date().toISOString() }).eq("id", id).eq("owner_id", dueno);
    return true;
  } catch (e) {
    console.error("Aviso en el chat falló:", e instanceof Error ? e.message : e);
    return false;
  }
}
