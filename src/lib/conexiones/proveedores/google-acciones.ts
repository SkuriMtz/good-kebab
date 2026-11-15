import type { ContextoHerramienta, Herramienta } from "@/lib/nucleo-tipos";
import { argCorreos, argNumero, argTexto, enZona, ErrorArgs, horaLocal, linea, pedirJson } from "../http";
import { ErrorApi } from "../oauth";

/**
 * GOOGLE: lo que Atendel HACE (no solo lee) en Calendar, Gmail y Tareas.
 * - Cada herramienta trae `hace` (su categoría de «Qué hace solo» y una frase
 *   de lo que va a hacer): el chat, las tareas y el trabajo por su cuenta la
 *   hacen al momento o la dejan esperando tu OK (src/lib/acciones.ts).
 * - Las citas se buscan y se revisan por dentro (choques, cuál es): no hace
 *   falta leer la agenda antes, y al modelo solo le llegan horas, nunca
 *   títulos de eventos (pueden venir de invitaciones de fuera). Por eso lo
 *   que regresan no cuenta como "dato de fuera".
 * - Si Google no dio el permiso de escribir (quien conectó antes solo con
 *   lectura), se pide volver a conectar esa app.
 * Las horas son locales de la cuenta (ctx.zona), en formato AAAA-MM-DDTHH:MM.
 */

const CAL = "https://www.googleapis.com/calendar/v3/calendars/primary";
const GMAIL = "https://gmail.googleapis.com/gmail/v1/users/me";
const TASKS = "https://tasks.googleapis.com/tasks/v1";
const ZONA = "America/Mexico_City";
const MIN = 60_000;

const zonaDe = (ctx: ContextoHerramienta) => ctx.zona || ZONA;
const pedido = async (ctx: ContextoHerramienta) => ({ token: (await ctx.token()).access_token, senal: ctx.senal, proveedor: "google" as const });

/** Si Google dice que falta el permiso de escribir: se pide volver a conectar esa app. */
function sinPermiso(e: unknown, app: "google_calendar" | "gmail" | "google_tasks", que: string): never {
  if (e instanceof ErrorApi && (e.status === 403 || e.status === 401))
    throw new ErrorArgs(`Google no dio permiso para ${que}. Vuelve a conectar la app para darle ese permiso: [Volver a conectar](/panel?conectar=${app})`);
  throw e;
}

/* ---------------- Calendar ---------------- */

type EventoG = {
  id?: string;
  summary?: string;
  status?: string;
  transparency?: string;
  attendees?: unknown[];
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
};

type Cita = { titulo: string; inicio: Date; fin: Date; descripcion: string; lugar: string; invitados: string[]; aunqueChoque: boolean };

/** ¿Con esos argumentos la cita manda invitaciones? Si no se entienden, se toma como que sí (lo más seguro). */
function conInvitados(args: Record<string, unknown>): boolean {
  try {
    return argCorreos(args, "invitados").length > 0;
  } catch {
    return true;
  }
}

function leerCita(args: Record<string, unknown>, zona: string): Cita {
  const titulo = argTexto(args, "titulo", { requerido: true, max: 200 }).replace(/\s+/g, " ");
  const inicio = horaLocal(argTexto(args, "inicio", { requerido: true, max: 40 }), zona);
  const finTxt = argTexto(args, "fin", { max: 40 });
  const fin = finTxt ? horaLocal(finTxt, zona) : new Date(inicio.getTime() + argNumero(args, "duracion_min", { min: 5, max: 720, omision: 60 }) * MIN);
  if (fin.getTime() <= inicio.getTime()) throw new ErrorArgs("La cita tiene que terminar después de empezar.");
  if (fin.getTime() - inicio.getTime() > 12 * 60 * MIN) throw new ErrorArgs("Una cita puede durar como máximo 12 horas.");
  if (inicio.getTime() < Date.now() - 60 * MIN) throw new ErrorArgs("Esa fecha y hora ya pasaron.");
  return {
    titulo,
    inicio,
    fin,
    descripcion: argTexto(args, "descripcion", { max: 2000 }),
    lugar: argTexto(args, "lugar", { max: 200 }),
    invitados: argCorreos(args, "invitados"),
    aunqueChoque: args.aunque_choque === true,
  };
}

