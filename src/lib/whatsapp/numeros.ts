import "server-only";
import type { Tokens } from "@/lib/nucleo-tipos";
import { avisarEnChat } from "@/lib/avisos";
import { clienteServicio } from "@/lib/supabase/servicio";
import { ID_META, suscribirApp } from "./cloud";

/**
 * Al conectar WhatsApp Business (Meta): se apunta qué número es de esta
 * cuenta (whatsapp_numeros, solo el servidor lo escribe) y se le pide a Meta
 * que mande a Atendel los mensajes de esa cuenta de WhatsApp. Los ids salen
 * de Meta con el token recién conectado (nadie los escribe a mano).
 * - Un número que ya está en OTRA cuenta de Atendel no se mueve solo: sigue
 *   allá (se avisa a las dos cuentas). Para moverlo, primero se desconecta
 *   en la cuenta donde está.
 * Mejor esfuerzo: si algo falla, la conexión igual queda.
 */
export async function registrarNumeroWhatsapp(userId: string, t: Tokens): Promise<boolean> {
  const telefono = t.extra?.phone_number_id ?? "";
  const waba = t.extra?.waba_id ?? "";
  if (!ID_META.test(telefono)) return false;
  const admin = clienteServicio();
  if (!admin) return false;
  const { data: actual } = await admin.from("whatsapp_numeros").select("owner_id").eq("phone_number_id", telefono).maybeSingle();
  if (actual && String(actual.owner_id) !== userId) {
    await avisarEnChat(admin, userId, {
      agente: "lola",
      texto: "Tu número de WhatsApp ya está conectado en otra cuenta de Atendel, así que los mensajes de tus clientes siguen llegando allá. Para que lleguen aquí, primero desconéctalo en esa cuenta y luego vuelve a conectar Meta en [Tu negocio → Apps](/panel?vista=negocio&tab=apps).",
    });
    await avisarEnChat(admin, String(actual.owner_id), {
      agente: "lola",
      texto: "Alguien intentó conectar tu número de WhatsApp en otra cuenta de Atendel. No cambió nada: los mensajes de tus clientes siguen llegando aquí. Si no fuiste tú, revisa quién tiene acceso a tu WhatsApp Business en Meta.",
    });
    return false;
  }
  // Un número por cuenta: si cambió de número, el anterior deja de llegar aquí
  await admin.from("whatsapp_numeros").delete().eq("owner_id", userId).neq("phone_number_id", telefono);
  const { error } = actual
    ? await admin.from("whatsapp_numeros").update({ waba_id: ID_META.test(waba) ? waba : null }).eq("phone_number_id", telefono).eq("owner_id", userId)
    : await admin.from("whatsapp_numeros").insert({ phone_number_id: telefono, owner_id: userId, waba_id: ID_META.test(waba) ? waba : null });
  if (ID_META.test(waba)) await suscribirApp(t.access_token, waba);
  return !error;
}
