import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { clienteServicio } from "@/lib/supabase/servicio";
import { avisosWhatsappListos, numeroDeAtendel } from "@/lib/whatsapp/aviso-plantilla";
import { TEXTO_CONFIRMAR, hashCodigo, mascara, nuevoCodigo, venceCodigo } from "@/lib/whatsapp/avisos-dueno";

/**
 * Tu WhatsApp para recibir avisos (tabla avisos_whatsapp, solo servidor).
 * - GET → { disponible, estado, numero (oculto: +52 ••• 1234), motivo }
 * - POST { accion: "conectar" } → un código de un solo uso (15 minutos) y el
 *   enlace a WhatsApp con el mensaje listo para mandarlo al número de Atendel.
 *   Tu número sale de ese mensaje (no se escribe aquí).
 * - POST { accion: "pausar" | "activar" | "quitar" }
 * Siempre con tu sesión; cada cuenta solo toca lo suyo.
 */

export const dynamic = "force-dynamic";

const error = (mensaje: string, status: number) => NextResponse.json({ error: mensaje }, { status });
const SIN_CACHE = { "Cache-Control": "private, no-store" };
type Fila = { numero: string | null; confirmado_en: string | null; pausado: boolean; motivo: string | null; codigo_vence: string | null; actualizado_en: string };

async function preparar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { user, admin: clienteServicio() };
}

const estadoDe = (f: Fila | null) => {
  if (f?.numero && f.confirmado_en) return f.pausado ? "pausado" : "conectado";
  if (f?.codigo_vence && new Date(f.codigo_vence).getTime() > Date.now()) return "esperando";
  return "sin_conectar";
};

export async function GET() {
  const { user, admin } = await preparar();
  if (!user) return error("Tu sesión terminó. Vuelve a entrar.", 401);
  if (!admin) return error("Los avisos todavía no están listos en el servidor.", 503);
  const { data } = await admin.from("avisos_whatsapp").select("numero, confirmado_en, pausado, motivo, codigo_vence, actualizado_en").eq("owner_id", user.id).maybeSingle();
  const f = (data as Fila | null) ?? null;
  return NextResponse.json(
    { disponible: avisosWhatsappListos(), estado: estadoDe(f), numero: f?.numero && f.confirmado_en ? mascara(f.numero) : null, motivo: f?.pausado ? f.motivo : null },
    { headers: SIN_CACHE },
  );
}

export async function POST(req: NextRequest) {
  const { user, admin } = await preparar();
  if (!user) return error("Tu sesión terminó. Vuelve a entrar.", 401);
  if (!admin) return error("Los avisos todavía no están listos en el servidor.", 503);
  if (Number(req.headers.get("content-length") ?? "0") > 1000) return error("Petición inválida.", 400);
  let accion: unknown;
  try {
    accion = ((await req.json()) as { accion?: unknown }).accion;
  } catch {
    return error("Petición inválida.", 400);
  }
  const ahora = new Date().toISOString();
  const { data } = await admin.from("avisos_whatsapp").select("numero, confirmado_en, pausado, motivo, codigo_vence, actualizado_en").eq("owner_id", user.id).maybeSingle();
  const f = (data as Fila | null) ?? null;

  if (accion === "conectar") {
    if (!avisosWhatsappListos()) return error("Los avisos por WhatsApp todavía no están disponibles.", 409);
    // Uno a la vez: un código nuevo cada 20 segundos como mucho
    if (f?.codigo_vence && new Date(f.codigo_vence).getTime() > Date.now() && Date.now() - new Date(f.actualizado_en).getTime() < 20_000) return error("Espera unos segundos y vuelve a intentar.", 429);
    const numero = await numeroDeAtendel();
    if (!numero) return error("No pude preparar el enlace a WhatsApp. Intenta en un momento.", 503);
    const codigo = nuevoCodigo();
    const vence = venceCodigo().toISOString();
    // Si ya tenías un número, se queda hasta que el nuevo se confirme
    const { error: e } = await admin.from("avisos_whatsapp").upsert({ owner_id: user.id, codigo_hash: hashCodigo(codigo), codigo_vence: vence, actualizado_en: ahora }, { onConflict: "owner_id" });
    if (e) return error("No pude preparar el código. Intenta de nuevo.", 500);
    return NextResponse.json({ enlace: `https://wa.me/${numero}?text=${encodeURIComponent(TEXTO_CONFIRMAR(codigo))}`, codigo, vence }, { headers: SIN_CACHE });
  }
  if (accion === "pausar" || accion === "activar") {
    if (!f?.numero || !f.confirmado_en) return error("Primero conecta tu WhatsApp.", 409);
    await admin
      .from("avisos_whatsapp")
      .update({ pausado: accion === "pausar", motivo: accion === "pausar" ? "Los pausaste en Ajustes." : null, actualizado_en: ahora })
      .eq("owner_id", user.id);
    return NextResponse.json({ estado: accion === "pausar" ? "pausado" : "conectado" }, { headers: SIN_CACHE });
  }
  if (accion === "quitar") {
    await admin.from("avisos_whatsapp").delete().eq("owner_id", user.id);
    return NextResponse.json({ estado: "sin_conectar" }, { headers: SIN_CACHE });
  }
  return error("No entendí qué hacer.", 400);
}
