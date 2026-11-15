import type { ContextoHerramienta, Herramienta } from "@/lib/nucleo-tipos";
import { argCorreos, argNumero, argTexto, enZona, ErrorArgs, horaLocal, linea, pedirJson } from "../http";
import { ErrorApi } from "../oauth";

/**
 * MICROSOFT (Graph): lo que Atendel HACE (no solo lee) en el calendario y el
 * correo de Outlook y en Microsoft To Do. Igual que en Google
 * (google-acciones.ts): cada herramienta trae `hace` para «Qué hace solo», las
 * citas se buscan y se revisan por dentro, y si falta el permiso de escribir
 * se pide volver a conectar. Las horas van en UTC a Graph.
 */

const GRAPH = "https://graph.microsoft.com/v1.0";
const ZONA = "America/Mexico_City";
const MIN = 60_000;
const ID_GRAPH = /^[A-Za-z0-9_=+/!.-]{5,400}$/;

const zonaDe = (ctx: ContextoHerramienta) => ctx.zona || ZONA;
const pedido = async (ctx: ContextoHerramienta, utc = false) => ({
  token: (await ctx.token()).access_token,
  senal: ctx.senal,
  proveedor: "microsoft" as const,
  ...(utc ? { headers: { Prefer: 'outlook.timezone="UTC"' } } : {}),
});
/** Graph quiere la hora sin desfase y la zona aparte: va en UTC. */
const utc = (d: Date) => ({ dateTime: d.toISOString().slice(0, 19), timeZone: "UTC" });
const deGraph = (t?: string) => new Date(`${(t ?? "").replace(/\.\d+$/, "")}Z`);

function sinPermiso(e: unknown, app: "outlook_calendar" | "outlook" | "microsoft_todo", que: string): never {
  if (e instanceof ErrorApi && (e.status === 403 || e.status === 401))
    throw new ErrorArgs(`Microsoft no dio permiso para ${que}. Vuelve a conectar la app para darle ese permiso: [Volver a conectar](/panel?conectar=${app})`);
  throw e;
}

/* ---------------- Calendario de Outlook ---------------- */

type EventoM = {
  id?: string;
  subject?: string;
  isAllDay?: boolean;
  isCancelled?: boolean;
  showAs?: string;
  attendees?: unknown[];
  start?: { dateTime?: string };
  end?: { dateTime?: string };
};

const horas = (inicio: Date, fin: Date, zona: string) => `${enZona(inicio, zona)}–${enZona(fin, zona, false)}`;

async function eventosEntre(ctx: ContextoHerramienta, desde: Date, hasta: Date): Promise<EventoM[]> {
  const q = `startDateTime=${encodeURIComponent(desde.toISOString())}&endDateTime=${encodeURIComponent(hasta.toISOString())}&$top=50&$select=id,subject,start,end,isAllDay,isCancelled,showAs,attendees`;
  const d = await pedirJson<{ value?: EventoM[] }>(`${GRAPH}/me/calendarView?${q}`, await pedido(ctx, true));
  return (d.value ?? []).filter((e) => !e.isCancelled);
}

async function ocupado(ctx: ContextoHerramienta, desde: Date, hasta: Date, ignorar?: string) {
  return (await eventosEntre(ctx, desde, hasta))
    .filter((e) => !e.isAllDay && e.showAs !== "free" && e.id !== ignorar && e.start?.dateTime && e.end?.dateTime)
    .map((e) => ({ inicio: deGraph(e.start!.dateTime), fin: deGraph(e.end!.dateTime) }));
}

const choque = (lista: { inicio: Date; fin: Date }[], zona: string) =>
  `a esa hora ya hay ${lista.length === 1 ? "otro evento" : `${lista.length} eventos`} (${lista.map((x) => horas(x.inicio, x.fin, zona)).join(", ")})`;

type Cita = { titulo: string; inicio: Date; fin: Date; descripcion: string; lugar: string; invitados: string[]; aunqueChoque: boolean };

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

