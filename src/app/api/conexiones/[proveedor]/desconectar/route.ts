import { NextResponse, type NextRequest } from "next/server";
import { aparatoDe } from "@/lib/aparato";
import { APP_POR_ID, esIdApp } from "@/lib/conexiones/catalogo";
import { NOMBRE_PROVEEDOR } from "@/lib/conexiones/oauth";
import { adaptador } from "@/lib/conexiones/registro";
import { notificar } from "@/lib/notificar";
import { clienteServicio } from "@/lib/supabase/servicio";
import { cuerpoJson, errorJson, preparar } from "@/lib/conexiones/rutas";
import { appsDeFila, descifrarTokens, guardarApps, leerFila } from "@/lib/conexiones/tokens";

/**
 * POST /api/conexiones/[proveedor]/desconectar  {app?: IdApp}
 *
 * - Con `app` y si quedan otras apps del mismo proveedor: solo quita esa app
 *   (sus herramientas dejan de dársele a los agentes).
 * - Si es la última (o sin `app`): revoca en el proveedor si se puede y
 *   borra la fila con los tokens.
 * Responde {ok, revocada, quedan: IdApp[]}.
 */

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, props: { params: Promise<{ proveedor: string }> }) {
  const params = await props.params;
  const r = await preparar(params);
  if ("fallo" in r) return r.fallo;
  const { proveedor: p, supabase, user } = r;
  const cuerpo = await cuerpoJson(request);
  if (!cuerpo) return errorJson("Petición inválida", 400);
  const app = cuerpo.app === undefined ? null : esIdApp(cuerpo.app) ? cuerpo.app : undefined;
  if (app === undefined) return errorJson("Esa app no existe.", 400);

  let fila;
  try {
    fila = await leerFila(supabase, user.id, p);
  } catch {
    return errorJson("No se pudo leer tu conexión. Intenta de nuevo.", 500);
  }
  if (!fila) return NextResponse.json({ ok: true, revocada: false, quedan: [] });

  const apps = appsDeFila(fila);
  // Sin WhatsApp Business, los mensajes de ese número dejan de llegar a Atendel
  if (p === "meta" && (!app || app === "whatsapp_business" || apps.length <= 1)) {
    await supabase.from("whatsapp_numeros").delete().eq("owner_id", user.id);
  }
  if (app && apps.includes(app) && apps.length > 1) {
    const quedan = apps.filter((a) => a !== app);
    const ok = await guardarApps(supabase, user.id, p, quedan).catch(() => false);
    if (!ok) return errorJson("No se pudo desconectar. Intenta de nuevo.", 500);
    await avisarQuitada(user.id, APP_POR_ID[app]?.nombre ?? NOMBRE_PROVEEDOR[p] ?? p, aparatoDe(request));
    return NextResponse.json({ ok: true, revocada: false, quedan });
  }

  let revocada = false;
  const a = adaptador(p);
  if (a.revocar) {
    try {
      await a.revocar(descifrarTokens(fila, user.id, p));
      revocada = true;
    } catch {
      /* si no se pudo revocar, igual se borra; la guía dice cómo quitar el permiso en la cuenta */
    }
  }
  const { error } = await supabase.from("conexiones").delete().eq("owner_id", user.id).eq("proveedor", p);
  if (error) return errorJson("No se pudo desconectar. Intenta de nuevo.", 500);
  await avisarQuitada(user.id, NOMBRE_PROVEEDOR[p] ?? p, aparatoDe(request));
  return NextResponse.json({ ok: true, revocada, quedan: [] });
}

/** Queda en el chat de Avisos; la notificación, solo a tus otros aparatos (por si no fuiste tú). */
async function avisarQuitada(userId: string, nombre: string, excepto: string | null) {
  const admin = clienteServicio();
  if (!admin) return;
  await notificar(admin, userId, {
    tipo: "app_conectada",
    agente: "iris",
    chat: `Se quitó ${nombre} de tus apps. Si no fuiste tú, vuelve a conectarla en [Tu negocio → Apps](/panel?vista=negocio&tab=apps).`,
    corto: `Se quitó ${nombre} de tus apps.`,
    enlace: "/panel?vista=negocio&tab=apps",
    excepto,
  }).catch(() => undefined);
}
