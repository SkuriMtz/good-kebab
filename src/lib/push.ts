import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { generateVAPIDKeys, sendNotification, WebPushError, type RequestOptions } from "web-push";

/**
 * NOTIFICACIONES DE LA APP (Web Push), del lado del servidor.
 *
 * - Llaves VAPID (firman cada notificación): el servidor las crea la primera
 *   vez y quedan en la bóveda de Supabase (migración 0025: llaves_push y
 *   guardar_llaves_push, solo service_role). Nadie las ve ni las pega.
 * - Cada aparato guarda su suscripción en suscripciones_push. Solo se aceptan
 *   direcciones de los servicios de push de verdad (Google, Apple, Mozilla y
 *   Microsoft): así nadie puede hacer que el servidor llame a otro lado.
 * - Lo que viaja: título, texto corto, enlace del panel y etiqueta (para que
 *   las del mismo tipo se reemplacen en vez de apilarse). Va cifrado de punta
 *   a punta: el servicio de push no lo puede leer.
 */

export type Llaves = { publica: string; privada: string };
let llavesEnMemoria: Llaves | null = null;

const esLlaves = (v: unknown): v is Llaves =>
  Boolean(v && typeof v === "object" && /^[A-Za-z0-9_-]{87}$/.test(String((v as Llaves).publica)) && /^[A-Za-z0-9_-]{43}$/.test(String((v as Llaves).privada)));

/** Las llaves VAPID (las crea y las guarda la primera vez). Null si la base de datos no responde. */
export async function llavesPush(admin: SupabaseClient): Promise<Llaves | null> {
  if (llavesEnMemoria) return llavesEnMemoria;
  const { data, error } = await admin.rpc("llaves_push");
  if (error) {
    console.error("Llaves de push:", error.message);
    return null;
  }
  let llaves: Llaves | null = esLlaves(data) ? data : null;
  if (!llaves) {
    const nuevas = generateVAPIDKeys();
    const r = await admin.rpc("guardar_llaves_push", { llaves: { publica: nuevas.publicKey, privada: nuevas.privateKey } });
    if (r.error) {
      console.error("No se guardaron las llaves de push:", r.error.message);
      return null;
    }
    llaves = esLlaves(r.data) ? r.data : null;
  }
  if (llaves) llavesEnMemoria = llaves;
  return llaves;
}

/** Los servicios de push de los navegadores (Chrome/Android/Edge nuevo, Firefox, Safari/iPhone y Edge en Windows). */
const SERVICIOS_PUSH = [/^fcm\.googleapis\.com$/, /^android\.googleapis\.com$/, /^updates\.push\.services\.mozilla\.com$/, /^web\.push\.apple\.com$/, /^[a-z0-9-]{1,63}\.notify\.windows\.com$/];

export function endpointValido(endpoint: unknown): endpoint is string {
  if (typeof endpoint !== "string" || endpoint.length < 20 || endpoint.length > 1000) return false;
  try {
    const u = new URL(endpoint);
    return u.protocol === "https:" && !u.port && !u.username && !u.password && SERVICIOS_PUSH.some((r) => r.test(u.hostname));
  } catch {
    return false;
  }
}

const deBase64Url = (t: string) => Buffer.from(t.replace(/=+$/, "").replace(/-/g, "+").replace(/_/g, "/"), "base64");

/** Las llaves del aparato: p256dh es un punto P-256 sin comprimir (65 bytes, empieza con 4) y auth son 16 bytes. */
export function llavesAparatoValidas(p256dh: unknown, auth: unknown): boolean {
  if (typeof p256dh !== "string" || typeof auth !== "string") return false;
  if (!/^[A-Za-z0-9_=-]{80,100}$/.test(p256dh) || !/^[A-Za-z0-9_=-]{16,40}$/.test(auth)) return false;
  const p = deBase64Url(p256dh);
  return p.length === 65 && p[0] === 4 && deBase64Url(auth).length === 16;
}

/** Un nombre para el aparato, sacado del navegador (nunca de lo que mande la persona). */
export function nombreAparato(ua: string | null | undefined): string {
  const t = ua ?? "";
  const sistema = /iPhone/.test(t)
    ? "iPhone"
    : /iPad/.test(t)
      ? "iPad"
      : /Android/.test(t)
        ? "Android"
        : /Macintosh|Mac OS X/.test(t)
          ? "Mac"
          : /Windows/.test(t)
            ? "Windows"
            : /CrOS/.test(t)
              ? "Chromebook"
              : /Linux/.test(t)
                ? "Linux"
                : "Aparato";
  const navegador = /Edg\//.test(t)
    ? "Edge"
    : /OPR\/|Opera/.test(t)
      ? "Opera"
      : /SamsungBrowser/.test(t)
        ? "Samsung Internet"
        : /Firefox\/|FxiOS/.test(t)
          ? "Firefox"
          : /Chrome\/|CriOS/.test(t)
            ? "Chrome"
            : /Safari\//.test(t)
              ? "Safari"
              : "";
  return navegador ? `${sistema} · ${navegador}` : sistema;
}

