import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { IdAgente } from "./agentes";
import { limpiarAjustes, type Avisos, type ModoAviso } from "./ajustes";
import { avisarEnChat, chatDeAvisos } from "./avisos";
import { ENLACE_PANEL, mandarPush, type MensajePush, type NivelPush } from "./push";
import { destinoWhatsapp, mandarAvisoWhatsapp } from "./whatsapp/aviso-plantilla";

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
  app_desconectada: { nivel: "urgente", titulo: "Se desconectó una app", grupo: "apps" }, // 33
  app_permisos: { nivel: "importante", titulo: "Una app necesita permisos nuevos", grupo: "apps" }, // 35
  app_conectada: { nivel: "info", titulo: "Cambio en tus apps", grupo: "apps" }, // 45
  // Recordatorios (solo salen si sigue pendiente)
  cliente_sin_respuesta: { nivel: "urgente", titulo: "Un cliente sigue esperando", grupo: "pendientes" }, // 3
  accion_sigue_esperando: { nivel: "importante", titulo: "Algo sigue esperando tu OK", grupo: "pendientes" }, // 24
  oficina_espera: { nivel: "importante", titulo: "La Oficina espera tu revisión", grupo: "oficina" }, // 38
  accion_fallo: { nivel: "importante", titulo: "Algo que aprobaste no se pudo hacer" }, // 23
  // Tareas, Oficina y envíos
  tarea_termino: { nivel: "info", titulo: "Tarea terminada", grupo: "tareas" }, // 36
  tarea_fallo: { nivel: "importante", titulo: "Una tarea no se pudo hacer", grupo: "tareas" }, // 37
  mensaje_no_llego: { nivel: "importante", titulo: "Un mensaje no llegó" }, // 40
  // Tu cuenta y seguridad
  entrada_nueva: { nivel: "urgente", titulo: "Entraron a tu cuenta desde un aparato nuevo", siempre: true }, // 41
  aparato_nuevo: { nivel: "urgente", titulo: "Avisos en un aparato nuevo", siempre: true }, // 42
  whatsapp_avisos_conectado: { nivel: "urgente", titulo: "Se conectó un WhatsApp para avisos", siempre: true }, // 42
  whatsapp_avisos_problema: { nivel: "importante", titulo: "No te llegan los avisos por WhatsApp" },
  cuenta_cambio: { nivel: "importante", titulo: "Cambió algo de tu cuenta" }, // 43
  // Uso, plan e informes
  uso_80: { nivel: "importante", titulo: "Vas en el 80 % de tu semana", grupo: "uso" }, // 46
  limite_trabajo: { nivel: "urgente", titulo: "Se pausó el trabajo por su cuenta", grupo: "uso" }, // 47
  plan_cambio: { nivel: "importante", titulo: "Cambió tu plan" }, // 48 (lo pone la base: migración 0026)
  resumen_dia: { nivel: "info", titulo: "Tu resumen del día", grupo: "informe" }, // 49
  informe_semana: { nivel: "importante", titulo: "Tu informe de la semana", grupo: "informe" }, // 50
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

type FilaAviso = {
  id: string;
  tipo: string;
  nivel: NivelAviso;
  titulo: string;
  texto: string;
  enlace: string;
  grupo: string | null;
  siempre: boolean;
  revisar?: string | null;
  chat?: string | null;
  agente?: string | null;
};

