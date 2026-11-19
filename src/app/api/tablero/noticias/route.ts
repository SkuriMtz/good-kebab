import { NextResponse } from "next/server";
import { limpiarAjustes } from "@/lib/ajustes";
import { noticiasDeHoy } from "@/lib/noticias-servidor";
import { createClient } from "@/lib/supabase/server";
import { clienteServicio } from "@/lib/supabase/servicio";

/*
 * POST /api/tablero/noticias: las noticias de tu industria para el Tablero.
 * Si las de hoy ya están (de cualquier negocio de tu tipo), regresa esas; si
 * no, las busca una vez (ver src/lib/noticias-servidor.ts). No recibe nada:
 * el tipo de negocio, el idioma y la zona salen de tu cuenta.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const sinCache = { "Cache-Control": "no-store" };

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Entra con tu cuenta para usar esto." }, { status: 401, headers: sinCache });
  const admin = clienteServicio();
  if (!admin) return NextResponse.json({ noticias: [] }, { headers: sinCache });

  const [{ data: perfil }, { data: ajustes }] = await Promise.all([
    supabase.from("perfil_negocio").select("tipo").eq("owner_id", user.id).maybeSingle(),
    supabase.from("ajustes_cuenta").select("datos").eq("owner_id", user.id).maybeSingle(),
  ]);
  const aj = limpiarAjustes(ajustes?.datos);
  const noticias = await noticiasDeHoy(admin, user.id, { tipo: typeof perfil?.tipo === "string" ? perfil.tipo : null, idioma: aj.idioma, zona: aj.zonaHoraria });
  return NextResponse.json({ noticias }, { headers: sinCache });
}