export type NivelPush = "urgente" | "importante" | "info";
export type MensajePush = { titulo: string; texto: string; enlace: string; etiqueta?: string | null; nivel: NivelPush };

/** Quién manda las notificaciones (lo piden los servicios de push; Apple exige https o mailto). */
const SUJETO = `https://${(process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "").replace(/[^a-z0-9.-]/gi, "") || "good-kebab.vercel.app"}`;

/** Los enlaces que puede abrir una notificación: solo del panel. */
export const ENLACE_PANEL = /^\/panel(\?[A-Za-z0-9=&_.:%-]{0,290})?$/;

/** Lo que viaja al aparato. Corto: los servicios de push aceptan unos 4 KB. */
export function cuerpoPush(m: MensajePush): string {
  const etiqueta = m.etiqueta && /^[a-z0-9_]{2,30}$/.test(m.etiqueta) ? m.etiqueta : undefined;
  return JSON.stringify({
    titulo: m.titulo.slice(0, 120),
    texto: m.texto.slice(0, 400),
    enlace: ENLACE_PANEL.test(m.enlace) ? m.enlace : "/panel",
    ...(etiqueta ? { etiqueta } : {}),
  });
}

export function opcionesPush(llaves: Llaves, m: Pick<MensajePush, "nivel" | "etiqueta">): RequestOptions {
  return {
    vapidDetails: { subject: SUJETO, publicKey: llaves.publica, privateKey: llaves.privada },
    // Si el aparato está apagado, cuánto lo guarda el servicio de push
    TTL: m.nivel === "info" ? 12 * 3600 : 24 * 3600,
    urgency: m.nivel === "urgente" ? "high" : m.nivel === "importante" ? "normal" : "low",
    // Si hay otra del mismo tipo sin entregar, esta la reemplaza
    ...(m.etiqueta && /^[a-z0-9_]{2,30}$/.test(m.etiqueta) ? { topic: m.etiqueta } : {}),
    timeout: 8000,
  };
}

/**
 * Manda la notificación a todos los aparatos del dueño (menos `excepto`: el
 * aparato que hizo el cambio). Los aparatos que ya no existen se borran solos.
 */
export async function mandarPush(admin: SupabaseClient, dueno: string, m: MensajePush, excepto?: string | null): Promise<{ aparatos: number; enviados: number }> {
  const { data: todas } = await admin.from("suscripciones_push").select("id, endpoint, p256dh, auth, aparato_id").eq("owner_id", dueno).limit(10);
  const subs = (todas ?? []).filter((s) => !excepto || s.aparato_id !== excepto);
  if (!subs.length) return { aparatos: 0, enviados: 0 };
  const llaves = await llavesPush(admin);
  if (!llaves) return { aparatos: subs.length, enviados: 0 };
  const cuerpo = cuerpoPush(m);
  const opciones = opcionesPush(llaves, m);
  const resultados = await Promise.all(
    subs.map(async (s) => {
      const id = String(s.id);
      if (!endpointValido(s.endpoint)) return { id, ok: false, borrar: true };
      try {
        await sendNotification({ endpoint: s.endpoint, keys: { p256dh: String(s.p256dh), auth: String(s.auth) } }, cuerpo, opciones);
        return { id, ok: true, borrar: false };
      } catch (e) {
        const estado = e instanceof WebPushError ? e.statusCode : 0;
        // 404 y 410: el aparato quitó el permiso o la suscripción venció
        if (estado !== 404 && estado !== 410) console.error("Push falló:", estado || (e instanceof Error ? e.message : e));
        return { id, ok: false, borrar: estado === 404 || estado === 410 };
      }
    }),
  );
  const borrar = resultados.filter((r) => r.borrar).map((r) => r.id);
  const bien = resultados.filter((r) => r.ok).map((r) => r.id);
  if (borrar.length) await admin.from("suscripciones_push").delete().eq("owner_id", dueno).in("id", borrar);
  if (bien.length) await admin.from("suscripciones_push").update({ usado_en: new Date().toISOString() }).eq("owner_id", dueno).in("id", bien);
  return { aparatos: subs.length - borrar.length, enviados: bien.length };
}