/** Lo que revisa un recordatorio antes de salir. */
const REVISAR = /^(whatsapp|accion|oficina):[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

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

/* ---------- Por WhatsApp ---------- */

/** Lo más que se manda por WhatsApp en 24 horas (cada mensaje de plantilla lo cobra Meta). */
const TOPE_WHATSAPP = 20;
const DISCRETO_WA = "Tienes un aviso nuevo de Atendel.";

/** Cuándo salió el último aviso informativo por ese lugar (para juntarlos: máximo uno cada 3 horas). */
async function ultimoInfoDe(admin: SupabaseClient, dueno: string, canal: "app" | "whatsapp"): Promise<Date | null> {
  const columna = canal === "app" ? "enviado_en" : "wa_enviado_en";
  const { data } = await admin
    .from("avisos_salida")
    .select(columna)
    .eq("owner_id", dueno)
    .eq("nivel", "info")
    .eq(canal, "enviado")
    .not(columna, "is", null)
    .order(columna, { ascending: false })
    .limit(1)
    .maybeSingle();
  const v = (data as Record<string, unknown> | null)?.[columna];
  return v ? new Date(String(v)) : null;
}

/** Cuántos WhatsApp de avisos salieron en las últimas 24 horas. */
async function enviadosWaHoy(admin: SupabaseClient, dueno: string): Promise<number> {
  const { count } = await admin
    .from("avisos_salida")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", dueno)
    .eq("whatsapp", "enviado")
    .gte("wa_enviado_en", new Date(Date.now() - 86_400_000).toISOString());
  return count ?? 0;
}

/**
 * Manda por WhatsApp (ya apartado). Si no sale, esos avisos quedan en
 * «fallo»; si el número ya no puede recibir, se pausa y te avisa en el chat
 * y en la app.
 */
async function mandarPorWhatsapp(admin: SupabaseClient, dueno: string, numero: string, texto: string, enlace: string, ids: string[]): Promise<boolean> {
  const r = await mandarAvisoWhatsapp({ a: numero, texto, enlace });
  if (r.ok) return true;
  await admin.from("avisos_salida").update({ whatsapp: "fallo" }).eq("owner_id", dueno).in("id", ids);
  if (r.permanente) {
    await admin.from("avisos_whatsapp").update({ pausado: true, motivo: "WhatsApp no pudo entregar los avisos a este número.", actualizado_en: new Date().toISOString() }).eq("owner_id", dueno);
    await notificar(admin, dueno, {
      tipo: "whatsapp_avisos_problema",
      agente: "iris",
      chat: "No te pudieron llegar los avisos por WhatsApp a tu número, así que los pausé. Revisa tu número y vuelve a conectarlo en [Ajustes → Notificaciones](/panel?vista=ajustes&seccion=notificaciones).",
      corto: "No te pudieron llegar los avisos por WhatsApp; los pausé. Revisa tu número en Ajustes.",
      enlace: "/panel?vista=ajustes&seccion=notificaciones",
      clave: `wa_problema:${new Date().toISOString().slice(0, 10)}`,
      soloApp: true,
    });
  }
  return false;
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
    /** No sale antes de esta hora (los recordatorios). */
    despues?: Date;
    /** Justo antes de salir se revisa que siga pendiente: whatsapp:<id>, accion:<id> u oficina:<id>. */
    revisar?: string;
    /** El aparato que hizo el cambio (el hash de su cookie): a ese no se le avisa. */
    excepto?: string | null;
    /** Solo a la app, no a WhatsApp (la prueba de los aparatos y los avisos sobre el propio WhatsApp). */
    soloApp?: boolean;
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
    const [{ data: filaAjustes }, { count: aparatos }, wa] = await Promise.all([
      admin.from("ajustes_cuenta").select("datos").eq("owner_id", dueno).maybeSingle(),
      admin.from("suscripciones_push").select("id", { count: "exact", head: true }).eq("owner_id", dueno),
      a.soloApp ? Promise.resolve(null) : destinoWhatsapp(admin, dueno),
    ]);
    const aj = limpiarAjustes(filaAjustes?.datos);
    const ultimoInfo = aparatos && def.nivel === "info" && aj.avisos.app === "todo" && !a.forzar ? await ultimoInfoDe(admin, dueno, "app") : null;
    // Un recordatorio se decide como si fuera la hora en que le toca salir
    const base = a.despues && a.despues.getTime() > ahora.getTime() ? a.despues : ahora;
    let cuando = !aparatos ? "nunca" : a.forzar ? "ahora" : decidirApp({ nivel: def.nivel, siempre: def.siempre, av: aj.avisos, ahora: base, zona: aj.zonaHoraria, ultimoInfo });
    if (cuando === "ahora" && base !== ahora) cuando = base;
    // WhatsApp: su propio nivel (por omisión, lo importante), las mismas horas de silencio y un tope por día
    let cuandoWa: "ahora" | "nunca" | Date = "nunca";
    if (wa) {
      const avWa = { ...aj.avisos, app: aj.avisos.whatsapp };
      const ultimoWa = def.nivel === "info" && avWa.app === "todo" && !a.forzar ? await ultimoInfoDe(admin, dueno, "whatsapp") : null;
      cuandoWa = a.forzar ? "ahora" : decidirApp({ nivel: def.nivel, siempre: def.siempre, av: avWa, ahora: base, zona: aj.zonaHoraria, ultimoInfo: ultimoWa });
      if (cuandoWa === "ahora" && base !== ahora) cuandoWa = base;
      if (cuandoWa === "ahora" && !a.forzar && (await enviadosWaHoy(admin, dueno)) >= TOPE_WHATSAPP) cuandoWa = finDelSilencio(aj.avisos, ahora, aj.zonaHoraria);
    }
    const revisar = a.revisar && REVISAR.test(a.revisar) ? a.revisar : null;

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
        whatsapp: cuandoWa === "nunca" ? "omitido" : "pendiente",
        wa_desde: (cuandoWa instanceof Date ? cuandoWa : ahora).toISOString(),
        revisar,
        agente: a.agente,
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
    const id = String(fila.id);

    // La notificación de la app
    let enApp: ResultadoAviso = cuando === "nunca" ? "omitido" : "pendiente";
    if (cuando === "ahora") {
      // Se aparta antes de mandar: si /api/trabajo?que=avisos pasa al mismo tiempo, no sale dos veces
      const { data: apartada } = await admin.from("avisos_salida").update({ app: "enviado", enviado_en: ahora.toISOString() }).eq("id", id).eq("app", "pendiente").select("id");
      enApp = "enviado";
      if (apartada?.length) {
        const m = await mensajeDe(admin, dueno, aj.avisos, [{ id, tipo: a.tipo, nivel: def.nivel, titulo: def.titulo, texto, enlace, grupo: def.grupo ?? null, siempre: Boolean(def.siempre) }]);
        const r = await mandarPush(admin, dueno, m, a.excepto);
        if (!r.enviados) await admin.from("avisos_salida").update({ app: r.aparatos ? "fallo" : "omitido" }).eq("id", id);
        enApp = r.enviados ? "enviado" : r.aparatos ? "fallo" : "omitido";
      }
    }
    // El WhatsApp
    let enWa: ResultadoAviso = cuandoWa === "nunca" ? "omitido" : "pendiente";
    if (cuandoWa === "ahora" && wa) {
      const { data: apartado } = await admin.from("avisos_salida").update({ whatsapp: "enviado", wa_enviado_en: ahora.toISOString() }).eq("id", id).eq("whatsapp", "pendiente").select("id");
      enWa = "enviado";
      if (apartado?.length) enWa = (await mandarPorWhatsapp(admin, dueno, wa, aj.avisos.discretos ? DISCRETO_WA : texto, enlace, [id])) ? "enviado" : "fallo";
    }
    if (enApp === "enviado" || enWa === "enviado") return "enviado";
    if (enApp === "pendiente" || enWa === "pendiente") return "pendiente";
    return enApp === "fallo" || enWa === "fallo" ? "fallo" : "omitido";
  } catch (e) {
    console.error("Aviso falló:", e instanceof Error ? e.message : e);
    // Mejor un aviso en el chat que ninguno
    await escribirChat().catch(() => undefined);
    return "fallo";
  }
}

