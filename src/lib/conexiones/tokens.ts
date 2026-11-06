import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { IdApp, Proveedor, Tokens } from "@/lib/nucleo-tipos";
import { cifrarJson, descifrarJson } from "@/lib/cifrado";
import { esIdApp } from "./catalogo";
import { leerConexionesPublicas, type ConexionPublica } from "./estado";
import { NOMBRE_PROVEEDOR, ErrorOAuth } from "./oauth";
import { adaptador, configurado, esPendiente } from "./registro";

/**
 * TOKENS DE LAS CONEXIONES (tabla `conexiones`, una fila por proveedor).
 * - Se guardan cifrados (AES-256-GCM, src/lib/cifrado.ts) y amarrados a la
 *   persona y al proveedor: el texto cifrado de una fila no sirve en otra.
 * - `obtenerToken` descifra, renueva con el refresh token si está por vencer
 *   y vuelve a guardar; si el proveedor dice invalid_grant (permiso revocado
 *   o vencido), marca la conexión con estado 'error'.
 * - Todo con el cliente con sesión de la persona (RLS); nunca service role.
 * - Nunca se registran tokens ni se mandan al navegador.
 */

export const contextoCifrado = (userId: string, p: Proveedor) => `conexion:${userId}:${p}`;

/** Renovar si al token le quedan menos de 2 minutos. */
const MARGEN_MS = 120_000;

export type CodigoConexion = "sin_conexion" | "vencida" | "sin_configurar" | "temporal";

export class ErrorConexion extends Error {
  constructor(
    readonly codigo: CodigoConexion,
    readonly proveedor: Proveedor,
  ) {
    super(mensajeConexion(codigo, proveedor));
    this.name = "ErrorConexion";
  }
}

/** Lo que se le dice a la persona (y al agente) cuando una conexión no sirve. */
export function mensajeConexion(codigo: CodigoConexion, p: Proveedor): string {
  const n = NOMBRE_PROVEEDOR[p] ?? p;
  switch (codigo) {
    case "sin_conexion":
      return `Todavía no conectas ${n}: conéctalo en Tu negocio → Apps.`;
    case "vencida":
      return `Tu conexión con ${n} venció: vuelve a conectarla en Tu negocio → Apps.`;
    case "sin_configurar":
      return `La conexión con ${n} todavía no está configurada en Atendel.`;
    default:
      return `${n} no respondió. Intenta de nuevo en un momento.`;
  }
}

type Fila = { apps: string[] | null; cuenta: string | null; estado: string; token_cifrado: string };

export async function leerFila(supabase: SupabaseClient, userId: string, p: Proveedor): Promise<Fila | null> {
  const { data, error } = await supabase
    .from("conexiones")
    .select("apps, cuenta, estado, token_cifrado")
    .eq("owner_id", userId)
    .eq("proveedor", p)
    .maybeSingle();
  if (error) throw new ErrorConexion("temporal", p);
  return (data as Fila | null) ?? null;
}

/** Las apps de una fila, ya validadas. */
export const appsDeFila = (f: Pick<Fila, "apps"> | null): IdApp[] => (Array.isArray(f?.apps) ? f.apps.filter(esIdApp) : []);

/**
 * Qué apps quedan al volver a conectar: de las pedidas (las que ya tenía más
 * la nueva), las que el proveedor de verdad concedió (Tokens.extra.apps; si
 * el adaptador no lo dice, se toman como concedidas).
 */
export function appsFinales(pedidas: IdApp[], tokens: Tokens): IdApp[] {
  const dichas = tokens.extra?.apps;
  if (dichas === undefined) return pedidas;
  const concedidas = new Set(dichas.split(",").map((a) => a.trim()));
  return pedidas.filter((a) => concedidas.has(a));
}

export async function guardarConexion(
  supabase: SupabaseClient,
  userId: string,
  p: Proveedor,
  datos: { tokens: Tokens; cuenta: string; apps: IdApp[] },
): Promise<boolean> {
  const scopes = (datos.tokens.extra?.scopes ?? "").split(/\s+/).filter(Boolean).slice(0, 50);
  const { error } = await supabase.from("conexiones").upsert(
    {
      owner_id: userId,
      proveedor: p,
      apps: Array.from(new Set(datos.apps)),
      cuenta: datos.cuenta.slice(0, 320) || null,
      scopes,
      token_cifrado: cifrarJson(datos.tokens, contextoCifrado(userId, p)),
      estado: "activa",
      error: null,
      actualizado_en: new Date().toISOString(),
    },
    { onConflict: "owner_id,proveedor" },
  );
  return !error;
}

export async function marcarError(supabase: SupabaseClient, userId: string, p: Proveedor, mensaje = mensajeConexion("vencida", p)) {
  await supabase
    .from("conexiones")
    .update({ estado: "error", error: mensaje.slice(0, 500), actualizado_en: new Date().toISOString() })
    .eq("owner_id", userId)
    .eq("proveedor", p);
}

