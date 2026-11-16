import { NextRequest, NextResponse } from "next/server";
import { soltarAvisos } from "@/lib/notificar";
import { clienteServicio } from "@/lib/supabase/servicio";
import { apartarTarea, ejecutarTarea, tareasQueTocan } from "@/lib/tareas";
import { trabajarPara } from "@/lib/trabajo";
import { vigilarCorreos } from "@/lib/vigilar-correos";

/**
 * POST /api/trabajo: la base de datos lo llama cada 10 minutos (pg_cron +
 * pg_net, migraciones 0016 y 0017) cuando hay revisiones del día sin trabajar. Para cada una,
 * la IA trabaja por su cuenta (src/lib/trabajo.ts) y deja lo que hizo en la
 * Oficina. Nada se envía.
 *
 * Seguridad: solo con la llave que la base de datos guarda en su Vault
 * (cabecera x-atendel-llave), validada con llave_trabajo_valida(). Sin
 * SUPABASE_SERVICE_ROLE_KEY en Vercel, contesta 503 y no hace nada.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Solo se empieza otra cuenta si van menos de 15 s (cada una puede tardar ~40 s: las apps y el informe). */
const TIEMPO = 15_000;
const error = (mensaje: string, status: number) => NextResponse.json({ error: mensaje }, { status });

export async function POST(req: NextRequest) {
  const llave = req.headers.get("x-atendel-llave") ?? "";
  if (llave.length < 32 || llave.length > 200) return error("No autorizado.", 401);
  const admin = clienteServicio();
  if (!admin) return error("Falta SUPABASE_SERVICE_ROLE_KEY en Vercel (proyecto good-kebab, ambiente Production).", 503);
  const { data: valida } = await admin.rpc("llave_trabajo_valida", { llave });
  if (valida !== true) return error("No autorizado.", 401);

  const empezo = Date.now();
  // La base de datos pide por separado las tareas, las revisiones y los correos (?que=…): cada una con su tiempo
  const que = req.nextUrl.searchParams.get("que");
  const conTareas = !que || que === "tareas";
  const conRevisiones = !que || que === "revisiones";

  // Los avisos que esperaban su hora (horas de silencio, o lo informativo que se junta; migración 0025)
  if (que === "avisos") {
    const r = await soltarAvisos(admin, 40_000);
    return NextResponse.json(r, { headers: { "Cache-Control": "no-store" } });
  }
  // Los correos nuevos (cada 10 minutos, migración 0024): de las cuentas con Gmail u Outlook conectado
  if (que === "correos") {
    const { data: cons } = await admin.from("conexiones").select("owner_id").eq("estado", "activa").overlaps("apps", ["gmail", "outlook"]).limit(500);
    // En desorden, para que con muchas cuentas a todas les toque
    const duenos = Array.from(new Set((cons ?? []).map((c) => String(c.owner_id)))).sort(() => Math.random() - 0.5);
    const correos: { avisos: number; nuevos: number; motivo?: string }[] = [];
    for (const d of duenos) {
      if (Date.now() - empezo > 40_000) break;
      try {
        correos.push(await vigilarCorreos(admin, d));
      } catch (e) {
        console.error("Vigilar correos falló:", e instanceof Error ? e.message : e);
      }
    }
    return NextResponse.json({ cuentas: correos.length, avisos: correos.reduce((n, c) => n + c.avisos, 0) }, { headers: { "Cache-Control": "no-store" } });
  }
  // Primero las tareas que ya tocan (tienen hora); se apartan antes, para no correrlas dos veces
  const tareas: { id: string; hecho: boolean; motivo: string }[] = [];
  for (const t of conTareas ? await tareasQueTocan(admin) : []) {
    if (Date.now() - empezo > TIEMPO) break;
    if (!(await apartarTarea(admin, t))) continue;
    try {
      tareas.push({ id: t.id, ...(await ejecutarTarea(admin, t)) });
    } catch (e) {
      console.error("Tarea falló:", e instanceof Error ? e.message : e);
      tareas.push({ id: t.id, hecho: false, motivo: "error" });
    }
  }

  const { data: pendientes } = await admin
    .from("revisiones")
    .select("id, owner_id, partes")
    .is("trabajo_en", null)
    .gte("creado_en", new Date(Date.now() - 36 * 3_600_000).toISOString())
    .order("creado_en", { ascending: true })
    .limit(25);

  const resultados: { id: string; hecho: boolean; motivo: string }[] = [];
  for (const r of !conRevisiones || Date.now() - empezo > TIEMPO ? [] : (pendientes ?? [])) {
    if (Date.now() - empezo > TIEMPO) break;
    // Se aparta primero: así nunca se trabaja dos veces la misma (lo que falte, en la siguiente vuelta)
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
  return NextResponse.json({ tareas, trabajadas: resultados.length, hechas: resultados.filter((x) => x.hecho).length, resultados }, { headers: { "Cache-Control": "no-store" } });
}
