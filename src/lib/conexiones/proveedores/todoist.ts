import type { Adaptador, Tokens } from "@/lib/nucleo-tipos";
import { ErrorProveedor, argEntero, argTexto, consulta, esquema, herramienta, linea, normalizar, pedirJson, unir } from "./_comun-1";

/**
 * TODOIST (por llave; developer.todoist.com, API v1, nov 2026):
 * - La persona copia su token en Todoist → Configuración → Integraciones →
 *   Desarrollador ("Token de la API") y lo pega en la tarjeta. Va solo del
 *   servidor a Todoist (Authorization: Bearer), nunca al navegador.
 * - Base https://api.todoist.com/api/v1: /user, /projects, /tasks,
 *   /tasks/filter (filtros de Todoist: "today | overdue"), /tasks/{id}/close.
 *   La API REST v2 vieja ya no sirve (responde 410).
 * - Lee pendientes, CREA tareas (con fecha en palabras: "mañana a las 5") y
 *   las marca como hechas, según «Qué hace solo» (categoría apps).
 */

const NOMBRE = "Todoist";
const API = "https://api.todoist.com/api/v1";

type Tarea = { id: string; content?: string; description?: string; due?: { date?: string; string?: string; datetime?: string } | null; priority?: number; project_id?: string };
type Proyecto = { id: string; name?: string };

function api<T>(t: Tokens, ruta: string, o: { params?: Record<string, string | number | undefined>; senal?: AbortSignal; metodo?: "GET" | "POST"; cuerpo?: unknown } = {}) {
  return pedirJson<T>(NOMBRE, `${API}${ruta}${consulta(o.params ?? {})}`, {
    metodo: o.metodo,
    encabezados: { Authorization: `Bearer ${t.access_token}`, Accept: "application/json", ...(o.cuerpo !== undefined ? { "Content-Type": "application/json" } : {}) },
    cuerpo: o.cuerpo !== undefined ? JSON.stringify(o.cuerpo) : undefined,
    senal: o.senal,
    interpretar: (estado) => {
      if (estado === 401 || estado === 403) return { mensaje: "Todoist no reconoció tu token. Cópialo otra vez de Configuración → Integraciones → Desarrollador.", status: 401 };
      if (estado === 404) return "No encontré eso en Todoist.";
      return undefined;
    },
  });
}

const PRIORIDAD: Record<number, string> = { 4: "urgente", 3: "alta", 2: "media" };
const fila = (x: Tarea) =>
  `- ${unir(linea(x.content, 160), x.due?.string || x.due?.date ? `para ${linea(x.due?.string || x.due?.date, 40)}` : "", PRIORIDAD[x.priority ?? 1] ?? "", x.description ? linea(x.description, 120) : "")}`;

async function proyectoPorNombre(t: Tokens, nombre: string, senal?: AbortSignal): Promise<Proyecto | null> {
  if (!nombre) return null;
  const d = await api<{ results?: Proyecto[] }>(t, "/projects", { params: { limit: 100 }, senal });
  const buscado = normalizar(nombre);
  const lista = d.results ?? [];
  const p = lista.find((x) => normalizar(x.name ?? "") === buscado) ?? lista.find((x) => normalizar(x.name ?? "").includes(buscado));
  if (!p) throw new ErrorProveedor(`No encontré el proyecto «${linea(nombre, 60)}» en Todoist.`);
  return p;
}

