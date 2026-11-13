import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { cargarCuenta } from "@/lib/cuenta";
import { periodoDe } from "@/lib/estadisticas";
import { cargarNegocio } from "@/lib/estadisticas-negocio";
import { ESQUEMA, INSTRUCCIONES, MAX_PREGUNTA, datosParaIA, esIdGrafica, type RespuestaGrafica } from "@/lib/pregunta-grafica";
import { resumirNegocio } from "@/lib/resumen-negocio";
import { createClient } from "@/lib/supabase/server";
import { Gasto, leerUso, registrarUso } from "@/lib/uso";
import { mensajeLimite } from "@/lib/uso-estado";
import { MODELOS } from "@/lib/planes";

/**
 * PREGUNTARLE A LA GRÁFICA (panel de información > Resumen)
 *
 * POST { pregunta, periodo } → RespuestaGrafica: qué gráfica dibujar y una
 * respuesta de una o dos frases hecha SOLO con los números del periodo.
 *
 * Con la sesión de la persona (RLS: solo sus datos). Usa el modelo de su plan
 * y cuenta como un mensaje del mes, igual que el chat; si ya no le quedan,
 * responde 429. Sin la llave de Anthropic responde 503 y el panel contesta
 * con reglas (sin IA).
 */

export const dynamic = "force-dynamic";

const error = (mensaje: string, status: number) => NextResponse.json({ error: mensaje }, { status });


export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return error("Inicia sesión.", 401);

  let body: { pregunta?: unknown; periodo?: unknown };
  try {
    body = await req.json();
  } catch {
    return error("No entendí la pregunta.", 400);
  }
  const pregunta = typeof body.pregunta === "string" ? body.pregunta.trim() : "";
  if (pregunta.length < 2 || pregunta.length > MAX_PREGUNTA) return error(`Escribe una pregunta de hasta ${MAX_PREGUNTA} caracteres.`, 400);
  const periodo = periodoDe(body.periodo);

  const cuenta = await cargarCuenta(supabase, user.id);
  // El límite de uso del plan (el mismo del chat: sesión de 5 horas y semana)
  const limite = mensajeLimite(await leerUso(supabase, user.id, cuenta.plan));
  if (limite) return error(limite, 429);
  if (!process.env.ANTHROPIC_API_KEY) return error("La IA todavía no está configurada.", 503);

  let datos;
  try {
    datos = resumirNegocio(await cargarNegocio(supabase, user.id, periodo, cuenta));
  } catch {
    return error("No se pudieron leer tus números.", 500);
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const base = {
    // Con margen: el modelo piensa un poco antes de escribir el JSON
    max_tokens: 2048,
    system: INSTRUCCIONES,
    messages: [{ role: "user" as const, content: `DATOS:\n${JSON.stringify(datosParaIA(datos))}\n\nPREGUNTA:\n${pregunta}` }],
  };
  try {
    // Es una respuesta corta con forma fija: la contesta el modelo Rápido (Haiku 5.5), con poco esfuerzo
    const respuesta = await client.messages.create({
      ...base,
      model: MODELOS.rapido.api,
      output_config: { effort: "low", format: { type: "json_schema", schema: ESQUEMA } },
    });
    // Lo que costó cuenta para el límite, aunque la respuesta no sirva
    const gasto = new Gasto();
    gasto.sumar(respuesta, MODELOS.rapido.api);
    await registrarUso(supabase, gasto, "pregunta");
    if (respuesta.stop_reason === "refusal" || respuesta.stop_reason === "max_tokens") return error("La IA no pudo contestar esa pregunta.", 502);
    const texto = respuesta.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    const salida = JSON.parse(texto) as { grafica?: unknown; respuesta?: unknown };
    if (!esIdGrafica(salida.grafica) || typeof salida.respuesta !== "string" || !salida.respuesta.trim()) return error("La IA no pudo contestar esa pregunta.", 502);

    // Cuenta como un mensaje (para las estadísticas, como el chat)
    await supabase.rpc("sumar_mensaje");
    const resultado: RespuestaGrafica = { grafica: salida.grafica, texto: salida.respuesta.trim().slice(0, 600), fuente: "ia" };
    return NextResponse.json(resultado, { headers: { "Cache-Control": "private, no-store" } });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return error("La IA está ocupada. Intenta en un momento.", 503);
    if (e instanceof Anthropic.APIError) return error("La IA no respondió.", 502);
    return error("La IA no pudo contestar esa pregunta.", 502);
  }
}
