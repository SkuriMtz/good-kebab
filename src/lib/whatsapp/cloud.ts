import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * WHATSAPP CLOUD API (Meta), para los mensajes de tus clientes:
 * - firmaValida: Meta firma cada aviso del webhook con el secreto de la app
 *   (X-Hub-Signature-256 = HMAC-SHA256 del cuerpo CRUDO con META_APP_SECRET).
 *   Sin firma válida no se guarda nada.
 * - leerAviso: saca de un aviso de Meta los mensajes nuevos y los estados.
 * - mandarTexto: contesta con texto libre. Meta solo lo deja dentro de las
 *   24 horas desde el último mensaje del cliente (después pide plantilla).
 * - suscribirApp: que Meta le mande a Atendel los mensajes de ese WhatsApp.
 * Los tokens nunca se registran ni salen del servidor.
 */

const GRAPH = "https://graph.facebook.com/v27.0";

const secreto = () => (process.env.META_APP_SECRET ?? "").trim();
const prueba = (token: string) => createHmac("sha256", secreto()).update(token).digest("hex");

const obj = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const lista = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const txt = (v: unknown, max = 4096) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export const NUMERO = /^[0-9]{6,20}$/;
export const ID_META = /^[0-9]{5,30}$/;

/** ¿El aviso viene de verdad de Meta? Compara en tiempo constante. */
export function firmaValida(cuerpo: Buffer, firma: string | null): boolean {
  const s = secreto();
  if (!s || !firma || !/^sha256=[0-9a-f]{64}$/i.test(firma)) return false;
  const esperada = createHmac("sha256", s).update(cuerpo).digest();
  const dada = Buffer.from(firma.slice(7), "hex");
  return dada.length === esperada.length && timingSafeEqual(dada, esperada);
}

export type Entrante = { waId: string; de: string; nombre: string | null; texto: string; en: number };
export type EstadoSalida = { waId: string; estado: string; error: string | null };
export type AvisoMeta = { phoneNumberId: string; mensajes: Entrante[]; estados: EstadoSalida[] };

/** Lo que mandó el cliente, en texto (lo que no es texto se describe). Vacío: no es un mensaje nuevo. */
function textoDe(m: Record<string, unknown>): string {
  const pie = (o: unknown) => {
    const c = txt(obj(o).caption, 1000);
    return c ? `: ${c}` : "";
  };
  switch (txt(m.type, 40)) {
    case "text":
      return txt(obj(m.text).body);
    case "button":
      return txt(obj(m.button).text, 500);
    case "interactive": {
      const i = obj(m.interactive);
      return txt(obj(i.button_reply).title, 500) || txt(obj(i.list_reply).title, 500) || "[Respondió a un menú]";
    }
    case "image":
      return `[Mandó una foto${pie(m.image)}]`;
    case "video":
      return `[Mandó un video${pie(m.video)}]`;
    case "audio":
      return "[Mandó un audio]";
    case "document": {
      const d = obj(m.document);
      const n = txt(d.filename, 200);
      return `[Mandó un documento${n ? ` (${n})` : ""}${pie(d)}]`;
    }
    case "sticker":
      return "[Mandó un sticker]";
    case "location": {
      const l = obj(m.location);
      const donde = [txt(l.name, 200), txt(l.address, 300)].filter(Boolean).join(", ");
      return `[Mandó una ubicación${donde ? `: ${donde}` : ""}]`;
    }
    case "contacts":
      return "[Mandó un contacto]";
    case "order":
      return "[Mandó un pedido del catálogo]";
    case "reaction":
    case "system":
      return "";
    default:
      return "[Mandó algo que WhatsApp no deja ver aquí]";
  }
}

/** Los mensajes y estados de un aviso de Meta (sin confiar en su forma). */
export function leerAviso(payload: unknown): AvisoMeta[] {
  const p = obj(payload);
  if (p.object !== "whatsapp_business_account") return [];
  const avisos: AvisoMeta[] = [];
  for (const e of lista(p.entry).slice(0, 50)) {
    for (const c of lista(obj(e).changes).slice(0, 50)) {
      const cambio = obj(c);
      if (cambio.field !== "messages") continue;
      const v = obj(cambio.value);
      const phoneNumberId = txt(obj(v.metadata).phone_number_id, 40);
      if (!ID_META.test(phoneNumberId)) continue;
      const nombres = new Map<string, string>();
      for (const k of lista(v.contacts)) {
        const x = obj(k);
        const id = txt(x.wa_id, 30);
        const nombre = txt(obj(x.profile).name, 120);
        if (id && nombre) nombres.set(id, nombre);
      }
      const mensajes: Entrante[] = [];
      for (const m of lista(v.messages).slice(0, 100)) {
        const x = obj(m);
        const de = txt(x.from, 30);
        const waId = txt(x.id, 200);
        const texto = textoDe(x);
        if (!NUMERO.test(de) || !waId || !texto) continue;
        const en = Number(x.timestamp) * 1000;
        mensajes.push({ waId, de, nombre: nombres.get(de) ?? null, texto, en: Number.isFinite(en) && en > 0 ? en : Date.now() });
      }
      const estados: EstadoSalida[] = [];
      for (const s of lista(v.statuses).slice(0, 100)) {
        const x = obj(s);
        const waId = txt(x.id, 200);
        const estado = txt(x.status, 20);
        if (!waId || !estado) continue;
        const err = obj(lista(x.errors)[0]);
        const detalle = txt(obj(err.error_data).details, 200) || txt(err.title, 200) || txt(err.message, 200);
        estados.push({ waId, estado, error: detalle || null });
      }
      if (mensajes.length || estados.length) avisos.push({ phoneNumberId, mensajes, estados });
    }
  }
  return avisos;
}

