import { NextResponse } from "next/server";
import { clienteServicio } from "@/lib/supabase/servicio";

/**
 * GET /api/demo/estado → si /pruebalo contesta con la IA.
 * En producción solo dice sí o no ({ listo }): nada de cómo está armado el
 * servidor. En los demás entornos (preview y local) dice qué falta, para
 * poder arreglarlo. Nunca gasta mensajes (prueba el contador con una huella
 * inválida, que no se guarda).
 */

export const dynamic = "force-dynamic";

export async function GET() {
  const llave = Boolean(process.env.ANTHROPIC_API_KEY);
  const admin = clienteServicio();
  const r = admin ? await admin.rpc("sumar_uso_demo", { p_huella: "prueba" }) : null;
  const contador = Boolean(r && !r.error && r.data === -1);
  const listo = llave && contador;
  const entorno = process.env.VERCEL_ENV ?? "local";
  if (entorno === "production") return NextResponse.json({ listo }, { headers: { "Cache-Control": "no-store" } });
  const que = !llave
    ? `Falta ANTHROPIC_API_KEY en Vercel para el entorno "${entorno}".`
    : !admin
      ? "Falta SUPABASE_SERVICE_ROLE_KEY en Vercel (el contador de la demo solo lo usa el servidor)."
      : !contador
        ? "El contador del límite (migraciones 0010 y 0030) no responde."
        : "Todo listo: /pruebalo contesta con la IA de verdad.";
  return NextResponse.json({ listo, entorno, llave_de_ia: llave, contador_del_limite: contador, que_falta: que }, { headers: { "Cache-Control": "no-store" } });
}
