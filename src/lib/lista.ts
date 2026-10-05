/**
 * Lista de espera y contacto: lo que se manda a /api/lista y cómo se valida.
 * Lo usan el navegador (FormularioLista, formulario de contacto) y el
 * servidor (src/app/api/lista/route.ts), así que aquí no hay nada secreto.
 * Los datos se guardan en la tabla `solicitudes` de Supabase
 * (supabase/migrations/0005_solicitudes.sql), que solo permite insertar.
 */

export type TipoSolicitud = "lista" | "contacto";

export type Solicitud = {
  tipo: TipoSolicitud;
  correo: string;
  nombre?: string;
  negocio?: string;
  mensaje?: string;
};

export type RespuestaLista = { ok: true } | { ok: false; error: string };

/** Límites (los mismos que revisa la base de datos). */
export const LIMITES = { correo: 254, nombre: 120, negocio: 160, mensaje: 2000 } as const;

/** Validación básica de correo: algo@algo.algo, sin espacios. */
const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizarCorreo(valor: string) {
  return valor.trim().toLowerCase();
}

export function correoValido(valor: string) {
  const c = normalizarCorreo(valor);
  return c.length >= 6 && c.length <= LIMITES.correo && PATRON_CORREO.test(c);
}

/** Revisa una solicitud antes de mandarla. Devuelve el mensaje de error o null. */
export function revisarSolicitud(s: Solicitud): string | null {
  if (!s.correo.trim()) return "Escribe tu correo.";
  if (!correoValido(s.correo)) return "Revisa tu correo: parece que le falta algo (por ejemplo, nombre@negocio.com).";
  if ((s.nombre ?? "").length > LIMITES.nombre) return `El nombre puede tener hasta ${LIMITES.nombre} caracteres.`;
  if ((s.negocio ?? "").length > LIMITES.negocio) return `El nombre del negocio puede tener hasta ${LIMITES.negocio} caracteres.`;
  if ((s.mensaje ?? "").length > LIMITES.mensaje) return `El mensaje puede tener hasta ${LIMITES.mensaje.toLocaleString("es-MX")} caracteres.`;
  if (s.tipo === "contacto" && !(s.mensaje ?? "").trim()) return "Escribe tu mensaje.";
  return null;
}

/**
 * Manda la solicitud desde el navegador. Nunca lanza errores: siempre
 * devuelve { ok } o { ok: false, error } con un mensaje para mostrar.
 * `trampa` es el campo oculto contra bots (las personas lo dejan vacío).
 */
export async function enviarSolicitud(s: Solicitud, trampa = ""): Promise<RespuestaLista> {
  const problema = revisarSolicitud(s);
  if (problema) return { ok: false, error: problema };
  try {
    const res = await fetch("/api/lista", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...s, correo: normalizarCorreo(s.correo), sitio_web: trampa }),
    });
    const datos = (await res.json().catch(() => null)) as RespuestaLista | null;
    if (res.ok && datos?.ok) return { ok: true };
    return {
      ok: false,
      error: datos && !datos.ok && datos.error ? datos.error : "No pudimos guardar tus datos. Intenta de nuevo en un momento.",
    };
  } catch {
    return { ok: false, error: "No hay conexión. Revisa tu internet e intenta de nuevo." };
  }
}
