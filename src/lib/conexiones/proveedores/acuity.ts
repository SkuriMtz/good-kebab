import type { Adaptador, Tokens } from "@/lib/nucleo-tipos";
import { ErrorProveedor, argEntero, argTexto, basico, consulta, esquema, herramienta, linea, pedirJson, unir } from "./_comun-1";

/**
 * ACUITY SCHEDULING (por llave; developers.acuityscheduling.com, nov 2026):
 * - La API usa HTTP Basic: el User ID (número) es el usuario y la API Key la
 *   contraseña. Están en Acuity → Integraciones → API. La persona pega
 *   "User ID:API key". Solo desde el servidor (nunca en el navegador).
 * - Base: https://acuityscheduling.com/api/v1 (me, appointments,
 *   appointment-types). Acuity también ofrece OAuth2, pero es para apps que
 *   conectan muchas cuentas; con la llave basta y no pide nada en Vercel.
 */

const NOMBRE = "Acuity";
const API = "https://acuityscheduling.com/api/v1";

function partes(llave: string) {
  const i = llave.indexOf(":");
  const usuario = (i > 0 ? llave.slice(0, i) : "").trim();
  const clave = (i > 0 ? llave.slice(i + 1) : "").trim();
  if (!/^\d{3,15}$/.test(usuario) || !/^[A-Za-z0-9]{16,128}$/.test(clave))
    throw new ErrorProveedor('Pega la llave de Acuity como "User ID:API key" (las encuentras en Acuity → Integraciones → API).');
  return { usuario, clave };
}

function api<T>(t: Tokens, ruta: string, params: Record<string, string | number | undefined> = {}, senal?: AbortSignal) {
  const usuario = t.extra?.usuario;
  if (!usuario) throw new ErrorProveedor("Falta el User ID de Acuity. Vuelve a pegar tu llave.");
  return pedirJson<T>(NOMBRE, `${API}${ruta}${consulta(params)}`, {
    encabezados: { Authorization: basico(usuario, t.access_token), Accept: "application/json" },
    senal,
    interpretar: (estado) => (estado === 401 ? { mensaje: "Acuity no reconoció la llave. Revisa tu User ID y tu API key.", status: 401 } : undefined),
  });
}

type Cita = {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  date?: string;
  time?: string;
  endTime?: string;
  type?: string;
  calendar?: string;
  price?: string;
  paid?: string;
  canceled?: boolean;
  notes?: string;
};

const hoy = (dias = 0) => new Date(Date.now() + dias * 86_400_000).toISOString().slice(0, 10);

const filaCita = (c: Cita) =>
  `- ${unir(
    `${linea(c.date, 40)} ${linea(c.time, 12)}${c.endTime ? `–${linea(c.endTime, 12)}` : ""}`.trim(),
    linea(c.type, 80),
    unir(linea([c.firstName, c.lastName].filter(Boolean).join(" "), 80), c.email, c.phone),
    c.calendar ? `con ${linea(c.calendar, 60)}` : "",
    c.price ? `$${c.price}${c.paid === "yes" ? " (pagado)" : ""}` : "",
    c.canceled ? "CANCELADA" : "",
    c.notes ? linea(c.notes, 120) : "",
  )}`;

