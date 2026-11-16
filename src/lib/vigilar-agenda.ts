import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { limpiarAjustes } from "./ajustes";
import { citar } from "./avisos";
import { enZona, horaLocal } from "./conexiones/http";
import { conexionesVigentes, obtenerToken } from "./conexiones/tokens";
import { contarFallaApp } from "./fallos-apps";
import { enSilencio, minutosDelDia, notificar, yaAvisado } from "./notificar";

/**
 * ATENDEL VIGILA TU AGENDA (la base de datos lo pide cada 10 minutos,
 * migración 0029 → /api/trabajo?que=agenda), con Google Calendar o el
 * calendario de Outlook conectado y «Que trabajen por su cuenta» prendido:
 *  - Guarda una foto de los próximos 14 días (tabla agenda_vista, solo
 *    servidor). La primera vez (o tras más de un día sin poder verla) solo
 *    la guarda, sin avisar nada.
 *  - Luego compara: cita nueva (6), movida o cancelada (7), dos citas que
 *    chocan por un cambio (8), tu próxima cita en 1 hora (9) y, cada noche
 *    a las 20:00, tu agenda de mañana (10).
 * Sin IA. Las notificaciones nunca llevan el título de la cita (solo el día
 * y la hora); el título va al chat, con citar().
 */

type Proveedor = "google" | "microsoft";
export type Evento = { proveedor: Proveedor; id: string; inicio: string; fin: string; todoElDia: boolean; titulo: string; ocupa: boolean };
type Foto = { proveedor: Proveedor; evento_id: string; inicio: string; fin: string; todo_el_dia: boolean; titulo: string | null };

const DIAS = 14;
const HORA_MANANA = 20 * 60;
const MAX_REVISAR = 5;
const ID_GOOGLE = /^[A-Za-z0-9_@.-]{1,400}$/;
const ID_OUTLOOK = /^[A-Za-z0-9_=+/!.-]{5,400}$/;

const corta = (t: unknown, max: number) => (typeof t === "string" ? t.replace(/\s+/g, " ").trim().slice(0, max) : "");
const iso = (t: unknown) => {
  const d = typeof t === "string" ? new Date(t) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toISOString() : null;
};
const clave = (e: { proveedor: Proveedor; id: string }) => `${e.proveedor}:${e.id}`;
/** Algo corto y fijo por cita, para las claves de los avisos (sin el id completo). */
export function huella(t: string): string {
  let h = 2166136261;
  for (let i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36);
}

/* ---------- Leer la agenda ---------- */

type EventoG = {
  id?: string;
  status?: string;
  summary?: string;
  transparency?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  attendees?: { self?: boolean; responseStatus?: string }[];
};

function deGoogle(e: EventoG, zona: string): Evento | null {
  if (!e.id || !ID_GOOGLE.test(e.id) || e.status === "cancelled") return null;
  const todoElDia = !e.start?.dateTime;
  let inicio: string | null;
  let fin: string | null;
  try {
    inicio = todoElDia ? (e.start?.date ? horaLocal(`${e.start.date}T00:00`, zona).toISOString() : null) : iso(e.start?.dateTime);
    fin = todoElDia ? (e.end?.date ? horaLocal(`${e.end.date}T00:00`, zona).toISOString() : null) : iso(e.end?.dateTime);
  } catch {
    return null;
  }
  if (!inicio || !fin) return null;
  const rechazada = e.attendees?.some((a) => a.self && a.responseStatus === "declined") ?? false;
  return { proveedor: "google", id: e.id, inicio, fin, todoElDia, titulo: corta(e.summary, 200), ocupa: !todoElDia && e.transparency !== "transparent" && !rechazada };
}

type EventoM = {
  id?: string;
  subject?: string;
  isAllDay?: boolean;
  isCancelled?: boolean;
  showAs?: string;
  responseStatus?: { response?: string };
  start?: { dateTime?: string };
  end?: { dateTime?: string };
};

