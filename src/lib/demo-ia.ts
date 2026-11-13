import "server-only";
import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * El límite de la IA en /pruebalo (migración 0010): 20 mensajes al día por
 * visitante y 1,000 al día entre todos. La huella es un hash de la IP y el
 * navegador (nunca se guarda la IP).
 */

export const MODELO_DEMO = "claude-haiku-4-5";

export function huella(req: NextRequest) {
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || req.headers.get("x-real-ip") || "sin-ip";
  const ua = req.headers.get("user-agent") ?? "";
  return createHash("sha256").update(`atendel-demo|${ip}|${ua}`).digest("hex").slice(0, 32);
}

/** Suma un mensaje. Regresa los que quedan (0 o más), o un error para mostrar. */
export async function usarMensajeDemo(req: NextRequest): Promise<{ quedan: number } | { error: string; status: number }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("sumar_uso_demo", { p_huella: huella(req) });
  if (error) return { error: "La IA de la demostración no está disponible ahora.", status: 503 };
  const n = typeof data === "number" ? data : -1;
  if (n === -2) return { error: "La demostración ya usó todos sus mensajes con IA de hoy. Vuelve mañana o crea tu cuenta.", status: 503 };
  if (n < 0) return { error: "Llegaste a los 20 mensajes con IA de la demostración por hoy. Crea tu cuenta para seguir con tu propio negocio.", status: 429 };
  return { quedan: n };
}
