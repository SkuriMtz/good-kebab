import "server-only";
import { createHmac } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ID_META } from "./cloud";

/**
 * AVISOS AL DUEÑO POR WHATSAPP, desde el número de Atendel (no el del negocio).
 *
 * Fuera de las 24 horas desde que el dueño escribió, Meta solo deja mandar con
 * una PLANTILLA aprobada. La de los avisos (WHATSAPP_PLANTILLA_AVISO, tipo
 * Utilidad) lleva {{1}} = el texto corto del aviso y un botón de enlace
 * «Abrir Atendel» → https://<dominio>/{{1}} = la ruta del panel.
 *
 * Variables en Vercel (nunca en el código ni en el chat):
 *   WHATSAPP_ENVIO_TOKEN         token permanente del usuario del sistema
 *   WHATSAPP_ENVIO_TELEFONO_ID   el phone number ID del número de Atendel
 *   WHATSAPP_PLANTILLA_AVISO     el nombre de la plantilla de avisos
 *   WHATSAPP_PLANTILLA_IDIOMA    opcional (por omisión es_MX)
 * Sin ellas, no se manda nada por WhatsApp (los avisos siguen en el chat y
 * en la app).
 */

const GRAPH = "https://graph.facebook.com/v27.0";
const token = () => (process.env.WHATSAPP_ENVIO_TOKEN ?? "").replace(/[^\x21-\x7E]/g, "");
export const idNumeroAtendel = () => (process.env.WHATSAPP_ENVIO_TELEFONO_ID ?? "").trim();
const plantilla = () => (process.env.WHATSAPP_PLANTILLA_AVISO ?? "").trim();
const idioma = () => (/^[a-z]{2}(_[A-Z]{2})?$/.test(process.env.WHATSAPP_PLANTILLA_IDIOMA ?? "") ? String(process.env.WHATSAPP_PLANTILLA_IDIOMA) : "es_MX");
/** Si la app de Meta pide la prueba del secreto, va en cada llamada. */
const prueba = () => {
  const s = (process.env.META_APP_SECRET ?? "").trim();
  return s ? `?appsecret_proof=${createHmac("sha256", s).update(token()).digest("hex")}` : "";
};

/** ¿Están puestos el número de Atendel y la plantilla de avisos? */
export function avisosWhatsappListos(): boolean {
  return Boolean(token()) && ID_META.test(idNumeroAtendel()) && /^[a-z0-9_]{1,512}$/.test(plantilla());
}

/** Las variables de una plantilla no aceptan saltos de línea, tabuladores ni más de 4 espacios seguidos. */
const paraPlantilla = (t: string, max: number) => t.replace(/\s+/g, " ").trim().slice(0, max);

/** A qué número de WhatsApp le llegan los avisos a este dueño (null: no conectado, en pausa o sin configurar). */
export async function destinoWhatsapp(admin: SupabaseClient, dueno: string): Promise<string | null> {
  if (!avisosWhatsappListos()) return null;
  const { data } = await admin.from("avisos_whatsapp").select("numero, confirmado_en, pausado").eq("owner_id", dueno).maybeSingle();
  if (!data?.numero || !data.confirmado_en || data.pausado) return null;
  return /^[1-9][0-9]{7,14}$/.test(String(data.numero)) ? String(data.numero) : null;
}

let numeroEnMemoria: string | null = null;

/** El número de WhatsApp de Atendel (solo dígitos), para el enlace wa.me. Se lee de Meta una vez. */
export async function numeroDeAtendel(): Promise<string | null> {
  if (numeroEnMemoria) return numeroEnMemoria;
  if (!avisosWhatsappListos()) return null;
  try {
    const sep = prueba() ? "&" : "?";
    const r = await fetch(`${GRAPH}/${idNumeroAtendel()}${prueba()}${sep}fields=display_phone_number`, {
      headers: { Authorization: `Bearer ${token()}` },
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    if (!r.ok) return null;
    const j = (await r.json().catch(() => null)) as { display_phone_number?: unknown } | null;
    const digitos = String(j?.display_phone_number ?? "").replace(/\D/g, "");
    if (!/^[1-9][0-9]{7,14}$/.test(digitos)) return null;
    numeroEnMemoria = digitos;
    return digitos;
  } catch {
    return null;
  }
}

export type EnvioAviso = { ok: true; waId: string } | { ok: false; error: string; permanente?: boolean };

/** Manda un aviso con la plantilla. Nunca dice que salió si Meta no lo confirmó. */
export async function mandarAvisoWhatsapp(o: { a: string; texto: string; enlace: string }): Promise<EnvioAviso> {
  if (!avisosWhatsappListos()) return { ok: false, error: "Los avisos por WhatsApp todavía no están configurados." };
  if (!/^[1-9][0-9]{7,14}$/.test(o.a)) return { ok: false, error: "El número no es válido.", permanente: true };
  const texto = paraPlantilla(o.texto, 900) || "Tienes un aviso nuevo.";
  // El botón: la ruta del panel sin la diagonal del inicio (la plantilla ya trae el dominio)
  const ruta = /^\/panel(\?[A-Za-z0-9=&_.:%-]{0,290})?$/.test(o.enlace) ? o.enlace.slice(1) : "panel";
  try {
    const r = await fetch(`${GRAPH}/${idNumeroAtendel()}/messages${prueba()}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: o.a,
        type: "template",
        template: {
          name: plantilla(),
          language: { code: idioma() },
          components: [
            { type: "body", parameters: [{ type: "text", text: texto }] },
            { type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: ruta }] },
          ],
        },
      }),
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
    const j = (await r.json().catch(() => null)) as { messages?: { id?: string }[]; error?: { code?: number; message?: string } } | null;
    if (r.ok) {
      const waId = String(j?.messages?.[0]?.id ?? "");
      return waId ? { ok: true, waId } : { ok: false, error: "WhatsApp no confirmó el envío." };
    }
    const codigo = Number(j?.error?.code);
    // A ese número no le puede llegar (no usa WhatsApp, o no es válido): no se vuelve a intentar
    const permanente = [131026, 131021, 1013].includes(codigo);
    return { ok: false, error: `WhatsApp no mandó el aviso (error ${Number.isFinite(codigo) ? codigo : r.status}).`, permanente };
  } catch {
    return { ok: false, error: "WhatsApp no respondió." };
  }
}
