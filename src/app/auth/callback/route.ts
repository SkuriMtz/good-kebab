import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Callback de autenticación (Google o link por correo). Después de que el usuario inicia
 * sesión, Supabase lo redirige aquí con un "code" que se intercambia por
 * su sesión real. También creamos su registro de "negocio" si es la
 * primera vez que entra.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Si el usuario no tiene un negocio todavía, se le crea uno.
      // RLS permite esto porque owner_id = auth.uid() coincide con quien
      // está haciendo la petición.
      const { data: existente } = await supabase
        .from("negocios")
        .select("id")
        .eq("owner_id", data.user.id)
        .maybeSingle();

      if (!existente) {
        await supabase.from("negocios").insert({
          owner_id: data.user.id,
          nombre: data.user.email ?? "Mi negocio",
        });
      }

      return NextResponse.redirect(`${origin}/panel`);
    }
  }

  // Si algo falló (link vencido, abierto en otro navegador, etc.)
  return NextResponse.redirect(`${origin}/entrar?error=login`);
}