function refCita(args: Record<string, unknown>, zona: string): string {
  const cuando = argTexto(args, "cuando", { max: 40 });
  const dia = argTexto(args, "dia", { max: 10 });
  const buscar = argTexto(args, "buscar", { max: 100 });
  if (cuando) return `la cita de las ${enZona(horaLocal(cuando, zona), zona, false)} del ${enZona(horaLocal(cuando, zona), zona).split(",")[0]}${buscar ? ` («${linea(buscar, 60)}»)` : ""}`;
  if (dia && /^\d{4}-\d{2}-\d{2}$/.test(dia) && buscar) return `la cita «${linea(buscar, 60)}» del ${enZona(horaLocal(`${dia}T12:00`, zona), zona).split(",")[0]}`;
  throw new ErrorArgs('Dime cuál cita: su hora de inicio ("cuando", AAAA-MM-DDTHH:MM) o el día ("dia", AAAA-MM-DD) con una palabra de su título ("buscar").');
}

async function buscarCita(ctx: ContextoHerramienta, args: Record<string, unknown>, zona: string): Promise<EventoM & { id: string }> {
  refCita(args, zona);
  const cuando = argTexto(args, "cuando", { max: 40 });
  const dia = argTexto(args, "dia", { max: 10 });
  const buscar = argTexto(args, "buscar", { max: 100 }).toLowerCase();
  const t = cuando ? horaLocal(cuando, zona) : null;
  const desde = t ? new Date(t.getTime() - MIN) : horaLocal(`${dia}T00:00`, zona);
  const hasta = t ? new Date(t.getTime() + MIN) : new Date(desde.getTime() + 24 * 60 * MIN);
  const lista = (await eventosEntre(ctx, desde, hasta)).filter(
    (e): e is EventoM & { id: string } =>
      Boolean(e.id && ID_GRAPH.test(e.id)) &&
      !e.isAllDay &&
      Boolean(e.start?.dateTime) &&
      (!t || Math.abs(deGraph(e.start!.dateTime).getTime() - t.getTime()) < MIN) &&
      (!buscar || (e.subject ?? "").toLowerCase().includes(buscar)),
  );
  if (!lista.length) throw new ErrorArgs("No encontré esa cita en el calendario de Outlook. Revisa la hora o la palabra.");
  if (lista.length > 1)
    throw new ErrorArgs(`Encontré ${lista.length} citas así (a las ${lista.map((e) => enZona(deGraph(e.start!.dateTime), zona, false)).join(", ")}). Dime la hora exacta ("cuando").`);
  return lista[0];
}

const ESQUEMA_CUAL = {
  cuando: { type: "string", description: "Hora de inicio actual de la cita, AAAA-MM-DDTHH:MM (hora local)." },
  dia: { type: "string", description: "O el día de la cita, AAAA-MM-DD (junto con «buscar»)." },
  buscar: { type: "string", description: "Una palabra de su título (por ejemplo, el nombre del cliente)." },
};

