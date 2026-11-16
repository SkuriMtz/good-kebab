import type { Adaptador, Tokens } from "@/lib/nucleo-tipos";
import { ErrorProveedor, argEntero, argTexto, consulta, esquema, fecha, herramienta, linea, normalizar, pedir, pedirJson, unir } from "./_comun-1";

/**
 * TRELLO (por llave; developer.atlassian.com/cloud/trello, nov 2026):
 * - La persona pega "API key:token": la API key de su Power-Up
 *   (trello.com/power-ups/admin) y el token que genera con esa key.
 * - Se mandan en el encabezado Authorization
 *   (OAuth oauth_consumer_key="…", oauth_token="…"), no en la URL.
 * - Lee: members/me, members/me/boards, boards/{id}/lists con sus tarjetas
 *   y search (tarjetas).
 * - Al desconectar se borra el token en Trello (DELETE /1/tokens/{token}).
 */

const NOMBRE = "Trello";
const API = "https://api.trello.com/1";

function partes(llave: string) {
  const i = llave.indexOf(":");
  const key = (i > 0 ? llave.slice(0, i) : "").trim();
  const token = (i > 0 ? llave.slice(i + 1) : "").trim();
  if (!/^[A-Za-z0-9]{20,64}$/.test(key) || !/^[A-Za-z0-9]{32,300}$/.test(token))
    throw new ErrorProveedor('Pega la llave de Trello como "API key:token" (las dos partes separadas por dos puntos).');
  return { key, token };
}

const autorizacion = (key: string, token: string) => `OAuth oauth_consumer_key="${key}", oauth_token="${token}"`;

function api<T>(t: Tokens, ruta: string, params: Record<string, string | number | boolean | undefined> = {}, senal?: AbortSignal) {
  const key = t.extra?.api_key;
  if (!key) throw new ErrorProveedor("Falta la API key de Trello. Vuelve a pegar tu llave.");
  return pedirJson<T>(NOMBRE, `${API}${ruta}${consulta(params)}`, {
    encabezados: { Authorization: autorizacion(key, t.access_token), Accept: "application/json" },
    senal,
    interpretar: (estado) => (estado === 401 ? "Trello no reconoció la llave. Revisa tu API key y tu token." : undefined),
  });
}

type Tarjeta = { id: string; name?: string; due?: string | null; dueComplete?: boolean; desc?: string; url?: string; labels?: { name?: string }[]; idBoard?: string; board?: { name?: string } };
type Lista = { id: string; name?: string; cards?: Tarjeta[] };

const filaTarjeta = (c: Tarjeta, lista?: string) =>
  `- ${unir(
    linea(c.name, 120),
    lista ? `en "${linea(lista, 60)}"` : c.board?.name ? `tablero "${linea(c.board.name, 60)}"` : "",
    c.due ? `vence ${fecha(c.due)}${c.dueComplete ? " (hecha)" : ""}` : "",
    (c.labels ?? []).map((l) => l.name).filter(Boolean).join(", "),
    c.desc ? linea(c.desc, 160) : "",
  )}`;