const horas = (inicio: Date, fin: Date, zona: string) => `${enZona(inicio, zona)}–${enZona(fin, zona, false)}`;

/** Lo que ya ocupa ese rato (sin los eventos de todo el día ni los marcados como "disponible"). Solo horas. */
async function ocupado(ctx: ContextoHerramienta, desde: Date, hasta: Date, ignorar?: string): Promise<{ inicio: Date; fin: Date }[]> {
  const q = new URLSearchParams({ timeMin: desde.toISOString(), timeMax: hasta.toISOString(), singleEvents: "true", maxResults: "20" });
  const d = await pedirJson<{ items?: EventoG[] }>(`${CAL}/events?${q}`, await pedido(ctx));
  return (d.items ?? [])
    .filter((e) => e.status !== "cancelled" && e.transparency !== "transparent" && e.start?.dateTime && e.end?.dateTime && e.id !== ignorar)
    .map((e) => ({ inicio: new Date(e.start!.dateTime!), fin: new Date(e.end!.dateTime!) }));
}

function choque(lista: { inicio: Date; fin: Date }[], zona: string): string {
  return `a esa hora ya hay ${lista.length === 1 ? "otro evento" : `${lista.length} eventos`} (${lista.map((x) => horas(x.inicio, x.fin, zona)).join(", ")})`;
}

/** Qué cita: por su hora de inicio ("cuando") o por el día y una palabra del título. */
function refCita(args: Record<string, unknown>, zona: string): string {
  const cuando = argTexto(args, "cuando", { max: 40 });
  const dia = argTexto(args, "dia", { max: 10 });
  const buscar = argTexto(args, "buscar", { max: 100 });
  if (cuando) return `la cita de las ${enZona(horaLocal(cuando, zona), zona, false)} del ${enZona(horaLocal(cuando, zona), zona).split(",")[0]}${buscar ? ` («${linea(buscar, 60)}»)` : ""}`;
  if (dia && /^\d{4}-\d{2}-\d{2}$/.test(dia) && buscar) return `la cita «${linea(buscar, 60)}» del ${enZona(horaLocal(`${dia}T12:00`, zona), zona).split(",")[0]}`;
  throw new ErrorArgs('Dime cuál cita: su hora de inicio ("cuando", AAAA-MM-DDTHH:MM) o el día ("dia", AAAA-MM-DD) con una palabra de su título ("buscar").');
}

async function buscarCita(ctx: ContextoHerramienta, args: Record<string, unknown>, zona: string): Promise<EventoG & { id: string }> {
  refCita(args, zona);
  const cuando = argTexto(args, "cuando", { max: 40 });
  const dia = argTexto(args, "dia", { max: 10 });
  const buscar = argTexto(args, "buscar", { max: 100 }).toLowerCase();
  const t = cuando ? horaLocal(cuando, zona) : null;
  const desde = t ? new Date(t.getTime() - MIN) : horaLocal(`${dia}T00:00`, zona);
  const hasta = t ? new Date(t.getTime() + MIN) : new Date(desde.getTime() + 24 * 60 * MIN);
  const q = new URLSearchParams({ timeMin: desde.toISOString(), timeMax: hasta.toISOString(), singleEvents: "true", maxResults: "50" });
  const d = await pedirJson<{ items?: EventoG[] }>(`${CAL}/events?${q}`, await pedido(ctx));
  const lista = (d.items ?? []).filter(
    (e): e is EventoG & { id: string } =>
      Boolean(e.id) &&
      e.status !== "cancelled" &&
      Boolean(e.start?.dateTime) &&
      (!t || Math.abs(new Date(e.start!.dateTime!).getTime() - t.getTime()) < MIN) &&
      (!buscar || (e.summary ?? "").toLowerCase().includes(buscar)),
  );
  if (!lista.length) throw new ErrorArgs("No encontré esa cita en el Google Calendar. Revisa la hora o la palabra.");
  if (lista.length > 1)
    throw new ErrorArgs(`Encontré ${lista.length} citas así (a las ${lista.map((e) => enZona(new Date(e.start!.dateTime!), zona, false)).join(", ")}). Dime la hora exacta ("cuando").`);
  return lista[0];
}

