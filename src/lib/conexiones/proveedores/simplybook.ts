import type { Adaptador, Tokens } from "@/lib/nucleo-tipos";
import { ErrorProveedor, argEntero, argTexto, esquema, herramienta, linea, pedirJson, unir } from "./_comun-1";

/**
 * SIMPLYBOOK.ME (por llave; simplybook.me/en/api/developer-api, nov 2026):
 * - API JSON-RPC 2.0. Para la parte de administración, getUserToken en
 *   https://user-api.simplybook.me/login con (empresa, usuario, API User Key).
 *   La API User Key empieza con "api_user_key_" y se crea en SimplyBook →
 *   Settings → API User Keys; a diferencia de la contraseña, no pide 2FA.
 * - Luego, en https://user-api.simplybook.me/admin/ con los encabezados
 *   X-Company-Login y X-User-Token: getBookings, getClientList y
 *   getEventList. El token dura poco, así que se pide uno en cada consulta.
 * - La persona pega "empresa:usuario:api_user_key_…". Nunca su contraseña.
 */

const NOMBRE = "SimplyBook.me";
const BASE = "https://user-api.simplybook.me";

function partes(llave: string) {
  const [empresa, usuario, ...resto] = llave.split(":");
  const clave = resto.join(":").trim();
  if (!/^[a-z0-9_-]{2,64}$/i.test(empresa?.trim() ?? "") || !usuario?.trim() || !/^api_user_key_[A-Za-z0-9]{8,200}$/.test(clave))
    throw new ErrorProveedor('Pega la llave de SimplyBook.me como "empresa:usuario:api_user_key_…" (la API User Key se crea en Settings → API User Keys).');
  return { empresa: empresa.trim(), usuario: usuario.trim(), clave };
}

type Rpc<T> = { result?: T; error?: { code?: number; message?: string } };

async function rpc<T>(url: string, metodo: string, params: unknown[], encabezados: Record<string, string> = {}, senal?: AbortSignal): Promise<T> {
  const r = await pedirJson<Rpc<T>>(NOMBRE, url, {
    metodo: "POST",
    encabezados: { "Content-Type": "application/json", Accept: "application/json", ...encabezados },
    cuerpo: JSON.stringify({ jsonrpc: "2.0", method: metodo, params, id: 1 }),
    senal,
  });
  if (r.error) {
    const auth = /token|auth|login|key|password/i.test(r.error.message ?? "");
    throw new ErrorProveedor(
      auth ? "SimplyBook.me no reconoció la llave. Revisa la empresa, el usuario y la API User Key." : "SimplyBook.me no dejó hacer la consulta en este momento.",
      auth ? 401 : 0,
    );
  }
  return r.result as T;
}

async function sesion(t: Tokens, senal?: AbortSignal) {
  const empresa = t.extra?.empresa;
  const usuario = t.extra?.usuario;
  if (!empresa || !usuario) throw new ErrorProveedor("Faltan datos de SimplyBook.me. Vuelve a pegar tu llave.");
  const token = await rpc<string>(`${BASE}/login`, "getUserToken", [empresa, usuario, t.access_token], {}, senal);
  if (typeof token !== "string" || !token) throw new ErrorProveedor("SimplyBook.me no dio acceso con esa llave.", 401);
  return <T,>(metodo: string, params: unknown[]) => rpc<T>(`${BASE}/admin/`, metodo, params, { "X-Company-Login": empresa, "X-User-Token": token }, senal);
}

type Reserva = {
  id?: string | number;
  start_date?: string;
  end_date?: string;
  event?: string;
  event_name?: string;
  unit?: string;
  unit_name?: string;
  client?: string;
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  is_confirm?: string | number;
  status?: string;
};

/** SimplyBook regresa listas como arreglo o como objeto { id: elemento }. */
const lista = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : v && typeof v === "object" ? (Object.values(v) as T[]) : []);

const dia = (dias = 0) => new Date(Date.now() + dias * 86_400_000).toISOString().slice(0, 10);

const filaReserva = (b: Reserva) =>
  `- ${unir(
    `${linea(b.start_date, 20)}${b.end_date ? `–${linea(b.end_date, 20).slice(-8)}` : ""}`,
    linea(b.event ?? b.event_name, 80),
    unir(linea(b.client ?? b.client_name, 80), b.client_email, b.client_phone),
    b.unit || b.unit_name ? `con ${linea(b.unit ?? b.unit_name, 60)}` : "",
    String(b.is_confirm) === "0" ? "sin confirmar" : "",
    b.status && b.status !== "confirmed" ? linea(b.status, 30) : "",
  )}`;

