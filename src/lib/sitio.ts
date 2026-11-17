/**
 * La dirección pública del sitio. En Vercel sale sola del dominio de
 * producción (VERCEL_PROJECT_PRODUCTION_URL): cuando conectes tu dominio
 * propio, cambia aquí sin tocar nada. NEXT_PUBLIC_SITIO_URL tiene prioridad
 * si la defines.
 */
function limpio(u: string | undefined): string {
  const t = (u ?? "").trim().replace(/\/+$/, "");
  if (!t) return "";
  const conProtocolo = /^https?:\/\//.test(t) ? t : `https://${t}`;
  try {
    return new URL(conProtocolo).origin;
  } catch {
    return "";
  }
}

export const SITIO = limpio(process.env.NEXT_PUBLIC_SITIO_URL) || limpio(process.env.VERCEL_PROJECT_PRODUCTION_URL) || "https://good-kebab.vercel.app";

/**
 * Correos de Atendel (por ahora Gmail; cuando sean de la empresa, se cambian solo aquí).
 * - INFO: todo lo de información, incluidos el Aviso de privacidad y los Términos.
 * - CONTACTO: para que la gente nos escriba.
 */
export const CORREO_INFO = "infoatendel@gmail.com";
export const CORREO_CONTACTO = "contactoatendel@gmail.com";
