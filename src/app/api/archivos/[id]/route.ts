import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/archivos/[id] → descarga un archivo que armó tu equipo (por
 * ejemplo, una presentación). Con tu sesión: RLS solo deja ver lo tuyo. Da
 * una dirección firmada que dura 5 minutos.
 */

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  if (!UUID.test(params.id)) return NextResponse.json({ error: "No existe ese archivo." }, { status: 404 });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/entrar", _req.url));
  const { data } = await supabase.from("archivos").select("nombre, ruta").eq("id", params.id).eq("owner_id", user.id).maybeSingle();
  if (!data) return NextResponse.json({ error: "No existe ese archivo." }, { status: 404 });
  const { data: firmado, error } = await supabase.storage.from("archivos").createSignedUrl(data.ruta as string, 300, { download: data.nombre as string });
  if (error || !firmado) return NextResponse.json({ error: "No se pudo abrir el archivo." }, { status: 500 });
  return NextResponse.redirect(firmado.signedUrl, { headers: { "Cache-Control": "private, no-store" } });
}