export const adaptador: Adaptador = {
  proveedor: "simplybook",
  autenticacion: "llave",
  variables: [],

  async validarLlave(llave) {
    const { empresa, usuario, clave } = partes(llave.trim());
    const t: Tokens = { access_token: clave, extra: { empresa, usuario } };
    await sesion(t);
    return t;
  },

  async cuenta(t) {
    return unir(t.extra?.usuario, t.extra?.empresa ? `en ${t.extra.empresa}` : "") || "Cuenta de SimplyBook.me";
  },

  herramientas: [
    herramienta({
      nombre: "simplybook_citas",
      descripcion: "Lista las próximas reservas de SimplyBook.me (fecha y hora, servicio, cliente y quién atiende). Solo lectura.",
      app: "simplybook",
      agentes: ["lola"],
      proveedor: NOMBRE,
      esquema: esquema({
        dias: { type: "integer", minimum: 1, maximum: 60, description: "Cuántos días hacia adelante, desde hoy. Por defecto 7." },
        limite: { type: "integer", minimum: 1, maximum: 50, description: "Cuántas reservas como máximo. Por defecto 25." },
      }),
      async ejecutar(args, ctx) {
        const dias = argEntero(args, "dias", 7, 1, 60);
        const llamar = await sesion(await ctx.token(), ctx.senal);
        const reservas = lista<Reserva>(await llamar("getBookings", [{ date_from: dia(), date_to: dia(dias), order: "date_start_asc" }])).slice(
          0,
          argEntero(args, "limite", 25, 1, 50),
        );
        if (!reservas.length) return `No hay reservas en SimplyBook.me en los próximos ${dias} días.`;
        return [`Reservas en SimplyBook.me, próximos ${dias} días (${reservas.length}):`, ...reservas.map(filaReserva)].join("\n");
      },
    }),
    herramienta({
      nombre: "simplybook_citas_cliente",
      descripcion: "Busca un cliente en SimplyBook.me (por nombre, correo o teléfono) y lista sus reservas. Solo lectura.",
      app: "simplybook",
      agentes: ["lola"],
      proveedor: NOMBRE,
      esquema: esquema({ cliente: { type: "string", description: "Nombre, correo o teléfono del cliente." } }, ["cliente"]),
      async ejecutar(args, ctx) {
        const q = argTexto(args, "cliente", 120);
        if (!q) throw new ErrorProveedor("Dime el nombre, el correo o el teléfono del cliente.");
        const llamar = await sesion(await ctx.token(), ctx.senal);
        const clientes = lista<{ id?: string | number; name?: string; email?: string; phone?: string }>(await llamar("getClientList", [q, 3]));
        if (!clientes.length) return `No encontré clientes en SimplyBook.me con "${q}".`;
        const bloques = await Promise.all(
          clientes.slice(0, 3).map(async (c) => {
            const reservas = lista<Reserva>(await llamar("getBookings", [{ client_id: Number(c.id), order: "date_start" }])).slice(0, 15);
            return [
              `${unir(linea(c.name, 80), c.email, c.phone)}: ${reservas.length ? `${reservas.length} reservas` : "sin reservas"}`,
              ...reservas.map(filaReserva),
            ].join("\n");
          }),
        );
        return bloques.join("\n\n");
      },
    }),
    herramienta({
      nombre: "simplybook_servicios",
      descripcion: "Lista los servicios de SimplyBook.me con su duración y precio. Solo lectura.",
      app: "simplybook",
      agentes: ["lola"],
      proveedor: NOMBRE,
      esquema: esquema({}),
      async ejecutar(_args, ctx) {
        const llamar = await sesion(await ctx.token(), ctx.senal);
        const servicios = lista<{ name?: string; duration?: string | number; price?: string | number; currency?: string; is_active?: string | number }>(
          await llamar("getEventList", [true, true, null, ""]),
        );
        if (!servicios.length) return "No hay servicios visibles en SimplyBook.me.";
        return [
          `Servicios en SimplyBook.me (${servicios.length}):`,
          ...servicios.map((s) => `- ${unir(linea(s.name, 80), s.duration ? `${s.duration} min` : "", s.price ? `${s.price} ${s.currency ?? ""}`.trim() : "")}`),
        ].join("\n");
      },
    }),
  ],
};

/** Con el nombre del proveedor, como lo importa el registro. */
export { adaptador as simplybook };
