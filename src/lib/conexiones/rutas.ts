import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import type { Proveedor } from "@/lib/nucleo-tipos";
import { createClient } from "@/lib/supabase/server";
import { esProveedor } from "./catalogo";
import { nombreCookie, origenPermitido, rutaCookie, type Volver } from "./oauth";

/** Piezas que comparten las rutas /api/conexiones/[proveedor]/*. */

export const errorJson = (mensaje: string, status: number, extra: Record<string, unknown> = {}) =>
  NextResponse.json({ error: mensaje, ...extra }, { status, headers: { "Cache-Control": "no-store" } });

/** El proveedor de la ruta y la sesión de Atendel (401 si no hay). */
export async function preparar(params: { proveedor: string }) {
  if (!esProveedor(params.proveedor)) return { fallo: errorJson("Ese proveedor no existe.", 404) } as const;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { fallo: errorJson("Tu sesión terminó. Vuelve a entrar.", 401) } as const;
  return { proveedor: params.proveedor as Proveedor, supabase, user } as const;
}

/**
 * A la pestaña Apps de Tu negocio, con lo que pasó (conectada=… o error=…).
 * Si se conectó desde el chat (`volver`), regresa al chat (y a esa
 * conversación), donde sale el aviso.
 */
export function volverAApps(request: NextRequest, p: Proveedor, datos: Record<string, string>, volver?: Volver) {
  const base = origenPermitido(request.nextUrl.origin) ?? request.nextUrl.origin;
  const url = new URL("/panel", base);
  if (volver?.a === "chat") {
    if (volver.c) url.searchParams.set("c", volver.c);
  } else {
    url.searchParams.set("vista", "negocio");
    url.searchParams.set("tab", "apps");
  }
  for (const [k, v] of Object.entries(datos)) url.searchParams.set(k, v);
  const res = NextResponse.redirect(url, { headers: { "Cache-Control": "no-store" } });
  // El cookie de la ida y vuelta se borra siempre
  res.cookies.set(nombreCookie(p), "", { httpOnly: true, secure: base.startsWith("https:"), sameSite: "lax", path: rutaCookie(p), maxAge: 0 });
  return res;
}

/** El cuerpo JSON (o {} si viene vacío); null si no se pudo leer. */
export async function cuerpoJson(request: NextRequest): Promise<Record<string, unknown> | null> {
  const texto = await request.text().catch(() => null);
  if (texto === null) return null;
  if (!texto.trim()) return {};
  if (texto.length > 20_000) return null;
  try {
    const d = JSON.parse(texto);
    return d && typeof d === "object" && !Array.isArray(d) ? (d as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}
