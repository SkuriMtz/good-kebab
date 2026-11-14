import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { HORAS_SESION, type Plan } from "./planes";
import { ZONA_PREDETERMINADA, type EstadoUso } from "./uso-estado";

/**
 * EL USO COMO LÍMITE (el mismo concepto que Claude)
 *
 * Cada respuesta de la IA cuesta según los tokens que de verdad usó: lo que
 * lee (instrucciones, tu negocio, documentos, la conversación, lo que
 * regresan las apps) y lo que escribe (incluido lo que piensa). Eso se
 * guarda en micro-dólares con el precio oficial de su modelo y se compara
 * con el límite del plan (src/lib/planes.ts) en dos ventanas: la sesión de
 * 5 horas y la semana. Lo escribe y lo lee la base de datos (migración
 * 0013: registrar_uso y estado_uso), siempre con la sesión de la persona.
 */

/** Dólares por millón de tokens (= micro-dólares por token). Precios oficiales de Anthropic, nov 2026. */
type Precio = { entrada: number; salida: number; cacheLee: number; cacheEscribe: number };
const PRECIOS: Record<string, Precio> = {
  "claude-opus-5-5": { entrada: 4, salida: 20, cacheLee: 0.2, cacheEscribe: 5 },
  "claude-opus-5": { entrada: 5, salida: 25, cacheLee: 0.5, cacheEscribe: 6.25 },
  "claude-opus-4-8": { entrada: 5, salida: 25, cacheLee: 0.5, cacheEscribe: 6.25 },
  "claude-sonnet-5-5": { entrada: 2, salida: 10, cacheLee: 0.1, cacheEscribe: 2.5 },
  "claude-haiku-4-5": { entrada: 1, salida: 5, cacheLee: 0.1, cacheEscribe: 1.25 },
  // Hasta 100 mil tokens de entrada; arriba de eso cuesta 5 veces (ver abajo)
  "claude-haiku-5-5": { entrada: 0.1, salida: 0.5, cacheLee: 0.01, cacheEscribe: 0.125 },
};
const HAIKU_55_LARGO: Precio = { entrada: 0.5, salida: 2.5, cacheLee: 0.05, cacheEscribe: 0.625 };
/** Si contesta un modelo que no está en la lista (un respaldo), se cobra como el más caro de arriba. */
const PRECIO_DESCONOCIDO: Precio = PRECIOS["claude-opus-5"];

/** Los tokens de una respuesta (sirve para Message y BetaMessage). */
type Tokens = { input_tokens: number; output_tokens: number; cache_read_input_tokens?: number | null; cache_creation_input_tokens?: number | null };

/** Lo que costó una respuesta, en micro-dólares (redondeado hacia arriba, mínimo 1). */
export function costoDe(modelo: string, u: Tokens | null | undefined): number {
  if (!u) return 0;
  const leidos = (u.input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0);
  const p = modelo === "claude-haiku-5-5" && leidos > 100_000 ? HAIKU_55_LARGO : (PRECIOS[modelo] ?? PRECIO_DESCONOCIDO);
  const total =
    (u.input_tokens ?? 0) * p.entrada + (u.output_tokens ?? 0) * p.salida + (u.cache_read_input_tokens ?? 0) * p.cacheLee + (u.cache_creation_input_tokens ?? 0) * p.cacheEscribe;
  return total > 0 ? Math.max(1, Math.ceil(total)) : 0;
}

/** Junta lo que gastaron varias rondas (con herramientas, la IA contesta en varias vueltas). */
export class Gasto {
  costo = 0;
  entrada = 0;
  salida = 0;
  modelo = "";
  sumar(m: { model: string; usage: Tokens | null } | null | undefined, modeloPlan: string) {
    if (!m?.usage) return;
    const modelo = m.model || modeloPlan;
    this.costo += costoDe(modelo, m.usage);
    this.entrada += (m.usage.input_tokens ?? 0) + (m.usage.cache_read_input_tokens ?? 0) + (m.usage.cache_creation_input_tokens ?? 0);
    this.salida += m.usage.output_tokens ?? 0;
    this.modelo = modelo;
  }
}

const zonaValida = (zona: unknown) => {
  if (typeof zona !== "string" || !zona) return ZONA_PREDETERMINADA;
  try {
    new Intl.DateTimeFormat("es-MX", { timeZone: zona });
    return zona;
  } catch {
    return ZONA_PREDETERMINADA;
  }
};

/**
 * Lo usado en la sesión abierta y en la semana. Si la base de datos todavía
 * no tiene la migración 0013, regresa uso en cero (nunca bloquea por eso).
 */
export async function leerUso(supabase: SupabaseClient, userId: string, plan: Plan): Promise<EstadoUso> {
  const { data: fila } = await supabase.from("ajustes_cuenta").select("zona:datos->>zonaHoraria").eq("owner_id", userId).maybeSingle();
  const zona = zonaValida((fila as { zona?: unknown } | null)?.zona);
  let r = await supabase.rpc("estado_uso", { zona });
  if (r.error && zona !== ZONA_PREDETERMINADA) r = await supabase.rpc("estado_uso", { zona: ZONA_PREDETERMINADA });
  const d = (Array.isArray(r.data) ? r.data[0] : r.data) as { sesion_inicio: string | null; sesion_costo: number | string; semana_inicio: string; semana_costo: number | string } | null;
  const ahora = Date.now();
  const lunes = d?.semana_inicio ? new Date(d.semana_inicio).getTime() : ahora;
  // El trabajo por su cuenta (aparte del chat): lo de esta semana
  const { data: trabajo } = await supabase.from("trabajo_uso").select("costo").eq("owner_id", userId).gte("creado_en", new Date(lunes).toISOString());
  return {
    trabajo: { usado: (trabajo ?? []).reduce((n, t) => n + (Number(t.costo) || 0), 0), limite: plan.trabajo.semana, reinicia: new Date(lunes + 7 * 86_400_000).toISOString() },
    sesion: {
      usado: d?.sesion_inicio ? Number(d.sesion_costo) || 0 : 0,
      limite: plan.limite.sesion,
      reinicia: d?.sesion_inicio ? new Date(new Date(d.sesion_inicio).getTime() + HORAS_SESION * 3_600_000).toISOString() : null,
    },
    semana: { usado: Number(d?.semana_costo) || 0, limite: plan.limite.semana, reinicia: new Date(lunes + 7 * 86_400_000).toISOString() },
    zona,
  };
}

/** Guarda lo que costó una respuesta (si no se pudo, solo se avisa en el registro del servidor). */
export async function registrarUso(supabase: SupabaseClient, gasto: Gasto, origen: "chat" | "pregunta") {
  if (gasto.costo <= 0) return;
  const { error } = await supabase.rpc("registrar_uso", {
    costo: Math.min(gasto.costo, 5_000_000),
    entrada: Math.min(gasto.entrada, 2_000_000_000),
    salida: Math.min(gasto.salida, 2_000_000_000),
    modelo: gasto.modelo.slice(0, 60),
    origen,
  });
  if (error) console.error("No se pudo guardar el uso:", error.code, error.message);
}
