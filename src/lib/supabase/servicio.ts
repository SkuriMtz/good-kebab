import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./config";

/**
 * El cliente con la llave de servicio de Supabase, solo para el trabajo por
 * su cuenta (/api/trabajo), que corre sin que nadie tenga la sesión abierta.
 * La llave va SOLO en Vercel (SUPABASE_SERVICE_ROLE_KEY), nunca en el código
 * ni en el navegador. Sin ella regresa null y no se hace nada.
 * Salta RLS: cada consulta que lo use filtra por owner_id a mano.
 */
export function clienteServicio() {
  // Sin espacios ni caracteres invisibles que se cuelan al pegar
  const llave = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").replace(/[^\x21-\x7E]/g, "");
  if (!llave) return null;
  return createClient(SUPABASE_URL, llave, { auth: { persistSession: false, autoRefreshToken: false } });
}
