import { NextRequest, NextResponse } from "next/server";
import { notificar } from "@/lib/notificar";
import { endpointValido, llavesAparatoValidas, nombreAparato } from "@/lib/push";
import { createClient } from "@/lib/supabase/server";
import { clienteServicio } from "@/lib/supabase/servicio";

/**
 * Los aparatos donde activaste las notificaciones (tabla suscripciones_push).
 * - GET → { aparatos }: los tuyos (con RLS).
 * - POST { suscripcion } → guarda este aparato. Solo direcciones de servicios
 *   de push reales y llaves con la forma correcta; el nombre del aparato sale
 *   del navegador. Si es nuevo, te avisa en todos tus aparatos y en el chat.
 * - DELETE { id } o { endpoint } → quita un aparato (con RLS: solo los tuyos).
 */

export const dynamic = "force-dynamic";

const MAX_APARATOS = 10;
const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const error = (mensaje: string, status: number) => NextResponse.json({ error: mensaje }, { status });
const SIN_CACHE = { "Cache-Control": "private, no-store" };

async function usuario() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

async function leerCuerpo(req: NextRequest): Promise<Record<string, unknown> | null> {
  if (Number(req.headers.get("content-length") ?? "0") > 4000) return null;
  try {
    const j = await req.json();
    return j && typeof j === "object" && !Array.isArray(j) ? (j as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export async function GET() {
  const { supabase, user } = await usuario();
  if (!user) return error("Tu sesión terminó. Vuelve a entrar.", 401);
  const { data, error: e } = await supabase.from("suscripciones_push").select("id, aparato, endpoint, creado_en, usado_en").order("creado_en", { ascending: false }).limit(MAX_APARATOS);
  if (e) return error("No pudimos leer tus aparatos.", 500);
  return NextResponse.json({ aparatos: data ?? [] }, { headers: SIN_CACHE });
}

export async function POST(req: NextRequest) {
  const { user } = await usuario();
  if (!user) return error("Tu sesión terminó. Vuelve a entrar.", 401);
  const cuerpo = await leerCuerpo(req);
  const s = cuerpo?.suscripcion as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } } | undefined;
  const endpoint = s?.endpoint;
  const p256dh = s?.keys?.p256dh;
  const auth = s?.keys?.auth;
  if (!endpointValido(endpoint) || !llavesAparatoValidas(p256dh, auth)) return error("Este navegador mandó algo que no reconocemos. Intenta de nuevo.", 400);
  const admin = clienteServicio();
  if (!admin) return error("Los avisos todavía no están listos en el servidor.", 503);
  const aparato = nombreAparato(req.headers.get("user-agent"));
  const llaves = { p256dh: String(p256dh), auth: String(auth) };

  const { data: hay } = await admin.from("suscripciones_push").select("id, owner_id, p256dh, auth").eq("endpoint", endpoint).maybeSingle();
  // Ya era tuyo: solo se actualiza
  if (hay && String(hay.owner_id) === user.id) {
    await admin.from("suscripciones_push").update({ ...llaves, aparato }).eq("id", hay.id).eq("owner_id", user.id);
    return NextResponse.json({ id: hay.id, nuevo: false }, { headers: SIN_CACHE });
  }
  const { count } = await admin.from("suscripciones_push").select("id", { count: "exact", head: true }).eq("owner_id", user.id);
  if ((count ?? 0) >= MAX_APARATOS) return error(`Ya tienes avisos en ${MAX_APARATOS} aparatos. Quita uno de la lista y vuelve a intentar.`, 409);

  // Tenía avisos de otra cuenta: solo pasa a esta si el navegador demuestra que es el mismo (sus llaves);
  // con solo la dirección nadie se puede quedar con los avisos de otro aparato
  if (hay && (String(hay.p256dh) !== llaves.p256dh || String(hay.auth) !== llaves.auth)) return error("Este aparato ya tiene avisos de otra cuenta. Apágalos allá y vuelve a intentar.", 409);
  let id: string | null = null;
  if (hay) {
    // Este navegador tenía avisos de otra cuenta (se entró con otra): ahora son de esta
    const { error: e } = await admin
      .from("suscripciones_push")
      .update({ owner_id: user.id, ...llaves, aparato, creado_en: new Date().toISOString(), usado_en: null })
      .eq("id", hay.id)
      .eq("owner_id", String(hay.owner_id));
    if (!e) id = String(hay.id);
  } else {
    const { data, error: e } = await admin
      .from("suscripciones_push")
      .insert({ owner_id: user.id, endpoint, ...llaves, aparato })
      .select("id")
      .single();
    if (!e && data) id = String(data.id);
  }
  if (!id) return error("No pudimos guardar este aparato. Intenta de nuevo.", 500);

  // Aviso de seguridad: a todos tus aparatos (también a este, así ves que funciona) y al chat
  await notificar(admin, user.id, {
    tipo: "aparato_nuevo",
    agente: "iris",
    chat: `Activaste los avisos en **${aparato}**: desde ahora también te aviso ahí de lo importante. Si no fuiste tú, quítalo en [Ajustes → Notificaciones](/panel?vista=ajustes&seccion=notificaciones).`,
    corto: `Se activaron los avisos en ${aparato}. Si no fuiste tú, quítalo en Ajustes.`,
    enlace: "/panel?vista=ajustes&seccion=notificaciones",
  });
  return NextResponse.json({ id, nuevo: true }, { headers: SIN_CACHE });
}

export async function DELETE(req: NextRequest) {
  const { supabase, user } = await usuario();
  if (!user) return error("Tu sesión terminó. Vuelve a entrar.", 401);
  const cuerpo = await leerCuerpo(req);
  const id = typeof cuerpo?.id === "string" && ID.test(cuerpo.id) ? cuerpo.id : null;
  const endpoint = endpointValido(cuerpo?.endpoint) ? cuerpo.endpoint : null;
  if (!id && !endpoint) return error("Falta cuál aparato quitar.", 400);
  // Con la sesión: RLS solo deja borrar los tuyos
  const q = supabase.from("suscripciones_push").delete();
  const { error: e } = await (id ? q.eq("id", id) : q.eq("endpoint", endpoint as string));
  if (e) return error("No pudimos quitar ese aparato. Intenta de nuevo.", 500);
  return NextResponse.json({ ok: true }, { headers: SIN_CACHE });
}
