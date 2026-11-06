import type { Adaptador } from "@/lib/nucleo-tipos";
import { ErrorProveedor, argEntero, argTexto, consulta, esquema, herramienta, linea, pedirJson, unir } from "./_comun-1";
import { argDia, dinero, fecha3, isoMx, llaveRechazada } from "./_comun-3";

/**
 * HOLDED (por llave; API v2, holded.com/es/desarrolladores, nov 2026; la v1
 * con el encabezado "key" quedó obsoleta):
 * - La persona crea una clave en Holded → Ajustes → API (con permisos de
 *   solo lectura) y la pega.
 * - "Authorization: Bearer <clave>". Base https://api.holded.com/api/v2.
 * - Valida con GET /account (permiso account:info.read); si la clave no
 *   tiene ese permiso, con GET /invoices?limit=1.
 * - Lee (paginación por cursor, limit hasta 100, sort=-date):
 *   GET /invoices (sales:invoices.read), /contacts y /contacts/search
 *   (contacts:contacts.read), /estimates, /sales-orders, /proformas,
 *   /sales-receipts y /waybills.
 * - No hay API para revocar la clave: se borra en Ajustes → API.
 */

const NOMBRE = "Holded";
const API = "https://api.holded.com/api/v2";

function api<T>(clave: string, ruta: string, params: Record<string, string | number | undefined>, senal?: AbortSignal) {
  return pedirJson<T>(NOMBRE, `${API}${ruta}${consulta(params)}`, {
    encabezados: { Authorization: `Bearer ${clave}`, Accept: "application/json" },
    senal,
    interpretar: (estado) => {
      if (estado === 401) return "Holded ya no reconoce la clave. Vuelve a pegarla en Tu negocio › Apps.";
      if (estado === 403) return "La clave de Holded no tiene permiso para ver esto. Dale permiso de lectura en Holded → Ajustes → API.";
      return undefined;
    },
  });
}

type Pagina<T> = { items?: T[]; has_more?: boolean; cursor?: string | null };
type Documento = {
  id?: string;
  document_number?: string | null;
  contact_name?: string | null;
  description?: string | null;
  date?: string | null;
  due_date?: string | null;
  total?: string;
  currency?: string;
  status?: string;
  payments_total?: string;
  payments_pending?: string;
};
type Contacto = { id?: string; name?: string; trade_name?: string | null; code?: string | null; email?: string | null; mobile?: string | null; phone?: string | null; type?: string | null };

const ESTADO: Record<string, string> = {
  pending: "pendiente",
  completed: "cobrado",
  partial: "cobrado en parte",
  cancelled: "cancelado",
  failed: "fallido",
  overdue: "vencido",
  outstanding: "por cobrar",
};
const TIPO_CONTACTO: Record<string, string> = { client: "cliente", debtor: "deudor", supplier: "proveedor", creditor: "acreedor", lead: "prospecto" };
const DOCUMENTOS = {
  presupuestos: { ruta: "/estimates", nombre: "Presupuestos" },
  pedidos: { ruta: "/sales-orders", nombre: "Pedidos de venta" },
  proformas: { ruta: "/proformas", nombre: "Proformas" },
  tickets: { ruta: "/sales-receipts", nombre: "Tickets de venta" },
  albaranes: { ruta: "/waybills", nombre: "Albaranes" },
} as const;
type TipoDoc = keyof typeof DOCUMENTOS;
const ESTADOS_DOC = ["pending", "completed", "partial", "cancelled", "failed", "overdue"];

function lineaDocumento(d: Documento): string {
  const pendiente = Number(d.payments_pending ?? 0);
  return `- ${unir(
    d.document_number ? linea(d.document_number, 30) : "",
    fecha3(d.date, true),
    linea(d.contact_name, 80),
    `total ${dinero(d.total, d.currency)}`,
    pendiente > 0 ? `por cobrar ${dinero(pendiente, d.currency)}` : "",
    d.due_date ? `vence ${fecha3(d.due_date, true)}` : "",
    d.status ? ESTADO[d.status] ?? linea(d.status, 20) : "",
    linea(d.description, 80),
  )}`;
}

