import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Tokens } from "@/lib/nucleo-tipos";
import { avisarEnChat } from "@/lib/avisos";
import { descifrarTokens, leerFila } from "@/lib/conexiones/tokens";
import { clienteServicio } from "@/lib/supabase/servicio";
import { ID_META, suscribirApp, tieneAcceso } from "./cloud";

/** ¿La cuenta que hoy tiene el número todavía tiene permiso en Meta? (con su propio token guardado) */
async function accesoDe(admin: SupabaseClient, dueno: string, telefono: string): Promise<boolean | null> {
  try {
    const fila = await leerFila(admin, dueno, "meta");
    if (!fila || fila.estado !== "activa") return false;
    const t = descifrarTokens(fila, dueno, "meta");
    if (t.expira_en !== undefined && t.expira_en <= Date.now()) return false;
    return await tieneAcceso(t.access_token, telefono);
  } catch {
    return null;
  }
}

/**
 * Al conectar WhatsApp Business (Meta): se apunta qué número es de esta
 * cuenta (whatsapp_numeros, solo el servidor lo escribe) y se le pide a Meta
 * que mande a Atendel los mensajes de esa cuenta de WhatsApp. Los ids salen
 * de Meta con el token recién conectado (nadie los escribe a mano).
 * - El número sigue a quien de verdad tiene permiso en Meta: si ya está en
 *   OTRA cuenta de Atendel y esa cuenta ya no tiene acceso (token vencido o
 *   le quitaron el permiso), se pasa a esta y se le avisa a la anterior. Si
 *   las dos tienen acceso, se queda donde está y se avisa a las dos.
 * Mejor esfuerzo: si algo falla, la conexión igual queda.
 */
export async function registrarNumeroWhatsapp(userId: string, t: Tokens): Promise<boolean> {
  const telefono = t.extra?.phone_number_id ?? "";
  const waba = t.extra?.waba_id ?? "";
  if (!ID_META.test(telefono)) return false;
  const admin = clienteServicio();
  if (!admin) return false;
  let { data: actual } = await admin.from("whatsapp_numeros").select("owner_id").eq("phone_number_id", telefono).maybeSingle();
  if (actual && String(actual.owner_id) !== userId && (await accesoDe(admin, String(actual.owner_id), telefono)) === false) {
    // La cuenta anterior ya no tiene permiso en Meta: el número se pasa a esta (la que sí lo tiene)
    const anterior = String(actual.owner_id);
    await admin.from("whatsapp_numeros").delete().eq("phone_number_id", telefono).eq("owner_id", anterior);
    await avisarEnChat(admin, anterior, {
      agente: "lola",
      texto: "Tu conexión con Meta ya no tiene permiso sobre tu número de WhatsApp, y otra cuenta de Atendel que sí lo tiene lo conectó. Desde ahora los mensajes de ese número llegan allá. Si es un error, vuelve a conectar Meta en [Tu negocio → Apps](/panel?vista=negocio&tab=apps).",
    });
    actual = null;
  }
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
