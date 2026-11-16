import "server-only";
import { createHash, randomInt } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { notificar } from "../notificar";
import { idNumeroAtendel } from "./aviso-plantilla";
import { mandarTexto, type Entrante, type EstadoSalida } from "./cloud";

/**
 * EL WHATSAPP DEL DUEÑO PARA AVISOS (tabla avisos_whatsapp, migración 0027).
 *
 * Conectar sin escribir el número: en Ajustes → Notificaciones se crea un
 * código de un solo uso (10 caracteres, vence en 15 minutos; se guarda solo
 * su hash) y se abre WhatsApp con un mensaje listo para el número de Atendel.
 * Cuando el dueño lo manda, el webhook lo recibe aquí: el número sale de ese
 * mensaje (así sabemos que es suyo y que aceptó recibir avisos).
 * - «PARAR» pausa los avisos; «ACTIVAR» los vuelve a prender.
 * - Mensajes de números que no conocemos: no se contestan (no damos pie a spam).
 * - Lo que el dueño escribe aquí nunca llega a la IA ni a otra cuenta.
 */

/** Sin 0/O, 1/I/L ni U (no se confunden al verlos). */
const ALFABETO = "23456789ABCDEFGHJKMNPQRSTVWXYZ";
const VENCE_MIN = 15;

export const hashCodigo = (codigo: string) =>
  createHash("sha256")
    .update(`atendel-wa:${codigo.replace(/[^A-Z0-9]/gi, "").toUpperCase()}`)
    .digest("hex");

/** Un código nuevo, como «K7P2X-9QX4M». */
export function nuevoCodigo(): string {
  let c = "";
  for (let i = 0; i < 10; i++) c += ALFABETO[randomInt(ALFABETO.length)];
  return `${c.slice(0, 5)}-${c.slice(5)}`;
}

export const TEXTO_CONFIRMAR = (codigo: string) => `Confirmo mis avisos de Atendel: ${codigo}`;
export const venceCodigo = () => new Date(Date.now() + VENCE_MIN * 60_000);

/** «+52 ••• 1234»: lo que se muestra del número (nunca completo). */
export const mascara = (numero: string) => (numero ? `+${numero.slice(0, numero.length > 10 ? numero.length - 10 : 0)} ••• ${numero.slice(-4)}` : "");

const CODIGO = new RegExp(`(?:^|[^A-Z0-9])([${ALFABETO}]{5})-?([${ALFABETO}]{5})(?![A-Z0-9])`);
const PARAR = /^(PARAR|STOP|BAJA|CANCELAR|DETENER)$/;
const ACTIVAR = /^(ACTIVAR|REANUDAR|START)$/;

const responder = (a: string, texto: string) => mandarTexto({ token: (process.env.WHATSAPP_ENVIO_TOKEN ?? "").replace(/[^\x21-\x7E]/g, ""), phoneNumberId: idNumeroAtendel(), a, texto });