export type ResultadoEnvio = { ok: true; waId: string } | { ok: false; error: string; vencida?: boolean };

/** Manda un texto a un cliente desde el número del negocio. Nunca dice que salió si Meta no lo confirmó. */
export async function mandarTexto(o: { token: string; phoneNumberId: string; a: string; texto: string }): Promise<ResultadoEnvio> {
  if (!ID_META.test(o.phoneNumberId) || !NUMERO.test(o.a)) return { ok: false, error: "El número no es válido." };
  const texto = o.texto.trim().slice(0, 4096);
  if (!texto) return { ok: false, error: "El mensaje está vacío." };
  if (!secreto()) return { ok: false, error: "Falta configurar META_APP_SECRET en Vercel." };
  let r: Response;
  try {
    r = await fetch(`${GRAPH}/${o.phoneNumberId}/messages?appsecret_proof=${prueba(o.token)}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${o.token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to: o.a, type: "text", text: { preview_url: false, body: texto } }),
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
  } catch {
    return { ok: false, error: "WhatsApp no respondió. Intenta de nuevo en un momento." };
  }
  const j = obj(await r.json().catch(() => null));
  if (r.ok) {
    const waId = txt(obj(lista(j.messages)[0]).id, 200);
    return waId ? { ok: true, waId } : { ok: false, error: "WhatsApp no confirmó el envío." };
  }
  const codigo = Number(obj(j.error).code);
  if (codigo === 131047) return { ok: false, error: "Ya pasaron más de 24 horas desde su último mensaje: WhatsApp solo deja contestar libre dentro de 24 horas." };
  if (codigo === 190 || codigo === 102) return { ok: false, error: "Tu conexión con Meta venció: vuelve a conectarla en Tu negocio → Apps.", vencida: true };
  if (codigo === 131026) return { ok: false, error: "A ese número no le pudo llegar (puede que no use WhatsApp o tenga una versión vieja)." };
  if (codigo === 133010) return { ok: false, error: "Tu número todavía no está dado de alta en la API de WhatsApp. Termínalo en el Administrador de WhatsApp de Meta." };
  if ([4, 80007, 130429, 131048, 131056].includes(codigo)) return { ok: false, error: "WhatsApp pidió esperar un poco antes de mandar más mensajes." };
  if (codigo === 10 || (codigo >= 200 && codigo < 300)) return { ok: false, error: "Meta no dio permiso para mandar mensajes: falta el permiso de WhatsApp (whatsapp_business_messaging)." };
  return { ok: false, error: `WhatsApp no lo mandó (error ${Number.isFinite(codigo) ? codigo : r.status}).` };
}

/** Pide a Meta que mande a Atendel los mensajes de esa cuenta de WhatsApp Business. */
export async function suscribirApp(token: string, wabaId: string): Promise<boolean> {
  if (!ID_META.test(wabaId) || !secreto()) return false;
  try {
    const r = await fetch(`${GRAPH}/${wabaId}/subscribed_apps?appsecret_proof=${prueba(token)}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    return r.ok;
  } catch {
    return false;
  }
}

/**
 * ¿Este token todavía tiene permiso en Meta sobre ese número?
 * - "si": Meta lo dejó leer.
 * - "sin_permiso": Meta dice que no tiene permiso sobre ese número (errores
 *   de permisos 10 y 200–299, o 100: "no existe o falta permiso").
 * - "token_invalido": el token ya no sirve (hay que volver a conectar).
 * - "no_se": Meta no respondió o dijo otra cosa (algo pasajero).
 * Manda lo que diga Meta: sin permiso confirmado, esa cuenta no ve mensajes.
 */
export type Acceso = "si" | "sin_permiso" | "token_invalido" | "no_se";

export async function tieneAcceso(token: string, phoneNumberId: string): Promise<Acceso> {
  if (!ID_META.test(phoneNumberId) || !secreto()) return "no_se";
  try {
    const r = await fetch(`${GRAPH}/${phoneNumberId}?fields=id&appsecret_proof=${prueba(token)}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    if (r.ok) return "si";
    const e = obj(obj(await r.json().catch(() => null)).error);
    const codigo = Number(e.code);
    if (codigo === 190 || codigo === 102) return "token_invalido";
    if (codigo === 10 || codigo === 100 || (codigo >= 200 && codigo < 300)) return "sin_permiso";
    return "no_se";
  } catch {
    return "no_se";
  }
}
