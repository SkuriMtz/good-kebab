import "server-only";
import { cache } from "react";
import type { IdAgente } from "./agentes";
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

  // El mismo filtro para contar y para listar: no nula, no vacía y que no empiece con "ninguna"
  const [cuenta, correos, conversaciones, grupos] = await Promise.all([
    supabase
      .from("resumenes_correo")
      .select("id", { count: "exact", head: true })
      .not("accion_sugerida", "is", null)
      .neq("accion_sugerida", "")
      .not("accion_sugerida", "ilike", "ninguna%"),
    filas > 0
      ? supabase
          .from("resumenes_correo")
          .select("id, remitente, asunto, accion_sugerida, creado_en")
          .not("accion_sugerida", "is", null)
          .neq("accion_sugerida", "")
          .not("accion_sugerida", "ilike", "ninguna%")
          .order("creado_en", { ascending: false })
          .limit(filas)
      : Promise.resolve({ data: [] as CorreoPendiente[], error: null }),
    supabase.from("conversaciones").select("id", { count: "exact", head: true }).eq("owner_id", userId),
    // Un grupo: una conversación con participantes (siempre de 2 a 4 agentes)
    supabase.from("conversaciones").select("id", { count: "exact", head: true }).eq("owner_id", userId).not("participantes", "is", null),
  ]);

  const todosLosPasos = pasosPanel({
    activos,
    conGoogle: google === "1",
    conConversaciones: (conversaciones.count ?? 0) > 0,
    conGrupo: (grupos.count ?? 0) > 0,
    conGrupos: planId !== "free",
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

/** Las opciones de `cargarPendientes` en texto. */
export const opcionesPendientes = (planId: string, conGoogle: boolean, activos: readonly string[]) => `${planId}|${conGoogle ? "1" : "0"}|${activos.join(",")}`;