const crearCita: Herramienta = {
  nombre: "outlook_calendar_crear_evento",
  descripcion:
    "CREA una cita o evento en el calendario de Outlook del dueño. Revisa sola que no choque (si choca, no la crea y dice a qué horas está ocupado; para crearla de todos modos, vuelve a llamarla con aunque_choque: true). No hace falta ver la agenda antes. Hora local, AAAA-MM-DDTHH:MM.",
  app: "outlook_calendar",
  agentes: ["lola"],
  esquema: {
    type: "object",
    properties: {
      titulo: { type: "string" },
      inicio: { type: "string", description: "Inicio, AAAA-MM-DDTHH:MM." },
      fin: { type: "string", description: "Fin, AAAA-MM-DDTHH:MM (o usa duracion_min)." },
      duracion_min: { type: "integer", minimum: 5, maximum: 720 },
      descripcion: { type: "string" },
      lugar: { type: "string" },
      invitados: { type: "array", items: { type: "string" }, description: "Correos a invitar (Outlook les manda la invitación)." },
      aunque_choque: { type: "boolean" },
    },
    required: ["titulo", "inicio"],
    additionalProperties: false,
  },
  hace: {
    categoria: "citas",
    resumen(args, zona) {
      const c = leerCita(args, zona);
      return `Crear «${linea(c.titulo, 80)}» el ${horas(c.inicio, c.fin, zona)} en tu calendario de Outlook${c.invitados.length ? ` e invitar a ${c.invitados.join(", ")}` : ""}`;
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
      await pedirJson(`${GRAPH}/me/events`, {
        ...(await pedido(ctx)),
        metodo: "POST",
        cuerpo: {
          subject: c.titulo,
          ...(c.descripcion ? { body: { contentType: "Text", content: c.descripcion } } : {}),
          ...(c.lugar ? { location: { displayName: c.lugar } } : {}),
          start: utc(c.inicio),
          end: utc(c.fin),
          ...(c.invitados.length ? { attendees: c.invitados.map((address) => ({ emailAddress: { address }, type: "required" })) } : {}),
        },
      });
      return `Listo: quedó «${linea(c.titulo, 120)}» el ${horas(c.inicio, c.fin, zona)} en el calendario de Outlook${c.invitados.length ? `, con invitación a ${c.invitados.join(", ")}` : ""}.`;
    } catch (e) {
      if (e instanceof ErrorArgs) throw e;
      sinPermiso(e, "outlook_calendar", "crear citas en tu calendario");
    }
  },
};

const moverCita: Herramienta = {
  nombre: "outlook_calendar_mover_evento",
  descripcion:
    "MUEVE una cita del calendario de Outlook del dueño a otra hora (conserva su duración si no das «nuevo_fin»). Dile cuál con su hora actual («cuando») o con el día y una palabra del título. Revisa sola que no choque.",
  app: "outlook_calendar",
  agentes: ["lola"],
  esquema: {
    type: "object",
    properties: { ...ESQUEMA_CUAL, nuevo_inicio: { type: "string" }, nuevo_fin: { type: "string" }, aunque_choque: { type: "boolean" } },
    required: ["nuevo_inicio"],
    additionalProperties: false,
  },
  hace: {
    categoria: "citas",
    resumen(args, zona) {
      const nuevo = horaLocal(argTexto(args, "nuevo_inicio", { requerido: true, max: 40 }), zona);
      return `Mover ${refCita(args, zona)} al ${enZona(nuevo, zona)} en tu calendario de Outlook`;
    },
  },
  async ejecutar(args, ctx) {
    const zona = zonaDe(ctx);
    const nuevoInicio = horaLocal(argTexto(args, "nuevo_inicio", { requerido: true, max: 40 }), zona);
    if (nuevoInicio.getTime() < Date.now() - 60 * MIN) throw new ErrorArgs("La nueva hora ya pasó.");
    try {
      const ev = await buscarCita(ctx, args, zona);
      const antes = deGraph(ev.start!.dateTime);
      const dura = deGraph(ev.end?.dateTime ?? ev.start!.dateTime).getTime() - antes.getTime();
      const finTxt = argTexto(args, "nuevo_fin", { max: 40 });
      const nuevoFin = finTxt ? horaLocal(finTxt, zona) : new Date(nuevoInicio.getTime() + Math.max(dura, 5 * MIN));
      if (nuevoFin.getTime() <= nuevoInicio.getTime()) throw new ErrorArgs("La cita tiene que terminar después de empezar.");
      if (args.aunque_choque !== true) {
        const ya = await ocupado(ctx, nuevoInicio, nuevoFin, ev.id);
        if (ya.length) throw new ErrorArgs(`No la moví: ${choque(ya, zona)}. Propón otra hora, o muévela de todos modos con aunque_choque si el dueño lo pide.`);
      }
      await pedirJson(`${GRAPH}/me/events/${encodeURIComponent(ev.id)}`, { ...(await pedido(ctx)), metodo: "PATCH", cuerpo: { start: utc(nuevoInicio), end: utc(nuevoFin) } });
      return `Listo: moví la cita del ${enZona(antes, zona)} al ${horas(nuevoInicio, nuevoFin, zona)}${ev.attendees?.length ? " (Outlook les avisa a los invitados)" : ""}.`;
    } catch (e) {
      if (e instanceof ErrorArgs) throw e;
      sinPermiso(e, "outlook_calendar", "mover citas en tu calendario");
    }
  },
};

