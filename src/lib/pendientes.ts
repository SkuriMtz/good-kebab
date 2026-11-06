import "server-only";
import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { IdAgente } from "./agentes";
import { CAMPOS_PERFIL } from "./nucleo-tipos";
import { pasosPanel, type PasoPanel } from "./pasos";
import { createClient } from "./supabase/server";

/**
 * Lo que espera algo de ti en el panel, contado igual en todas partes (el
 * número del menú, el Inicio y la vista Pendientes):
 * - los correos que Clara resumió con una acción sugerida: no nula, no
 *   vacía y que no empiece con "ninguna" (conteo exacto en la base), y
 * - los primeros pasos que faltan.
 * Solo lee; RLS deja ver a cada quien solo lo suyo. Con `cache`, el layout
 * y la página comparten la misma lectura en cada visita.
 */

export type CorreoPendiente = { id: string; remitente: string | null; asunto: string | null; accion_sugerida: string; creado_en: string };

export type Pendientes = {
  /** Correos con una acción sugerida (exacto). null si no se pudo leer. */
  correos: number | null;
  /** Los más recientes de esos correos (hasta `filas`). */
  lista: CorreoPendiente[];
  /** Los primeros pasos que faltan. */
  pasos: PasoPanel[];
  /** Todos los pasos (para el círculo de avance). */
  todosLosPasos: PasoPanel[];
  /** correos + pasos; null si no se pudieron leer los correos. */
  total: number | null;
};

export const cargarPendientes = cache(async function cargarPendientes(
  userId: string,
  opciones: string, // "planId|conGoogle|lola,clara" (texto, para que `cache` lo reconozca)
  filas: number,
): Promise<Pendientes> {
  const [planId, google, lista] = opciones.split("|");
  const activos = (lista ? lista.split(",") : []) as IdAgente[];
  const supabase = await createClient();
  // resumenes_correo no tiene owner_id: además de RLS, se filtra por los negocios de la persona
  const ids = await negociosDe(supabase, userId);

  // El mismo filtro para contar y para listar: no nula, no vacía y que no empiece con "ninguna"
  const [cuenta, correos, conversaciones, grupos, perfil, apps] = await Promise.all([
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
  ]);
  const filaPerfil = (perfil.error ? null : perfil.data) as Record<string, unknown> | null;
  const camposPerfil = CAMPOS_PERFIL.filter((c) => typeof filaPerfil?.[c] === "string" && (filaPerfil[c] as string).trim().length > 0).length;

  const todosLosPasos = pasosPanel({
    activos,
    conGoogle: google === "1",
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
    todosLosPasos,
    total: n === null ? null : n + pasos.length,
  };
});

/** Los negocios de la persona (resumenes_correo se filtra por negocio_id, como en Estadísticas). */
export async function negociosDe(supabase: SupabaseClient, userId: string): Promise<string[]> {
  const { data, error } = await supabase.from("negocios").select("id").eq("owner_id", userId);
  if (error) console.error("pendientes: no se pudieron leer los negocios", error);
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
export const opcionesPendientes = (planId: string, conGoogle: boolean, activos: readonly string[]) => `${planId}|${conGoogle ? "1" : "0"}|${activos.join(",")}`;