const ESQUEMA_CUAL = {
  cuando: { type: "string", description: "Hora de inicio actual de la cita, AAAA-MM-DDTHH:MM (hora local)." },
  dia: { type: "string", description: "O el día de la cita, AAAA-MM-DD (junto con «buscar»)." },
  buscar: { type: "string", description: "Una palabra de su título (por ejemplo, el nombre del cliente)." },
};

const crearCita: Herramienta = {
  nombre: "google_calendar_crear_evento",
  descripcion:
    "CREA una cita o evento en el Google Calendar del dueño. Revisa sola que no choque con otro evento (si choca, no la crea y dice a qué horas está ocupado; para crearla de todos modos, vuelve a llamarla con aunque_choque: true). No hace falta ver la agenda antes. Hora local del negocio, AAAA-MM-DDTHH:MM.",
  app: "google_calendar",
  agentes: ["lola"],
  esquema: {
    type: "object",
    properties: {
      titulo: { type: "string", description: "Título de la cita (por ejemplo «Corte — Ana López»)." },
      inicio: { type: "string", description: "Inicio, AAAA-MM-DDTHH:MM." },
      fin: { type: "string", description: "Fin, AAAA-MM-DDTHH:MM (o usa duracion_min)." },
      duracion_min: { type: "integer", minimum: 5, maximum: 720, description: "Duración en minutos si no das «fin» (por omisión 60)." },
      descripcion: { type: "string", description: "Notas (teléfono del cliente, servicio…)." },
      lugar: { type: "string" },
      invitados: { type: "array", items: { type: "string" }, description: "Correos a invitar (Google les manda la invitación)." },
      aunque_choque: { type: "boolean", description: "true solo si el dueño quiere crearla aunque choque con otra." },
    },
    required: ["titulo", "inicio"],
    additionalProperties: false,
  },
  hace: {
    categoria: "citas",
    // Con invitados, la cita les manda un correo: cuenta como «Mandar correos» y su texto se revisa
    // (con el mismo lector que usa la acción; si no se entiende, cuenta como que sí lleva invitados)
    categoriaDe: (args) => (conInvitados(args) ? "correos" : "citas"),
    textoQueSale: (args) => (conInvitados(args) ? [args.titulo, args.descripcion, args.lugar].filter((x) => typeof x === "string").join("\n") : ""),
    resumen(args, zona) {
      const c = leerCita(args, zona);
      return `Crear «${linea(c.titulo, 80)}» el ${horas(c.inicio, c.fin, zona)} en tu Google Calendar${c.invitados.length ? ` e invitar a ${c.invitados.join(", ")}` : ""}`;
    },
  },
  async ejecutar(args, ctx) {
    const zona = zonaDe(ctx);
    const c = leerCita(args, zona);
    try {
      if (!c.aunqueChoque) {
        const ya = await ocupado(ctx, c.inicio, c.fin);
        if (ya.length) throw new ErrorArgs(`No la creé: ${choque(ya, zona)}. Propón otra hora, o créala de todos modos con aunque_choque si el dueño lo pide.`);
      }
      const ev = await pedirJson<{ id?: string }>(`${CAL}/events?sendUpdates=${c.invitados.length ? "all" : "none"}`, {
        ...(await pedido(ctx)),
        metodo: "POST",
        cuerpo: {
          summary: c.titulo,
          ...(c.descripcion ? { description: c.descripcion } : {}),
          ...(c.lugar ? { location: c.lugar } : {}),
          start: { dateTime: c.inicio.toISOString() },
          end: { dateTime: c.fin.toISOString() },
          ...(c.invitados.length ? { attendees: c.invitados.map((email) => ({ email })) } : {}),
        },
      });
      return `Listo: quedó «${linea(c.titulo, 120)}» el ${horas(c.inicio, c.fin, zona)} en el Google Calendar${c.invitados.length ? `, con invitación a ${c.invitados.join(", ")}` : ""}.${ev.id ? ` (id ${linea(ev.id, 80)})` : ""}`;
    } catch (e) {
      if (e instanceof ErrorArgs) throw e;
      sinPermiso(e, "google_calendar", "crear citas en tu calendario");
    }
  },
};