/** Graph con Prefer: outlook.timezone="UTC" regresa la hora sin desfase: es UTC. */
const utc = (t?: string) => (t ? iso(/[zZ]|[+-]\d\d:\d\d$/.test(t) ? t : `${t.replace(/\.\d+$/, "")}Z`) : null);

function deOutlook(e: EventoM): Evento | null {
  if (!e.id || !ID_OUTLOOK.test(e.id) || e.isCancelled) return null;
  const inicio = utc(e.start?.dateTime);
  const fin = utc(e.end?.dateTime);
  if (!inicio || !fin) return null;
  const todoElDia = e.isAllDay === true;
  const ocupa = !todoElDia && e.showAs !== "free" && e.responseStatus?.response !== "declined";
  return { proveedor: "microsoft", id: e.id, inicio, fin, todoElDia, titulo: corta(e.subject, 200), ocupa };
}

class FallaAgenda extends Error {
  constructor(readonly status: number) {
    super(`La agenda respondió ${status}`);
  }
}

async function pedir<T>(url: string, token: string, senal: AbortSignal, headers: Record<string, string> = {}): Promise<{ status: number; datos: T | null }> {
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}`, ...headers }, cache: "no-store", signal: senal });
  if (r.status === 404 || r.status === 410) return { status: r.status, datos: null };
  if (!r.ok) throw new FallaAgenda(r.status);
  return { status: r.status, datos: (await r.json()) as T };
}

/** Los eventos de los próximos días; `hasta` es hasta dónde se sabe que la lista está completa. */
async function leerGoogle(token: string, zona: string, desde: Date, hasta: Date, senal: AbortSignal): Promise<{ eventos: Evento[]; hasta: number }> {
  const q = new URLSearchParams({ timeMin: desde.toISOString(), timeMax: hasta.toISOString(), singleEvents: "true", orderBy: "startTime", maxResults: "250" });
  const { status, datos } = await pedir<{ items?: EventoG[]; nextPageToken?: string }>(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${q}`, token, senal);
  // Sin lista no se compara nada (si no, todo parecería cancelado)
  if (!datos || !Array.isArray(datos.items)) throw new FallaAgenda(status === 200 ? 502 : status);
  const eventos = (datos?.items ?? []).flatMap((e) => deGoogle(e, zona) ?? []);
  const completo = !datos?.nextPageToken;
  return { eventos, hasta: completo ? hasta.getTime() : Math.max(desde.getTime(), ...eventos.map((e) => new Date(e.inicio).getTime())) };
}

async function leerOutlook(token: string, desde: Date, hasta: Date, senal: AbortSignal): Promise<{ eventos: Evento[]; hasta: number }> {
  const q = `startDateTime=${encodeURIComponent(desde.toISOString())}&endDateTime=${encodeURIComponent(hasta.toISOString())}&$top=200&$orderby=${encodeURIComponent("start/dateTime")}&$select=id,subject,start,end,isAllDay,isCancelled,showAs,responseStatus`;
  const { status, datos } = await pedir<{ value?: EventoM[]; "@odata.nextLink"?: string }>(`https://graph.microsoft.com/v1.0/me/calendarView?${q}`, token, senal, { Prefer: 'outlook.timezone="UTC"' });
  if (!datos || !Array.isArray(datos.value)) throw new FallaAgenda(status === 200 ? 502 : status);
  const eventos = (datos?.value ?? []).flatMap((e) => deOutlook(e) ?? []);
  const completo = !datos?.["@odata.nextLink"];
  return { eventos, hasta: completo ? hasta.getTime() : Math.max(desde.getTime(), ...eventos.map((e) => new Date(e.inicio).getTime())) };
}

/** Una cita que ya no salió en la lista: ¿se canceló o se movió fuera de los 14 días? */
async function buscarUna(f: Foto, token: string, zona: string, senal: AbortSignal): Promise<Evento | "cancelada"> {
  if (f.proveedor === "google") {
    const { datos } = await pedir<EventoG>(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(f.evento_id)}`, token, senal);
    if (!datos || datos.status === "cancelled") return "cancelada";
    return deGoogle(datos, zona) ?? "cancelada";
  }
  const { datos } = await pedir<EventoM>(`https://graph.microsoft.com/v1.0/me/events/${encodeURIComponent(f.evento_id)}?$select=id,subject,start,end,isAllDay,isCancelled,showAs,responseStatus`, token, senal, {
    Prefer: 'outlook.timezone="UTC"',
  });
  if (!datos) return "cancelada";
  return deOutlook(datos) ?? "cancelada";
}

