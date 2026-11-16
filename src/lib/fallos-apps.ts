import "server-only";
import { APP_POR_ID } from "./conexiones/catalogo";
import { notificar } from "./notificar";
import { clienteServicio } from "./supabase/servicio";

/**
 * UNA APP QUE FALLA SEGUIDO (aviso 34): cada falla del lado de la app (su
 * servidor responde 5xx o no se pudo llegar a ella) se cuenta por día
 * (tabla fallos_apps, solo servidor; migración 0029). A la tercera del día,
 * te aviso una sola vez. Lo de tu cuenta (sin permiso, conexión vencida) ya
 * tiene sus propios avisos y aquí no cuenta.
 */

const VECES = 3;

const statusDe = (e: unknown) => (typeof (e as { status?: unknown })?.status === "number" ? (e as { status: number }).status : 0);

/** ¿Falló la app (su servidor o la red), y no lo que se pidió ni la cuenta? */
export function esFallaDeLaApp(e: unknown, senal?: AbortSignal): boolean {
  // Si lo cancelamos nosotros (se acabó el tiempo o se cerró el chat), no es culpa de la app
  if (senal?.aborted) return false;
  const st = statusDe(e);
  if (st) return st >= 500 && st <= 599;
  return e instanceof TypeError && /fetch failed|network|socket|ECONNRESET|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|EAI_AGAIN/i.test(`${e.message} ${String((e as { cause?: unknown }).cause ?? "")}`);
}

/** Cuenta una falla de esa app; a la tercera del día, te avisa (una vez). Nunca truena. */
export async function contarFallaApp(dueno: string, app: string): Promise<void> {
  try {
    if (!/^[a-z0-9_]{2,40}$/.test(app)) return;
    const admin = clienteServicio();
    if (!admin) return;
    const { data, error } = await admin.rpc("contar_fallo_app", { p_owner: dueno, p_app: app });
    if (error || Number(data) !== VECES) return;
    const nombre = APP_POR_ID[app as keyof typeof APP_POR_ID]?.nombre ?? "Una de tus apps";
    await notificar(admin, dueno, {
      tipo: "app_falla",
      agente: "iris",
      chat: `**${nombre}** falló ${VECES} veces hoy cuando intenté usarla. Parece un problema de su lado, no de tu cuenta: lo sigo intentando. Si sigue así, revisa si ${nombre} tiene problemas hoy.`,
      corto: `${nombre} está fallando seguido hoy; parece un problema de su lado.`,
      enlace: "/panel?vista=negocio&tab=apps",
      clave: `app_falla:${app}:${new Date().toISOString().slice(0, 10)}`,
    });
  } catch (e) {
    console.error("Contar falla de app:", e instanceof Error ? e.message : e);
  }
}