const moverCita: Herramienta = {
  nombre: "google_calendar_mover_evento",
  descripcion:
    "MUEVE una cita del Google Calendar del dueño a otra hora (conserva su duración si no das «nuevo_fin»). Dile cuál con su hora actual («cuando») o con el día y una palabra de su título. Revisa sola que la nueva hora no choque. No hace falta ver la agenda antes.",
  app: "google_calendar",
  agentes: ["lola"],
  esquema: {
    type: "object",
    properties: {
      ...ESQUEMA_CUAL,
      nuevo_inicio: { type: "string", description: "Nueva hora de inicio, AAAA-MM-DDTHH:MM." },
      nuevo_fin: { type: "string", description: "Nueva hora de fin, AAAA-MM-DDTHH:MM (opcional)." },
      aunque_choque: { type: "boolean", description: "true solo si el dueño quiere moverla aunque choque." },
    },
    required: ["nuevo_inicio"],
    additionalProperties: false,
  },
  hace: {
    categoria: "citas",
    resumen(args, zona) {
      const nuevo = horaLocal(argTexto(args, "nuevo_inicio", { requerido: true, max: 40 }), zona);
      return `Mover ${refCita(args, zona)} al ${enZona(nuevo, zona)} en tu Google Calendar`;
    },
  },
  async ejecutar(args, ctx) {
    const zona = zonaDe(ctx);
    const nuevoInicio = horaLocal(argTexto(args, "nuevo_inicio", { requerido: true, max: 40 }), zona);
    if (nuevoInicio.getTime() < Date.now() - 60 * MIN) throw new ErrorArgs("La nueva hora ya pasó.");
    try {
      const ev = await buscarCita(ctx, args, zona);
      const antes = new Date(ev.start!.dateTime!);
      const dura = new Date(ev.end?.dateTime ?? ev.start!.dateTime!).getTime() - antes.getTime();
      const finTxt = argTexto(args, "nuevo_fin", { max: 40 });
      const nuevoFin = finTxt ? horaLocal(finTxt, zona) : new Date(nuevoInicio.getTime() + Math.max(dura, 5 * MIN));
      if (nuevoFin.getTime() <= nuevoInicio.getTime()) throw new ErrorArgs("La cita tiene que terminar después de empezar.");
      if (args.aunque_choque !== true) {
        const ya = await ocupado(ctx, nuevoInicio, nuevoFin, ev.id);
        if (ya.length) throw new ErrorArgs(`No la moví: ${choque(ya, zona)}. Propón otra hora, o muévela de todos modos con aunque_choque si el dueño lo pide.`);
      }
      await pedirJson(`${CAL}/events/${encodeURIComponent(ev.id)}?sendUpdates=${ev.attendees?.length ? "all" : "none"}`, {
        ...(await pedido(ctx)),
        metodo: "PATCH",
        cuerpo: { start: { dateTime: nuevoInicio.toISOString() }, end: { dateTime: nuevoFin.toISOString() } },
      });
      // Sin el título: puede venir de una invitación de alguien de fuera
      return `Listo: moví la cita del ${enZona(antes, zona)} al ${horas(nuevoInicio, nuevoFin, zona)}${ev.attendees?.length ? " (Google les avisó a los invitados)" : ""}.`;
    } catch (e) {
      if (e instanceof ErrorArgs) throw e;
      sinPermiso(e, "google_calendar", "mover citas en tu calendario");
    }
  },
};