/* ---------- Comparar (sin red: se prueba aparte) ---------- */

/** Lo que cambió entre la foto guardada y lo que hay ahora. */
export function compararAgenda(foto: Foto[], ahora: Evento[], o: { desde: number; hasta: Record<Proveedor, number> }) {
  const antes = new Map(foto.map((f) => [`${f.proveedor}:${f.evento_id}`, f]));
  const nuevos: Evento[] = [];
  const movidos: { antes: Foto; ahora: Evento }[] = [];
  const vistos = new Set<string>();
  for (const e of ahora) {
    const k = clave(e);
    vistos.add(k);
    const f = antes.get(k);
    if (!f) {
      // Solo lo que todavía no empieza
      if (new Date(e.inicio).getTime() > o.desde) nuevos.push(e);
    } else if (
      (new Date(f.inicio).getTime() !== new Date(e.inicio).getTime() || new Date(f.fin).getTime() !== new Date(e.fin).getTime()) &&
      Math.max(new Date(f.inicio).getTime(), new Date(e.inicio).getTime()) > o.desde
    ) {
      movidos.push({ antes: f, ahora: e });
    }
  }
  // Ya no salió: solo si era futura y está dentro de lo que se leyó completo
  const faltan = foto.filter((f) => {
    const t = new Date(f.inicio).getTime();
    return !vistos.has(`${f.proveedor}:${f.evento_id}`) && t > o.desde && t < o.hasta[f.proveedor];
  });
  return { nuevos, movidos, faltan };
}

/** Pares de citas que se enciman (solo las que ocupan tiempo: sin «todo el día», libres ni rechazadas). */
export function choques(eventos: Evento[], desde: number): [Evento, Evento][] {
  const lista = eventos.filter((e) => e.ocupa && new Date(e.fin).getTime() > desde).sort((a, b) => a.inicio.localeCompare(b.inicio));
  const pares: [Evento, Evento][] = [];
  for (let i = 0; i < lista.length; i++) {
    const a = lista[i];
    const finA = new Date(a.fin).getTime();
    for (let j = i + 1; j < lista.length; j++) {
      const b = lista[j];
      if (new Date(b.inicio).getTime() >= finA) break;
      if (new Date(b.fin).getTime() > new Date(b.inicio).getTime()) pares.push([a, b]);
      if (pares.length >= 20) return pares;
    }
  }
  return pares;
}

const cuandoEs = (e: { inicio: string; todoElDia?: boolean; todo_el_dia?: boolean }, zona: string) => {
  const d = new Date(e.inicio);
  return e.todoElDia || e.todo_el_dia ? `${new Intl.DateTimeFormat("es-MX", { timeZone: zona, weekday: "short", day: "numeric", month: "short" }).format(d)} (todo el día)` : enZona(d, zona);
};
const nombreDe = (e: { titulo?: string | null }) => citar(e.titulo, 120) || "(sin título)";

/* ---------- Vigilar ---------- */

