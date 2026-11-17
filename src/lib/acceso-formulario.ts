/**
 * Pequeñas reglas del formulario de acceso (entrar y crear cuenta) que se
 * revisan en el navegador antes de pedir el código. El servidor vuelve a
 * revisarlo todo: esto solo evita viajes y da el aviso junto al campo.
 */

/** "AAAA-MM-DD" a una fecha local sin zona horaria (null si no existe ese día). */
export function leerFecha(valor: string): { a: number; m: number; d: number } | null {
  const c = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  if (!c) return null;
  const a = Number(c[1]);
  const m = Number(c[2]);
  const d = Number(c[3]);
  const f = new Date(Date.UTC(a, m - 1, d));
  if (f.getUTCFullYear() !== a || f.getUTCMonth() !== m - 1 || f.getUTCDate() !== d) return null;
  return { a, m, d };
}

/** Años cumplidos a `hoy` (null si la fecha no es válida o es futura). */
export function edadDe(nacimiento: string, hoy: Date = new Date()): number | null {
  const f = leerFecha(nacimiento);
  if (!f) return null;
  let edad = hoy.getFullYear() - f.a;
  const antes = hoy.getMonth() + 1 < f.m || (hoy.getMonth() + 1 === f.m && hoy.getDate() < f.d);
  if (antes) edad -= 1;
  return edad < 0 ? null : edad;
}

/** A dónde se navega después de verificar: solo rutas propias (nada de //otro-sitio ni http://). */
export function destinoSeguro(destino: unknown): string {
  return typeof destino === "string" && /^\/(?![/\\])[\w\-./?=&%#]*$/.test(destino) ? destino : "/panel";
}

/** Solo dígitos, hasta 6 (para el campo del código). */
export const soloDigitos = (v: string) => v.replace(/\D/g, "").slice(0, 6);