const cancelarCita: Herramienta = {
  nombre: "google_calendar_cancelar_evento",
  descripcion:
    "CANCELA (borra) una cita del Google Calendar del dueño. Dile cuál con su hora («cuando») o con el día y una palabra de su título. Si tiene invitados, Google les avisa.",
  app: "google_calendar",
  agentes: ["lola"],
  esquema: { type: "object", properties: ESQUEMA_CUAL, additionalProperties: false },
  hace: {
    categoria: "citas",
    resumen: (args, zona) => `Cancelar ${refCita(args, zona)} en tu Google Calendar`,
  },
  async ejecutar(args, ctx) {
    const zona = zonaDe(ctx);
    try {
      const ev = await buscarCita(ctx, args, zona);
      await pedirJson(`${CAL}/events/${encodeURIComponent(ev.id)}?sendUpdates=${ev.attendees?.length ? "all" : "none"}`, { ...(await pedido(ctx)), metodo: "DELETE" });
      return `Listo: cancelé la cita del ${enZona(new Date(ev.start!.dateTime!), zona)}${ev.attendees?.length ? " (Google les avisó a los invitados)" : ""}.`;
    } catch (e) {
      if (e instanceof ErrorArgs) throw e;
      sinPermiso(e, "google_calendar", "cancelar citas en tu calendario");
    }
  },
};

/* ---------------- Gmail: mandar y contestar ---------------- */

const ID_GMAIL = /^[A-Za-z0-9_-]{6,64}$/;
const sinSaltos = (t: string) => t.replace(/[\r\n]+/g, " ").trim();
const cabeceraUtf8 = (t: string) => `=?UTF-8?B?${Buffer.from(t, "utf8").toString("base64")}?=`;
const base64Lineas = (t: string) => (Buffer.from(t, "utf8").toString("base64").match(/.{1,76}/g) ?? []).join("\r\n");

const gmailEnviar: Herramienta = {
  nombre: "gmail_enviar_correo",
  descripcion:
    "MANDA un correo desde el Gmail del dueño, o contesta uno: con «responder_a» (el id que dio gmail_buscar_correos) va en la misma conversación. «para» siempre: los correos de los destinatarios. Texto simple.",
  app: "gmail",
  agentes: ["clara"],
  esquema: {
    type: "object",
    properties: {
      para: { type: "array", items: { type: "string" }, description: "Correos de los destinatarios (máximo 10)." },
      asunto: { type: "string", description: "Asunto (en una respuesta se usa el del correo original)." },
      texto: { type: "string", description: "El cuerpo del correo, listo para mandarse." },
      responder_a: { type: "string", description: "Id del correo de Gmail que se contesta (opcional)." },
    },
    required: ["para", "texto"],
    additionalProperties: false,
  },
  hace: {
    categoria: "correos",
    textoQueSale: (args) => [args.asunto, args.texto].filter((x) => typeof x === "string").join("\n"),
    resumen(args) {
      const para = argCorreos(args, "para", { requerido: true });
      const asunto = sinSaltos(argTexto(args, "asunto", { max: 200 }));
      const texto = argTexto(args, "texto", { requerido: true, max: 20_000 });
      const responde = argTexto(args, "responder_a", { max: 64 });
      return `${responde ? "Contestar un correo de" : "Mandar un correo a"} ${para.join(", ")}${asunto ? ` («${linea(asunto, 80)}»)` : ""} desde tu Gmail: «${linea(texto, 180)}»`;
    },
  },
  async ejecutar(args, ctx) {
    const para = argCorreos(args, "para", { requerido: true });
    const texto = argTexto(args, "texto", { requerido: true, max: 20_000 });
    let asunto = sinSaltos(argTexto(args, "asunto", { max: 200 }));
    const responde = argTexto(args, "responder_a", { max: 64, patron: ID_GMAIL });
    try {
      const p = await pedido(ctx);
      let hilo: string | undefined;
      const extra: string[] = [];
      if (responde) {
        const meta = "format=metadata&metadataHeaders=Subject&metadataHeaders=Message-ID&metadataHeaders=References";
        const o = await pedirJson<{ threadId?: string; payload?: { headers?: { name?: string; value?: string }[] } }>(`${GMAIL}/messages/${responde}?${meta}`, p);
        const h = (n: string) => sinSaltos(o.payload?.headers?.find((x) => x.name?.toLowerCase() === n.toLowerCase())?.value ?? "");
        hilo = o.threadId;
        const original = h("Subject");
        if (!asunto) asunto = /^re:/i.test(original) ? original : `Re: ${original}`;
        const id = h("Message-ID");
        if (/^<[^<>\s]{3,300}>$/.test(id)) extra.push(`In-Reply-To: ${id}`, `References: ${[h("References"), id].filter(Boolean).join(" ").slice(0, 900)}`);
      }
      if (!asunto) throw new ErrorArgs("Falta el asunto del correo.");
      const mime = [
        `To: ${para.join(", ")}`,
        `Subject: ${cabeceraUtf8(asunto)}`,
        "MIME-Version: 1.0",
        'Content-Type: text/plain; charset="UTF-8"',
        "Content-Transfer-Encoding: base64",
        ...extra,
        "",
        base64Lineas(texto),
      ].join("\r\n");
      await pedirJson(`${GMAIL}/messages/send`, { ...p, metodo: "POST", cuerpo: { raw: Buffer.from(mime, "utf8").toString("base64url"), ...(hilo ? { threadId: hilo } : {}) } });
      return `Listo: mandé el correo a ${para.join(", ")} («${linea(asunto, 120)}») desde tu Gmail.`;
    } catch (e) {
      if (e instanceof ErrorArgs) throw e;
      sinPermiso(e, "gmail", "mandar correos desde tu Gmail");
    }
  },
};

