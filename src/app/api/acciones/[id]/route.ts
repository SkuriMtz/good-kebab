import { NextRequest, NextResponse } from "next/server";
import { limpiarAjustes } from "@/lib/ajustes";
import { aparatoDe } from "@/lib/aparato";
import { citar } from "@/lib/avisos";
import { APP_POR_ID } from "@/lib/conexiones/catalogo";
import { limpiarCorto, notificar } from "@/lib/notificar";
import { herramientaPorNombre } from "@/lib/conexiones/registro";
import { conexionesVigentes } from "@/lib/conexiones/tokens";
import { mensajeError } from "@/lib/herramientas/ciclo";
import { corredor } from "@/lib/herramientas/preparar";
import { createClient } from "@/lib/supabase/server";
import { clienteServicio } from "@/lib/supabase/servicio";

/**
 * POST /api/acciones/[id]  { accion: "aprobar" | "descartar" }
 *
 * Tu decisión sobre algo que Atendel dejó esperando tu OK (crear o mover una
 * cita, mandar un correo, crear una tarea…; src/lib/acciones.ts).
 * - Con tu sesión (RLS): solo lo de tu cuenta.
 * - Se "toma" primero: dos clics seguidos no lo hacen dos veces.
 * - Se hace con TU conexión de esa app, con lo que viste en el resumen; si la
 *   app ya no está conectada, no se hace.
 * - Nunca se dice que se hizo si la app no lo confirmó.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const error = (mensaje: string, status: number) => NextResponse.json({ error: mensaje }, { status });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!UUID.test(params.id)) return error("No existe eso.", 404);
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

  const { data: fila } = await supabase.from("acciones").select("id, herramienta, app, args, estado, resumen").eq("id", params.id).eq("owner_id", user.id).maybeSingle();
  if (!fila) return error("No existe eso.", 404);
  if (fila.estado !== "esperando") return error("Eso ya se resolvió.", 409);
  const admin = clienteServicio();
  if (!admin) return error("Falta SUPABASE_SERVICE_ROLE_KEY en Vercel.", 503);

  // Se toma solo si sigue esperando: dos clics no lo hacen dos veces
  const { data: tomada } = await supabase
    .from("acciones")
    .update({ estado: accion === "descartar" ? "descartada" : "haciendo" })
    .eq("id", fila.id)
    .eq("owner_id", user.id)
    .eq("estado", "esperando")
    .select("id")
    .maybeSingle();
  if (!tomada) return error("Eso ya se resolvió.", 409);
  const ahora = () => new Date().toISOString();
  if (accion === "descartar") {
    await admin.from("acciones").update({ resuelto_en: ahora() }).eq("id", fila.id).eq("owner_id", user.id);
    return NextResponse.json({ estado: "descartada", mensaje: "Listo: no se hizo nada." });
  }

  const fallo = async (mensaje: string, status: number) => {
    await admin.from("acciones").update({ estado: "error", resultado: mensaje.slice(0, 2000), resuelto_en: ahora() }).eq("id", fila.id).eq("owner_id", user.id);
    // Queda en el chat de Avisos; la notificación, solo a tus otros aparatos (en este ya lo estás viendo)
    await notificar(admin, user.id, {
      tipo: "accion_fallo",
      agente: "iris",
      chat: `No se pudo hacer lo que aprobaste: ${citar(fila.resumen, 300)}.\n\n${citar(mensaje, 400)}`,
      corto: `No se pudo hacer lo que aprobaste: ${limpiarCorto(fila.resumen, 160)}.`,
      excepto: aparatoDe(req),
    });
    return error(mensaje, status);
  };
  const h = herramientaPorNombre(String(fila.herramienta));
  if (!h?.hace || h.app !== fila.app) return fallo("Eso ya no se puede hacer desde aquí.", 409);
  const app = APP_POR_ID[h.app];
  const conexiones = await conexionesVigentes(supabase, user.id);
  if (!conexiones.some((c) => c.estado === "activa" && c.apps.includes(h.app)))
    return fallo(`${app?.nombre ?? "Esa app"} ya no está conectada. Conéctala en Tu negocio → Apps y vuelve a pedírselo a Atendel.`, 409);

  const { data: filaAjustes } = await supabase.from("ajustes_cuenta").select("datos").eq("owner_id", user.id).maybeSingle();
  const zona = limpiarAjustes(filaAjustes?.datos).zonaHoraria;
  const args = fila.args && typeof fila.args === "object" && !Array.isArray(fila.args) ? (fila.args as Record<string, unknown>) : {};
  try {
    const resultado = await corredor(supabase, user.id, zona)(h, args, AbortSignal.timeout(25_000));
    await admin.from("acciones").update({ estado: "hecha", resultado: resultado.slice(0, 2000), resuelto_en: ahora() }).eq("id", fila.id).eq("owner_id", user.id);
    return NextResponse.json({ estado: "hecha", mensaje: resultado.slice(0, 400) });
  } catch (e) {
    return fallo(mensajeError(e, app?.nombre ?? "la app").replace(/^No se pudo usar la herramienta: /, "").replace(/ Díselo a la persona tal cual\.$/, ""), 502);
  }
}
