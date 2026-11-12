import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET → un archivo JSON con los datos de la cuenta: perfil del negocio,
 * ajustes, equipo, plan, conversaciones con sus mensajes, documentos y qué
 * apps están conectadas. Nunca los tokens de las apps (ni cifrados).
 * Con la sesión de la persona: RLS solo deja leer lo suyo.
 */

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });

  const [perfil, ajustes, equipo, plan, conversaciones, mensajes, documentos, conexiones] = await Promise.all([
    supabase.from("perfil_negocio").select("*").eq("owner_id", user.id).maybeSingle(),
    supabase.from("ajustes_cuenta").select("datos, actualizado_en").eq("owner_id", user.id).maybeSingle(),
    supabase.from("agentes_elegidos").select("agentes").eq("owner_id", user.id).maybeSingle(),
    supabase.from("suscripciones").select("plan").eq("owner_id", user.id).maybeSingle(),
    supabase.from("conversaciones").select("*").eq("owner_id", user.id).order("actualizado_en", { ascending: false }).limit(1000),
    supabase.from("mensajes").select("conversacion_id, rol, contenido, creado_en").eq("owner_id", user.id).order("creado_en").limit(20000),
    supabase.from("documentos").select("*").eq("owner_id", user.id).limit(500),
    // Solo qué está conectado: sin token_cifrado
    supabase.from("conexiones").select("proveedor, apps, cuenta, estado, creado_en").eq("owner_id", user.id),
  ]);

  const archivo = {
    exportado_en: new Date().toISOString(),
    cuenta: { correo: user.email ?? null, creada_en: user.created_at },
    plan: plan.data?.plan ?? "free",
    equipo: equipo.data?.agentes ?? null,
    perfil_negocio: perfil.data ?? null,
    ajustes: ajustes.data?.datos ?? null,
    conexiones: conexiones.data ?? [],
    documentos: documentos.data ?? [],
    conversaciones: (conversaciones.data ?? []).map((c) => ({ ...c, mensajes: (mensajes.data ?? []).filter((m) => m.conversacion_id === c.id) })),
  };
  const dia = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(archivo, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="atendel-mis-datos-${dia}.json"`,
      "Cache-Control": "private, no-store",
    },
  });
}