const cancelarCita: Herramienta = {
  nombre: "outlook_calendar_cancelar_evento",
  descripcion: "CANCELA (borra) una cita del calendario de Outlook del dueño. Dile cuál con su hora («cuando») o con el día y una palabra del título.",
  app: "outlook_calendar",
  agentes: ["lola"],
  esquema: { type: "object", properties: ESQUEMA_CUAL, additionalProperties: false },
  hace: { categoria: "citas", resumen: (args, zona) => `Cancelar ${refCita(args, zona)} en tu calendario de Outlook` },
  async ejecutar(args, ctx) {
    const zona = zonaDe(ctx);
    try {
      const ev = await buscarCita(ctx, args, zona);
      await pedirJson(`${GRAPH}/me/events/${encodeURIComponent(ev.id)}`, { ...(await pedido(ctx)), metodo: "DELETE" });
      return `Listo: cancelé la cita del ${enZona(deGraph(ev.start!.dateTime), zona)}.`;
    } catch (e) {
      if (e instanceof ErrorArgs) throw e;
      sinPermiso(e, "outlook_calendar", "cancelar citas en tu calendario");
    }
  },
};

/* ---------------- Correo de Outlook ---------------- */

const outlookEnviar: Herramienta = {
  nombre: "outlook_enviar_correo",
  descripcion:
    "MANDA un correo desde el Outlook del dueño, o contesta uno: con «responder_a» (el id que dio outlook_buscar_correos) va en la misma conversación. «para» siempre: los correos de los destinatarios. Texto simple.",
  app: "outlook",
  agentes: ["clara"],
  esquema: {
    type: "object",
    properties: {
      para: { type: "array", items: { type: "string" } },
      asunto: { type: "string", description: "Asunto (en una respuesta se usa el del correo original)." },
      texto: { type: "string" },
      responder_a: { type: "string", description: "Id del correo de Outlook que se contesta (opcional)." },
    },
    required: ["para", "texto"],
    additionalProperties: false,
  },
  hace: {
    categoria: "correos",
    resumen(args) {
      const para = argCorreos(args, "para", { requerido: true });
      const asunto = argTexto(args, "asunto", { max: 200 }).replace(/[\r\n]+/g, " ");
      const texto = argTexto(args, "texto", { requerido: true, max: 20_000 });
      const responde = argTexto(args, "responder_a", { max: 400 });
      return `${responde ? "Contestar un correo de" : "Mandar un correo a"} ${para.join(", ")}${asunto ? ` («${linea(asunto, 80)}»)` : ""} desde tu Outlook: «${linea(texto, 180)}»`;
    },
  },
  async ejecutar(args, ctx) {
    const para = argCorreos(args, "para", { requerido: true });
    const texto = argTexto(args, "texto", { requerido: true, max: 20_000 });
    const asunto = argTexto(args, "asunto", { max: 200 }).replace(/[\r\n]+/g, " ");
    const responde = argTexto(args, "responder_a", { max: 400, patron: ID_GRAPH });
    const destinatarios = para.map((address) => ({ emailAddress: { address } }));
    try {
      if (responde) {
        await pedirJson(`${GRAPH}/me/messages/${encodeURIComponent(responde)}/reply`, {
          ...(await pedido(ctx)),
          metodo: "POST",
          cuerpo: { message: { toRecipients: destinatarios }, comment: texto },
        });
        return `Listo: contesté el correo a ${para.join(", ")} desde tu Outlook.`;
      }
      if (!asunto) throw new ErrorArgs("Falta el asunto del correo.");
      await pedirJson(`${GRAPH}/me/sendMail`, {
        ...(await pedido(ctx)),
        metodo: "POST",
        cuerpo: { message: { subject: asunto, body: { contentType: "Text", content: texto }, toRecipients: destinatarios }, saveToSentItems: true },
      });
      return `Listo: mandé el correo a ${para.join(", ")} («${linea(asunto, 120)}») desde tu Outlook.`;
    } catch (e) {
      if (e instanceof ErrorArgs) throw e;
      sinPermiso(e, "outlook", "mandar correos desde tu Outlook");
    }
  },
};

