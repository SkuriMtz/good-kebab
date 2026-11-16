import { NextRequest, NextResponse } from "next/server";
import { AUTONOMIA, limpiarAjustes } from "@/lib/ajustes";
import { aparatoDe } from "@/lib/aparato";
import { notificar } from "@/lib/notificar";
import { limpiarOrganizacion } from "@/lib/organizacion-chats";
import { createClient } from "@/lib/supabase/server";
import { clienteServicio } from "@/lib/supabase/servicio";

/**
 * PUT { ajustes } → guarda los ajustes de la cuenta (tabla ajustes_cuenta).
 * Con la sesión de la persona (RLS: solo los suyos). Lo que llega se limpia
 * campo por campo; lo desconocido se ignora.
 */

export const dynamic = "force-dynamic";

const error = (mensaje: string, status: number) => NextResponse.json({ error: mensaje }, { status });

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return error("Tu sesión terminó. Vuelve a entrar.", 401);
  if (Number(request.headers.get("content-length") ?? "0") > 40_000) return error("Los ajustes son demasiado largos.", 413);

  let cuerpo: { ajustes?: unknown };
  try {
    cuerpo = await request.json();
  } catch {
    return error("No pudimos leer los ajustes.", 400);
  }
  const datos = limpiarAjustes(cuerpo?.ajustes);
  // Cómo acomoda sus conversaciones vive en la misma fila (PUT /api/chats/organizacion): se conserva
  const { data: fila } = await supabase.from("ajustes_cuenta").select("datos").eq("owner_id", user.id).maybeSingle();
  const previos = fila?.datos && typeof fila.datos === "object" && !Array.isArray(fila.datos) ? (fila.datos as Record<string, unknown>) : {};
  const conOrganizacion = "organizacion" in previos ? { ...datos, organizacion: limpiarOrganizacion(previos.organizacion) } : datos;
  const { error: e } = await supabase.from("ajustes_cuenta").upsert({ owner_id: user.id, datos: conOrganizacion, actualizado_en: new Date().toISOString() });
  if (e) return error("No se pudieron guardar tus ajustes. Intenta de nuevo.", 500);

  // «Qué hace solo» es de lo más importante de tu cuenta: si cambió, queda en el chat de Avisos
  // y sale una notificación a tus otros aparatos (máximo una cada 30 minutos), por si no fuiste tú
  const antes = limpiarAjustes(previos).autonomia;
  const cambios = AUTONOMIA.filter((x) => antes[x.id] !== datos.autonomia[x.id]);
  const admin = cambios.length ? clienteServicio() : null;
  if (admin) {
    const lista = cambios.map((x) => `- «${x.titulo}»: ${datos.autonomia[x.id] === "solo" ? "ahora lo hago solo" : "ahora te pregunto antes"}`).join("\n");
    await notificar(admin, user.id, {
      tipo: "cuenta_cambio",
      agente: "iris",
      chat: `Cambió «Qué hace solo»:\n${lista}\n\nSi no fuiste tú, revísalo en [Ajustes → Atendel](/panel?vista=ajustes&seccion=atendel) y cierra la sesión en todos lados en [Ajustes → Cuenta](/panel?vista=ajustes&seccion=cuenta).`,
      corto: `Cambió «Qué hace solo» (${cambios.length === 1 ? `«${cambios[0].titulo}»` : `${cambios.length} cosas`}). Si no fuiste tú, revísalo.`,
      enlace: "/panel?vista=ajustes&seccion=atendel",
      clave: `autonomia:${Math.floor(Date.now() / 1_800_000)}`,
      chatSiempre: true,
      excepto: aparatoDe(request),
    });
  }
  return NextResponse.json({ ajustes: datos }, { headers: { "Cache-Control": "private, no-store" } });
}