export async function vigilarAgenda(admin: SupabaseClient, dueno: string): Promise<{ avisos: number; motivo?: string }> {
  const { data: filaAjustes } = await admin.from("ajustes_cuenta").select("datos").eq("owner_id", dueno).maybeSingle();
  const aj = limpiarAjustes(filaAjustes?.datos);
  if (aj.trabajoAutonomo !== "activa") return { avisos: 0, motivo: "apagado" };
  const zona = aj.zonaHoraria;
  const conexiones = await conexionesVigentes(admin, dueno);
  const apps = new Set(conexiones.filter((c) => c.estado === "activa").flatMap((c) => c.apps));
  const proveedores: Proveedor[] = [...(apps.has("google_calendar") ? (["google"] as const) : []), ...(apps.has("outlook_calendar") ? (["microsoft"] as const) : [])];
  if (!proveedores.length) return { avisos: 0, motivo: "sin agenda" };

  const ahora = Date.now();
  const desde = new Date(ahora - 3_600_000);
  const hasta = new Date(ahora + DIAS * 86_400_000);
  const senal = AbortSignal.timeout(15_000);
  const [{ data: fotoGuardada }, { data: cuentas }] = await Promise.all([
    admin.from("agenda_vista").select("proveedor, evento_id, inicio, fin, todo_el_dia, titulo").eq("owner_id", dueno).gt("fin", desde.toISOString()).limit(2000),
    admin.from("agenda_cuentas").select("proveedor, revisado_en").eq("owner_id", dueno),
  ]);
  const foto = (fotoGuardada ?? []) as Foto[];

  const actuales: Evento[] = [];
  const tokens = new Map<Proveedor, string>();
  const hastaDe: Record<Proveedor, number> = { google: 0, microsoft: 0 };
  const sembrar = new Set<Proveedor>();
  for (const p of proveedores) {
    try {
      const token = (await obtenerToken(admin, dueno, p)).access_token;
      const r = p === "google" ? await leerGoogle(token, zona, desde, hasta, senal) : await leerOutlook(token, desde, hasta, senal);
      tokens.set(p, token);
      actuales.push(...r.eventos);
      hastaDe[p] = r.hasta;
      // La primera vez, o si pasó más de un día sin poder verla: solo se guarda (si no, todo parecería nuevo)
      const c = (cuentas ?? []).find((x) => x.proveedor === p);
      if (!c?.revisado_en || ahora - new Date(String(c.revisado_en)).getTime() > 86_400_000) sembrar.add(p);
    } catch (e) {
      if (e instanceof FallaAgenda && e.status >= 500) await contarFallaApp(dueno, p === "google" ? "google_calendar" : "outlook_calendar");
      // Sin poder leerla, esta vez no se compara nada de esa agenda
    }
  }
  if (!tokens.size) return { avisos: 0, motivo: "no se pudo leer" };
  const leidos = new Set(tokens.keys());
  const fotoLeida = foto.filter((f) => leidos.has(f.proveedor) && !sembrar.has(f.proveedor));
  const actualesComparables = actuales.filter((e) => !sembrar.has(e.proveedor));

  const { nuevos, movidos, faltan } = compararAgenda(fotoLeida, actualesComparables, { desde: ahora, hasta: hastaDe });
  // Lo que ya no salió: se busca una por una (pocas) para saber si se canceló o se movió más allá de 14 días
  const canceladas: Foto[] = [];
  const resueltas = new Set<string>();
  for (const f of faltan.slice(0, MAX_REVISAR)) {
    const token = tokens.get(f.proveedor);
    if (!token) continue;
    try {
      const r = await buscarUna(f, token, zona, senal);
      resueltas.add(`${f.proveedor}:${f.evento_id}`);
      if (r === "cancelada") canceladas.push(f);
      else if (new Date(r.inicio).getTime() !== new Date(f.inicio).getTime() || new Date(r.fin).getTime() !== new Date(f.fin).getTime()) movidos.push({ antes: f, ahora: r });
    } catch {
      /* no se pudo saber: se revisa en la siguiente vuelta */
    }
  }
  // Lo que no se pudo revisar esta vez se queda como estaba
  const sinResolver = new Set(faltan.filter((f) => !resueltas.has(`${f.proveedor}:${f.evento_id}`)).map((f) => `${f.proveedor}:${f.evento_id}`));
  let avisos = 0;

  // 6. Citas nuevas (una sola notificación con todas)
  if (nuevos.length) {
    const lista = nuevos.slice(0, 8);
    await notificar(admin, dueno, {
      tipo: "cita_nueva",
      agente: "lola",
      chat: `${nuevos.length === 1 ? "Se agendó una cita nueva" : `Se agendaron ${nuevos.length} citas nuevas`} en tu agenda:\n${lista.map((e) => `- ${cuandoEs(e, zona)}: ${nombreDe(e)}`).join("\n")}${nuevos.length > lista.length ? `\n- y ${nuevos.length - lista.length} más` : ""}`,
      corto: nuevos.length === 1 ? `Se agendó una cita nueva para el ${cuandoEs(nuevos[0], zona)}.` : `Se agendaron ${nuevos.length} citas nuevas en tu agenda.`,
    });
    avisos++;
  }
  // 7. Movidas o canceladas
  if (movidos.length || canceladas.length) {
    const lineas = [
      ...movidos.slice(0, 8).map((m) => `- Se movió «${nombreDe(m.ahora)}»: de ${cuandoEs(m.antes, zona)} a ${cuandoEs(m.ahora, zona)}`),
      ...canceladas.slice(0, 8).map((f) => `- Se canceló «${nombreDe(f)}» (${cuandoEs(f, zona)})`),
    ];
    const total = movidos.length + canceladas.length;
    await notificar(admin, dueno, {
      tipo: "cita_cambio",
      agente: "lola",
      chat: `${total === 1 ? "Cambió una cita" : `Cambiaron ${total} citas`} de tu agenda:\n${lineas.join("\n")}`,
      corto:
        total > 1
          ? `Cambiaron ${total} citas de tu agenda.`
          : movidos.length
            ? `Se movió una cita al ${cuandoEs(movidos[0].ahora, zona)}.`
            : `Se canceló tu cita del ${cuandoEs(canceladas[0], zona)}.`,
    });
    avisos++;
  }
  // 8. Dos citas que chocan por algo nuevo o movido (las que ya chocaban antes no se repiten)
  const cambiadas = new Set([...nuevos.map(clave), ...movidos.map((m) => clave(m.ahora))]);
  const conMovidas = [...actuales.filter((e) => !movidos.some((m) => clave(m.ahora) === clave(e))), ...movidos.map((m) => m.ahora)];
  const pares = cambiadas.size ? choques(conMovidas, ahora).filter(([a, b]) => cambiadas.has(clave(a)) || cambiadas.has(clave(b))) : [];
  for (const [a, b] of pares.slice(0, 3)) {
    const r = await notificar(admin, dueno, {
      tipo: "citas_chocan",
      agente: "lola",
      chat: `Dos citas de tu agenda chocan:\n- ${cuandoEs(a, zona)}: ${nombreDe(a)}\n- ${cuandoEs(b, zona)}: ${nombreDe(b)}\n\nRevisa cuál mover. Si quieres, pídeme que la mueva.`,
      corto: `Dos citas de tu agenda chocan el ${cuandoEs(a, zona)}.`,
      clave: `choque:${huella(clave(a))}:${huella(clave(b))}:${a.inicio}:${b.inicio}`,
    });
    if (r !== "repetido") avisos++;
  }
  // 9. Tu próxima cita en 1 hora (en horas de silencio no: llegaría tarde)
  const pronto = actuales.filter((e) => !e.todoElDia && new Date(e.inicio).getTime() > ahora && new Date(e.inicio).getTime() <= ahora + 65 * 60_000).sort((a, b) => a.inicio.localeCompare(b.inicio))[0];
  if (pronto && !enSilencio(aj.avisos, new Date(ahora), zona)) {
    const r = await notificar(admin, dueno, {
      tipo: "cita_pronto",
      agente: "lola",
      chat: `Tu próxima cita empieza a las ${enZona(new Date(pronto.inicio), zona, false)}: ${nombreDe(pronto)}.`,
      corto: `Tu próxima cita empieza a las ${enZona(new Date(pronto.inicio), zona, false)}.`,
      clave: `pronto:${huella(clave(pronto))}:${pronto.inicio}`,
    });
    if (r !== "repetido") avisos++;
  }
  // 10. Cada noche, desde las 20:00: tu agenda de mañana (si hay algo)
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: zona });
  const manana = fmt.format(new Date(ahora + 86_400_000));
  if (minutosDelDia(new Date(ahora), zona) >= HORA_MANANA && !(await yaAvisado(admin, dueno, `agenda_manana:${manana}`))) {
    // Las de «todo el día» cuentan si mañana cae dentro (su fin es la medianoche del día siguiente)
    const deManana = actuales.filter((e) =>
      e.todoElDia ? fmt.format(new Date(e.inicio)) <= manana && fmt.format(new Date(new Date(e.fin).getTime() - 1)) >= manana : fmt.format(new Date(e.inicio)) === manana,
    );
    const unicos = Array.from(new Map(deManana.map((e) => [clave(e), e])).values()).sort((a, b) => a.inicio.localeCompare(b.inicio));
    if (unicos.length) {
      await notificar(admin, dueno, {
        tipo: "agenda_manana",
        agente: "lola",
        chat: `Tu agenda de mañana:\n${unicos
          .slice(0, 15)
          .map((e) => `- ${e.todoElDia ? "Todo el día" : enZona(new Date(e.inicio), zona, false)}: ${nombreDe(e)}`)
          .join("\n")}${unicos.length > 15 ? `\n- y ${unicos.length - 15} más` : ""}`,
        corto: unicos.length === 1 ? "Mañana tienes una cita en tu agenda." : `Mañana tienes ${unicos.length} citas en tu agenda.`,
        clave: `agenda_manana:${manana}`,
      });
      avisos++;
    }
  }

  // La foto nueva: lo que hay ahora (y lo que no se pudo revisar se queda como estaba)
  const filas = actuales.map((e) => ({ owner_id: dueno, proveedor: e.proveedor, evento_id: e.id, inicio: e.inicio, fin: e.fin, todo_el_dia: e.todoElDia, titulo: e.titulo || null, visto_en: new Date().toISOString() }));
  for (let i = 0; i < filas.length; i += 500) await admin.from("agenda_vista").upsert(filas.slice(i, i + 500), { onConflict: "owner_id,proveedor,evento_id" });
  // Lo que se movió más allá de los 14 días: se guarda su nueva hora
  const lejanas = movidos.filter((m) => !actuales.some((e) => clave(e) === clave(m.ahora))).map((m) => m.ahora);
  if (lejanas.length) {
    await admin
      .from("agenda_vista")
      .upsert(
        lejanas.map((e) => ({ owner_id: dueno, proveedor: e.proveedor, evento_id: e.id, inicio: e.inicio, fin: e.fin, todo_el_dia: e.todoElDia, titulo: e.titulo || null, visto_en: new Date().toISOString() })),
        { onConflict: "owner_id,proveedor,evento_id" },
      );
  }
  // Lo cancelado (o que ya no está en una agenda recién guardada) se borra; lo que falta revisar, se queda
  const presentes = new Set(actuales.map(clave));
  const borrar = foto.filter((f) => {
    const k = `${f.proveedor}:${f.evento_id}`;
    if (!leidos.has(f.proveedor) || presentes.has(k) || sinResolver.has(k)) return false;
    if (lejanas.some((e) => clave(e) === k)) return false;
    // Dentro de lo que se leyó completo (o ya revisada una por una)
    return resueltas.has(k) || sembrar.has(f.proveedor) || (new Date(f.inicio).getTime() > ahora && new Date(f.inicio).getTime() < hastaDe[f.proveedor]);
  });
  for (const p of leidos) {
    const ids = borrar.filter((f) => f.proveedor === p).map((f) => f.evento_id);
    for (let i = 0; i < ids.length; i += 100) await admin.from("agenda_vista").delete().eq("owner_id", dueno).eq("proveedor", p).in("evento_id", ids.slice(i, i + 100));
  }
  // Lo que ya pasó hace más de un día
  await admin.from("agenda_vista").delete().eq("owner_id", dueno).lt("fin", new Date(ahora - 86_400_000).toISOString());
  await admin.from("agenda_cuentas").upsert(
    Array.from(leidos).map((p) => ({ owner_id: dueno, proveedor: p, revisado_en: new Date().toISOString() })),
    { onConflict: "owner_id,proveedor" },
  );
  return { avisos };
}
