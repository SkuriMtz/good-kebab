import { NextResponse, type NextRequest } from "next/server";
import { registrarEvento } from "@/lib/seguridad";
import { createClient } from "@/lib/supabase/server";

/*
 * POST /api/errores-panel: cuando una sección del panel truena, el aviso de
 * error (src/app/panel/error.tsx) manda aquí el detalle técnico (qué
 * sección, el mensaje y la primera línea de la pila) para poder arreglarlo.
 * Solo con sesión; se guarda en la bitácora del servidor (eventos_seguridad,
 * 300 caracteres, 20 por hora como mucho). Nada de datos del negocio.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const crudo = await req.text().catch(() => "");
  if (crudo.length > 4000) return NextResponse.json({ ok: false }, { status: 400 });
  let c: { vista?: unknown; nombre?: unknown; mensaje?: unknown; digest?: unknown; pila?: unknown } = {};
  try {
    c = JSON.parse(crudo) as typeof c;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const s = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").slice(0, max) : "");
  const primeraLinea = s(c.pila, 600).split(" at ").slice(1, 2).join("").slice(0, 90);
  const detalle = `${s(c.vista, 40)} | ${s(c.nombre, 30)}: ${s(c.mensaje, 150)} | ${s(c.digest, 20)} | ${primeraLinea}`;
  await registrarEvento("error_panel", req, detalle);
  return NextResponse.json({ ok: true });
}
