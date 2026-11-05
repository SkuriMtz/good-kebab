import type { NextRequest } from "next/server";
import { descifrar } from "@/lib/cifrado";
import { iguales, leerEstadoOAuth, NOMBRE_PROVEEDOR, nombreCookie, type EstadoOAuth } from "@/lib/conexiones/oauth";
import { adaptador, configurado } from "@/lib/conexiones/registro";
import { preparar, volverAApps } from "@/lib/conexiones/rutas";
import { appsFinales, descifrarTokens, guardarConexion, leerFila } from "@/lib/conexiones/tokens";

/**
 * GET /api/conexiones/[proveedor]/callback  (a donde vuelve el proveedor)
 *
 * Valida el `state` contra el cookie (y que sea la misma persona), cambia el
 * code por los tokens (con el verifier de PKCE), guarda la conexión cifrada
 * con su cuenta, apps y permisos, y vuelve a
 * /panel?vista=negocio&tab=apps&conectada=<app>.
 * Si algo falla vuelve con &error=<estado|cancelado|configuracion|intercambio|permiso|guardar>&app=<app>.
 */

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: { proveedor: string } }) {
  const r = await preparar(params);
  if ("fallo" in r) return r.fallo;
  const { proveedor: p, supabase, user } = r;
  const qs = request.nextUrl.searchParams;

  let estado: EstadoOAuth | null = null;
  const crudo = request.cookies.get(nombreCookie(p))?.value;
  if (crudo) {
    try {
      estado = leerEstadoOAuth(descifrar(crudo, `oauth:${p}`));
    } catch {
      estado = null;
    }
  }
  const state = qs.get("state") ?? "";
  if (!estado || estado.uid !== user.id || !state || !iguales(estado.state, state)) return volverAApps(request, p, { error: "estado" });
  // El redirect_uri tiene que ser el mismo con el que se pidió
  if (new URL(estado.redirectUri).origin !== request.nextUrl.origin) return volverAApps(request, p, { error: "estado" });
  const app = estado.app;
  if (qs.get("error")) return volverAApps(request, p, { error: "cancelado", app });
  const code = qs.get("code") ?? "";
  if (!code || code.length > 4096) return volverAApps(request, p, { error: "estado", app });
  if (!configurado(p).ok) return volverAApps(request, p, { error: "configuracion", app });

  const a = adaptador(p);
  if (!a.intercambiar) return volverAApps(request, p, { error: "configuracion", app });
  const query: Record<string, string> = Object.fromEntries(Array.from(qs.entries()).filter(([k]) => k !== "code" && k !== "state"));
  let tokens;
  try {
    tokens = await a.intercambiar({ code, redirectUri: estado.redirectUri, codeVerifier: estado.verifier, query: { ...query, ...estado.q } });
  } catch {
    return volverAApps(request, p, { error: "intercambio", app });
  }

  const apps = appsFinales(estado.apps, tokens);
  if (!apps.includes(app)) return volverAApps(request, p, { error: "permiso", app });
  let cuenta = NOMBRE_PROVEEDOR[p];
  try {
    cuenta = (await a.cuenta(tokens)) || cuenta;
  } catch {
    /* sin el nombre de la cuenta también se conecta */
  }

  // Si se conectó otra cuenta, se revoca el permiso de la anterior (si se puede)
  const fila = await leerFila(supabase, user.id, p).catch(() => null);
  if (fila?.cuenta && fila.cuenta !== cuenta && a.revocar) {
    try {
      await a.revocar(descifrarTokens(fila, user.id, p));
    } catch {
      /* lo que no se pudo revocar se puede quitar desde la cuenta */
    }
  }

  const ok = await guardarConexion(supabase, user.id, p, { tokens, cuenta, apps }).catch(() => false);
  if (!ok) {
    if (a.revocar) await a.revocar(tokens).catch(() => undefined);
    return volverAApps(request, p, { error: "guardar", app });
  }
  return volverAApps(request, p, { conectada: app });
}
