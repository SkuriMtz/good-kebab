import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { APP_POR_ID, esIdApp } from "@/lib/conexiones/catalogo";

/**
 * "Avísame" de las apps En camino (fase 2 y 3), guardado en `apps_interes`.
 * - POST {app} → lo anota (si ya estaba, no pasa nada).
 * - DELETE {app} → lo quita.
 * Responde {ok, app, avisame}. RLS: cada quien solo toca lo suyo.
 */

export const dynamic = "force-dynamic";

const error = (mensaje: string, status: number) => NextResponse.json({ error: mensaje }, { status });

async function preparar(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { fallo: error("Tu sesión terminó. Vuelve a entrar.", 401) } as const;
  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return { fallo: error("Petición inválida", 400) } as const;
  }
  const app = (cuerpo as { app?: unknown } | null)?.app;
  if (!esIdApp(app)) return { fallo: error("Esa app no existe.", 400) } as const;
  if (APP_POR_ID[app].fase === 1) return { fallo: error("Esa app ya se puede conectar.", 400) } as const;
  return { supabase, user, app } as const;
}

export async function POST(request: NextRequest) {
  const p = await preparar(request);
  if ("fallo" in p) return p.fallo;
  const { error: err } = await p.supabase
    .from("apps_interes")
    .upsert({ owner_id: p.user.id, app: p.app }, { onConflict: "owner_id,app", ignoreDuplicates: true });
  if (err) return error("No se pudo guardar tu aviso. Intenta de nuevo.", 500);
  return NextResponse.json({ ok: true, app: p.app, avisame: true });
}

export async function DELETE(request: NextRequest) {
  const p = await preparar(request);
  if ("fallo" in p) return p.fallo;
  const { error: err } = await p.supabase.from("apps_interes").delete().eq("owner_id", p.user.id).eq("app", p.app);
  if (err) return error("No se pudo quitar tu aviso. Intenta de nuevo.", 500);
  return NextResponse.json({ ok: true, app: p.app, avisame: false });
}
