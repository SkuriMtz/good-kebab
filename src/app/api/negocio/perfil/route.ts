import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ETIQUETAS_PERFIL, perfilVacio } from "@/lib/contexto-negocio";
import { normalizarTexto } from "@/lib/documentos/trocear";
import { faltaMigracion, MENSAJES } from "@/lib/documentos/procesar";
import { CAMPOS_PERFIL, MAX_CAMPO_PERFIL, type CampoPerfil, type PerfilNegocio } from "@/lib/nucleo-tipos";

/**
 * PERFIL DEL NEGOCIO (Tu negocio > Perfil)
 *
 * GET → PerfilNegocio (con todo vacío si todavía no lo llena).
 * PUT { campo: texto, ... } (solo los campos que cambian) → PerfilNegocio.
 *
 * Con la sesión de la persona: RLS solo deja leer y guardar su propio
 * perfil y el owner_id es siempre el suyo. Cada campo tiene máximo 2000
 * caracteres (lo revisa también la base de datos).
 */

export const dynamic = "force-dynamic";

const COLUMNAS = [...CAMPOS_PERFIL, "actualizado_en"].join(", ");
const error = (mensaje: string, status: number) => NextResponse.json({ error: mensaje }, { status });

function comoPerfil(fila: Record<string, unknown> | null): PerfilNegocio {
  const perfil = perfilVacio();
  if (!fila) return perfil;
  for (const c of CAMPOS_PERFIL) perfil[c] = typeof fila[c] === "string" ? (fila[c] as string) : "";
  perfil.actualizado_en = typeof fila.actualizado_en === "string" ? fila.actualizado_en : null;
  return perfil;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return error("Tu sesión terminó. Vuelve a entrar.", 401);

  const { data, error: err } = await supabase.from("perfil_negocio").select(COLUMNAS).eq("owner_id", user.id).maybeSingle();
  if (faltaMigracion(err)) return error(MENSAJES.baseDeDatos, 503);
  if (err) return error("No pudimos leer el perfil. Intenta de nuevo.", 500);
  return NextResponse.json(comoPerfil(data as Record<string, unknown> | null), { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return error("Tu sesión terminó. Vuelve a entrar.", 401);

  if (Number(request.headers.get("content-length") ?? "0") > 100_000) return error("El perfil es demasiado largo.", 413);
  let cuerpo: Record<string, unknown>;
  try {
    const datos = await request.json();
    if (!datos || typeof datos !== "object" || Array.isArray(datos)) throw new Error("forma");
    cuerpo = datos as Record<string, unknown>;
  } catch {
    return error("No pudimos leer el perfil. Intenta de nuevo.", 400);
  }

  // Solo los campos conocidos; los demás (p. ej. actualizado_en) se ignoran
  const cambios: Partial<Record<CampoPerfil, string>> = {};
  for (const c of CAMPOS_PERFIL) {
    if (!(c in cuerpo) || cuerpo[c] === undefined) continue;
    const valor = cuerpo[c] === null ? "" : cuerpo[c];
    if (typeof valor !== "string") return error(`"${ETIQUETAS_PERFIL[c]}" tiene que ser texto.`, 400);
    const limpio = normalizarTexto(valor);
    if (limpio.length > MAX_CAMPO_PERFIL) {
      return error(`"${ETIQUETAS_PERFIL[c]}" es muy largo: máximo ${MAX_CAMPO_PERFIL.toLocaleString("es-MX")} caracteres.`, 400);
    }
    cambios[c] = limpio;
  }
  if (!Object.keys(cambios).length) return error("No hay nada que guardar.", 400);

  // upsert: crea el perfil la primera vez; después solo cambia los campos que llegaron
  const { data, error: err } = await supabase
    .from("perfil_negocio")
    .upsert({ ...cambios, owner_id: user.id, actualizado_en: new Date().toISOString() }, { onConflict: "owner_id" })
    .select(COLUMNAS)
    .single();
  if (faltaMigracion(err)) return error(MENSAJES.baseDeDatos, 503);
  if (err || !data) return error("No pudimos guardar el perfil. Intenta de nuevo.", 500);
  return NextResponse.json(comoPerfil(data as unknown as Record<string, unknown>), { headers: { "Cache-Control": "no-store" } });
}
