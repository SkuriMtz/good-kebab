/**
 * Lee la URL y la clave pública de Supabase desde las variables de entorno.
 *
 * Al copiar y pegar estos valores (por ejemplo en Vercel) es fácil que se
 * cuelen espacios, saltos de línea o caracteres invisibles. Como ambos
 * valores solo usan caracteres ASCII visibles, quitamos todo lo demás para
 * que un error de copiado no rompa el inicio de sesión.
 */
function limpiar(valor: string | undefined) {
  return (valor ?? "").replace(/[^\x21-\x7E]/g, "");
}

export const SUPABASE_URL = limpiar(process.env.NEXT_PUBLIC_SUPABASE_URL);
export const SUPABASE_ANON_KEY = limpiar(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
