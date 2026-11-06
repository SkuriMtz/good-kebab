import type { Adaptador } from "@/lib/nucleo-tipos";
import { ErrorProveedor, argEntero, argTexto, consulta, esquema, herramienta, linea, pedirJson, unir } from "./_comun-1";
import { argDia, basic3, dinero, fecha3, llaveRechazada, partirLlave } from "./_comun-3";

/**
 * ALEGRA (por llave; developer.alegra.com, nov 2026):
 * - La persona copia su token en Alegra → Configuración → Integraciones
 *   con otros sistemas → API (Token) y pega "correo:token".
 * - HTTP Basic con correo:token. Base https://api.alegra.com/api/v1.
 * - Valida con GET /company (nombre e identificación de la empresa).
 * - Lee: GET /invoices (limit máximo 30, order_field=date, filtros
 *   client_name, status y date_afterOrNow/date_beforeOrNow), GET /payments
 *   (type=in = cobros) y GET /contacts (query, type=client|provider).
 * - No hay API para revocar el token: se regenera en Alegra.
 */

const NOMBRE = "Alegra";
const API = "https://api.alegra.com/api/v1";
const FORMATO = "correo:token (el correo con el que entras a Alegra y tu token de la API, separados por dos puntos)";

function api<T>(credencial: string, ruta: string, params: Record<string, string | number | undefined>, senal?: AbortSignal) {
  const [correo, token] = partirLlave(credencial, NOMBRE, FORMATO);
  return pedirJson<T>(NOMBRE, `${API}${ruta}${consulta(params)}`, {
    encabezados: { Authorization: basic3(correo, token), Accept: "application/json" },
    senal,
    interpretar: (estado) => (estado === 401 ? "Alegra ya no acepta tu correo y token. Vuelve a pegarlos en Tu negocio › Apps." : undefined),
  });
}

type Moneda = { code?: string };
type Factura = {
  id?: string | number;
  date?: string;
  dueDate?: string;
  status?: string;
  total?: number | string;
  balance?: number | string;
  numberTemplate?: { prefix?: string; number?: string | number; fullNumber?: string };
  client?: { name?: string; identification?: string };
  currency?: Moneda;
  stamp?: { uuid?: string };
};
type Pago = {
  id?: string | number;
  number?: string | number;
  date?: string;
  amount?: number | string;
  paymentMethod?: string;
  status?: string;
  client?: { name?: string };
  currency?: Moneda;
  invoices?: { id?: string | number; number?: string; numberTemplate?: { fullNumber?: string }; amount?: number }[];
  observations?: string;
};
type Contacto = {
  id?: string | number;
  name?: string | { firstName?: string; lastName?: string };
  identification?: string | { number?: string };
  identificationObject?: { number?: string };
  email?: string;
  phonePrimary?: string;
  mobile?: string;
  type?: string[] | string;
};

const ESTADO_FACTURA: Record<string, string> = { open: "por cobrar", closed: "pagada", draft: "borrador", void: "anulada" };
const ESTADOS = Object.keys(ESTADO_FACTURA);
const METODO: Record<string, string> = { cash: "efectivo", transfer: "transferencia", "credit-card": "tarjeta de crédito", "debit-card": "tarjeta de débito", check: "cheque", deposit: "depósito" };

const numeroFactura = (f: Factura) =>
  linea(f.numberTemplate?.fullNumber || [f.numberTemplate?.prefix, f.numberTemplate?.number].filter((x) => x !== undefined && x !== "").join(""), 30);

function nombreContacto(c: Contacto): string {
  if (typeof c.name === "string") return linea(c.name, 100);
  return linea([c.name?.firstName, c.name?.lastName].filter(Boolean).join(" "), 100);
}
function idContacto(c: Contacto): string {
  if (typeof c.identification === "string") return linea(c.identification, 20);
  return linea(c.identification?.number ?? c.identificationObject?.number, 20);
}
const listaDe = <T>(r: unknown): T[] => (Array.isArray(r) ? (r as T[]) : Array.isArray((r as { data?: unknown })?.data) ? ((r as { data: T[] }).data) : []);

