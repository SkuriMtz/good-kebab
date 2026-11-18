import "server-only";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cargarCuenta } from "./cuenta";
import { pasarLimite } from "./seguridad";
import { Gasto, leerUso, registrarUso } from "./uso";
import { bloqueoConHora } from "./uso-estado";

/*
 * Lo que comparten las dos rutas del modo plática (/api/platica/escuchar y
 * /api/platica/hablar): el límite de uso del plan (el mismo del chat), un
 * tope de veces por hora y anotar lo que costó la voz en el uso del chat.
 */

export const respuestaError = (mensaje: string, status: number, extra?: Record<string, unknown>) =>
  NextResponse.json({ error: mensaje, ...extra }, { status, headers: { "Cache-Control": "no-store" } });

/** null si puede seguir; si no, la respuesta de error. */
export async function puedeUsarVoz(supabase: SupabaseClient, userId: string, que: "escuchar" | "hablar"): Promise<NextResponse | null> {
  // Por hora: de sobra para platicar (cada respuesta se dice en varias frases), pero con tope
  const max = que === "escuchar" ? 150 : 900;
  if (!(await pasarLimite(`platica-${que}:${userId}`, max, 3_600, false))) return respuestaError("Llevas mucho rato platicando. Descansa unos minutos y sigue.", 429);
  const cuenta = await cargarCuenta(supabase, userId);
  const uso = await leerUso(supabase, userId, cuenta.plan);
  const limite = bloqueoConHora(uso);
  if (limite) return respuestaError(limite.texto, 429, { hasta: limite.hasta });
  return null;
}

/** Suma lo que costó la voz al uso del chat (con la sesión de la persona). */
export async function anotarVoz(supabase: SupabaseClient, costo: number, que: "escuchar" | "hablar") {
  const gasto = new Gasto();
  gasto.costo = Math.max(1, Math.round(costo));
  gasto.modelo = que === "escuchar" ? "voz: escuchar" : "voz: hablar";
  await registrarUso(supabase, gasto, "chat");
}