export const adaptador: Adaptador = {
  proveedor: "todoist",
  autenticacion: "llave",
  variables: [],

  async validarLlave(llave) {
    const token = llave.trim();
    if (!/^[A-Za-z0-9]{20,100}$/.test(token)) throw new ErrorProveedor("Ese no parece un token de Todoist. Cópialo de Configuración → Integraciones → Desarrollador.");
    const t: Tokens = { access_token: token, extra: {} };
    const yo = await api<{ email?: string; full_name?: string }>(t, "/user");
    if (yo.email) t.extra!.correo = yo.email;
    if (yo.full_name) t.extra!.nombre = yo.full_name;
    return t;
  },

  async cuenta(t) {
    return (t.extra?.correo || t.extra?.nombre || "Cuenta de Todoist") as string;
  },

  herramientas: [
    herramienta({
      nombre: "todoist_pendientes",
      descripcion:
        "Lee las tareas pendientes de Todoist del dueño: las de hoy y las atrasadas (por omisión), las de un proyecto, o las que coincidan con un filtro de Todoist. Solo lectura.",
      app: "todoist",
      agentes: ["iris"],
      proveedor: NOMBRE,
      esquema: esquema({
        proyecto: { type: "string", description: "Nombre del proyecto (opcional)." },
        filtro: { type: "string", description: 'Filtro de Todoist (opcional), por ejemplo "7 days" o "p1".' },
        limite: { type: "integer", minimum: 1, maximum: 50, description: "Cuántas como máximo. Por defecto 30." },
      }),
      async ejecutar(args, ctx) {
        const t = await ctx.token();
        const limite = argEntero(args, "limite", 30, 1, 50);
        const p = await proyectoPorNombre(t, argTexto(args, "proyecto", 100), ctx.senal);
        const filtro = argTexto(args, "filtro", 200);
        const d = p
          ? await api<{ results?: Tarea[] }>(t, "/tasks", { params: { project_id: p.id, limit: limite }, senal: ctx.senal })
          : await api<{ results?: Tarea[] }>(t, "/tasks/filter", { params: { query: filtro || "today | overdue", lang: "es", limit: limite }, senal: ctx.senal });
        const lista = d.results ?? [];
        const que = p ? `del proyecto «${linea(p.name, 60)}»` : filtro ? `con «${linea(filtro, 60)}»` : "de hoy y atrasadas";
        if (!lista.length) return `No hay tareas pendientes ${que} en Todoist.`;
        return [`Tareas pendientes ${que} en Todoist (${lista.length}):`, ...lista.map(fila)].join("\n");
      },
    }),
    herramienta({
      nombre: "todoist_crear_tarea",
      descripcion:
        "CREA una tarea en Todoist del dueño. «cuando» va en palabras, como en Todoist (por ejemplo «mañana a las 5pm», «cada lunes», «20 nov»). Proyecto opcional (por su nombre).",
      app: "todoist",
      agentes: ["iris"],
      proveedor: NOMBRE,
      esquema: esquema(
        {
          titulo: { type: "string" },
          descripcion: { type: "string" },
          cuando: { type: "string", description: "Fecha en palabras (opcional)." },
          proyecto: { type: "string", description: "Nombre del proyecto (opcional)." },
          prioridad: { type: "integer", minimum: 1, maximum: 4, description: "1 normal … 4 urgente (opcional)." },
        },
        ["titulo"],
      ),
      hace: {
        categoria: "apps",
        resumen(args) {
          const titulo = argTexto(args, "titulo", 300);
          if (!titulo) throw new ErrorProveedor("Falta el título de la tarea.");
          const cuando = argTexto(args, "cuando", 100);
          const proyecto = argTexto(args, "proyecto", 100);
          return `Crear la tarea «${linea(titulo, 100)}»${cuando ? ` para ${linea(cuando, 40)}` : ""} en Todoist${proyecto ? ` (proyecto «${linea(proyecto, 40)}»)` : ""}`;
        },
      },
      async ejecutar(args, ctx) {
        const titulo = argTexto(args, "titulo", 300);
        if (!titulo) throw new ErrorProveedor("Falta el título de la tarea.");
        const t = await ctx.token();
        const p = await proyectoPorNombre(t, argTexto(args, "proyecto", 100), ctx.senal);
        const cuando = argTexto(args, "cuando", 100);
        const prioridad = argEntero(args, "prioridad", 1, 1, 4);
        const nueva = await api<Tarea>(t, "/tasks", {
          metodo: "POST",
          senal: ctx.senal,
          cuerpo: {
            content: titulo,
            ...(argTexto(args, "descripcion", 2000) ? { description: argTexto(args, "descripcion", 2000) } : {}),
            ...(cuando ? { due_string: cuando, due_lang: "es" } : {}),
            ...(p ? { project_id: p.id } : {}),
            ...(prioridad > 1 ? { priority: prioridad } : {}),
          },
        });
        const para = nueva.due?.string || nueva.due?.date;
        return `Listo: creé la tarea «${linea(titulo, 120)}»${para ? ` para ${linea(para, 40)}` : ""} en Todoist${p ? ` (proyecto «${linea(p.name, 40)}»)` : ""}.`;
      },
    }),
    herramienta({
      nombre: "todoist_completar",
      descripcion: "MARCA COMO HECHA una tarea pendiente de Todoist del dueño, buscándola por una parte de su título.",
      app: "todoist",
      agentes: ["iris"],
      proveedor: NOMBRE,
      esquema: esquema({ titulo: { type: "string", description: "El título de la tarea o una parte." } }, ["titulo"]),
      hace: {
        categoria: "apps",
        resumen(args) {
          const titulo = argTexto(args, "titulo", 300);
          if (!titulo) throw new ErrorProveedor("Falta el título de la tarea.");
          return `Marcar como hecha la tarea «${linea(titulo, 100)}» en Todoist`;
        },
      },
      async ejecutar(args, ctx) {
        const buscado = normalizar(argTexto(args, "titulo", 300));
        if (!buscado) throw new ErrorProveedor("Falta el título de la tarea.");
        const t = await ctx.token();
        // Las pendientes de los próximos 30 días, las atrasadas y las sin fecha
        const d = await api<{ results?: Tarea[] }>(t, "/tasks/filter", { params: { query: "30 days | overdue | no date", lang: "en", limit: 200 }, senal: ctx.senal });
        const lista = (d.results ?? []).filter((x) => /^[A-Za-z0-9]{1,40}$/.test(x.id) && normalizar(x.content ?? "").includes(buscado));
        if (!lista.length) throw new ErrorProveedor("No encontré una tarea pendiente con ese título.");
        if (lista.length > 1) throw new ErrorProveedor(`Hay ${lista.length} tareas que coinciden; dime el título más completo.`);
        await api(t, `/tasks/${lista[0].id}/close`, { metodo: "POST", senal: ctx.senal });
        return `Listo: marqué como hecha la tarea que dice «${linea(argTexto(args, "titulo", 300), 120)}».`;
      },
    }),
  ],
};

export { adaptador as todoist };