/* ---------- Lo que esperaba su hora (/api/trabajo?que=avisos) ---------- */

/** Si lo que recuerda un recordatorio sigue pendiente (si ya lo resolviste, no sale). */
async function sigueVigente(admin: SupabaseClient, dueno: string, revisar: string): Promise<boolean> {
  const [que, id] = revisar.split(":");
  if (que === "whatsapp") {
    const { data } = await admin.from("whatsapp_mensajes").select("estado").eq("id", id).eq("owner_id", dueno).maybeSingle();
    return Boolean(data && ["esperando_ok", "sin_respuesta", "error", "recibido", "pensando"].includes(String(data.estado)));
  }
  if (que === "accion") {
    const { data } = await admin.from("acciones").select("estado").eq("id", id).eq("owner_id", dueno).maybeSingle();
    return data?.estado === "esperando";
  }
  if (que === "oficina") {
    const { data } = await admin.from("trabajos").select("revision").eq("id", id).eq("owner_id", dueno).maybeSingle();
    return data?.revision === "revisar";
  }
  return false;
}

const AGENTES_AVISO = ["lola", "clara", "victor", "iris"] as const;

/** Manda, junto, lo que ya toca de cada cuenta. */
async function soltarDe(admin: SupabaseClient, dueno: string): Promise<boolean> {
  const ahora = new Date();
  const { data: filaAjustes } = await admin.from("ajustes_cuenta").select("datos").eq("owner_id", dueno).maybeSingle();
  const aj = limpiarAjustes(filaAjustes?.datos);
  const { data } = await admin
    .from("avisos_salida")
    .select("id, tipo, nivel, titulo, texto, enlace, grupo, siempre, revisar, chat, agente")
    .eq("owner_id", dueno)
    .eq("app", "pendiente")
    .lte("enviar_desde", ahora.toISOString())
    .order("creado_en", { ascending: true })
    .limit(50);
  const todas = ((data ?? []) as FilaAviso[]).map((f) => ({ ...f, id: String(f.id) }));
  if (!todas.length) return false;

  // Los que nacieron en la base (como un cambio de plan) traen su texto para el chat: se escribe una sola vez
  for (const f of todas) {
    if (!f.chat) continue;
    const { data: tomado } = await admin.from("avisos_salida").update({ chat: null }).eq("id", f.id).eq("owner_id", dueno).not("chat", "is", null).select("id");
    const agente = (AGENTES_AVISO as readonly string[]).includes(String(f.agente)) ? (f.agente as IdAgente) : "iris";
    if (tomado?.length) await avisarEnChat(admin, dueno, { agente, texto: f.chat });
  }
  // Los recordatorios de algo que ya resolviste no salen
  const resueltos: FilaAviso[] = [];
  for (const f of todas) if (f.revisar && !(await sigueVigente(admin, dueno, f.revisar))) resueltos.push(f);
  if (resueltos.length)
    await admin
      .from("avisos_salida")
      .update({ app: "omitido" })
      .eq("owner_id", dueno)
      .in(
        "id",
        resueltos.map((f) => f.id),
      );
  const filas = todas.filter((f) => !resueltos.includes(f));
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

/** Lo de WhatsApp que ya toca de una cuenta: sale junto, en un solo mensaje. */
async function soltarWhatsappDe(admin: SupabaseClient, dueno: string): Promise<boolean> {
  const ahora = new Date();
  const { data } = await admin
    .from("avisos_salida")
    .select("id, tipo, nivel, titulo, texto, enlace, grupo, siempre, revisar")
    .eq("owner_id", dueno)
    .eq("whatsapp", "pendiente")
    .lte("wa_desde", ahora.toISOString())
    .order("creado_en", { ascending: true })
    .limit(50);
  const todas = ((data ?? []) as FilaAviso[]).map((f) => ({ ...f, id: String(f.id) }));
  if (!todas.length) return false;
  const omitir = async (filas: FilaAviso[]) => {
    if (filas.length)
      await admin
        .from("avisos_salida")
        .update({ whatsapp: "omitido" })
        .eq("owner_id", dueno)
        .in(
          "id",
          filas.map((f) => f.id),
        );
  };
  // Si ya no hay a dónde (se quitó, se pausó o falta configurarlo), no sale
  const numero = await destinoWhatsapp(admin, dueno);
  if (!numero) {
    await omitir(todas);
    return false;
  }
  const { data: filaAjustes } = await admin.from("ajustes_cuenta").select("datos").eq("owner_id", dueno).maybeSingle();
  const aj = limpiarAjustes(filaAjustes?.datos);
  const avWa = { ...aj.avisos, app: aj.avisos.whatsapp };

  // Recordatorios ya resueltos y lo que ya no toca (cambió el nivel): no salen
  const fuera: FilaAviso[] = [];
  for (const f of todas) {
    if (!f.siempre && !pasaElNivel(avWa.app, f.nivel)) fuera.push(f);
    else if (f.revisar && !(await sigueVigente(admin, dueno, f.revisar))) fuera.push(f);
  }
  await omitir(fuera);
  const tocan = todas.filter((f) => !fuera.includes(f));
  // Horas de silencio y tope del día: esperan
  const callado = enSilencio(aj.avisos, ahora, aj.zonaHoraria);
  const lleno = (await enviadosWaHoy(admin, dueno)) >= TOPE_WHATSAPP;
  const esperan = lleno ? tocan : callado ? tocan.filter((f) => !f.siempre && !(f.nivel === "urgente" && aj.avisos.urgentePasa)) : [];
  if (esperan.length)
    await admin
      .from("avisos_salida")
      .update({ wa_desde: finDelSilencio(aj.avisos, ahora, aj.zonaHoraria).toISOString() })
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
    .update({ whatsapp: "junto", wa_enviado_en: ahora.toISOString() })
    .eq("owner_id", dueno)
    .eq("whatsapp", "pendiente")
    .in(
      "id",
      salen.map((f) => f.id),
    )
    .select("id");
  const ids = new Set((apartadas ?? []).map((f) => String(f.id)));
  const van = salen.filter((f) => ids.has(f.id));
  if (!van.length) return false;
  const ultimo = van[van.length - 1];
  const deOk = van.every((f) => f.grupo === "pendientes");
  const enlace = van.length === 1 ? ultimo.enlace : deOk ? "/panel?vista=pendientes" : (van.find((f) => f.enlace.startsWith("/panel?c="))?.enlace ?? "/panel");
  const texto = aj.avisos.discretos
    ? DISCRETO_WA
    : van.length === 1
      ? ultimo.texto
      : `Tienes ${van.length} avisos nuevos: ${van
          .slice(-3)
          .reverse()
          .map((f) => f.texto)
          .join(" · ")}`.slice(0, 600);
  const ok = await mandarPorWhatsapp(
    admin,
    dueno,
    numero,
    texto,
    enlace,
    van.map((f) => f.id),
  );
  if (ok) await admin.from("avisos_salida").update({ whatsapp: "enviado" }).eq("id", ultimo.id).eq("owner_id", dueno);
  return ok;
}

export async function soltarAvisos(admin: SupabaseClient, tiempo = 40_000): Promise<{ cuentas: number; enviadas: number }> {
  const empezo = Date.now();
  const ya = new Date().toISOString();
  const [{ data: deApp }, { data: deWa }] = await Promise.all([
    admin.from("avisos_salida").select("owner_id").eq("app", "pendiente").lte("enviar_desde", ya).order("enviar_desde", { ascending: true }).limit(500),
    admin.from("avisos_salida").select("owner_id").eq("whatsapp", "pendiente").lte("wa_desde", ya).order("wa_desde", { ascending: true }).limit(500),
  ]);
  const app = new Set((deApp ?? []).map((f) => String(f.owner_id)));
  const wa = new Set((deWa ?? []).map((f) => String(f.owner_id)));
  const duenos = Array.from(new Set([...Array.from(app), ...Array.from(wa)]));
  let cuentas = 0;
  let enviadas = 0;
  for (const d of duenos) {
    if (Date.now() - empezo > tiempo) break;
    try {
      cuentas++;
      const enApp = app.has(d) ? await soltarDe(admin, d) : false;
      const enWa = wa.has(d) ? await soltarWhatsappDe(admin, d) : false;
      if (enApp || enWa) enviadas++;
    } catch (e) {
      console.error("Soltar avisos falló:", e instanceof Error ? e.message : e);
    }
  }
  return { cuentas, enviadas };
}

/* ---------- Ayudas ---------- */

/**
 * Un recordatorio: sale en `minutos`, solo si lo de `revisar` sigue pendiente
 * (si ya lo resolviste, no sale). No va al chat: el aviso original ya está ahí.
 */
export function recordar(
  admin: SupabaseClient,
  dueno: string,
  r: { tipo: TipoAviso; agente: IdAgente; corto: string; enlace?: string; minutos: number; revisar: string; clave: string },
): Promise<ResultadoAviso> {
  return notificar(admin, dueno, { tipo: r.tipo, agente: r.agente, corto: r.corto, enlace: r.enlace, clave: r.clave, revisar: r.revisar, despues: new Date(Date.now() + r.minutos * 60_000) });
}

/** Si ya se avisó esto (por su clave): para no repetir trabajo en lo que corre a cada rato. */
export async function yaAvisado(admin: SupabaseClient, dueno: string, clave: string): Promise<boolean> {
  const { data } = await admin.from("avisos_salida").select("id").eq("owner_id", dueno).eq("clave", clave).limit(1).maybeSingle();
  return Boolean(data);
}

/** El trabajo por su cuenta: aviso al 80 % y al llegar al límite (una vez por semana cada uno). */
export async function avisarUsoTrabajo(admin: SupabaseClient, dueno: string, o: { gastado: number; limite: number; semana: string; lleno: boolean }): Promise<void> {
  if (o.limite <= 0) return;
  const semana = o.semana.slice(0, 10);
  if (o.lleno) {
    const clave = `limite_trabajo:${semana}`;
    if (await yaAvisado(admin, dueno, clave)) return;
    await notificar(admin, dueno, {
      tipo: "limite_trabajo",
      agente: "iris",
      chat: "Llegué al límite de esta semana para trabajar por mi cuenta (la revisión del día, tus tareas y tus correos), así que eso queda en pausa hasta el lunes. El chat sigue funcionando. Lo ves en [Ajustes → Uso](/panel?vista=ajustes&seccion=uso).",
      corto: "Llegué al límite de la semana para trabajar por mi cuenta: vuelvo el lunes. El chat sigue funcionando.",
      enlace: "/panel?vista=ajustes&seccion=uso",
      clave,
    });
    return;
  }
  if (o.gastado < 0.8 * o.limite) return;
  const clave = `uso80_trabajo:${semana}`;
  if (await yaAvisado(admin, dueno, clave)) return;
  await notificar(admin, dueno, {
    tipo: "uso_80",
    agente: "iris",
    chat: "Ya usé el 80 % de lo que tengo esta semana para trabajar por mi cuenta. Cuando llegue al límite, eso se pausa hasta el lunes (el chat sigue). Lo ves en [Ajustes → Uso](/panel?vista=ajustes&seccion=uso).",
    corto: "Ya usé el 80 % de mi semana para trabajar por mi cuenta.",
    enlace: "/panel?vista=ajustes&seccion=uso",
    clave,
  });
}
