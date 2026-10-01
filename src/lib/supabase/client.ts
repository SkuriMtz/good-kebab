import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config";

/**
 * Cliente de Supabase para usar en el navegador (componentes del lado
 * del cliente). Usa la clave pública (anon key) — segura de exponer
 * porque el acceso real a los datos lo controla RLS en la base de datos,
 * no esta clave.
 */
export function createClient() {
  return createBrowserClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );
}
