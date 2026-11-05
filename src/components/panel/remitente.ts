/**
 * El nombre y el correo de un remitente ("Laura Méndez <laura@correo.com>").
 * Igual que en Estadísticas (src/lib/estadisticas.ts): así un filtro
 * ?de=Laura Méndez coincide en Correo y en Pendientes.
 */
export function partirRemitente(remitente: string | null | undefined): { nombre: string; correo: string | null } | null {
  const texto = (remitente ?? "").trim();
  if (!texto) return null;
  const conAngulos = texto.match(/^(.*?)\s*<([^>]+)>\s*$/);
  const correo = (conAngulos ? conAngulos[2] : /^[^\s@]+@[^\s@]+$/.test(texto) ? texto : "").trim().toLowerCase() || null;
  const nombre = (conAngulos ? conAngulos[1] : texto).replace(/^["']|["']$/g, "").trim() || correo || texto;
  return { nombre, correo };
}

export const nombreRemitente = (r: string | null | undefined) => partirRemitente(r)?.nombre ?? "Sin remitente";