/* ---------------- Microsoft To Do ---------------- */

type ListaM = { id: string; displayName?: string; wellknownListName?: string };
type TareaM = { id: string; title?: string; status?: string; dueDateTime?: { dateTime?: string } };

async function listas(ctx: ContextoHerramienta): Promise<ListaM[]> {
  const d = await pedirJson<{ value?: ListaM[] }>(`${GRAPH}/me/todo/lists?$top=20`, await pedido(ctx));
  return (d.value ?? []).filter((l) => l.id && ID_GRAPH.test(l.id));
}

async function listaElegida(ctx: ContextoHerramienta, nombre: string): Promise<ListaM> {
  const todas = await listas(ctx);
  if (!todas.length) throw new ErrorArgs("No encontré listas en Microsoft To Do.");
  if (!nombre) return todas.find((l) => l.wellknownListName === "defaultList") ?? todas[0];
  const l = todas.find((x) => (x.displayName ?? "").toLowerCase() === nombre.toLowerCase()) ?? todas.find((x) => (x.displayName ?? "").toLowerCase().includes(nombre.toLowerCase()));
  if (!l) throw new ErrorArgs(`No encontré la lista «${linea(nombre, 60)}». Hay: ${todas.map((x) => linea(x.displayName, 40)).join(", ")}.`);
  return l;
}

const pendientesDe = async (ctx: ContextoHerramienta, l: ListaM) =>
  (await pedirJson<{ value?: TareaM[] }>(`${GRAPH}/me/todo/lists/${encodeURIComponent(l.id)}/tasks?$top=50&$filter=${encodeURIComponent("status ne 'completed'")}`, await pedido(ctx))).value ?? [];

const todoVer: Herramienta = {
  nombre: "microsoft_todo_ver",
  descripcion: "Ve los pendientes (sin terminar) de Microsoft To Do del dueño, lista por lista. Solo lectura.",
  app: "microsoft_todo",
  agentes: ["iris"],
  esquema: { type: "object", properties: {}, additionalProperties: false },
  async ejecutar(_args, ctx) {
    const todas = (await listas(ctx)).slice(0, 6);
    if (!todas.length) return "No hay listas en Microsoft To Do.";
    const partes = await Promise.all(
      todas.map(async (l) => {
        const t = (await pendientesDe(ctx, l)).filter((x) => x.title);
        return [`Lista «${linea(l.displayName, 60)}» (${t.length} pendientes):`, ...t.slice(0, 30).map((x) => `- ${linea(x.title, 160)}${x.dueDateTime?.dateTime ? ` (para el ${x.dueDateTime.dateTime.slice(0, 10)})` : ""}`)].join("\n");
      }),
    );
    return partes.join("\n\n");
  },
};

