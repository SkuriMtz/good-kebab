import "server-only";

/**
 * MANDAR POR WHATSAPP (WhatsApp Cloud API de Meta).
 *
 * Solo se usa al aprobar un envío en Pendientes (/api/envios/[id]). Para
 * mandarle algo a alguien que no te escribió en las últimas 24 h, Meta pide
 * una PLANTILLA aprobada; la de Atendel lleva un documento de encabezado y
 * dos variables: {{1}} el nombre de quien recibe y {{2}} el mensaje.
 *
 * Variables en Vercel (nunca en el código):
 *   WHATSAPP_ENVIO_TOKEN          token permanente del usuario del sistema
 *   WHATSAPP_ENVIO_TELEFONO_ID    el phone number ID que manda
 *   WHATSAPP_PLANTILLA_ARCHIVO    el nombre de la plantilla aprobada
 *   WHATSAPP_PLANTILLA_IDIOMA     opcional (por omisión es_MX)
 * Sin ellas, los envíos aprobados se guardan y esperan.
 */

export function whatsappListo() {
  return Boolean(process.env.WHATSAPP_ENVIO_TOKEN && process.env.WHATSAPP_ENVIO_TELEFONO_ID && process.env.WHATSAPP_PLANTILLA_ARCHIVO);
}

/** Las variables de una plantilla no aceptan saltos de línea, tabuladores ni más de 4 espacios seguidos. */
const paraPlantilla = (t: string, max: number) => t.replace(/\s+/g, " ").trim().slice(0, max);

export async function mandarPorWhatsapp(o: { a: string; nombre: string; mensaje: string; documento?: { enlace: string; nombre: string } }): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!whatsappListo()) return { ok: false, error: "WhatsApp todavía no está conectado." };
  const componentes: unknown[] = [];
  if (o.documento) componentes.push({ type: "header", parameters: [{ type: "document", document: { link: o.documento.enlace, filename: o.documento.nombre } }] });
  componentes.push({
    type: "body",
    parameters: [
      { type: "text", text: paraPlantilla(o.nombre, 60) || "Hola" },
      { type: "text", text: paraPlantilla(o.mensaje, 900) },
    ],
  });
  try {
    const r = await fetch(`https://graph.facebook.com/v21.0/${process.env.WHATSAPP_ENVIO_TELEFONO_ID}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_ENVIO_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: o.a.replace(/^\+/, ""),
        type: "template",
        template: { name: process.env.WHATSAPP_PLANTILLA_ARCHIVO, language: { code: process.env.WHATSAPP_PLANTILLA_IDIOMA || "es_MX" }, components: componentes },
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (r.ok) return { ok: true };
    const j = (await r.json().catch(() => null)) as { error?: { message?: string } } | null;
    return { ok: false, error: (j?.error?.message ?? `WhatsApp respondió ${r.status}`).slice(0, 300) };
  } catch {
    return { ok: false, error: "No se pudo hablar con WhatsApp." };
  }
}
