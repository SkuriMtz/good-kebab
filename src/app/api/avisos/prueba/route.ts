import { NextResponse } from "next/server";
import { notificar } from "@/lib/notificar";
import { createClient } from "@/lib/supabase/server";
import { clienteServicio } from "@/lib/supabase/servicio";

/**
 * POST /api/avisos/prueba → manda un aviso de prueba a todos tus aparatos
 * (sin importar el nivel ni las horas de silencio). Hasta 5 por hora.
 * Responde { resultado }: enviado, omitido (no hay aparatos) o fallo.
 */

export const dynamic = "force-dynamic";

const POR_HORA = 5;
const error = (mensaje: string, status: number) => NextResponse.json({ error: mensaje }, { status });

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return error("Tu sesión terminó. Vuelve a entrar.", 401);
  const admin = clienteServicio();
  if (!admin) return error("Los avisos todavía no están listos en el servidor.", 503);
  const { count } = await admin
    .from("avisos_salida")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id)
    .eq("tipo", "prueba")
    .gte("creado_en", new Date(Date.now() - 3_600_000).toISOString());
  if ((count ?? 0) >= POR_HORA) return error("Ya mandaste varias pruebas. Espera un rato y vuelve a intentar.", 429);
  const resultado = await notificar(admin, user.id, {
    tipo: "prueba",
    agente: "iris",
    corto: "Así te van a llegar los avisos de Atendel.",
    enlace: "/panel?vista=ajustes&seccion=notificaciones",
    forzar: true,
  });
  return NextResponse.json({ resultado }, { headers: { "Cache-Control": "private, no-store" } });
}