export const adaptador: Adaptador = {
  proveedor: "acuity",
  autenticacion: "llave",
  variables: [],

  async validarLlave(llave) {
    const { usuario, clave } = partes(llave);
    const t: Tokens = { access_token: clave, extra: { usuario } };
    const yo = await api<{ name?: string; email?: string }>(t, "/me");
    if (yo.email) t.extra!.correo = yo.email;
    if (yo.name) t.extra!.nombre = yo.name;
    return t;
  },

  async cuenta(t) {
    if (t.extra?.correo || t.extra?.nombre) return (t.extra.correo || t.extra.nombre) as string;
    const yo = await api<{ name?: string; email?: string }>(t, "/me");
    return yo.email || yo.name || "Cuenta de Acuity";
  },

  herramientas: [
    herramienta({
      nombre: "acuity_citas",
      descripcion: "Lista las próximas citas agendadas en Acuity Scheduling (fecha, hora, servicio, cliente y quién atiende). Solo lectura.",
      app: "acuity",
      agentes: ["lola"],
      proveedor: NOMBRE,
      esquema: esquema({
        dias: { type: "integer", minimum: 1, maximum: 60, description: "Cuántos días hacia adelante, desde hoy. Por defecto 7." },
        limite: { type: "integer", minimum: 1, maximum: 50, description: "Cuántas citas como máximo. Por defecto 25." },
      }),
      async ejecutar(args, ctx) {
        const dias = argEntero(args, "dias", 7, 1, 60);
        const lista = await api<Cita[]>(
          await ctx.token(),
          "/appointments",
          { minDate: hoy(), maxDate: hoy(dias), max: argEntero(args, "limite", 25, 1, 50), direction: "ASC" },
          ctx.senal,
        );
        if (!lista.length) return `No hay citas en Acuity en los próximos ${dias} días.`;
        return [`Citas en Acuity, próximos ${dias} días (${lista.length}):`, ...lista.map(filaCita)].join("\n");
      },
    }),
    herramienta({
      nombre: "acuity_citas_cliente",
      descripcion: "Busca las citas de un cliente en Acuity Scheduling por su correo, teléfono o nombre (pasadas y futuras). Solo lectura.",
      app: "acuity",
      agentes: ["lola"],
      proveedor: NOMBRE,
      esquema: esquema({
        correo: { type: "string", description: "Correo del cliente." },
        telefono: { type: "string", description: "Teléfono del cliente." },
        nombre: { type: "string", description: "Nombre y apellido del cliente." },
      }),
      async ejecutar(args, ctx) {
        const correo = argTexto(args, "correo", 200);
        const telefono = argTexto(args, "telefono", 40);
        const [nombre, ...resto] = argTexto(args, "nombre", 120).split(/\s+/).filter(Boolean);
        if (!correo && !telefono && !nombre) throw new ErrorProveedor("Dime el correo, el teléfono o el nombre del cliente.");
        const lista = await api<Cita[]>(
          await ctx.token(),
          "/appointments",
          { email: correo || undefined, phone: telefono || undefined, firstName: nombre, lastName: resto.join(" ") || undefined, max: 30, direction: "DESC" },
          ctx.senal,
        );
        if (!lista.length) return "No encontré citas de ese cliente en Acuity.";
        return [`Citas del cliente en Acuity (${lista.length}, de la más reciente):`, ...lista.map(filaCita)].join("\n");
      },
    }),
    herramienta({
      nombre: "acuity_servicios",
      descripcion: "Lista los servicios (tipos de cita) de Acuity Scheduling con su duración, precio y categoría. Solo lectura.",
      app: "acuity",
      agentes: ["lola"],
      proveedor: NOMBRE,
      esquema: esquema({}),
      async ejecutar(_args, ctx) {
        const tipos = await api<{ id: number; name?: string; duration?: number; price?: string; category?: string; active?: boolean; schedulingUrl?: string }[]>(
          await ctx.token(),
          "/appointment-types",
          {},
          ctx.senal,
        );
        const activos = tipos.filter((x) => x.active !== false);
        if (!activos.length) return "No hay servicios activos en Acuity.";
        return [
          `Servicios en Acuity (${activos.length}):`,
          ...activos.map((x) => `- ${unir(linea(x.name, 80), x.duration ? `${x.duration} min` : "", x.price ? `$${x.price}` : "", linea(x.category, 60), x.schedulingUrl)}`),
        ].join("\n");
      },
    }),
  ],
};

/** Con el nombre del proveedor, como lo importa el registro. */
export { adaptador as acuity };