/* ---------------- Tareas de Google ---------------- */

type ListaT = { id: string; title?: string };
type TareaG = { id: string; title?: string; notes?: string; due?: string; status?: string };

async function listasDeTareas(ctx: ContextoHerramienta): Promise<ListaT[]> {
  const d = await pedirJson<{ items?: ListaT[] }>(`${TASKS}/users/@me/lists?maxResults=20`, await pedido(ctx));
  return (d.items ?? []).filter((l) => l.id);
}

async function listaElegida(ctx: ContextoHerramienta, nombre: string): Promise<ListaT> {
  const listas = await listasDeTareas(ctx);
  if (!listas.length) throw new ErrorArgs("No encontré listas en Tareas de Google.");
  if (!nombre) return listas[0];
  const l = listas.find((x) => (x.title ?? "").toLowerCase() === nombre.toLowerCase()) ?? listas.find((x) => (x.title ?? "").toLowerCase().includes(nombre.toLowerCase()));
  if (!l) throw new ErrorArgs(`No encontré la lista «${linea(nombre, 60)}». Hay: ${listas.map((x) => linea(x.title, 40)).join(", ")}.`);
  return l;
}

const tareasVer: Herramienta = {
  nombre: "google_tareas_ver",
  descripcion: "Ve los pendientes (sin terminar) de Tareas de Google del dueño, lista por lista. Solo lectura.",
  app: "google_tasks",
  agentes: ["iris"],
  esquema: { type: "object", properties: {}, additionalProperties: false },
  async ejecutar(_args, ctx) {
    const listas = (await listasDeTareas(ctx)).slice(0, 6);
    if (!listas.length) return "No hay listas en Tareas de Google.";
    const p = await pedido(ctx);
    const partes = await Promise.all(
      listas.map(async (l) => {
        const d = await pedirJson<{ items?: TareaG[] }>(`${TASKS}/lists/${encodeURIComponent(l.id)}/tasks?showCompleted=false&maxResults=50`, p);
        const t = (d.items ?? []).filter((x) => x.status !== "completed" && x.title);
        return [`Lista «${linea(l.title, 60)}» (${t.length} pendientes):`, ...t.slice(0, 30).map((x) => `- ${linea(x.title, 160)}${x.due ? ` (para el ${x.due.slice(0, 10)})` : ""}${x.notes ? ` · ${linea(x.notes, 120)}` : ""}`)].join("\n");
      }),
    );
    return partes.join("\n\n");
  },
};

