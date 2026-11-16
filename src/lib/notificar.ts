import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { IdAgente } from "./agentes";
import { limpiarAjustes, type Avisos, type ModoAviso } from "./ajustes";
import { avisarEnChat, chatDeAvisos } from "./avisos";
import { ENLACE_PANEL, mandarPush, type MensajePush, type NivelPush } from "./push";

/**
 * UN SOLO LUGAR PARA AVISAR. Cada aviso:
 * 1. se escribe en el chat «Avisos de Atendel» (el historial completo);
 * 2. se guarda en avisos_salida (para no repetir, juntar y respetar horarios);
 * 3. sale a la app (notificación) según lo que eligió el dueño en Ajustes →
 *    Notificaciones: todo, lo importante, solo lo urgente o nada; con horas
 *    de silencio y lo informativo junto (máximo una cada 3 horas).
 *
 * Lo que viene de fuera (lo que escribió un cliente, un correo, enlaces)
 * NUNCA va en la notificación: solo un texto corto fijo por tipo, con los
 * nombres limpios (nombreSeguro). El detalle completo queda en el chat.
 * Lo que espera su hora lo manda /api/trabajo?que=avisos (soltarAvisos).
 */

export type NivelAviso = NivelPush;
type DefAviso = { nivel: NivelAviso; titulo: string; grupo?: string; siempre?: boolean };

/** Los tipos de aviso (el número es el de la lista de 50 del plan). */
export const AVISOS = {
  // Clientes por WhatsApp (Lola)
  cliente_espera_ok: { nivel: "urgente", titulo: "Un cliente espera respuesta", grupo: "pendientes" }, // 1
  cliente_te_toca: { nivel: "urgente", titulo: "Un cliente te escribió", grupo: "pendientes" }, // 2
  lola_contesto: { nivel: "info", titulo: "Lola atendió por WhatsApp", grupo: "lola" }, // 5
  // Correo
  correo_importante: { nivel: "importante", titulo: "Correo que necesita algo de ti", grupo: "correo" }, // 11
  correo_respuesta_lista: { nivel: "urgente", titulo: "Respuesta lista para tu OK", grupo: "pendientes" }, // 12
  // Lo que Atendel hizo o quiere hacer
  accion_espera_ok: { nivel: "urgente", titulo: "Algo espera tu OK", grupo: "pendientes" }, // 20 y 21
  hizo_solo: { nivel: "info", titulo: "Lo hice por mi cuenta", grupo: "hecho" }, // 13 y 22
  // Lo que revisó por ti
  revision_dia: { nivel: "importante", titulo: "Revisé todo por ti", grupo: "revision" }, // 26
  // Apps conectadas
  whatsapp_reconectar: { nivel: "urgente", titulo: "Vuelve a conectar tu WhatsApp", grupo: "whatsapp" }, // 31
  whatsapp_sin_mensajes: { nivel: "urgente", titulo: "Tu WhatsApp ya no llega aquí", grupo: "whatsapp" }, // 32
  whatsapp_intento: { nivel: "importante", titulo: "Intentaron conectar tu WhatsApp" }, // 32
  // Tareas, Oficina y envíos
  tarea_termino: { nivel: "info", titulo: "Tarea terminada", grupo: "tareas" }, // 36
  mensaje_no_llego: { nivel: "importante", titulo: "Un mensaje no llegó" }, // 40
  // Tu cuenta y seguridad
  aparato_nuevo: { nivel: "urgente", titulo: "Avisos en un aparato nuevo", siempre: true }, // 42
  prueba: { nivel: "urgente", titulo: "Aviso de prueba", siempre: true },
} satisfies Record<string, DefAviso>;
export type TipoAviso = keyof typeof AVISOS;

/* ---------- Limpieza de lo que viene de fuera ---------- */

