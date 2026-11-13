import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { MODELO_DEMO, usarMensajeDemo } from "@/lib/demo-ia";
import { ESQUEMA, INSTRUCCIONES, MAX_PREGUNTA, datosParaIA, esIdGrafica, type RespuestaGrafica } from "@/lib/pregunta-grafica";
import type { ResumenInfo } from "@/lib/resumen-negocio";

/**
 * POST /api/demo/pregunta { pregunta, datos } → la gráfica del resumen de
 * /pruebalo contesta con la IA de verdad, con los números de ejemplo que se
 * ven en pantalla. Cuenta en el límite de la demostración (20 al día).
 */

export const dynamic = "force-dynamic";

const error = (mensaje: string, status: number) => NextResponse.json({ error: mensaje }, { status });

export async function POST(req: NextRequest) {
  if (Number(req.headers.get("content-length") ?? "0") > 60_000) return error("Demasiados datos.", 413);
  let body: { pregunta?: unknown; datos?: unknown };
  try {
    body = await req.json();
  } catch {
    return error("No entendí la pregunta.", 400);
  }
  const pregunta = typeof body.pregunta === "string" ? body.pregunta.trim() : "";
  if (pregunta.length < 2 || pregunta.length > MAX_PREGUNTA) return error(`Escribe una pregunta de hasta ${MAX_PREGUNTA} caracteres.`, 400);
  let compactos: ReturnType<typeof datosParaIA>;
  try {
    compactos = datosParaIA(body.datos as ResumenInfo);
  } catch {
    return error("No entendí los datos.", 400);
  }
  if (!process.env.ANTHROPIC_API_KEY) return error("La IA de la demostración no está disponible ahora.", 503);
  const uso = await usarMensajeDemo(req);
  if ("error" in uso) return error(uso.error, uso.status);

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const respuesta = await client.messages.create({
      model: MODELO_DEMO,
      max_tokens: 600,
      system: `${INSTRUCCIONES}\nEstos son datos DE EJEMPLO de la demostración (Estudio Luna).`,
      messages: [{ role: "user", content: `DATOS:\n${JSON.stringify(compactos).slice(0, 40_000)}\n\nPREGUNTA:\n${pregunta}` }],
      output_config: { format: { type: "json_schema", schema: ESQUEMA } },
    });
    if (respuesta.stop_reason === "refusal" || respuesta.stop_reason === "max_tokens") return error("La IA no pudo contestar esa pregunta.", 502);
    const texto = respuesta.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    const salida = JSON.parse(texto) as { grafica?: unknown; respuesta?: unknown };
    if (!esIdGrafica(salida.grafica) || typeof salida.respuesta !== "string" || !salida.respuesta.trim()) return error("La IA no pudo contestar esa pregunta.", 502);
    const resultado: RespuestaGrafica = { grafica: salida.grafica, texto: salida.respuesta.trim().slice(0, 600), fuente: "ia" };
    return NextResponse.json(resultado, { headers: { "Cache-Control": "no-store", "X-Demo-Quedan": String(uso.quedan) } });
  } catch {
    return error("La IA no respondió.", 502);
  }
}
