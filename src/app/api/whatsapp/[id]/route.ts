import { NextRequest, NextResponse } from "next/server";
import { aparatoDe } from "@/lib/aparato";
import { citar } from "@/lib/avisos";
import { ErrorConexion, obtenerToken } from "@/lib/conexiones/tokens";
import { nombreSeguro, notificar } from "@/lib/notificar";
import { createClient } from "@/lib/supabase/server";
import { clienteServicio } from "@/lib/supabase/servicio";
import { mandarTexto } from "@/lib/whatsapp/cloud";

/**
 * POST /api/whatsapp/[id]  { accion: "mandar", texto } | { accion: "descartar" }
 *
 * Tu decisión sobre un mensaje de un cliente que espera tu OK: mandarle la
 * respuesta (la que propuso Lola o la tuya) o no contestar.
 * - Con tu sesión (RLS): solo mensajes de tu cuenta.
 * - Se "toma" primero: dos clics seguidos no lo mandan dos veces.
 * - Solo dentro de las 24 horas desde su último mensaje (regla de WhatsApp).
 * - Nunca se dice que salió si Meta no lo confirmó.
 */

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Lo que espera tu decisión. */
const ESPERAN = ["esperando_ok", "sin_respuesta", "error"];
/** Lo que se quedó a medias (más de 3 minutos sin que Lola terminara). */
const ATORADOS = ["recibido", "pensando"];
const TRES_MIN = 3 * 60_000;
const error = (mensaje: string, status: number) => NextResponse.json({ error: mensaje }, { status });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!UUID.test(params.id)) return error("No existe ese mensaje.", 404);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return error("Tu sesión terminó. Vuelve a entrar.", 401);
  let cuerpo: { accion?: unknown; texto?: unknown };
  try {
    cuerpo = (await req.json()) as { accion?: unknown; texto?: unknown };
  } catch {
    return error("No entendí qué hacer.", 400);
  }
  const accion = cuerpo.accion;
  if (accion !== "mandar" && accion !== "descartar") return error("No entendí qué hacer.", 400);
  const texto = typeof cuerpo.texto === "string" ? cuerpo.texto.trim() : "";
  if (accion === "mandar" && !texto) return error("Escribe la respuesta.", 400);
  if (texto.length > 4096) return error("El mensaje es muy largo (máximo 4,096 letras).", 400);

  const { data: msj } = await supabase
    .from("whatsapp_mensajes")
    .select("id, estado, telefono, nombre, creado_en")
    .eq("id", params.id)
    .eq("owner_id", user.id)
    .eq("direccion", "entrante")
    .maybeSingle();
  if (!msj) return error("No existe ese mensaje.", 404);
  const estado = String(msj.estado);
  const atorado = ATORADOS.includes(estado) && Date.now() - new Date(String(msj.creado_en)).getTime() > TRES_MIN;
  if (!ESPERAN.includes(estado) && !atorado) return error("Ese mensaje ya se resolvió.", 409);
  const quien = msj.nombre || `+${msj.telefono}`;

  if (accion === "descartar") {
    const { data: tomado } = await supabase.from("whatsapp_mensajes").update({ estado: "descartado" }).eq("id", msj.id).eq("owner_id", user.id).eq("estado", estado).select("id").maybeSingle();
    if (!tomado) return error("Ese mensaje ya se resolvió.", 409);
    return NextResponse.json({ estado: "descartado", mensaje: "Listo: no se le contesta." });
  }

  // La regla de WhatsApp: texto libre solo dentro de las 24 horas desde su último mensaje
  const { data: ultimo } = await supabase
    .from("whatsapp_mensajes")
    .select("creado_en")
    .eq("owner_id", user.id)
    .eq("telefono", msj.telefono)
    .eq("direccion", "entrante")
    .order("creado_en", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!ultimo || Date.now() - new Date(String(ultimo.creado_en)).getTime() > 24 * 3_600_000) {
    return error("Ya pasaron más de 24 horas desde su último mensaje: WhatsApp ya no deja contestarle libre desde aquí.", 409);
  }
  const admin = clienteServicio();
  if (!admin) return error("Falta SUPABASE_SERVICE_ROLE_KEY en Vercel.", 503);
  const { data: numero } = await supabase.from("whatsapp_numeros").select("phone_number_id").eq("owner_id", user.id).order("creado_en", { ascending: false }).limit(1).maybeSingle();
  if (!numero) return error("Tu número de WhatsApp no está conectado: conéctalo en Tu negocio → Apps.", 409);
  let token = "";
  try {
    token = (await obtenerToken(supabase, user.id, "meta")).access_token;
  } catch (e) {
    return error(e instanceof ErrorConexion ? e.message : "No pude leer tu conexión con Meta. Intenta de nuevo.", 409);
  }

  // Se toma: dos clics seguidos no lo mandan dos veces
  const { data: tomado } = await supabase.from("whatsapp_mensajes").update({ estado: "mandando" }).eq("id", msj.id).eq("owner_id", user.id).eq("estado", estado).select("id").maybeSingle();
  if (!tomado) return error("Ese mensaje ya se resolvió.", 409);

  const envio = await mandarTexto({ token, phoneNumberId: String(numero.phone_number_id), a: String(msj.telefono), texto });
  if (!envio.ok) {
    await admin.from("whatsapp_mensajes").update({ estado: "error", borrador: texto, motivo: `No salió: ${envio.error}`.slice(0, 300) }).eq("id", msj.id).eq("owner_id", user.id);
    // En el chat de Avisos; la notificación, solo a tus otros aparatos (en este ya lo estás viendo)
    const cliente = nombreSeguro(msj.nombre, "un cliente");
    await notificar(admin, user.id, {
      tipo: "accion_fallo",
      agente: "lola",
      chat: `No salió la respuesta que le mandaste a ${citar(msj.nombre, 80) || "un cliente"} por WhatsApp: ${citar(envio.error, 300)}. Quedó en [Necesita tu OK](/panel?vista=pendientes) para que lo intentes de nuevo.`,
      corto: `No salió la respuesta que le mandaste a ${cliente} por WhatsApp.`,
      enlace: "/panel?vista=pendientes",
      excepto: aparatoDe(req),
    });
    return error(`No salió: ${envio.error}`, 502);
  }
  await admin.from("whatsapp_mensajes").insert({ owner_id: user.id, telefono: msj.telefono, nombre: msj.nombre, direccion: "saliente", texto, wa_id: envio.waId, estado: "enviado", autor: "dueno" });
  await admin.from("whatsapp_mensajes").update({ estado: "respondido", motivo: "Lo mandaste tú." }).eq("id", msj.id).eq("owner_id", user.id);
  // Lo que ese cliente dejó sin contestar antes ya va en esta respuesta
  await admin
    .from("whatsapp_mensajes")
    .update({ estado: "agrupado", motivo: "Se contestó junto con su siguiente mensaje." })
    .eq("owner_id", user.id)
    .eq("telefono", msj.telefono)
    .eq("direccion", "entrante")
    .in("estado", ESPERAN)
    .lt("creado_en", msj.creado_en);
  return NextResponse.json({ estado: "respondido", mensaje: `Listo: se le mandó a ${quien}.` });
}