/** Un mensaje que le llegó al número de Atendel. */
export async function mensajeAlNumeroDeAtendel(admin: SupabaseClient, m: Entrante): Promise<void> {
  const texto = m.texto.normalize("NFKC").toUpperCase().trim();
  const ahora = new Date().toISOString();

  // 1. Un código para conectar
  const c = CODIGO.exec(texto);
  if (c) {
    const { data: fila } = await admin
      .from("avisos_whatsapp")
      .update({ numero: m.de, confirmado_en: ahora, pausado: false, motivo: null, codigo_hash: null, codigo_vence: null, respondido_en: ahora, actualizado_en: ahora })
      .eq("codigo_hash", hashCodigo(c[1] + c[2]))
      .gt("codigo_vence", ahora)
      .select("owner_id")
      .maybeSingle();
    if (fila?.owner_id) {
      await responder(m.de, "Listo: aquí te llegarán los avisos de Atendel de lo importante. Para dejar de recibirlos, responde PARAR.");
      await notificar(admin, String(fila.owner_id), {
        tipo: "whatsapp_avisos_conectado",
        agente: "iris",
        chat: `Conectaste tu WhatsApp (${mascara(m.de)}) para recibir avisos. Si no fuiste tú, quítalo en [Ajustes → Notificaciones](/panel?vista=ajustes&seccion=notificaciones).`,
        corto: `Se conectó el WhatsApp ${mascara(m.de)} para tus avisos. Si no fuiste tú, quítalo en Ajustes.`,
        enlace: "/panel?vista=ajustes&seccion=notificaciones",
        soloApp: true,
      });
      return;
    }
  }

  // De aquí en adelante, solo con números que ya conectaron sus avisos
  const { data: suyas } = await admin.from("avisos_whatsapp").select("owner_id, pausado, respondido_en, confirmado_en").eq("numero", m.de).not("confirmado_en", "is", null).limit(20);
  const cuentas = (suyas ?? []) as { owner_id: string; pausado: boolean; respondido_en: string | null; confirmado_en: string | null }[];
  if (!cuentas.length) return;

  if (c) {
    // Si Meta repite el mismo mensaje justo después de conectar, no se contesta otra vez
    const recien = cuentas.some((x) => x.confirmado_en && Date.now() - new Date(x.confirmado_en).getTime() < 10 * 60_000);
    if (!recien) await responder(m.de, "Ese código ya no sirve (vence a los 15 minutos). Pide uno nuevo en Atendel → Ajustes → Notificaciones.");
    return;
  }
  if (PARAR.test(texto)) {
    await admin.from("avisos_whatsapp").update({ pausado: true, motivo: "Pediste PARAR por WhatsApp.", respondido_en: ahora, actualizado_en: ahora }).eq("numero", m.de);
    await responder(m.de, "Listo: ya no te mando avisos por aquí. Si quieres volver a recibirlos, responde ACTIVAR.");
    return;
  }
  if (ACTIVAR.test(texto)) {
    await admin.from("avisos_whatsapp").update({ pausado: false, motivo: null, respondido_en: ahora, actualizado_en: ahora }).eq("numero", m.de).not("confirmado_en", "is", null);
    await responder(m.de, "Listo: vuelvo a mandarte los avisos de lo importante. Para dejar de recibirlos, responde PARAR.");
    return;
  }
  // Cualquier otra cosa: se contesta una vez cada 12 horas, para que sepa dónde hablar con Atendel
  const reciente = cuentas.some((x) => x.respondido_en && Date.now() - new Date(x.respondido_en).getTime() < 12 * 3_600_000);
  if (reciente) return;
  await admin.from("avisos_whatsapp").update({ respondido_en: ahora }).eq("numero", m.de);
  await responder(m.de, "Por aquí solo te mando avisos. Para hablar con Atendel o aprobar algo, entra a tu panel desde la app. Para dejar de recibir avisos, responde PARAR.");
}

/** Un aviso al dueño que Meta no pudo entregar: si el número ya no puede recibir, se pausa. */
export async function falloDelNumeroDeAtendel(admin: SupabaseClient, s: EstadoSalida): Promise<void> {
  if (s.estado !== "failed" || !s.para) return;
  // 131026: ese número no puede recibir (no usa WhatsApp o tiene una versión vieja); 131021: es el mismo número
  if (s.codigo !== 131026 && s.codigo !== 131021) return;
  const { data } = await admin
    .from("avisos_whatsapp")
    .update({ pausado: true, motivo: "WhatsApp no pudo entregar los avisos a este número.", actualizado_en: new Date().toISOString() })
    .eq("numero", s.para)
    .eq("pausado", false)
    .select("owner_id");
  for (const f of data ?? [])
    await notificar(admin, String(f.owner_id), {
      tipo: "whatsapp_avisos_problema",
      agente: "iris",
      chat: "No te pudieron llegar los avisos por WhatsApp a tu número, así que los pausé. Revisa tu número y vuelve a conectarlo en [Ajustes → Notificaciones](/panel?vista=ajustes&seccion=notificaciones).",
      corto: "No te pudieron llegar los avisos por WhatsApp; los pausé. Revisa tu número en Ajustes.",
      enlace: "/panel?vista=ajustes&seccion=notificaciones",
      clave: `wa_problema:${new Date().toISOString().slice(0, 10)}`,
      soloApp: true,
    });
}
