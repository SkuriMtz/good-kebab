import { NextRequest, NextResponse } from "next/server";
import { mandarPorWhatsapp, whatsappListo } from "@/lib/envios/whatsapp";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/envios/[id] { accion: "aprobar" | "descartar" }
 *
 * El visto bueno del dueño a un envío que dejó un agente en Pendientes. Es lo
 * ÚNICO que manda algo por WhatsApp. Si WhatsApp aún no está conectado, el
 * envío queda "aprobado" (guardado) y se dice así; nunca se finge que salió.
 */

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const error = (mensaje: string, status: number) => NextResponse.json({ error: mensaje }, { status });

type Destinatario = { nombre: string; whatsapp: string };

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!UUID.test(params.id)) return error("No existe ese envío.", 404);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return error("Tu sesión terminó. Vuelve a entrar.", 401);
  let accion: unknown;
  try {
    accion = ((await req.json()) as { accion?: unknown }).accion;
  } catch {
    return error("No entendí qué hacer.", 400);
  }
  if (accion !== "aprobar" && accion !== "descartar") return error("No entendí qué hacer.", 400);

  const { data: envio } = await supabase.from("envios").select("id, estado, destinatarios, mensaje, archivo_id").eq("id", params.id).eq("owner_id", user.id).maybeSingle();
  if (!envio) return error("No existe ese envío.", 404);
  if (envio.estado !== "por_aprobar") return error("Ese envío ya se resolvió.", 409);
  const ahora = new Date().toISOString();

  // Se "toma" el envío solo si sigue por aprobar: dos clics seguidos no lo mandan dos veces
  const { data: tomado } = await supabase
    .from("envios")
    .update({ estado: accion === "descartar" ? "descartado" : "aprobado", resuelto_en: ahora })
    .eq("id", envio.id)
    .eq("owner_id", user.id)
    .eq("estado", "por_aprobar")
    .select("id")
    .maybeSingle();
  if (!tomado) return error("Ese envío ya se resolvió.", 409);
  if (accion === "descartar") return NextResponse.json({ estado: "descartado", mensaje: "Descartado: no se mandó nada." });

  // Sin WhatsApp conectado: queda aprobado y guardado, sin fingir que salió
  if (!whatsappListo()) return NextResponse.json({ estado: "aprobado", mensaje: "Aprobado. Se manda en cuanto WhatsApp quede conectado." });

  let documento: { enlace: string; nombre: string } | undefined;
  if (envio.archivo_id) {
    const { data: a } = await supabase.from("archivos").select("nombre, ruta").eq("id", envio.archivo_id).eq("owner_id", user.id).maybeSingle();
    if (a) {
      // Una dirección firmada que dura un día, para que WhatsApp la baje
      const { data: f } = await supabase.storage.from("archivos").createSignedUrl(a.ruta as string, 86_400);
      if (f) documento = { enlace: f.signedUrl, nombre: a.nombre as string };
    }
  }
  const destinatarios = (envio.destinatarios as Destinatario[]).slice(0, 50);
  const fallas: string[] = [];
  for (const d of destinatarios) {
    const r = await mandarPorWhatsapp({ a: d.whatsapp, nombre: d.nombre, mensaje: envio.mensaje as string, documento });
    if (!r.ok) fallas.push(`${d.nombre}: ${r.error}`);
  }
  const estado = fallas.length === destinatarios.length ? "error" : "enviado";
  await supabase
    .from("envios")
    .update({ estado, resuelto_en: ahora, error: fallas.length ? fallas.join(" · ").slice(0, 500) : null })
    .eq("id", envio.id)
    .eq("owner_id", user.id);
  if (estado === "error") return NextResponse.json({ estado, mensaje: `No se pudo mandar: ${fallas[0]}` }, { status: 502 });
  return NextResponse.json({ estado, mensaje: fallas.length ? `Se mandó, pero falló con ${fallas.length}: ${fallas.join(" · ")}` : `Se mandó a ${destinatarios.length} ${destinatarios.length === 1 ? "persona" : "personas"}.` });
}