/** Un nombre de fuera (cliente, remitente): solo letras y espacios, sin enlaces ni números. */
export function nombreSeguro(n: unknown, siNo = "Un cliente"): string {
  const t = typeof n === "string" ? n.replace(/<[^>]*>/g, " ").replace(/\S+@\S+/g, " ") : "";
  const limpio = t
    .normalize("NFC")
    .replace(/[^\p{L}\p{M}' -]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 30)
    .trim();
  return limpio || siNo;
}

/** El texto corto de una notificación: sin enlaces, correos, dominios, formato ni saltos de línea. */
export function limpiarCorto(t: unknown, max = 300): string {
  if (typeof t !== "string") return "";
  return t
    .replace(/https?:\/\/\S+|www\.\S+/gi, "…")
    .replace(/\S+@\S+\.\S+/g, "…")
    .replace(/\b(?:[a-z0-9-]+\.)+[a-z]{2,24}\b/gi, "…")
    .replace(/[[\]()*_`#<>|~]/g, "")
    .replace(/[\u0000-\u001f\u007f\u200b-\u200f\u2028-\u202e\u2066-\u2069]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max)
    .trim();
}

/* ---------- Cuándo sale ---------- */

const RANGO: Record<NivelAviso, number> = { info: 0, importante: 1, urgente: 2 };
const MINIMO: Record<ModoAviso, number> = { todo: 0, importante: 1, urgente: 2, nada: 3 };
/** Si este nivel sale con lo que eligió el dueño. */
export const pasaElNivel = (modo: ModoAviso, nivel: NivelAviso) => RANGO[nivel] >= MINIMO[modo];

const aMinutos = (h: string) => {
  const [a, b] = h.split(":").map(Number);
  return ((a || 0) % 24) * 60 + ((b || 0) % 60);
};

/** Los minutos desde la medianoche, en la zona horaria del negocio. */
export function minutosDelDia(d: Date, zona: string): number {
  let partes: Intl.DateTimeFormatPart[];
  try {
    partes = new Intl.DateTimeFormat("en-US", { timeZone: zona, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(d);
  } catch {
    partes = new Intl.DateTimeFormat("en-US", { timeZone: "America/Mexico_City", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(d);
  }
  const h = Number(partes.find((p) => p.type === "hour")?.value ?? 0) % 24;
  const m = Number(partes.find((p) => p.type === "minute")?.value ?? 0);
  return h * 60 + m;
}

/** Si en ese momento son horas de silencio (pueden cruzar la medianoche: de 22:00 a 8:00). */
export function enSilencio(av: Pick<Avisos, "silencio" | "desde" | "hasta">, t: Date, zona: string): boolean {
  if (!av.silencio) return false;
  const desde = aMinutos(av.desde);
  const hasta = aMinutos(av.hasta);
  if (desde === hasta) return false;
  const m = minutosDelDia(t, zona);
  return desde < hasta ? m >= desde && m < hasta : m >= desde || m < hasta;
}

/** Cuándo terminan las horas de silencio (la próxima vez que den las «hasta» en su zona). */
export function finDelSilencio(av: Pick<Avisos, "hasta">, t: Date, zona: string): Date {
  let faltan = (aMinutos(av.hasta) - minutosDelDia(t, zona) + 1440) % 1440;
  if (faltan === 0) faltan = 1440;
  const inicioMinuto = t.getTime() - (t.getTime() % 60_000);
  return new Date(inicioMinuto + faltan * 60_000);
}

const TRES_HORAS = 3 * 3_600_000;

/**
 * Cuándo sale a la app: "ahora", más tarde (una fecha) o "nunca".
 * - Por debajo del nivel elegido: nunca (queda en el chat).
 * - Lo informativo, junto: si ya salió uno hace menos de 3 horas, espera.
 * - En horas de silencio espera a que terminen, salvo lo de seguridad y, si así
 *   lo pidió, lo urgente.
 */
export function decidirApp(o: { nivel: NivelAviso; siempre?: boolean; av: Avisos; ahora: Date; zona: string; ultimoInfo?: Date | null }): "ahora" | "nunca" | Date {
  if (!pasaElNivel(o.av.app, o.nivel)) return "nunca";
  let cuando: "ahora" | Date = "ahora";
  if (o.nivel === "info" && o.ultimoInfo && o.ahora.getTime() - o.ultimoInfo.getTime() < TRES_HORAS) cuando = new Date(o.ultimoInfo.getTime() + TRES_HORAS);
  const t = cuando === "ahora" ? o.ahora : cuando;
  const puedeDespertar = Boolean(o.siempre) || (o.nivel === "urgente" && o.av.urgentePasa);
  if (!puedeDespertar && enSilencio(o.av, t, o.zona)) cuando = finDelSilencio(o.av, t, o.zona);
  return cuando;
}

/* ---------- Lo que dice la notificación ---------- */

/** Cuántas cosas esperan tu OK (para que se lea «3 cosas esperan tu OK» en vez de tres avisos). */
async function cuantosPendientes(admin: SupabaseClient, dueno: string): Promise<number> {
  const [a, w, e] = await Promise.all([
    admin.from("acciones").select("id", { count: "exact", head: true }).eq("owner_id", dueno).eq("estado", "esperando"),
    admin.from("whatsapp_mensajes").select("id", { count: "exact", head: true }).eq("owner_id", dueno).eq("direccion", "entrante").in("estado", ["esperando_ok", "sin_respuesta"]),
    admin.from("envios").select("id", { count: "exact", head: true }).eq("owner_id", dueno).eq("estado", "por_aprobar"),
  ]);
  return (a.count ?? 0) + (w.count ?? 0) + (e.count ?? 0);
}

type FilaAviso = { id: string; tipo: string; nivel: NivelAviso; titulo: string; texto: string; enlace: string; grupo: string | null; siempre: boolean };

const discreto = (n: number, enlace: string, nivel: NivelAviso, etiqueta: string | null): MensajePush => ({
  titulo: "Atendel",
  texto: n === 1 ? "Tienes un aviso nuevo." : `Tienes ${n} avisos nuevos.`,
  enlace,
  etiqueta,
  nivel,
});

/** La notificación de uno o de varios avisos juntos. */
async function mensajeDe(admin: SupabaseClient, dueno: string, av: Avisos, filas: FilaAviso[]): Promise<MensajePush> {
  const ultimo = filas[filas.length - 1];
  const nivel: NivelAviso = filas.some((f) => f.nivel === "urgente") ? "urgente" : filas.some((f) => f.nivel === "importante") ? "importante" : "info";
  const deOk = filas.every((f) => f.grupo === "pendientes");
  const n = deOk ? await cuantosPendientes(admin, dueno) : 0;
  if (filas.length === 1) {
    const etiqueta = ultimo.grupo;
    if (av.discretos) return discreto(1, ultimo.enlace, nivel, etiqueta);
    return { titulo: deOk && n > 1 ? `${n} cosas esperan tu OK` : ultimo.titulo, texto: ultimo.texto, enlace: ultimo.enlace, etiqueta, nivel };
  }
  const etiqueta = deOk ? "pendientes" : "resumen";
  const alChat = filas.find((f) => f.enlace.startsWith("/panel?c="))?.enlace;
  const enlace = deOk ? "/panel?vista=pendientes" : (alChat ?? "/panel");
  if (av.discretos) return discreto(filas.length, enlace, nivel, etiqueta);
  return {
    titulo: deOk ? `${Math.max(n, filas.length)} cosas esperan tu OK` : `Tienes ${filas.length} avisos nuevos`,
    texto: filas
      .slice(-3)
      .reverse()
      .map((f) => f.texto)
      .join(" · ")
      .slice(0, 300),
    enlace,
    etiqueta,
    nivel,
  };
}

/* ---------- Avisar ---------- */

export type ResultadoAviso = "enviado" | "pendiente" | "omitido" | "fallo" | "repetido";

export async function notificar(
  admin: SupabaseClient,
  dueno: string,
  a: {
    tipo: TipoAviso;
    agente: IdAgente;
    /** El aviso completo para el chat «Avisos de Atendel» (lo de fuera, con citar()). Sin esto no se escribe en el chat. */
    chat?: string;
    /** Lo que dice la notificación: texto fijo, sin nada de fuera (los nombres, con nombreSeguro). */
    corto: string;
    /** A dónde lleva al tocarla (solo /panel…). Sin esto, al chat de Avisos. */
    enlace?: string;
    /** Para no avisar dos veces lo mismo. */
    clave?: string;
    /** Con la clave repetida, el chat sí se escribe (solo no sale otra notificación). */
    chatSiempre?: boolean;
    /** Sale ya, sin importar el nivel ni las horas de silencio (el aviso de prueba). */
    forzar?: boolean;
  },
): Promise<ResultadoAviso> {
  const def: DefAviso = AVISOS[a.tipo];
  let idChat: string | null = null;
  let chatEscrito = false;
  const escribirChat = async () => {
    if (!a.chat || chatEscrito) return;
    chatEscrito = true;
    await avisarEnChat(admin, dueno, { agente: a.agente, texto: a.chat }, idChat);
  };
  try {
    const ahora = new Date();
    const [{ data: filaAjustes }, { count: aparatos }] = await Promise.all([
      admin.from("ajustes_cuenta").select("datos").eq("owner_id", dueno).maybeSingle(),
      admin.from("suscripciones_push").select("id", { count: "exact", head: true }).eq("owner_id", dueno),
    ]);
    const aj = limpiarAjustes(filaAjustes?.datos);
    let ultimoInfo: Date | null = null;
    if (aparatos && def.nivel === "info" && aj.avisos.app === "todo" && !a.forzar) {
      const { data: u } = await admin
        .from("avisos_salida")
        .select("enviado_en")
        .eq("owner_id", dueno)
        .eq("nivel", "info")
        .eq("app", "enviado")
        .not("enviado_en", "is", null)
        .order("enviado_en", { ascending: false })
        .limit(1)
        .maybeSingle();
      ultimoInfo = u?.enviado_en ? new Date(String(u.enviado_en)) : null;
    }
    const cuando = !aparatos ? "nunca" : a.forzar ? "ahora" : decidirApp({ nivel: def.nivel, siempre: def.siempre, av: aj.avisos, ahora, zona: aj.zonaHoraria, ultimoInfo });

    const enlaceValido = a.enlace && ENLACE_PANEL.test(a.enlace) ? a.enlace : null;
    if (a.chat || !enlaceValido) idChat = await chatDeAvisos(admin, dueno, a.agente).catch(() => null);
    const enlace = enlaceValido ?? (idChat ? `/panel?c=${idChat}` : "/panel");
    const texto = limpiarCorto(a.corto, 300) || def.titulo;
    const { data: fila, error } = await admin
      .from("avisos_salida")
      .insert({
        owner_id: dueno,
        tipo: a.tipo,
        nivel: def.nivel,
        titulo: def.titulo,
        texto,
        enlace,
        clave: a.clave ? a.clave.slice(0, 200) : null,
        grupo: def.grupo ?? null,
        siempre: Boolean(def.siempre || a.forzar),
        app: cuando === "nunca" ? "omitido" : "pendiente",
        enviar_desde: (cuando instanceof Date ? cuando : ahora).toISOString(),
      })
      .select("id")
      .single();
    if (error || !fila) {
      // Ya se avisó (la misma clave): solo el chat, si así se pidió
      const repetido = error?.code === "23505";
      if (!repetido) console.error("Aviso: no se guardó", error?.message);
      if (!repetido || a.chatSiempre) await escribirChat();
      return repetido ? "repetido" : "fallo";
    }
    await escribirChat();
    if (cuando === "nunca") return "omitido";
    if (cuando !== "ahora") return "pendiente";

    // Se aparta antes de mandar: si /api/trabajo?que=avisos pasa al mismo tiempo, no sale dos veces
    const { data: apartada } = await admin
      .from("avisos_salida")
      .update({ app: "enviado", enviado_en: ahora.toISOString() })
      .eq("id", fila.id)
      .eq("app", "pendiente")
      .select("id");
    if (!apartada?.length) return "enviado";
    const m = await mensajeDe(admin, dueno, aj.avisos, [
      { id: String(fila.id), tipo: a.tipo, nivel: def.nivel, titulo: def.titulo, texto, enlace, grupo: def.grupo ?? null, siempre: Boolean(def.siempre) },
    ]);
    const r = await mandarPush(admin, dueno, m);
    if (!r.enviados) await admin.from("avisos_salida").update({ app: r.aparatos ? "fallo" : "omitido" }).eq("id", fila.id);
    return r.enviados ? "enviado" : r.aparatos ? "fallo" : "omitido";
  } catch (e) {
    console.error("Aviso falló:", e instanceof Error ? e.message : e);
    // Mejor un aviso en el chat que ninguno
    await escribirChat().catch(() => undefined);
    return "fallo";
  }
}

/* ---------- Lo que esperaba su hora (/api/trabajo?que=avisos) ---------- */

/** Manda, junto, lo que ya toca de cada cuenta. */
async function soltarDe(admin: SupabaseClient, dueno: string): Promise<boolean> {
  const ahora = new Date();
  const { data: filaAjustes } = await admin.from("ajustes_cuenta").select("datos").eq("owner_id", dueno).maybeSingle();
  const aj = limpiarAjustes(filaAjustes?.datos);
  const { data } = await admin
    .from("avisos_salida")
    .select("id, tipo, nivel, titulo, texto, enlace, grupo, siempre")
    .eq("owner_id", dueno)
    .eq("app", "pendiente")
    .lte("enviar_desde", ahora.toISOString())
    .order("creado_en", { ascending: true })
    .limit(50);
  const filas = ((data ?? []) as FilaAviso[]).map((f) => ({ ...f, id: String(f.id) }));
  if (!filas.length) return false;

  // Lo que ya no toca (cambió a un nivel más alto o a «Nada») no sale
  const noTocan = filas.filter((f) => !f.siempre && !pasaElNivel(aj.avisos.app, f.nivel));
  if (noTocan.length)
    await admin
      .from("avisos_salida")
      .update({ app: "omitido" })
      .eq("owner_id", dueno)
      .in(
        "id",
        noTocan.map((f) => f.id),
      );
  const tocan = filas.filter((f) => !noTocan.includes(f));
  // Si ahora son horas de silencio (pudo cambiar el horario), lo que no puede despertar espera
  const callado = enSilencio(aj.avisos, ahora, aj.zonaHoraria);
  const esperan = callado ? tocan.filter((f) => !f.siempre && !(f.nivel === "urgente" && aj.avisos.urgentePasa)) : [];
  if (esperan.length)
    await admin
      .from("avisos_salida")
      .update({ enviar_desde: finDelSilencio(aj.avisos, ahora, aj.zonaHoraria).toISOString() })
      .eq("owner_id", dueno)
      .in(
        "id",
        esperan.map((f) => f.id),
      );
  const salen = tocan.filter((f) => !esperan.includes(f));
  if (!salen.length) return false;

  // Se apartan (si otra vuelta llega al mismo tiempo, no salen dos veces)
  const { data: apartadas } = await admin
    .from("avisos_salida")
    .update({ app: "junto", enviado_en: ahora.toISOString() })
    .eq("owner_id", dueno)
    .eq("app", "pendiente")
    .in(
      "id",
      salen.map((f) => f.id),
    )
    .select("id");
  const ids = new Set((apartadas ?? []).map((f) => String(f.id)));
  const van = salen.filter((f) => ids.has(f.id));
  if (!van.length) return false;
  const r = await mandarPush(admin, dueno, await mensajeDe(admin, dueno, aj.avisos, van));
  const principal = van[van.length - 1].id;
  if (r.enviados) await admin.from("avisos_salida").update({ app: "enviado" }).eq("id", principal);
  else
    await admin
      .from("avisos_salida")
      .update({ app: r.aparatos ? "fallo" : "omitido" })
      .eq("owner_id", dueno)
      .in(
        "id",
        van.map((f) => f.id),
      );
  // Lo de hace más de 60 días ya no sirve
  await admin
    .from("avisos_salida")
    .delete()
    .eq("owner_id", dueno)
    .lt("creado_en", new Date(Date.now() - 60 * 86_400_000).toISOString());
  return r.enviados > 0;
}

export async function soltarAvisos(admin: SupabaseClient, tiempo = 40_000): Promise<{ cuentas: number; enviadas: number }> {
  const empezo = Date.now();
  const { data } = await admin.from("avisos_salida").select("owner_id").eq("app", "pendiente").lte("enviar_desde", new Date().toISOString()).order("enviar_desde", { ascending: true }).limit(500);
  const duenos = Array.from(new Set((data ?? []).map((f) => String(f.owner_id))));
  let cuentas = 0;
  let enviadas = 0;
  for (const d of duenos) {
    if (Date.now() - empezo > tiempo) break;
    try {
      cuentas++;
      if (await soltarDe(admin, d)) enviadas++;
    } catch (e) {
      console.error("Soltar avisos falló:", e instanceof Error ? e.message : e);
    }
  }
  return { cuentas, enviadas };
}
