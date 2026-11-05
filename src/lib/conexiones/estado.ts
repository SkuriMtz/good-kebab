import type { SupabaseClient } from "@supabase/supabase-js";
import type { EstadoAppPersona, IdApp, Proveedor } from "@/lib/nucleo-tipos";
import { CATALOGO, esIdApp, esProveedor } from "./catalogo";
import { configuradoApp, esPendiente } from "./registro";

/**
 * El estado de cada app para la persona (GET /api/apps): junta el catálogo,
 * lo que está configurado en Vercel, sus conexiones y sus "Avísame".
 *
 * De `conexiones` se leen SOLO columnas sin secretos (nunca token_cifrado):
 * así es imposible que un token llegue al navegador por esta ruta.
 * Sin "server-only" a propósito: se prueba con un script local.
 */

/** Las columnas que se pueden leer de `conexiones` para mostrarlas. */
export const COLUMNAS_PUBLICAS = "proveedor, apps, cuenta, estado, error";

export type ConexionPublica = {
  proveedor: Proveedor;
  apps: IdApp[];
  cuenta: string | null;
  estado: "activa" | "error";
  error: string | null;
};

type Entorno = Record<string, string | undefined>;

/** Puro: lo que ve la pestaña Apps. */
export function estadoApps(conexiones: ConexionPublica[], intereses: IdApp[], env: Entorno = process.env): EstadoAppPersona[] {
  const pedidas = new Set(intereses);
  return CATALOGO.map((app): EstadoAppPersona => {
    // Sin API todavía (clip) o con su adaptador aún sin unir: "En camino" con "Avísame"
    if (app.fase !== 1 || !app.proveedor || esPendiente(app.proveedor)) return { id: app.id, estado: "en_camino", avisame: pedidas.has(app.id) };
    const cfg = configuradoApp(app.id, env);
    if (!cfg.ok) return { id: app.id, estado: "sin_configurar", falta: cfg.falta };
    const con = conexiones.find((c) => c.proveedor === app.proveedor && c.apps.includes(app.id));
    if (!con) return { id: app.id, estado: "desconectada" };
    if (con.estado === "error") {
      return {
        id: app.id,
        estado: "error",
        ...(con.cuenta ? { cuenta: con.cuenta } : {}),
        error: con.error || "La conexión dejó de funcionar. Vuelve a conectarla.",
      };
    }
    return { id: app.id, estado: "conectada", ...(con.cuenta ? { cuenta: con.cuenta } : {}) };
  });
}

/** Normaliza una fila (lo que venga de la base) a lo público; descarta lo raro. */
export function aConexionPublica(fila: Record<string, unknown>): ConexionPublica | null {
  if (!esProveedor(fila.proveedor)) return null;
  const apps = Array.isArray(fila.apps) ? fila.apps.filter(esIdApp) : [];
  return {
    proveedor: fila.proveedor,
    apps,
    cuenta: typeof fila.cuenta === "string" ? fila.cuenta : null,
    estado: fila.estado === "error" ? "error" : "activa",
    error: typeof fila.error === "string" ? fila.error : null,
  };
}

/** Las conexiones de la persona, sin tokens. Si la tabla aún no existe, ninguna. */
export async function leerConexionesPublicas(supabase: SupabaseClient, userId: string): Promise<ConexionPublica[]> {
  const { data, error } = await supabase.from("conexiones").select(COLUMNAS_PUBLICAS).eq("owner_id", userId);
  if (error || !data) return [];
  return (data as unknown as Record<string, unknown>[]).map(aConexionPublica).filter((c): c is ConexionPublica => c !== null);
}

/** Las apps "En camino" que la persona pidió con "Avísame". */
export async function leerIntereses(supabase: SupabaseClient, userId: string): Promise<IdApp[]> {
  const { data, error } = await supabase.from("apps_interes").select("app").eq("owner_id", userId);
  if (error || !data) return [];
  return (data as { app: unknown }[]).map((f) => f.app).filter(esIdApp);
}
