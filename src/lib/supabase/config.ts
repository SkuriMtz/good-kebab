/**
 * URL y clave pública (anon key) de Supabase.
 *
 * Ambos valores son PÚBLICOS: van dentro de la app que se descarga en el
 * navegador, así que cualquiera puede verlos. Lo que protege los datos son
 * las reglas de Row Level Security en la base de datos, no esta clave.
 * Por eso se pueden dejar aquí como valores por defecto, y así no hay que
 * copiarlos a mano (un error de copiado rompía el inicio de sesión).
 *
 * Si algún día cambias de proyecto de Supabase, define las variables de
 * entorno NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY y esas
 * tendrán prioridad.
 *
 * NUNCA pongas aquí la "service role key" ni ninguna otra clave secreta.
 */
const URL_POR_DEFECTO = "https://hatuwlxervgzajazwjvz.supabase.co";
const ANON_KEY_POR_DEFECTO =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhdHV3bHhlcnZnemFqYXp3anZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3MzYyODgsImV4cCI6MjEwNjMxMjI4OH0.zaBYAmQ8mEPqCB6ZfR8BSNuB0XjgwBDsv3tbV-Msops";

// Quita espacios, saltos de línea o caracteres invisibles que se cuelan al pegar
function limpiar(valor: string | undefined) {
  return (valor ?? "").replace(/[^\x21-\x7E]/g, "");
}

export const SUPABASE_URL =
  limpiar(process.env.NEXT_PUBLIC_SUPABASE_URL) || URL_POR_DEFECTO;
export const SUPABASE_ANON_KEY =
  limpiar(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) || ANON_KEY_POR_DEFECTO;
