import "server-only";
import { createHash, randomBytes } from "node:crypto";

/**
 * EL APARATO: una cookie al azar (httpOnly) que reconoce el navegador. Sirve
 * para avisarte si entras a tu cuenta desde un aparato nuevo y para no
 * avisarle al mismo aparato que hizo un cambio. En la base solo se guarda su
 * hash (sha256), nunca la cookie. No da acceso a nada por sí sola.
 */

export const COOKIE_APARATO = "atendel_aparato";
const FORMA = /^[A-Za-z0-9_-]{43}$/;

export const hashAparato = (valor: string) => createHash("sha256").update(`atendel-aparato:${valor}`).digest("hex");
export const nuevoAparato = () => randomBytes(32).toString("base64url");
export const valorAparatoValido = (v: unknown): v is string => typeof v === "string" && FORMA.test(v);

/** El hash del aparato de esta petición, o null si todavía no tiene su cookie. */
export function aparatoDe(req: { cookies: { get(nombre: string): { value: string } | undefined } }): string | null {
  const v = req.cookies.get(COOKIE_APARATO)?.value;
  return valorAparatoValido(v) ? hashAparato(v) : null;
}

/** La cookie dura poco más de un año; solo la lee el servidor. */
export const OPCIONES_COOKIE_APARATO = { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/", maxAge: 400 * 86_400 };
