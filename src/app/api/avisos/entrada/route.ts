import { NextRequest, NextResponse } from "next/server";
import { COOKIE_APARATO, OPCIONES_COOKIE_APARATO, hashAparato, nuevoAparato, valorAparatoValido } from "@/lib/aparato";
import { notificar } from "@/lib/notificar";
import { nombreAparato } from "@/lib/push";
import { createClient } from "@/lib/supabase/server";
import { clienteServicio } from "@/lib/supabase/servicio";

/**
 * POST /api/avisos/entrada (el panel lo llama al abrir): anota desde qué
 * aparato entraste (tabla entradas, con el hash de la cookie del aparato).
 * Si es un aparato nuevo y la sesión se acaba de iniciar, te avisa en tus
 * otros aparatos y en el chat (por si no fuiste tú). Si la sesión ya venía
 * de antes (por ejemplo, el día que esto se sube), solo lo anota.
 */

export const dynamic = "force-dynamic";

const RECIENTE = 15 * 60_000;
const error = (mensaje: string, status: number) => NextResponse.json({ error: mensaje }, { status });

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return error("Tu sesión terminó. Vuelve a entrar.", 401);
  const admin = clienteServicio();
  if (!admin) return error("Los avisos todavía no están listos en el servidor.", 503);

  let valor = req.cookies.get(COOKIE_APARATO)?.value ?? "";
  const nueva = !valorAparatoValido(valor);
  if (nueva) valor = nuevoAparato();
  const aparato = hashAparato(valor);
  const nombre = nombreAparato(req.headers.get("user-agent"));

  const { data: visto } = await admin.from("entradas").select("visto_en").eq("owner_id", user.id).eq("aparato", aparato).maybeSingle();
  if (visto) {
    // Se refresca de vez en cuando (no en cada vuelta)
    if (Date.now() - new Date(String(visto.visto_en)).getTime() > 86_400_000)
      await admin.from("entradas").update({ visto_en: new Date().toISOString(), nombre }).eq("owner_id", user.id).eq("aparato", aparato);
  } else {
    const { count: antes } = await admin.from("entradas").select("aparato", { count: "exact", head: true }).eq("owner_id", user.id);
    const { error: e } = await admin.from("entradas").insert({ owner_id: user.id, aparato, nombre });
    const sesionNueva = Boolean(user.last_sign_in_at) && Date.now() - new Date(String(user.last_sign_in_at)).getTime() < RECIENTE;
    // Su primer aparato no se avisa; tampoco si se guardó en otra vuelta al mismo tiempo
    if (!e && sesionNueva && (antes ?? 0) > 0) {
      await notificar(admin, user.id, {
        tipo: "entrada_nueva",
        agente: "iris",
        chat: `Entraste a tu cuenta desde un aparato nuevo: **${nombre}**. Si no fuiste tú, cambia tu contraseña y cierra la sesión en todos lados en [Ajustes → Cuenta](/panel?vista=ajustes&seccion=cuenta).`,
        corto: `Entraron a tu cuenta desde ${nombre}. Si no fuiste tú, cierra la sesión en todos lados en Ajustes → Cuenta.`,
        enlace: "/panel?vista=ajustes&seccion=cuenta",
        excepto: aparato,
      });
    }
  }
  const res = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } });
  if (nueva) res.cookies.set(COOKIE_APARATO, valor, OPCIONES_COOKIE_APARATO);
  return res;
}
