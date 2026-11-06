import { NextResponse } from "next/server";
import { ErrorOAuth } from "@/lib/conexiones/oauth";
import { tokenSoloDriveFile } from "@/lib/conexiones/proveedores/google";
import { configuradoApp } from "@/lib/conexiones/registro";
import { errorJson, preparar } from "@/lib/conexiones/rutas";
import { appsDeFila, descifrarTokens, leerFila, marcarError, mensajeConexion } from "@/lib/conexiones/tokens";

/**
 * GET /api/conexiones/google/token-picker → {token, expira_en}
 *
 * Para abrir el Google Picker en el navegador: un access token NUEVO, de
 * vida corta y SOLO con el permiso drive.file (no sirve para Gmail ni nada
 * más), y solo para el dueño de la conexión (su sesión + RLS). El token
 * completo con todos los permisos nunca sale del servidor.
 */

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { proveedor: string } }) {
  if (params.proveedor !== "google") return errorJson("No existe.", 404);
  const r = await preparar(params);
  if ("fallo" in r) return r.fallo;
  const { supabase, user } = r;
  const cfg = configuradoApp("google_drive");
  if (!cfg.ok) return errorJson("Google Drive todavía no está configurado en Atendel.", 503, { falta: cfg.falta });

  const fila = await leerFila(supabase, user.id, "google").catch(() => null);
  if (!fila || !appsDeFila(fila).includes("google_drive")) return errorJson("Conecta Google Drive primero en Tu negocio → Apps.", 400);
  if (fila.estado === "error") return errorJson(mensajeConexion("vencida", "google"), 401);

  try {
    const t = await tokenSoloDriveFile(descifrarTokens(fila, user.id, "google"));
    return NextResponse.json({ token: t.access_token, expira_en: t.expira_en ?? null }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    if (e instanceof ErrorOAuth && e.codigo === "invalid_grant") {
      await marcarError(supabase, user.id, "google");
      return errorJson(mensajeConexion("vencida", "google"), 401);
    }
    return errorJson("Google no dio un permiso limitado para elegir archivos. Intenta de nuevo en un momento.", 502);
  }
}
