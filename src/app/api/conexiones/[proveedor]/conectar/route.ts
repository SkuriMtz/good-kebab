import { NextResponse, type NextRequest } from "next/server";
import { cifrarJson } from "@/lib/cifrado";
import { APP_POR_ID, esIdApp } from "@/lib/conexiones/catalogo";
import { aleatorio, nombreCookie, origenPermitido, pkce, queryExtra, rutaCookie, uriCallback, VIDA_COOKIE_S, type EstadoOAuth } from "@/lib/conexiones/oauth";
import { adaptador, configuradoApp } from "@/lib/conexiones/registro";
import { errorJson, preparar, volverAApps } from "@/lib/conexiones/rutas";
import { appsDeFila, leerFila } from "@/lib/conexiones/tokens";

/**
 * GET /api/conexiones/[proveedor]/conectar?app=<IdApp>  → redirige al OAuth
 *
 * - Requiere sesión de Atendel (401).
 * - Arma el redirect_uri con el origen de la petición, solo si está en la
 *   lista permitida (producción, los *.vercel.app del proyecto, localhost en
 *   desarrollo).
 * - Guarda en un cookie cifrado, httpOnly, Secure y SameSite=Lax de 10 min:
 *   un `state` aleatorio, la app, las apps pedidas y el verifier de PKCE.
 * - Pide los permisos de la app nueva más los de las que ya tenía conectadas
 *   con ese proveedor (así no se pierde ninguna).
 */

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: { proveedor: string } }) {
  const r = await preparar(params);
  if ("fallo" in r) return r.fallo;
  const { proveedor: p, supabase, user } = r;

  const app = request.nextUrl.searchParams.get("app");
  if (!esIdApp(app) || APP_POR_ID[app].proveedor !== p || APP_POR_ID[app].fase !== 1) return errorJson("Esa app no se conecta con este proveedor.", 400);
  const a = adaptador(p);
  if (a.autenticacion !== "oauth" || !a.urlAutorizacion || !a.intercambiar) return errorJson("Esta app se conecta pegando tu llave en la tarjeta.", 400);

  const origen = origenPermitido(request.nextUrl.origin);
  if (!origen) return errorJson("Este dominio no está permitido para conectar apps.", 400);
  if (!configuradoApp(app).ok) return volverAApps(request, p, { error: "configuracion", app });

  const fila = await leerFila(supabase, user.id, p).catch(() => null);
  const previas = fila && fila.estado === "activa" ? appsDeFila(fila) : [];
  const apps = Array.from(new Set([...previas, app]));

  const state = aleatorio();
  const { verifier, challenge } = pkce();
  const redirectUri = uriCallback(origen, p);
  const q = queryExtra(request.nextUrl.searchParams, ["app"]);
  let url: string;
  try {
    url = a.urlAutorizacion({ state, redirectUri, apps, codeChallenge: challenge, query: q });
  } catch {
    return volverAApps(request, p, { error: "configuracion", app });
  }

  const estado: EstadoOAuth = { state, app, apps, q, verifier, redirectUri, uid: user.id, exp: Date.now() + VIDA_COOKIE_S * 1000 };
  const res = NextResponse.redirect(url, { headers: { "Cache-Control": "no-store" } });
  res.cookies.set(nombreCookie(p), cifrarJson(estado, `oauth:${p}`), {
    httpOnly: true,
    secure: origen.startsWith("https:"),
    sameSite: "lax",
    path: rutaCookie(p),
    maxAge: VIDA_COOKIE_S,
  });
  return res;
}
