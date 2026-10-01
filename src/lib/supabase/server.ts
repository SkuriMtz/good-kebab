import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config";

/**
 * Cliente de Supabase para usar en el servidor (API routes, Server
 * Components). Lee la sesión del usuario desde las cookies, así que
 * cada petición sabe EXACTAMENTE quién la está haciendo — eso es lo
 * que RLS usa (auth.uid()) para decidir qué filas puede tocar.
 *
 * IMPORTANTE: nunca uses la "service role key" (la clave que se salta
 * RLS) en código que responde a peticiones de usuarios. Esa clave solo
 * se usa en tareas internas de servidor que tú controlas por completo.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[]
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Se puede ignorar si se llama desde un Server Component;
            // el middleware ya se encarga de refrescar la sesión.
          }
        },
      },
    }
  );
}
