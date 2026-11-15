import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Tokens } from "@/lib/nucleo-tipos";
import { avisarEnChat } from "@/lib/avisos";
import { descifrarTokens, leerFila } from "@/lib/conexiones/tokens";
import { clienteServicio } from "@/lib/supabase/servicio";
import { ID_META, suscribirApp, tieneAcceso, type Acceso } from "./cloud";

/**
 * ¿La cuenta que hoy tiene el número puede demostrar que sigue con permiso? Se pregunta a Meta con
 * SU token. Sin conexión, con la conexión vencida o con error, no puede demostrarlo
 * ("token_invalido"). Si no se pudo leer de nuestro lado o Meta no respondió: "no_se".
 */
async function accesoDe(admin: SupabaseClient, dueno: string, telefono: string): Promise<Acceso> {
  let token: string;
  try {
    const fila = await leerFila(admin, dueno, "meta");
    if (!fila || fila.estado !== "activa") return "token_invalido";
    const t = descifrarTokens(fila, dueno, "meta");
    if (t.expira_en !== undefined && t.expira_en <= Date.now()) return "token_invalido";
    token = t.access_token;
  } catch {
    return "no_se";
  }
  // Para mover un número entre cuentas, solo cuentan los errores de permiso claros de Meta
  return tieneAcceso(token, telefono, { estricto: true });
}

/**
 * Al conectar WhatsApp Business (Meta): se apunta qué número es de esta
 * cuenta (whatsapp_numeros, solo el servidor lo escribe) y se le pide a Meta
 * que mande a Atendel los mensajes de esa cuenta de WhatsApp. Los ids salen
 * de Meta con el token recién conectado (nadie los escribe a mano).
 * - Quien conecta necesita permiso CONFIRMADO por Meta sobre el número, en
 *   ese momento.
 * - Si ya está en OTRA cuenta de Atendel: se pasa a esta solo si esa otra
 *   no puede demostrar su permiso (Meta dice que no lo tiene, o su conexión
 *   venció o ya no sirve), y se le avisa. Si las dos tienen permiso, o si
 *   Meta no respondió, no se mueve y se avisa a las dos.
 * Mejor esfuerzo: si algo falla, la conexión igual queda.
 */
export async function registrarNumeroWhatsapp(userId: string, t: Tokens): Promise<boolean> {
  const telefono = t.extra?.phone_number_id ?? "";
  const waba = t.extra?.waba_id ?? "";
  if (!ID_META.test(telefono)) return false;
  const admin = clienteServicio();
  if (!admin) return false;
  // Quien conecta tiene que tener permiso confirmado por Meta
  if ((await tieneAcceso(t.access_token, telefono)) !== "si") {
    await avisarEnChat(admin, userId, {
      agente: "lola",
      texto: "No pude confirmar con Meta tu permiso sobre tu número de WhatsApp, así que todavía no recibo sus mensajes. Vuelve a conectar Meta en [Tu negocio → Apps](/panel?vista=negocio&tab=apps) en un momento.",
    });
    return false;
  }
  let { data: actual } = await admin.from("whatsapp_numeros").select("owner_id").eq("phone_number_id", telefono).maybeSingle();
  if (actual && String(actual.owner_id) !== userId) {
    const anterior = String(actual.owner_id);
    const acceso = await accesoDe(admin, anterior, telefono);
    if (acceso === "sin_permiso" || acceso === "token_invalido") {
      // Meta confirma que la cuenta anterior ya no tiene permiso: el número pasa a esta
      await admin.from("whatsapp_numeros").delete().eq("phone_number_id", telefono).eq("owner_id", anterior);
      await avisarEnChat(admin, anterior, {
        agente: "lola",
        texto: "Tu conexión con Meta ya no tiene permiso sobre tu número de WhatsApp y otra cuenta de Atendel que sí lo tiene lo conectó, así que sus mensajes ahora llegan allá. Si no fuiste tú, revisa quién tiene acceso a tu WhatsApp Business en Meta y vuelve a conectar en [Tu negocio → Apps](/panel?vista=negocio&tab=apps).",
      });
      actual = null;
    }
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
