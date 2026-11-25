import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { FichaEmpleado, HechoEquipo } from "@/components/panel/TuEquipo";
import { esIdAgente, type IdAgente } from "@/lib/agentes";
import { herramientaPorNombre } from "@/lib/conexiones/registro";
import { diaLocal, inicioDia } from "@/lib/estadisticas";

/**
 * Los datos de «Tu equipo» (src/components/panel/TuEquipo.tsx): qué hizo hoy
 * cada empleado y en qué está ahorita. Lee con la sesión del dueño (RLS):
 * - encargos (migración 0040): lo que Atendel le encargó en el chat.
 * - acciones: lo que hizo en tus apps (hecho) o dejó esperando tu OK. De
 *   quién es sale de la herramienta (registro de apps) o, si no, de su tipo.
 * - trabajos: lo que hizo por su cuenta y dejó en la Oficina.
 */

/** Un encargo que sigue «trabajando» después de esto ya no está trabajando (se cortó). */
const VIVO_MS = 3 * 60_000;

const POR_CATEGORIA: Record<string, IdAgente> = {
  preguntas: "lola",
  citas: "lola",
  precios: "lola",
  correos: "clara",
  seguimiento: "victor",
  nuevo: "victor",
  dinero: "victor",
  apps: "iris",
};

const corto = (t: unknown, max = 90) => (typeof t === "string" ? t.replace(/\s+/g, " ").trim().slice(0, max) : "");

/** De quién es una acción: de quien tiene esa herramienta (o, si no se sabe, de quien lleva ese tipo de cosas). */
export function agenteDeAccion(herramienta: string, categoria: string): IdAgente {
  const h = herramientaPorNombre(herramienta);
  const primero = h?.agentes[0];
  return primero && esIdAgente(primero) ? primero : (POR_CATEGORIA[categoria] ?? "iris");
}

type FilaEncargo = { id: string; agente: string; titulo: string; estado: string; creado_en: string; conversacion_id: string | null };
type FilaAccion = { id: string; herramienta: string; categoria: string; resumen: string; estado: string; creado_en: string; resuelto_en: string | null };
type FilaTrabajo = { id: string; agente: string; titulo: string; creado_en: string };

/** Arma las fichas con las filas de hoy (función pura, para probarla). */
export function armarFichas(
  ids: readonly IdAgente[],
  filas: { encargos: FilaEncargo[]; acciones: FilaAccion[]; trabajos: FilaTrabajo[] },
  ahora: number,
  base = "/panel",
): FichaEmpleado[] {
  const por = new Map<IdAgente, HechoEquipo[]>(ids.map((id) => [id, []]));
  const ahorita = new Map<IdAgente, string>();

  for (const e of filas.encargos) {
    if (!esIdAgente(e.agente) || !por.has(e.agente)) continue;
    const vivo = e.estado === "trabajando" && ahora - Date.parse(e.creado_en) < VIVO_MS;
    // Uno viejo que se quedó «trabajando» (se cortó la conexión): no se terminó
    const estado: HechoEquipo["estado"] = vivo ? "trabajando" : e.estado === "listo" ? "listo" : "error";
    // El que está haciendo ahorita va arriba («Ahorita»), no se repite en la lista
    if (vivo && !ahorita.has(e.agente)) {
      ahorita.set(e.agente, corto(e.titulo));
      continue;
    }
    por.get(e.agente)!.push({ id: `e-${e.id}`, titulo: corto(e.titulo), hora: e.creado_en, estado, ...(e.conversacion_id ? { href: `${base}?c=${e.conversacion_id}` } : {}) });
  }
  for (const a of filas.acciones) {
    const agente = agenteDeAccion(a.herramienta, a.categoria);
    if (!por.has(agente)) continue;
    const espera = a.estado === "esperando";
    por.get(agente)!.push({
      id: `a-${a.id}`,
      titulo: corto(a.resumen),
      hora: a.resuelto_en ?? a.creado_en,
      estado: espera ? "espera" : "listo",
      href: espera ? `${base}?vista=equipo&aprobar=${a.id}` : `${base}?vista=pendientes&tab=hecho`,
    });
  }
  for (const t of filas.trabajos) {
    if (!esIdAgente(t.agente) || !por.has(t.agente)) continue;
    por.get(t.agente)!.push({ id: `t-${t.id}`, titulo: corto(t.titulo), hora: t.creado_en, estado: "listo", href: `${base}?vista=oficina` });
  }

  return ids.map((agente) => {
    const lista = por.get(agente)!.sort((x, y) => Date.parse(y.hora) - Date.parse(x.hora));
    // Lo que espera tu OK va primero (es lo que te toca a ti); luego lo más nuevo
    const ordenada = [...lista.filter((h) => h.estado === "espera"), ...lista.filter((h) => h.estado !== "espera")];
    return {
      agente,
      trabajando: ahorita.get(agente) ?? null,
      hoy: lista.filter((h) => h.estado === "listo").length,
      ultimos: ordenada.slice(0, 3),
    };
  });
}

export async function cargarEquipo(supabase: SupabaseClient, userId: string, ids: readonly IdAgente[], ahora = Date.now()): Promise<FichaEmpleado[]> {
  const desde = inicioDia(diaLocal(new Date(ahora))).toISOString();
  const [enc, acc, trab] = await Promise.all([
    supabase
      .from("encargos")
      .select("id, agente, titulo, estado, creado_en, conversacion_id")
      .eq("owner_id", userId)
      .gte("creado_en", desde)
      .order("creado_en", { ascending: false })
      .limit(100),
    supabase
      .from("acciones")
      .select("id, herramienta, categoria, resumen, estado, creado_en, resuelto_en")
      .eq("owner_id", userId)
      .in("estado", ["hecha", "esperando"])
      .gte("creado_en", desde)
      .order("creado_en", { ascending: false })
      .limit(100),
    supabase.from("trabajos").select("id, agente, titulo, creado_en").eq("owner_id", userId).gte("creado_en", desde).order("creado_en", { ascending: false }).limit(50),
  ]);
  return armarFichas(
    ids,
    {
      encargos: (enc.data ?? []) as FilaEncargo[],
      acciones: (acc.data ?? []) as FilaAccion[],
      trabajos: (trab.data ?? []) as FilaTrabajo[],
    },
    ahora,
  );
}