function filtrosFecha(args: Record<string, unknown>) {
  const desde = argDia(args, "desde");
  const hasta = argDia(args, "hasta");
  return { start_date: desde ? isoMx(desde) : undefined, end_date: hasta ? isoMx(hasta, true) : undefined };
}

export const adaptador: Adaptador = {
  proveedor: "holded",
  autenticacion: "llave",
  variables: [],

  async validarLlave(llave) {
    const clave = llave.trim();
    if (!/^[A-Za-z0-9_.-]{16,200}$/.test(clave)) throw new ErrorProveedor("Esa no parece una clave de la API de Holded (créala en Holded → Ajustes → API).");
    const extra: Record<string, string> = {};
    try {
      const c = await api<Record<string, unknown>>(clave, "/account", {});
      const datos = (c.data && typeof c.data === "object" ? c.data : c) as Record<string, unknown>;
      const nombre = [datos.name, datos.company_name, datos.trade_name, datos.email].find((v) => typeof v === "string" && v.trim());
      if (nombre) extra.nombre = linea(nombre, 120);
    } catch (e) {
      if (e instanceof ErrorProveedor && e.status === 401) throw llaveRechazada(NOMBRE, "Holded → Ajustes → API");
      // Sin permiso para la cuenta: basta con poder leer facturas
      try {
        await api(clave, "/invoices", { limit: 1 });
      } catch {
        throw llaveRechazada(NOMBRE, "Holded → Ajustes → API; dale permiso de lectura de facturas");
      }
    }
    return { access_token: clave, extra };
  },

  async cuenta(t) {
    return t.extra?.nombre || "Cuenta de Holded";
  },

  herramientas: [
    herramienta({
      nombre: "holded_facturas",
      descripcion:
        "Lista las facturas de venta de Holded, de la más nueva a la más vieja: número, fecha, cliente, total, lo que falta por cobrar, vencimiento y estado. Se puede filtrar por estado y fechas. Solo lectura.",
      app: "holded",
      agentes: ["iris", "victor"],
      proveedor: NOMBRE,
      esquema: esquema({
        estado: { type: "string", enum: [...ESTADOS_DOC, "outstanding"], description: "pending = pendientes, outstanding = por cobrar, overdue = vencidas, completed = cobradas…" },
        desde: { type: "string", description: "Fecha inicial AAAA-MM-DD." },
        hasta: { type: "string", description: "Fecha final AAAA-MM-DD." },
        limite: { type: "integer", minimum: 1, maximum: 50, description: "Cuántas facturas. Por defecto 20." },
      }),
      async ejecutar(args, ctx) {
        const estado = argTexto(args, "estado", 20);
        if (estado && !ESTADO[estado]) throw new ErrorProveedor(`"estado" puede ser ${Object.keys(ESTADO).join(", ")}.`);
        const fechas = filtrosFecha(args);
        const t = await ctx.token();
        const r = await api<Pagina<Documento>>(t.access_token, "/invoices", { limit: argEntero(args, "limite", 20, 1, 50), sort: "-date", status: estado || undefined, ...fechas }, ctx.senal);
        const lista = r.items ?? [];
        if (!lista.length) return estado || fechas.start_date || fechas.end_date ? "No encontré facturas en Holded con esos datos." : "No hay facturas en Holded.";
        return [`Facturas de Holded (${lista.length}${r.has_more ? ", hay más" : ""}, de la más reciente):`, ...lista.map(lineaDocumento)].join("\n");
      },
    }),
    herramienta({
      nombre: "holded_contactos",
      descripcion:
        "Busca contactos en Holded (clientes, proveedores y prospectos): nombre, RFC o NIF, correo y teléfonos. Busca por nombre (empieza con), o exacto por correo o teléfono. Sin texto, regresa los primeros. Solo lectura.",
      app: "holded",
      agentes: ["iris", "victor"],
      proveedor: NOMBRE,
      esquema: esquema({
        buscar: { type: "string", description: "Nombre (o el inicio del nombre), correo o teléfono." },
        limite: { type: "integer", minimum: 1, maximum: 50, description: "Cuántos contactos. Por defecto 20." },
      }),
      async ejecutar(args, ctx) {
        const buscar = argTexto(args, "buscar", 120);
        const limite = argEntero(args, "limite", 20, 1, 50);
        const t = await ctx.token();
        const telefono = buscar.replace(/[\s()-]/g, "");
        const r = !buscar
          ? await api<Pagina<Contacto>>(t.access_token, "/contacts", { limit: limite }, ctx.senal)
          : buscar.includes("@")
            ? await api<Pagina<Contacto>>(t.access_token, "/contacts", { email: buscar, limit: limite }, ctx.senal)
            : /^\+?\d{7,15}$/.test(telefono)
              ? await api<Pagina<Contacto>>(t.access_token, "/contacts", { phone: telefono, limit: limite }, ctx.senal)
              : await api<Pagina<Contacto>>(t.access_token, "/contacts/search", { name: buscar, limit: limite }, ctx.senal);
        let lista = r.items ?? [];
        // Holded busca el teléfono fijo y el móvil por separado
        if (!lista.length && buscar && /^\+?\d{7,15}$/.test(telefono)) lista = (await api<Pagina<Contacto>>(t.access_token, "/contacts", { mobile: telefono, limit: limite }, ctx.senal)).items ?? [];
        if (!lista.length) return buscar ? `No encontré contactos en Holded con "${linea(buscar, 60)}".` : "No hay contactos en Holded.";
        return [
          `Contactos de Holded${buscar ? ` con "${linea(buscar, 60)}"` : ""} (${lista.length}${r.has_more ? ", hay más" : ""}):`,
          ...lista.map(
            (c) =>
              `- ${unir(
                linea(c.name, 100) || "Sin nombre",
                c.trade_name && c.trade_name !== c.name ? linea(c.trade_name, 60) : "",
                linea(c.code, 20),
                linea(c.email, 80),
                linea(c.mobile, 30),
                linea(c.phone, 30),
                c.type ? TIPO_CONTACTO[c.type] ?? linea(c.type, 20) : "",
              )}`,
          ),
        ].join("\n");
      },
    }),
    herramienta({
      nombre: "holded_documentos",
      descripcion:
        "Lista otros documentos de venta de Holded, del más nuevo al más viejo: presupuestos, pedidos de venta, proformas, tickets de venta o albaranes (número, fecha, cliente, total y estado). Solo lectura.",
      app: "holded",
      agentes: ["iris"],
      proveedor: NOMBRE,
      esquema: esquema(
        {
          tipo: { type: "string", enum: Object.keys(DOCUMENTOS), description: "Qué documentos: presupuestos, pedidos, proformas, tickets o albaranes." },
          estado: { type: "string", enum: ESTADOS_DOC, description: "Filtrar por estado. Vacío: todos." },
          desde: { type: "string", description: "Fecha inicial AAAA-MM-DD." },
          hasta: { type: "string", description: "Fecha final AAAA-MM-DD." },
          limite: { type: "integer", minimum: 1, maximum: 50, description: "Cuántos documentos. Por defecto 20." },
        },
        ["tipo"],
      ),
      async ejecutar(args, ctx) {
        const tipo = argTexto(args, "tipo", 20) as TipoDoc;
        const doc = DOCUMENTOS[tipo];
        if (!doc) throw new ErrorProveedor(`"tipo" puede ser ${Object.keys(DOCUMENTOS).join(", ")}.`);
        const estado = argTexto(args, "estado", 20);
        if (estado && !ESTADOS_DOC.includes(estado)) throw new ErrorProveedor(`"estado" puede ser ${ESTADOS_DOC.join(", ")}.`);
        const t = await ctx.token();
        const r = await api<Pagina<Documento>>(t.access_token, doc.ruta, { limit: argEntero(args, "limite", 20, 1, 50), sort: "-date", status: estado || undefined, ...filtrosFecha(args) }, ctx.senal);
        const lista = r.items ?? [];
        if (!lista.length) return `No hay ${doc.nombre.toLowerCase()} en Holded con esos datos.`;
        return [`${doc.nombre} de Holded (${lista.length}${r.has_more ? ", hay más" : ""}, del más reciente):`, ...lista.map(lineaDocumento)].join("\n");
      },
    }),
  ],
};

/** Con el nombre del proveedor, como lo importa el registro. */
export { adaptador as holded };
