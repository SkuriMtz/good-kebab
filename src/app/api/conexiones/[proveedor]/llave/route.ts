import { NextResponse, type NextRequest } from "next/server";
import type { EstadoAppPersona } from "@/lib/nucleo-tipos";
import { APP_POR_ID, esIdApp } from "@/lib/conexiones/catalogo";
import { ErrorArgs } from "@/lib/conexiones/http";
import { NOMBRE_PROVEEDOR } from "@/lib/conexiones/oauth";
import { adaptador, configurado } from "@/lib/conexiones/registro";
import { cuerpoJson, errorJson, preparar } from "@/lib/conexiones/rutas";
import { appsDeFila, appsFinales, guardarConexion, leerFila } from "@/lib/conexiones/tokens";

/**
 * POST /api/conexiones/[proveedor]/llave  {llave, app}  → EstadoAppPersona
 *
 * Para las apps que se conectan con una llave de la persona (token del bot de
 * Telegram, llave restringida de Stripe, Facturapi, Trello, Airtable…):
 * la valida con el proveedor (`validarLlave`), la guarda CIFRADA y responde
 * con el estado de la app. La llave nunca se regresa ni se registra.
 */

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, { params }: { params: { proveedor: string } }) {
  const r = await preparar(params);
  if ("fallo" in r) return r.fallo;
  const { proveedor: p, supabase, user } = r;
  const cuerpo = await cuerpoJson(request);
  if (!cuerpo) return errorJson("Petición inválida", 400);

  const app = cuerpo.app;
  if (!esIdApp(app) || APP_POR_ID[app].proveedor !== p || APP_POR_ID[app].fase !== 1) return errorJson("Esa app no se conecta con este proveedor.", 400);
  const a = adaptador(p);
  if (a.autenticacion !== "llave" || !a.validarLlave) return errorJson("Esta app se conecta con el botón Conectar.", 400);
  const cfg = configurado(p);
  if (!cfg.ok) return errorJson("Esta app todavía no está configurada en Atendel.", 503, { falta: cfg.falta });

  const llave = typeof cuerpo.llave === "string" ? cuerpo.llave.trim() : "";
  if (!llave || llave.length > 4096 || /\s/.test(llave)) return errorJson("Pega la llave completa, sin espacios.", 400);

  let tokens;
  try {
    tokens = await a.validarLlave(llave);
  } catch (e) {
    // ErrorArgs trae un mensaje pensado para la persona (p. ej. "usa una llave restringida de solo lectura")
    if (e instanceof ErrorArgs) return errorJson(e.message, 400);
    return errorJson(`${NOMBRE_PROVEEDOR[p]} no aceptó esa llave. Revisa que la copiaste completa y que tenga permiso de lectura.`, 400);
  }
  let cuenta = NOMBRE_PROVEEDOR[p];
  try {
    cuenta = (await a.cuenta(tokens)) || cuenta;
  } catch {
    /* sin el nombre de la cuenta también se conecta */
  }
  const fila = await leerFila(supabase, user.id, p).catch(() => null);
  const previas = fila && fila.estado === "activa" ? appsDeFila(fila) : [];
  const apps = appsFinales(Array.from(new Set([...previas, app])), tokens);
  if (!apps.includes(app)) return errorJson("Esa llave no da permiso para esta app.", 400);

  const ok = await guardarConexion(supabase, user.id, p, { tokens, cuenta, apps }).catch(() => false);
  if (!ok) return errorJson("No se pudo guardar la conexión. Intenta de nuevo.", 500);
  const estado: EstadoAppPersona = { id: app, estado: "conectada", cuenta };
  return NextResponse.json(estado, { headers: { "Cache-Control": "no-store" } });
}
