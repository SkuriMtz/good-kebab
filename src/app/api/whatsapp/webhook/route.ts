import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { avisarEnChat, citar } from "@/lib/avisos";
import { clienteServicio } from "@/lib/supabase/servicio";
import { firmaValida, leerAviso } from "@/lib/whatsapp/cloud";

/**
 * /api/whatsapp/webhook: a donde Meta manda los mensajes de tus clientes.
 *
 * - GET: Meta verifica la dirección una vez (hub.verify_token debe ser igual
 *   a WHATSAPP_VERIFY_TOKEN, que el dueño pone en Vercel y en su app de Meta).
 * - POST: cada mensaje nuevo. Solo se acepta con la firma de Meta
 *   (X-Hub-Signature-256 con META_APP_SECRET). Se guarda en
 *   whatsapp_mensajes (sin repetir: el id de Meta es único) y la base de
 *   datos le pide al servidor que Lola conteste (migración 0022). Aquí no se
 *   espera a la IA: Meta necesita la respuesta rápido.
 * - Si algo no se pudo guardar, contesta 500 para que Meta lo vuelva a mandar.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 20;

const MAX_CUERPO = 1_000_000;

function iguales(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export async function GET(req: NextRequest) {
  const esperado = (process.env.WHATSAPP_VERIFY_TOKEN ?? "").trim();
  if (!esperado) return new NextResponse("Falta WHATSAPP_VERIFY_TOKEN en Vercel.", { status: 503 });
  const q = req.nextUrl.searchParams;
  const reto = q.get("hub.challenge") ?? "";
  if (q.get("hub.mode") !== "subscribe" || !iguales(q.get("hub.verify_token") ?? "", esperado) || !/^[A-Za-z0-9_-]{1,200}$/.test(reto)) {
    return new NextResponse("No autorizado.", { status: 403 });
  }
  return new NextResponse(reto, { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  if (Number(req.headers.get("content-length") ?? 0) > MAX_CUERPO) return NextResponse.json({ error: "Muy grande." }, { status: 413 });
  const crudo = Buffer.from(await req.arrayBuffer());
  if (crudo.length > MAX_CUERPO) return NextResponse.json({ error: "Muy grande." }, { status: 413 });
  if (!firmaValida(crudo, req.headers.get("x-hub-signature-256"))) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  let datos: unknown;
  try {
    datos = JSON.parse(crudo.toString("utf8"));
  } catch {
    // Firmado pero ilegible: no sirve que Meta lo repita
    return NextResponse.json({ ok: true });
  }
  const avisos = leerAviso(datos);
  if (!avisos.length) return NextResponse.json({ ok: true });
  const admin = clienteServicio();
  // Sin la llave de servicio no se puede guardar: Meta lo vuelve a intentar después
  if (!admin) return NextResponse.json({ error: "Falta SUPABASE_SERVICE_ROLE_KEY en Vercel." }, { status: 503 });

  const duenos = new Map<string, string | null>();
  let fallo = false;
  for (const a of avisos) {
    if (!duenos.has(a.phoneNumberId)) {
      const { data, error } = await admin.from("whatsapp_numeros").select("owner_id").eq("phone_number_id", a.phoneNumberId).maybeSingle();
      if (error) fallo = true;
      duenos.set(a.phoneNumberId, data?.owner_id ? String(data.owner_id) : null);
    }
    // Un número que nadie conectó en Atendel: se ignora
    const dueno = duenos.get(a.phoneNumberId);
    if (!dueno) continue;

    // Uno por uno: cada mensaje con su propia hora (así se sabe cuál fue el último)
    for (const m of a.mensajes) {
      const tarde = Date.now() - m.en > 24 * 3_600_000;
      const { error } = await admin.from("whatsapp_mensajes").upsert(
        {
          owner_id: dueno,
          telefono: m.de,
          nombre: m.nombre,
          direccion: "entrante",
          texto: m.texto,
          wa_id: m.waId,
          ...(tarde ? { estado: "sin_respuesta", motivo: "Llegó con más de 24 horas de retraso: WhatsApp ya no deja contestarle libre." } : {}),
        },
        { onConflict: "wa_id", ignoreDuplicates: true },
      );
      if (error) {
        fallo = true;
        console.error("WhatsApp: no se guardó un mensaje", error.code);
      }
    }

    // Lo que mandamos y Meta dice que no llegó: se marca y se avisa en el chat
    for (const s of a.estados) {
      if (s.estado !== "failed") continue;
      const motivo = (s.error ?? "WhatsApp no lo pudo entregar.").slice(0, 300);
      const { data: fallido } = await admin
        .from("whatsapp_mensajes")
        .update({ estado: "error", motivo })
        .eq("wa_id", s.waId)
        .eq("owner_id", dueno)
        .eq("direccion", "saliente")
        .neq("estado", "error")
        .select("telefono, nombre")
        .maybeSingle();
      if (fallido) {
        await avisarEnChat(admin, dueno, {
          agente: "lola",
          texto: `No le llegó a ${citar(fallido.nombre, 80) || `+${fallido.telefono}`} el mensaje de WhatsApp que le mandamos. WhatsApp dice: «${citar(motivo, 300)}».`,
        });
      }
    }
  }
  return fallo ? NextResponse.json({ error: "No se guardó todo; Meta lo vuelve a mandar." }, { status: 500 }) : NextResponse.json({ ok: true });
}
