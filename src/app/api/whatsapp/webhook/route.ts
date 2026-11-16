import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { citar } from "@/lib/avisos";
import { nombreSeguro, notificar } from "@/lib/notificar";
import { clienteServicio } from "@/lib/supabase/servicio";
import { idNumeroAtendel } from "@/lib/whatsapp/aviso-plantilla";
import { falloDelNumeroDeAtendel, mensajeAlNumeroDeAtendel } from "@/lib/whatsapp/avisos-dueno";
import { firmaValida, leerAviso } from "@/lib/whatsapp/cloud";
import { registrarEvento } from "@/lib/seguridad";

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
 * - Lo que llega al número de Atendel (WHATSAPP_ENVIO_TELEFONO_ID) no es de un
 *   cliente: son dueños conectando o pausando sus avisos (avisos-dueno.ts).
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
  if (!firmaValida(crudo, req.headers.get("x-hub-signature-256"))) {
    await registrarEvento("firma_invalida", req);
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

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
  if (!admin) {
    console.error("WhatsApp: falta SUPABASE_SERVICE_ROLE_KEY en Vercel.");
    return NextResponse.json({ error: "No disponible." }, { status: 503 });
  }

  const duenos = new Map<string, string | null>();
  let fallo = false;
  const deAtendel = idNumeroAtendel();
  for (const a of avisos) {
    // Lo que llega al número de Atendel (no al de un negocio): los dueños conectando o pausando sus avisos
    if (deAtendel && a.phoneNumberId === deAtendel) {
      for (const m of a.mensajes) await mensajeAlNumeroDeAtendel(admin, m).catch((e) => console.error("WhatsApp de Atendel:", e instanceof Error ? e.message : e));
      for (const s of a.estados) await falloDelNumeroDeAtendel(admin, s).catch((e) => console.error("WhatsApp de Atendel (estado):", e instanceof Error ? e.message : e));
      continue;
    }
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
        await notificar(admin, dueno, {
          tipo: "mensaje_no_llego",
          agente: "lola",
          chat: `No le llegó a ${citar(fallido.nombre, 80) || `+${fallido.telefono}`} el mensaje de WhatsApp que le mandamos. WhatsApp dice: «${citar(motivo, 300)}».`,
          corto: `A ${nombreSeguro(fallido.nombre, "un cliente")} no le llegó un mensaje de WhatsApp.`,
        });
      }
    }
  }
  return fallo ? NextResponse.json({ error: "No se guardó todo; Meta lo vuelve a mandar." }, { status: 500 }) : NextResponse.json({ ok: true });
}
