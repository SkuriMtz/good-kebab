import { NextRequest, NextResponse } from "next/server";
import { clienteServicio } from "@/lib/supabase/servicio";
import { trabajarPara } from "@/lib/trabajo";

/**
 * POST /api/trabajo: la base de datos lo llama cada hora (pg_cron + pg_net,
 * migración 0016) cuando hay revisiones del día sin trabajar. Para cada una,
 * la IA trabaja por su cuenta (src/lib/trabajo.ts) y deja lo que hizo en la
 * Oficina. Nada se envía.
 *
 * Seguridad: solo con la llave que la base de datos guarda en su Vault
 * (cabecera x-atendel-llave), validada con llave_trabajo_valida(). Sin
 * SUPABASE_SERVICE_ROLE_KEY en Vercel, contesta 503 y no hace nada.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const TIEMPO = 45_000;
const error = (mensaje: string, status: number) => NextResponse.json({ error: mensaje }, { status });

export async function POST(req: NextRequest) {
  const llave = req.headers.get("x-atendel-llave") ?? "";
  if (llave.length < 32 || llave.length > 200) return error("No autorizado.", 401);
  const admin = clienteServicio();
  if (!admin) return error("Falta SUPABASE_SERVICE_ROLE_KEY en Vercel.", 503);
  const { data: valida } = await admin.rpc("llave_trabajo_valida", { llave });
  if (valida !== true) return error("No autorizado.", 401);

  const empezo = Date.now();
  const { data: pendientes } = await admin
    .from("revisiones")
    .select("id, owner_id, partes")
    .is("trabajo_en", null)
    .gte("creado_en", new Date(Date.now() - 36 * 3_600_000).toISOString())
    .order("creado_en", { ascending: true })
    .limit(25);

  const resultados: { id: string; hecho: boolean; motivo: string }[] = [];
  for (const r of pendientes ?? []) {
    if (Date.now() - empezo > TIEMPO) break;
    // Se aparta primero: así nunca se trabaja dos veces la misma (lo que falte, en la siguiente hora)
    const { data: apartada } = await admin.from("revisiones").update({ trabajo_en: new Date().toISOString() }).eq("id", r.id).is("trabajo_en", null).select("id");
    if (!apartada?.length) continue;
    try {
      const x = await trabajarPara(admin, { id: String(r.id), owner_id: String(r.owner_id), partes: r.partes });
      resultados.push({ id: String(r.id), ...x });
    } catch (e) {
      console.error("Trabajo por su cuenta falló:", e instanceof Error ? e.message : e);
      resultados.push({ id: String(r.id), hecho: false, motivo: "error" });
    }
  }
  return NextResponse.json({ trabajadas: resultados.length, hechas: resultados.filter((x) => x.hecho).length, resultados }, { headers: { "Cache-Control": "no-store" } });
}
