import { NextResponse, type NextRequest } from "next/server";
import { esIdApp } from "@/lib/conexiones/catalogo";
import { adaptador } from "@/lib/conexiones/registro";
import { cuerpoJson, errorJson, preparar } from "@/lib/conexiones/rutas";
import { appsDeFila, descifrarTokens, leerFila } from "@/lib/conexiones/tokens";

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

export async function POST(request: NextRequest, { params }: { params: { proveedor: string } }) {
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
  if (app && apps.includes(app) && apps.length > 1) {
    const quedan = apps.filter((a) => a !== app);
    const { error } = await supabase
      .from("conexiones")
      .update({ apps: quedan, actualizado_en: new Date().toISOString() })
      .eq("owner_id", user.id)
      .eq("proveedor", p);
    if (error) return errorJson("No se pudo desconectar. Intenta de nuevo.", 500);
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
  return NextResponse.json({ ok: true, revocada, quedan: [] });
}
