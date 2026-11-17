import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ETIQUETAS_PERFIL, perfilVacio } from "@/lib/contexto-negocio";
import { normalizarTexto } from "@/lib/documentos/trocear";
import { faltaMigracion, MENSAJES } from "@/lib/documentos/procesar";
import { esTipoNegocio } from "@/lib/tipos-negocio";
import { CAMPOS_PERFIL, MAX_CAMPO_PERFIL, type CampoPerfil, type PerfilNegocio } from "@/lib/nucleo-tipos";

/**
 * PERFIL DEL NEGOCIO (Tu negocio > Perfil)
 *
 * GET → PerfilNegocio (con todo vacío si todavía no lo llena).
 * PUT { campo: texto, ..., tipo? } (solo los campos que cambian) → PerfilNegocio.
 *
 * Con la sesión de la persona: RLS solo deja leer y guardar su propio
 * perfil y el owner_id es siempre el suyo. Cada campo tiene máximo 2000
 * caracteres (lo revisa también la base de datos). `tipo` es un id de
 * TIPOS_NEGOCIO (src/lib/tipos-negocio.ts), o "" / null para quitarlo.
 */

export const dynamic = "force-dynamic";

const COLUMNAS = [...CAMPOS_PERFIL, "tipo", "actualizado_en"].join(", ");
/** Sin la columna tipo (mientras no se aplique la migración 0034). */
const COLUMNAS_SIN_TIPO = [...CAMPOS_PERFIL, "actualizado_en"].join(", ");
/** ¿Falta la columna tipo? (migración 0034 sin aplicar) */
const faltaTipo = (e: { code?: string } | null) => !!e && ["42703", "PGRST204"].includes(e.code ?? "");
const error = (mensaje: string, status: number, campo?: string) => NextResponse.json(campo ? { error: mensaje, campo } : { error: mensaje }, { status });

function comoPerfil(fila: Record<string, unknown> | null): PerfilNegocio {
  const perfil = perfilVacio();
  if (!fila) return perfil;
  for (const c of CAMPOS_PERFIL) perfil[c] = typeof fila[c] === "string" ? (fila[c] as string) : "";
  perfil.tipo = esTipoNegocio(fila.tipo) ? fila.tipo : "";
  perfil.actualizado_en = typeof fila.actualizado_en === "string" ? fila.actualizado_en : null;
  return perfil;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return error("Tu sesión terminó. Vuelve a entrar.", 401);

  const leer = (columnas: string) => supabase.from("perfil_negocio").select(columnas).eq("owner_id", user.id).maybeSingle();
  let { data, error: err } = await leer(COLUMNAS);
  if (faltaTipo(err)) ({ data, error: err } = await leer(COLUMNAS_SIN_TIPO));
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
  const cambios: Partial<Record<CampoPerfil, string>> & { tipo?: string | null } = {};
  for (const c of CAMPOS_PERFIL) {
    if (!(c in cuerpo) || cuerpo[c] === undefined) continue;
    const valor = cuerpo[c] === null ? "" : cuerpo[c];
    if (typeof valor !== "string") return error(`"${ETIQUETAS_PERFIL[c]}" tiene que ser texto.`, 400, c);
    const limpio = normalizarTexto(valor);
    if (limpio.length > MAX_CAMPO_PERFIL) {
      return error(`"${ETIQUETAS_PERFIL[c]}" es muy largo: máximo ${MAX_CAMPO_PERFIL.toLocaleString("es-MX")} caracteres.`, 400, c);
    }
    cambios[c] = limpio;
  }
  // El tipo: solo uno de la lista (o vacío para quitarlo)
  if ("tipo" in cuerpo && cuerpo.tipo !== undefined) {
    if (cuerpo.tipo === null || cuerpo.tipo === "") cambios.tipo = null;
    else if (esTipoNegocio(cuerpo.tipo)) cambios.tipo = cuerpo.tipo;
    else return error("Elige el tipo de negocio de la lista.", 400, "tipo");
  }
  if (!Object.keys(cambios).length) return error("No hay nada que guardar.", 400);

  // upsert: crea el perfil la primera vez; después solo cambia los campos que llegaron
  const guardar = (columnas: string) =>
    supabase
      .from("perfil_negocio")
      .upsert({ ...cambios, owner_id: user.id, actualizado_en: new Date().toISOString() }, { onConflict: "owner_id" })
      .select(columnas)
      .single();
  let { data, error: err } = await guardar(COLUMNAS);
  if (faltaTipo(err) && !("tipo" in cambios)) ({ data, error: err } = await guardar(COLUMNAS_SIN_TIPO));
  if (faltaTipo(err)) return error("El tipo de negocio todavía no se puede guardar. Avísale a quien administra Atendel.", 503, "tipo");
  if (faltaMigracion(err)) return error(MENSAJES.baseDeDatos, 503);
  if (err || !data) return error("No pudimos guardar el perfil. Intenta de nuevo.", 500);
  return NextResponse.json(comoPerfil(data as unknown as Record<string, unknown>), { headers: { "Cache-Control": "no-store" } });
}