export function descifrarTokens(f: Pick<Fila, "token_cifrado">, userId: string, p: Proveedor): Tokens {
  const t = descifrarJson<Tokens>(f.token_cifrado, contextoCifrado(userId, p));
  if (!t || typeof t.access_token !== "string") throw new Error("Tokens sin forma");
  return t;
}

/**
 * Los tokens vigentes de la persona para ese proveedor. Renueva si hace
 * falta (o si `forzar`, p. ej. después de un 401) y guarda los nuevos.
 */
export async function obtenerToken(supabase: SupabaseClient, userId: string, p: Proveedor, opciones: { forzar?: boolean; ahora?: number } = {}): Promise<Tokens> {
  if (!configurado(p).ok) throw new ErrorConexion("sin_configurar", p);
  const fila = await leerFila(supabase, userId, p);
  if (!fila) throw new ErrorConexion("sin_conexion", p);
  if (fila.estado === "error") throw new ErrorConexion("vencida", p);

  let tokens: Tokens;
  try {
    tokens = descifrarTokens(fila, userId, p);
  } catch {
    // La llave cambió o el texto no sirve: hay que volver a conectar
    await marcarError(supabase, userId, p);
    throw new ErrorConexion("vencida", p);
  }

  const ahora = opciones.ahora ?? Date.now();
  const porVencer = tokens.expira_en !== undefined && tokens.expira_en - ahora < MARGEN_MS;
  if (!porVencer && !opciones.forzar) return tokens;

  const a = adaptador(p);
  if (!a.renovar || !tokens.refresh_token) {
    if (porVencer || opciones.forzar) {
      await marcarError(supabase, userId, p);
      throw new ErrorConexion("vencida", p);
    }
    return tokens;
  }
  let nuevos: Tokens;
  try {
    nuevos = await a.renovar(tokens);
  } catch (e) {
    if (e instanceof ErrorOAuth && e.codigo === "invalid_grant") {
      await marcarError(supabase, userId, p);
      throw new ErrorConexion("vencida", p);
    }
    throw new ErrorConexion("temporal", p);
  }
  const guardados: Tokens = { ...nuevos, refresh_token: nuevos.refresh_token ?? tokens.refresh_token, extra: { ...(tokens.extra ?? {}), ...(nuevos.extra ?? {}) } };
  const { error } = await supabase
    .from("conexiones")
    .update({ token_cifrado: cifrarJson(guardados, contextoCifrado(userId, p)), estado: "activa", error: null, actualizado_en: new Date().toISOString() })
    .eq("owner_id", userId)
    .eq("proveedor", p);
  // Si no se pudo guardar, el token nuevo igual sirve para esta respuesta
  void error;
  return guardados;
}

/**
 * Al reconectar, ¿se revoca el permiso de la conexión anterior? Solo si es
 * de OTRA cuenta (correo distinto y conocido de los dos lados), sus tokens
 * son otros y el proveedor da un permiso por cuenta que el token nuevo no
 * comparte (hoy, Google). Con Meta, Notion y los demás, el token nuevo puede
 * compartir el permiso con el anterior: revocar tumbaría lo recién conectado.
 */
const REVOCA_AL_CAMBIAR_CUENTA = new Set<Proveedor>(["google"]);

export function debeRevocarAnterior(p: Proveedor, cuentaAnterior: string | null | undefined, cuentaNueva: string, anterior: Tokens, nuevos: Tokens): boolean {
  if (!REVOCA_AL_CAMBIAR_CUENTA.has(p)) return false;
  const a = (cuentaAnterior ?? "").trim().toLowerCase();
  const b = cuentaNueva.trim().toLowerCase();
  if (!a.includes("@") || !b.includes("@") || a === b) return false;
  return anterior.access_token !== nuevos.access_token && (anterior.refresh_token ?? "") !== (nuevos.refresh_token ?? "");
}

/**
 * Las conexiones de la persona (sin tokens) con las vencidas ya marcadas:
 * si un proveedor no puede renovar (p. ej. Meta, cuyo token dura ~60 días)
 * y su token ya venció, la fila pasa a 'error' con "Tu conexión con … venció".
 * Lo usan /api/apps y el chat. Los tokens se leen solo aquí, en el servidor.
 */
export async function conexionesVigentes(supabase: SupabaseClient, userId: string, ahora = Date.now()): Promise<ConexionPublica[]> {
  const conexiones = await leerConexionesPublicas(supabase, userId);
  for (const c of conexiones) {
    if (c.estado !== "activa" || esPendiente(c.proveedor) || adaptador(c.proveedor).renovar) continue;
    try {
      const fila = await leerFila(supabase, userId, c.proveedor);
      if (!fila) continue;
      const t = descifrarTokens(fila, userId, c.proveedor);
      if (t.expira_en === undefined || t.expira_en > ahora) continue;
    } catch {
      // Si no se puede leer el token, tampoco sirve: hay que volver a conectar
    }
    const mensaje = mensajeConexion("vencida", c.proveedor);
    await marcarError(supabase, userId, c.proveedor, mensaje);
    c.estado = "error";
    c.error = mensaje;
  }
  return conexiones;
}