export const adaptador: Adaptador = {
  proveedor: "trello",
  autenticacion: "llave",
  variables: [],

  async validarLlave(llave) {
    const { key, token } = partes(llave);
    const t: Tokens = { access_token: token, extra: { api_key: key } };
    const yo = await api<{ id?: string; fullName?: string; username?: string }>(t, "/members/me", { fields: "fullName,username" });
    if (yo.username) t.extra!.usuario = yo.username;
    if (yo.fullName) t.extra!.nombre = yo.fullName;
    return t;
  },

  async revocar(t) {
    const key = t.extra?.api_key;
    if (!key) return;
    await pedir(NOMBRE, `${API}/tokens/${encodeURIComponent(t.access_token)}`, {
      metodo: "DELETE",
      encabezados: { Authorization: autorizacion(key, t.access_token) },
    }).catch(() => undefined);
  },

  async cuenta(t) {
    if (t.extra?.nombre || t.extra?.usuario) return unir(t.extra.nombre, t.extra.usuario ? `@${t.extra.usuario}` : "");
    const yo = await api<{ fullName?: string; username?: string }>(t, "/members/me", { fields: "fullName,username" });
    return unir(yo.fullName, yo.username ? `@${yo.username}` : "") || "Cuenta de Trello";
  },

  herramientas: [
    herramienta({
      nombre: "trello_crear_tarjeta",
      descripcion:
        "CREA una tarjeta en un tablero de Trello del dueño (en la lista que digas o en la primera del tablero), con descripción y fecha opcionales. El tablero y la lista se buscan por su nombre.",
      app: "trello",
      agentes: ["iris"],
      proveedor: NOMBRE,
      esquema: esquema(
        {
          tablero: { type: "string", description: "Nombre del tablero (o una parte)." },
          lista: { type: "string", description: "Nombre de la lista (opcional; por omisión, la primera del tablero)." },
          titulo: { type: "string", description: "Título de la tarjeta." },
          descripcion: { type: "string" },
          fecha: { type: "string", description: "Para cuándo, AAAA-MM-DD (opcional)." },
        },
        ["tablero", "titulo"],
      ),
      hace: {
        categoria: "apps",
        resumen(args) {
          const titulo = argTexto(args, "titulo", 200);
          const tablero = argTexto(args, "tablero", 100);
          if (!titulo || !tablero) throw new ErrorProveedor("Falta el tablero o el título de la tarjeta.");
          const lista = argTexto(args, "lista", 100);
          return `Crear la tarjeta «${linea(titulo, 100)}» en Trello (tablero «${linea(tablero, 60)}»${lista ? `, lista «${linea(lista, 60)}»` : ""})`;
        },
      },
      async ejecutar(args, ctx) {
        const titulo = argTexto(args, "titulo", 200);
        const tablero = normalizar(argTexto(args, "tablero", 100));
        const lista = normalizar(argTexto(args, "lista", 100));
        const fechaTxt = argTexto(args, "fecha", 10);
        if (!titulo || !tablero) throw new ErrorProveedor("Falta el tablero o el título de la tarjeta.");
        if (fechaTxt && !/^\d{4}-\d{2}-\d{2}$/.test(fechaTxt)) throw new ErrorProveedor("La fecha va como AAAA-MM-DD.");
        const t = await ctx.token();
        const tableros = await api<{ id: string; name?: string }[]>(t, "/members/me/boards", { fields: "name", filter: "open" }, ctx.senal);
        const coinciden = tableros.filter((b) => normalizar(b.name ?? "").includes(tablero));
        const b = coinciden.find((x) => normalizar(x.name ?? "") === tablero) ?? (coinciden.length === 1 ? coinciden[0] : null);
        if (!b) throw new ErrorProveedor(coinciden.length ? `Hay ${coinciden.length} tableros con ese nombre; dime el nombre completo.` : "No encontré ese tablero en Trello.");
        const listas = await api<Lista[]>(t, `/boards/${b.id}/lists`, { fields: "name", filter: "open" }, ctx.senal);
        const l = lista ? (listas.find((x) => normalizar(x.name ?? "") === lista) ?? listas.find((x) => normalizar(x.name ?? "").includes(lista))) : listas[0];
        if (!l) throw new ErrorProveedor(lista ? `No encontré esa lista en «${linea(b.name, 60)}».` : "Ese tablero no tiene listas.");
        const key = t.extra?.api_key;
        if (!key) throw new ErrorProveedor("Falta la API key de Trello. Vuelve a pegar tu llave.");
        await pedirJson(NOMBRE, `${API}/cards${consulta({ idList: l.id, name: titulo, desc: argTexto(args, "descripcion", 5000) || undefined, due: fechaTxt ? `${fechaTxt}T18:00:00.000Z` : undefined, pos: "top" })}`, {
          metodo: "POST",
          encabezados: { Authorization: autorizacion(key, t.access_token), Accept: "application/json" },
          senal: ctx.senal,
          interpretar: (estado) =>
            estado === 401 || estado === 403 ? "Trello no dio permiso para crear tarjetas: genera tu token con permiso de escribir (read,write) y vuelve a pegar tu llave." : undefined,
        });
        return `Listo: creé la tarjeta «${linea(titulo, 120)}» en «${linea(b.name, 60)}» → «${linea(l.name, 60)}».`;
      },
    }),
    herramienta({
      nombre: "trello_tableros",
      descripcion: "Lista los tableros abiertos de Trello de la persona (nombre, id y última actividad). Solo lectura.",
      app: "trello",
      agentes: ["iris"],
      proveedor: NOMBRE,
      esquema: esquema({}),
      async ejecutar(_args, ctx) {
        const t = await ctx.token();
        const tableros = await api<{ id: string; name?: string; url?: string; dateLastActivity?: string }[]>(
          t,
          "/members/me/boards",
          { filter: "open", fields: "name,url,dateLastActivity" },
          ctx.senal,
        );
        if (!tableros.length) return "No hay tableros abiertos en Trello.";
        return [
          `Tableros de Trello (${tableros.length}):`,
          ...tableros.map((b) => `- ${unir(linea(b.name, 100), `id ${b.id}`, b.dateLastActivity ? `actividad ${fecha(b.dateLastActivity)}` : "", b.url)}`),
        ].join("\n");
      },
    }),
    herramienta({
      nombre: "trello_tarjetas",
      descripcion:
        "Lee las tarjetas abiertas de un tablero de Trello agrupadas por lista (con fecha de vencimiento, etiquetas y descripción), o busca tarjetas en todos los tableros. Solo lectura.",
      app: "trello",
      agentes: ["iris"],
      proveedor: NOMBRE,
      esquema: esquema({
        tablero_id: { type: "string", description: "Id del tablero (de trello_tableros). Si no se da, se busca en todos los tableros." },
        buscar: { type: "string", description: "Texto para filtrar o buscar tarjetas." },
        limite: { type: "integer", minimum: 1, maximum: 50, description: "Cuántas tarjetas como máximo. Por defecto 30." },
      }),
      async ejecutar(args, ctx) {
        const t = await ctx.token();
        const tablero = argTexto(args, "tablero_id", 40);
        const buscar = argTexto(args, "buscar", 200);
        const limite = argEntero(args, "limite", 30, 1, 50);
        if (tablero) {
          if (!/^[A-Za-z0-9]{8,24}$/.test(tablero)) throw new ErrorProveedor("Ese id de tablero de Trello no es válido. Usa trello_tableros para verlo.");
          const listas = await api<Lista[]>(
            t,
            `/boards/${tablero}/lists`,
            { cards: "open", card_fields: "name,due,dueComplete,desc,labels,url", fields: "name", filter: "open" },
            ctx.senal,
          );
          const q = normalizar(buscar);
          const filas: string[] = [];
          for (const l of listas) {
            for (const c of l.cards ?? []) {
              if (filas.length >= limite) break;
              if (q && !normalizar(`${c.name ?? ""} ${c.desc ?? ""}`).includes(q)) continue;
              filas.push(filaTarjeta(c, l.name));
            }
          }
          if (!filas.length) return buscar ? `No hay tarjetas con "${buscar}" en ese tablero.` : "Ese tablero no tiene tarjetas abiertas.";
          return [`Tarjetas del tablero (${filas.length}):`, ...filas].join("\n");
        }
        if (!buscar) throw new ErrorProveedor("Dime el tablero (tablero_id) o qué tarjetas buscar.");
        const r = await api<{ cards?: Tarjeta[] }>(
          t,
          "/search",
          { query: buscar, modelTypes: "cards", cards_limit: limite, card_fields: "name,due,dueComplete,desc,labels,url,idBoard", card_board: true, board_fields: "name" },
          ctx.senal,
        );
        const tarjetas = r.cards ?? [];
        if (!tarjetas.length) return `No encontré tarjetas con "${buscar}" en Trello.`;
        return [`Tarjetas de Trello con "${buscar}" (${tarjetas.length}):`, ...tarjetas.map((c) => filaTarjeta(c))].join("\n");
      },
    }),
  ],
};

/** Con el nombre del proveedor, como lo importa el registro. */
export { adaptador as trello };
