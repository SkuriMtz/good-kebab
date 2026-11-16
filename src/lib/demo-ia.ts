import "server-only";
import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { hashIp, ipDe, pasarLimite, registrarEvento } from "@/lib/seguridad";
import { clienteServicio } from "@/lib/supabase/servicio";

/**
 * El límite de la IA en /pruebalo (migración 0010): 20 mensajes al día por
 * visitante y 300 al día entre todos. La huella es un hash de la IP y el
 * navegador (nunca se guarda la IP). Desde la 0030 el contador solo lo usa
 * el servidor, y además hay un tope por IP (30 al día) que no se evade
 * cambiando de navegador.
 */

export const MODELO_DEMO = "claude-sonnet-5-5";

export function huella(req: NextRequest) {
  const ip = ipDe(req);
  const ua = req.headers.get("user-agent") ?? "";
  return createHash("sha256").update(`atendel-demo|${ip}|${ua}`).digest("hex").slice(0, 32);
}

/** Suma un mensaje. Regresa los que quedan (0 o más), o un error para mostrar. */
export async function usarMensajeDemo(req: NextRequest): Promise<{ quedan: number } | { error: string; status: number }> {
  const admin = clienteServicio();
  if (!admin) return { error: "La IA de la demostración no está disponible ahora.", status: 503 };
  if (!(await pasarLimite(`demo:${hashIp(ipDe(req))}`, 30, 86_400, false))) {
    await registrarEvento("limite_demo", req);
    return { error: "Llegaste al límite de mensajes con IA de la demostración por hoy. Crea tu cuenta para seguir con tu propio negocio.", status: 429 };
  }
  const { data, error } = await admin.rpc("sumar_uso_demo", { p_huella: huella(req) });
  if (error) return { error: "La IA de la demostración no está disponible ahora.", status: 503 };
  const n = typeof data === "number" ? data : -1;
  if (n === -2) return { error: "La demostración ya usó todos sus mensajes con IA de hoy. Vuelve mañana o crea tu cuenta.", status: 503 };
  if (n < 0) return { error: "Llegaste a los 20 mensajes con IA de la demostración por hoy. Crea tu cuenta para seguir con tu propio negocio.", status: 429 };
  return { quedan: n };
}
