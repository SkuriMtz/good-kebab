import { NextResponse } from "next/server";
import { llavesPush } from "@/lib/push";
import { createClient } from "@/lib/supabase/server";
import { clienteServicio } from "@/lib/supabase/servicio";

/**
 * GET /api/avisos/llave → { publica }: la llave pública VAPID, que el
 * navegador necesita para activar las notificaciones. La privada nunca sale
 * del servidor (vive en la bóveda de Supabase). Solo con sesión.
 */

export const dynamic = "force-dynamic";

const error = (mensaje: string, status: number) => NextResponse.json({ error: mensaje }, { status });

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return error("Tu sesión terminó. Vuelve a entrar.", 401);
  const admin = clienteServicio();
  if (!admin) return error("Los avisos todavía no están listos en el servidor.", 503);
  const llaves = await llavesPush(admin);
  if (!llaves) return error("No se pudieron preparar los avisos. Intenta en un momento.", 503);
  return NextResponse.json({ publica: llaves.publica }, { headers: { "Cache-Control": "private, max-age=3600" } });
}