const todoCrear: Herramienta = {
  nombre: "microsoft_todo_crear",
  descripcion: "CREA una tarea en Microsoft To Do del dueño (en su lista principal o en la que digas), con fecha opcional.",
  app: "microsoft_todo",
  agentes: ["iris"],
  esquema: {
    type: "object",
    properties: { titulo: { type: "string" }, notas: { type: "string" }, fecha: { type: "string", description: "AAAA-MM-DD (opcional)." }, lista: { type: "string" } },
    required: ["titulo"],
    additionalProperties: false,
  },
  hace: {
    categoria: "apps",
    resumen(args) {
      const titulo = argTexto(args, "titulo", { requerido: true, max: 200 });
      const fecha = argTexto(args, "fecha", { max: 10, patron: /^\d{4}-\d{2}-\d{2}$/ });
      return `Crear la tarea «${linea(titulo, 100)}»${fecha ? ` para el ${fecha}` : ""} en Microsoft To Do`;
    },
  },
  async ejecutar(args, ctx) {
    const titulo = argTexto(args, "titulo", { requerido: true, max: 200 });
    const fecha = argTexto(args, "fecha", { max: 10, patron: /^\d{4}-\d{2}-\d{2}$/ });
    const notas = argTexto(args, "notas", { max: 2000 });
    try {
      const l = await listaElegida(ctx, argTexto(args, "lista", { max: 80 }));
      await pedirJson(`${GRAPH}/me/todo/lists/${encodeURIComponent(l.id)}/tasks`, {
        ...(await pedido(ctx)),
        metodo: "POST",
        cuerpo: {
          title: titulo,
          ...(notas ? { body: { content: notas, contentType: "text" } } : {}),
          ...(fecha ? { dueDateTime: { dateTime: `${fecha}T12:00:00`, timeZone: "UTC" } } : {}),
        },
      });
      return `Listo: creé la tarea «${linea(titulo, 120)}»${fecha ? ` para el ${fecha}` : ""} en la lista «${linea(l.displayName, 60)}».`;
    } catch (e) {
      if (e instanceof ErrorArgs) throw e;
      sinPermiso(e, "microsoft_todo", "crear tareas");
    }
  },
};

const todoCompletar: Herramienta = {
  nombre: "microsoft_todo_completar",
  descripcion: "MARCA COMO HECHA una tarea pendiente de Microsoft To Do del dueño, buscándola por una parte de su título.",
  app: "microsoft_todo",
  agentes: ["iris"],
  esquema: { type: "object", properties: { titulo: { type: "string" }, lista: { type: "string" } }, required: ["titulo"], additionalProperties: false },
  hace: {
    categoria: "apps",
    resumen: (args) => `Marcar como hecha la tarea «${linea(argTexto(args, "titulo", { requerido: true, max: 200 }), 100)}» en Microsoft To Do`,
  },
  async ejecutar(args, ctx) {
    const buscar = argTexto(args, "titulo", { requerido: true, max: 200 }).toLowerCase();
    try {
      const l = await listaElegida(ctx, argTexto(args, "lista", { max: 80 }));
      const t = (await pendientesDe(ctx, l)).filter((x) => (x.title ?? "").toLowerCase().includes(buscar) && ID_GRAPH.test(x.id));
      if (!t.length) throw new ErrorArgs("No encontré una tarea pendiente con ese título.");
      if (t.length > 1) throw new ErrorArgs(`Hay ${t.length} tareas que coinciden; dime el título más completo.`);
      await pedirJson(`${GRAPH}/me/todo/lists/${encodeURIComponent(l.id)}/tasks/${encodeURIComponent(t[0].id)}`, { ...(await pedido(ctx)), metodo: "PATCH", cuerpo: { status: "completed" } });
      return `Listo: marqué como hecha la tarea que dice «${linea(buscar, 120)}».`;
    } catch (e) {
      if (e instanceof ErrorArgs) throw e;
      sinPermiso(e, "microsoft_todo", "cambiar tus tareas");
    }
  },
};

export const ACCIONES_MICROSOFT: Herramienta[] = [crearCita, moverCita, cancelarCita, outlookEnviar, todoVer, todoCrear, todoCompletar];
