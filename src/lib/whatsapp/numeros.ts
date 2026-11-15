import "server-only";
import type { Tokens } from "@/lib/nucleo-tipos";
import { clienteServicio } from "@/lib/supabase/servicio";
import { ID_META, suscribirApp } from "./cloud";

/**
 * Al conectar WhatsApp Business (Meta): se apunta qué número es de esta
 * cuenta (whatsapp_numeros, solo el servidor lo escribe) y se le pide a Meta
 * que mande a Atendel los mensajes de esa cuenta de WhatsApp. Los ids salen
 * de Meta con el token recién conectado (nadie los escribe a mano).
 * Mejor esfuerzo: si algo falla, la conexión igual queda.
 */
export async function registrarNumeroWhatsapp(userId: string, t: Tokens): Promise<boolean> {
  const telefono = t.extra?.phone_number_id ?? "";
  const waba = t.extra?.waba_id ?? "";
  if (!ID_META.test(telefono)) return false;
  const admin = clienteServicio();
  if (!admin) return false;
  // Un número por cuenta: si cambió de número, el anterior deja de llegar aquí
  await admin.from("whatsapp_numeros").delete().eq("owner_id", userId).neq("phone_number_id", telefono);
  const { error } = await admin
    .from("whatsapp_numeros")
    .upsert({ phone_number_id: telefono, owner_id: userId, waba_id: ID_META.test(waba) ? waba : null }, { onConflict: "phone_number_id" });
  if (ID_META.test(waba)) await suscribirApp(t.access_token, waba);
  return !error;
}
