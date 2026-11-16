import { NextRequest, NextResponse } from "next/server";
import { clienteServicio } from "@/lib/supabase/servicio";
import { responderWhatsapp } from "@/lib/whatsapp/responder";
import { registrarEvento } from "@/lib/seguridad";

/**
 * POST /api/whatsapp/responder {id}: la base de datos lo llama al llegar un
 * mensaje de un cliente (migración 0022, pg_net). Lola contesta sola o deja
 * la respuesta esperando tu OK (src/lib/whatsapp/responder.ts).
 *
 * Seguridad: solo con la llave que la base de datos guarda en su Vault
 * (cabecera x-atendel-llave), validada con llave_trabajo_valida(), igual
 * que /api/trabajo. Nadie de fuera puede pedir que se conteste algo.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const error = (mensaje: string, status: number) => NextResponse.json({ error: mensaje }, { status });

export async function POST(req: NextRequest) {
  const llave = req.headers.get("x-atendel-llave") ?? "";
  if (llave.length < 32 || llave.length > 200) {
    await registrarEvento("llave_invalida", req);
    return error("No autorizado.", 401);
  }
  const admin = clienteServicio();
  if (!admin) {
    console.error("Falta SUPABASE_SERVICE_ROLE_KEY en Vercel (proyecto good-kebab, ambiente Production).");
    return error("Este servicio no está disponible ahora.", 503);
  }
  const { data: valida } = await admin.rpc("llave_trabajo_valida", { llave });
  if (valida !== true) {
    await registrarEvento("llave_invalida", req);
    return error("No autorizado.", 401);
  }

  let id: unknown;
  try {
    id = ((await req.json()) as { id?: unknown }).id;
  } catch {
    return error("Petición inválida.", 400);
  }
  if (typeof id !== "string" || !UUID.test(id)) return error("Petición inválida.", 400);
  try {
    return NextResponse.json(await responderWhatsapp(admin, id), { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("WhatsApp: no se pudo contestar", e instanceof Error ? e.message : e);
    // Que no se quede "pensando": así aparece en Necesita tu OK
    await admin.from("whatsapp_mensajes").update({ estado: "sin_respuesta", motivo: "No le contesté: algo falló de mi lado." }).eq("id", id).eq("estado", "pensando");
    return error("No se pudo contestar.", 500);
  }
}