const tareasCrear: Herramienta = {
  nombre: "google_tareas_crear",
  descripcion: "CREA una tarea en Tareas de Google del dueño (en su primera lista o en la que digas), con fecha opcional.",
  app: "google_tasks",
  agentes: ["iris"],
  esquema: {
    type: "object",
    properties: {
      titulo: { type: "string" },
      notas: { type: "string" },
      fecha: { type: "string", description: "Para cuándo, AAAA-MM-DD (opcional)." },
      lista: { type: "string", description: "Nombre de la lista (opcional)." },
    },
    required: ["titulo"],
    additionalProperties: false,
  },
  hace: {
    categoria: "apps",
    resumen(args) {
      const titulo = argTexto(args, "titulo", { requerido: true, max: 200 });
      const fecha = argTexto(args, "fecha", { max: 10, patron: /^\d{4}-\d{2}-\d{2}$/ });
      return `Crear la tarea «${linea(titulo, 100)}»${fecha ? ` para el ${fecha}` : ""} en Tareas de Google`;
    },
  },
  async ejecutar(args, ctx) {
    const titulo = argTexto(args, "titulo", { requerido: true, max: 200 });
    const fecha = argTexto(args, "fecha", { max: 10, patron: /^\d{4}-\d{2}-\d{2}$/ });
    try {
      const l = await listaElegida(ctx, argTexto(args, "lista", { max: 80 }));
      await pedirJson(`${TASKS}/lists/${encodeURIComponent(l.id)}/tasks`, {
        ...(await pedido(ctx)),
        metodo: "POST",
        cuerpo: { title: titulo, ...(argTexto(args, "notas", { max: 2000 }) ? { notes: argTexto(args, "notas", { max: 2000 }) } : {}), ...(fecha ? { due: `${fecha}T00:00:00.000Z` } : {}) },
      });
      return `Listo: creé la tarea «${linea(titulo, 120)}»${fecha ? ` para el ${fecha}` : ""} en la lista «${linea(l.title, 60)}».`;
    } catch (e) {
      if (e instanceof ErrorArgs) throw e;
      sinPermiso(e, "google_tasks", "crear tareas");
    }
  },
};

const tareasCompletar: Herramienta = {
  nombre: "google_tareas_completar",
  descripcion: "MARCA COMO HECHA una tarea pendiente de Tareas de Google del dueño, buscándola por una parte de su título.",
  app: "google_tasks",
  agentes: ["iris"],
  esquema: {
    type: "object",
    properties: { titulo: { type: "string", description: "El título de la tarea o una parte." }, lista: { type: "string" } },
    required: ["titulo"],
    additionalProperties: false,
  },
  hace: {
    categoria: "apps",
    resumen: (args) => `Marcar como hecha la tarea «${linea(argTexto(args, "titulo", { requerido: true, max: 200 }), 100)}» en Tareas de Google`,
  },
  async ejecutar(args, ctx) {
    const buscar = argTexto(args, "titulo", { requerido: true, max: 200 }).toLowerCase();
    try {
      const l = await listaElegida(ctx, argTexto(args, "lista", { max: 80 }));
      const p = await pedido(ctx);
      const d = await pedirJson<{ items?: TareaG[] }>(`${TASKS}/lists/${encodeURIComponent(l.id)}/tasks?showCompleted=false&maxResults=100`, p);
      const t = (d.items ?? []).filter((x) => x.status !== "completed" && (x.title ?? "").toLowerCase().includes(buscar));
      if (!t.length) throw new ErrorArgs("No encontré una tarea pendiente con ese título.");
      if (t.length > 1) throw new ErrorArgs(`Hay ${t.length} tareas que coinciden; dime el título más completo.`);
      await pedirJson(`${TASKS}/lists/${encodeURIComponent(l.id)}/tasks/${encodeURIComponent(t[0].id)}`, { ...p, metodo: "PATCH", cuerpo: { status: "completed" } });
      return `Listo: marqué como hecha la tarea que dice «${linea(buscar, 120)}».`;
    } catch (e) {
      if (e instanceof ErrorArgs) throw e;
      sinPermiso(e, "google_tasks", "cambiar tus tareas");
    }
  },
};

export const ACCIONES_GOOGLE: Herramienta[] = [crearCita, moverCita, cancelarCita, gmailEnviar, tareasVer, tareasCrear, tareasCompletar];
