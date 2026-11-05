import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * BUSCAR EN LOS DOCUMENTOS DEL NEGOCIO
 *
 * Llama a la función SQL buscar_fragmentos (migración 0006), que corre con
 * la sesión de la persona: RLS solo deja ver sus propios fragmentos.
 *
 * Por defecto la búsqueda es "amplia": basta con que el fragmento tenga
 * alguna de las palabras, y salen primero los que tienen más. Así una
 * pregunta completa ("¿cuánto cuesta la limpieza facial y aceptan
 * tarjeta?") encuentra la lista de precios aunque no traiga todas las
 * palabras. Con modo "exacta" se usa la sintaxis de websearch_to_tsquery
 * tal cual ("a b" = las dos, "a or b", "\"frase exacta\"", "-palabra").
 *
 * Sin "server-only" a propósito: no tiene claves y así se prueba con un
 * script local y un cliente falso.
 */

export type FragmentoEncontrado = {
  documento_id: string;
  nombre: string;
  orden: number;
  texto: string;
  rango: number;
};

export class ErrorBusqueda extends Error {
  /** "sin_migracion": la función todavía no existe en la base de datos. */
  motivo: "sin_migracion" | "error";
  constructor(motivo: "sin_migracion" | "error") {
    super(motivo === "sin_migracion" ? "La búsqueda en documentos todavía no está lista (falta la migración 0006)." : "No se pudo buscar en los documentos.");
    this.name = "ErrorBusqueda";
    this.motivo = motivo;
  }
}

const MAX_PALABRAS = 30;

/** Palabras sueltas unidas con "or" (sin signos ni operadores). Vacío si no hay palabras. */
export function consultaAmplia(texto: string): string {
  const vistas = new Set<string>();
  for (const palabra of (texto ?? "").normalize("NFC").toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []) {
    if (palabra.length < 2 || palabra === "or") continue;
    vistas.add(palabra);
    if (vistas.size >= MAX_PALABRAS) break;
  }
  return Array.from(vistas).join(" or ");
}

/**
 * Los fragmentos que mejor responden a `consulta`, del más al menos
 * parecido (máximo 20). Lanza ErrorBusqueda si la base de datos falla.
 */
export async function buscarFragmentos(
  supabase: SupabaseClient,
  consulta: string,
  limite = 6,
  opciones: { modo?: "amplia" | "exacta" } = {},
): Promise<FragmentoEncontrado[]> {
  const texto = opciones.modo === "exacta" ? (consulta ?? "").slice(0, 500) : consultaAmplia(consulta);
  if (!texto.trim()) return [];
  const { data, error } = await supabase.rpc("buscar_fragmentos", {
    consulta: texto,
    limite: Math.max(1, Math.min(20, Math.floor(limite) || 6)),
  });
  if (error) {
    const sinMigracion = ["42883", "PGRST202", "42P01", "PGRST205"].includes(error.code ?? "");
    throw new ErrorBusqueda(sinMigracion ? "sin_migracion" : "error");
  }
  return ((data ?? []) as FragmentoEncontrado[]).map((f) => ({
    documento_id: String(f.documento_id),
    nombre: String(f.nombre ?? ""),
    orden: Number(f.orden) || 0,
    texto: String(f.texto ?? ""),
    rango: Number(f.rango) || 0,
  }));
}
