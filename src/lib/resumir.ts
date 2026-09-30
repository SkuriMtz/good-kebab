import Anthropic from "@anthropic-ai/sdk";

/**
 * Le pasa un correo a Claude y regresa un resumen + acción sugerida.
 * Se usa tanto para los correos de Gmail como para el modo de prueba,
 * así los dos generan exactamente el mismo tipo de resultado.
 */
export async function resumirCorreo({
  asunto,
  remitente,
  contenido,
}: {
  asunto: string;
  remitente: string;
  contenido: string;
}) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const respuestaIA = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: `Eres un asistente que ayuda a un negocio pequeño a priorizar su correo.
Da un resumen de 1-2 líneas y una acción sugerida corta (o "ninguna" si no aplica).
Responde SOLO en este formato exacto:
RESUMEN: <resumen>
ACCION: <acción sugerida>

Asunto: ${asunto}
De: ${remitente}
Contenido: ${contenido}`,
      },
    ],
  });

  const textoIA =
    respuestaIA.content[0]?.type === "text" ? respuestaIA.content[0].text : "";
  const resumen = textoIA.match(/RESUMEN:\s*(.+)/)?.[1]?.trim() ?? contenido;
  const accion = textoIA.match(/ACCION:\s*(.+)/)?.[1]?.trim() ?? "ninguna";

  return { resumen, accion };
}