export const adaptador: Adaptador = {
  proveedor: "alegra",
  autenticacion: "llave",
  variables: [],

  async validarLlave(llave) {
    const [correo, token] = partirLlave(llave, NOMBRE, FORMATO);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo) || token.length < 8 || token.length > 200) throw new ErrorProveedor(`Pega ${FORMATO}.`);
    const credencial = `${correo}:${token}`;
    let empresa: { name?: string; identification?: string };
    try {
      empresa = await api<{ name?: string; identification?: string }>(credencial, "/company", {});
    } catch (e) {
      if (e instanceof ErrorProveedor && (e.status === 401 || e.status === 403)) throw llaveRechazada(NOMBRE, "Configuración → Integraciones con otros sistemas → API");
      throw e;
    }
    const extra: Record<string, string> = { correo: linea(correo, 120) };
    if (empresa.name) extra.empresa = linea(empresa.name, 120);
    return { access_token: credencial, extra };
  },

  async cuenta(t) {
    return unir(t.extra?.empresa, t.extra?.correo) || "Cuenta de Alegra";
  },

  herramientas: [
    herramienta({
      nombre: "alegra_facturas",
      descripcion:
        "Lista las facturas de venta de Alegra, de la más nueva a la más vieja: número, fecha, cliente, total, saldo por cobrar, vencimiento y estado. Se puede filtrar por cliente, estado (por cobrar, pagada…) y fechas. Solo lectura.",
      app: "alegra",
      agentes: ["iris", "victor"],
      proveedor: NOMBRE,
      esquema: esquema({
        cliente: { type: "string", description: "Nombre (o parte) del cliente." },
        estado: { type: "string", enum: ESTADOS, description: "open = por cobrar, closed = pagadas, draft = borradores, void = anuladas." },
        desde: { type: "string", description: "Fecha inicial AAAA-MM-DD." },
        hasta: { type: "string", description: "Fecha final AAAA-MM-DD." },
        limite: { type: "integer", minimum: 1, maximum: 30, description: "Cuántas facturas. Por defecto 20 (Alegra da máximo 30)." },
      }),
      async ejecutar(args, ctx) {
        const cliente = argTexto(args, "cliente", 120);
        const estado = argTexto(args, "estado", 10);
        if (estado && !ESTADO_FACTURA[estado]) throw new ErrorProveedor(`"estado" puede ser ${ESTADOS.join(", ")}.`);
        const desde = argDia(args, "desde");
        const hasta = argDia(args, "hasta");
        const t = await ctx.token();
        const r = await api<unknown>(
          t.access_token,
          "/invoices",
          {
            start: 0,
            limit: argEntero(args, "limite", 20, 1, 30),
            order_direction: "DESC",
            order_field: "date",
            client_name: cliente || undefined,
            status: estado || undefined,
            date_afterOrNow: desde || undefined,
            date_beforeOrNow: hasta || undefined,
          },
          ctx.senal,
        );
        const facturas = listaDe<Factura>(r);
        if (!facturas.length) return cliente || estado || desde || hasta ? "No encontré facturas en Alegra con esos datos." : "No hay facturas en Alegra.";
        return [
          `Facturas de Alegra${cliente ? ` de "${linea(cliente, 60)}"` : ""} (${facturas.length}, de la más reciente):`,
          ...facturas.map((f) => {
            const saldo = Number(f.balance ?? 0);
            return `- ${unir(
              numeroFactura(f) ? `factura ${numeroFactura(f)}` : "",
              fecha3(f.date, true),
              linea(f.client?.name, 80),
              f.client?.identification ? linea(f.client.identification, 20) : "",
              `total ${dinero(f.total, f.currency?.code)}`,
              saldo > 0 ? `por cobrar ${dinero(saldo, f.currency?.code)}` : "",
              f.dueDate ? `vence ${fecha3(f.dueDate, true)}` : "",
              f.status ? ESTADO_FACTURA[f.status] ?? linea(f.status, 20) : "",
              f.stamp?.uuid ? `UUID ${linea(f.stamp.uuid, 36)}` : "",
            )}`;
          }),
        ].join("\n");
      },
    }),
    herramienta({
      nombre: "alegra_cobros",
      descripcion: "Lista los pagos recibidos (cobros) registrados en Alegra, del más nuevo al más viejo: fecha, número, cliente, monto, método y facturas que pagan. Solo lectura.",
      app: "alegra",
      agentes: ["iris"],
      proveedor: NOMBRE,
      esquema: esquema({ limite: { type: "integer", minimum: 1, maximum: 30, description: "Cuántos cobros. Por defecto 20." } }),
      async ejecutar(args, ctx) {
        const t = await ctx.token();
        const r = await api<unknown>(t.access_token, "/payments", { start: 0, limit: argEntero(args, "limite", 20, 1, 30), order_direction: "DESC", order_field: "date", type: "in" }, ctx.senal);
        const pagos = listaDe<Pago>(r);
        if (!pagos.length) return "No hay cobros registrados en Alegra.";
        return [
          `Cobros de Alegra (${pagos.length}, del más reciente):`,
          ...pagos.map((p) => {
            const facturas = (p.invoices ?? [])
              .map((i) => linea(i.numberTemplate?.fullNumber ?? i.number ?? i.id, 20))
              .filter(Boolean)
              .slice(0, 5)
              .join(", ");
            return `- ${unir(
              fecha3(p.date, true),
              p.number !== undefined && p.number !== "" ? `cobro ${linea(p.number, 20)}` : "",
              linea(p.client?.name, 80),
              dinero(p.amount, p.currency?.code),
              p.paymentMethod ? METODO[p.paymentMethod] ?? linea(p.paymentMethod, 30) : "",
              facturas ? `facturas ${facturas}` : "",
              p.status === "void" ? "anulado" : "",
              linea(p.observations, 80),
            )}`;
          }),
        ].join("\n");
      },
    }),
    herramienta({
      nombre: "alegra_contactos",
      descripcion: "Busca contactos (clientes o proveedores) en Alegra: nombre, RFC o identificación, correo y teléfonos. Sin texto, regresa los más recientes. Solo lectura.",
      app: "alegra",
      agentes: ["iris", "victor"],
      proveedor: NOMBRE,
      esquema: esquema({
        buscar: { type: "string", description: "Nombre o identificación (RFC) a buscar." },
        tipo: { type: "string", enum: ["client", "provider"], description: "client = clientes, provider = proveedores. Vacío: todos." },
        limite: { type: "integer", minimum: 1, maximum: 30, description: "Cuántos contactos. Por defecto 20." },
      }),
      async ejecutar(args, ctx) {
        const buscar = argTexto(args, "buscar", 120);
        const tipo = argTexto(args, "tipo", 10);
        if (tipo && tipo !== "client" && tipo !== "provider") throw new ErrorProveedor('"tipo" puede ser client o provider.');
        const t = await ctx.token();
        const r = await api<unknown>(
          t.access_token,
          "/contacts",
          { start: 0, limit: argEntero(args, "limite", 20, 1, 30), order_direction: "DESC", order_field: "id", query: buscar || undefined, type: tipo || undefined, mode: "simple" },
          ctx.senal,
        );
        const contactos = listaDe<Contacto>(r);
        if (!contactos.length) return buscar ? `No encontré contactos en Alegra con "${linea(buscar, 60)}".` : "No hay contactos en Alegra.";
        return [
          `Contactos de Alegra${buscar ? ` con "${linea(buscar, 60)}"` : ""} (${contactos.length}):`,
          ...contactos.map((c) => {
            const tipos = (Array.isArray(c.type) ? c.type : c.type ? [c.type] : []).map((x) => (x === "client" ? "cliente" : x === "provider" ? "proveedor" : linea(x, 20)));
            return `- ${unir(nombreContacto(c) || "Sin nombre", idContacto(c), linea(c.email, 80), linea(c.phonePrimary, 30), linea(c.mobile, 30), tipos.join("/"))}`;
          }),
        ].join("\n");
      },
    }),
  ],
};

/** Con el nombre del proveedor, como lo importa el registro. */
export { adaptador as alegra };
