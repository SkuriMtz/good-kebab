import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/demo/estado → por qué /pruebalo contesta (o no) con la IA.
 * Solo dice sí o no: nunca muestra la llave ni datos de nadie, y no gasta
 * mensajes (prueba el contador con una huella inválida, que no se guarda).
 */

export const dynamic = "force-dynamic";

export async function GET() {
  const llave = Boolean(process.env.ANTHROPIC_API_KEY);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("sumar_uso_demo", { p_huella: "prueba" });
  const contador = !error && data === -1;
  const entorno = process.env.VERCEL_ENV ?? "local";
  const que = !llave
    ? `Falta ANTHROPIC_API_KEY en Vercel para el entorno "${entorno}". Agrégala en Settings → Environment Variables (marca ${entorno === "preview" ? "Preview" : entorno === "production" ? "Production" : "el entorno"}) y vuelve a publicar.`
    : !contador
      ? "El contador del límite (migración 0010) no responde."
      : "Todo listo: /pruebalo contesta con la IA de verdad.";
  return NextResponse.json({ entorno, llave_de_ia: llave, contador_del_limite: contador, que_falta: que }, { headers: { "Cache-Control": "no-store" } });
}
