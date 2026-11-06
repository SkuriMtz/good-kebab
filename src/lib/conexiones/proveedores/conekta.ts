import type { Adaptador, Tokens } from "@/lib/nucleo-tipos";
import { ErrorProveedor, argEntero, argTexto, consulta, esquema, herramienta, linea, pedirJson, unir } from "./_comun-1";
import { dinero, fecha3, llaveRechazada } from "./_comun-3";

/**
 * CONEKTA (por llave; developers.conekta.com, API 2.3.0, nov 2026):
 * - La persona copia su llave PRIVADA en panel.conekta.com → Desarrolladores
 *   → API Keys (empieza con "key_"). Sirve igual en modo prueba y producción:
 *   la llave dice cuál.
 * - Autenticación Bearer con la llave, Accept
 *   "application/vnd.conekta-v2.3.0+json" y Accept-Language "es".
 * - Valida con GET /companies/current (nombre de la empresa); si esa ruta no
 *   está disponible para la cuenta, con GET /orders?limit=1.
 * - Lee: GET /orders y GET /charges (limit hasta 250, search por correo o
 *   referencia; montos en centavos y fechas en segundos).
 * - Conekta no deja revocar la llave por API: se borra o rota en su panel.
 */

const NOMBRE = "Conekta";
const API = "https://api.conekta.io";
const ACEPTA = "application/vnd.conekta-v2.3.0+json";
const FORMA_LLAVE = /^key_[A-Za-z0-9]{10,100}$/;

function api<T>(llave: string, ruta: string, params: Record<string, string | number | undefined>, senal?: AbortSignal) {
  return pedirJson<T>(NOMBRE, `${API}${ruta}${consulta(params)}`, {
    encabezados: { Authorization: `Bearer ${llave}`, Accept: ACEPTA, "Accept-Language": "es" },
    senal,
    interpretar: (estado) => (estado === 401 ? "Conekta ya no reconoce la llave. Vuelve a pegar tu llave privada en Tu negocio › Apps." : undefined),
  });
}

const ESTADO: Record<string, string> = {
  paid: "pagado",
  pending_payment: "pendiente de pago",
  expired: "vencido",
  refunded: "reembolsado",
  partially_refunded: "reembolsado en parte",
  charged_back: "contracargo",
  pre_authorized: "preautorizado",
  voided: "anulado",
  declined: "rechazado",
  canceled: "cancelado",
};
const estado = (s?: string) => (s ? ESTADO[s] ?? linea(s, 30) : "");

type Metodo = { type?: string; brand?: string; last4?: string; reference?: string; bank?: string; clabe?: string };
type Cargo = { id?: string; amount?: number; currency?: string; status?: string; created_at?: number; paid_at?: number | null; description?: string; order_id?: string; payment_method?: Metodo };
type Orden = {
  id?: string;
  amount?: number;
  currency?: string;
  payment_status?: string;
  created_at?: number;
  customer_info?: { name?: string; email?: string; phone?: string };
  line_items?: { data?: { name?: string; quantity?: number }[] };
  charges?: { data?: Cargo[] };
};
type Lista<T> = { data?: T[]; has_more?: boolean };

const ESTADOS_ORDEN = ["paid", "pending_payment", "expired", "refunded", "partially_refunded", "charged_back", "pre_authorized", "voided", "declined", "canceled"];

function metodo(m?: Metodo): string {
  if (!m?.type) return "";
  const t = m.type.toLowerCase();
  if (t.includes("card")) return unir("tarjeta", linea(m.brand, 20), m.last4 ? `****${linea(m.last4, 4)}` : "");
  if (t.includes("cash") || t.includes("oxxo")) return "efectivo (OXXO u otra tienda)";
  if (t.includes("spei") || t.includes("bank")) return "transferencia SPEI";
  return linea(m.type, 30);
}

export const adaptador: Adaptador = {
  proveedor: "conekta",
  autenticacion: "llave",
  variables: [],

  async validarLlave(llave) {
    const k = llave.trim();
    if (!FORMA_LLAVE.test(k)) throw new ErrorProveedor('Esa no parece una llave privada de Conekta. Empieza con "key_" (está en tu panel → Desarrolladores → API Keys).');
    const t: Tokens = { access_token: k, extra: {} };
    try {
      const c = await api<{ id?: string; name?: string }>(k, "/companies/current", {});
      if (c.name) t.extra!.empresa = linea(c.name, 120);
    } catch (e) {
      if (e instanceof ErrorProveedor && e.status === 401) throw llaveRechazada(NOMBRE, "panel → Desarrolladores → API Keys, la llave privada");
      // Sin acceso a /companies/current: basta con poder leer órdenes
      try {
        await api(k, "/orders", { limit: 1 });
      } catch {
        throw llaveRechazada(NOMBRE, "panel → Desarrolladores → API Keys, la llave privada");
      }
    }
    return t;
  },

  async cuenta(t) {
    return t.extra?.empresa || "Cuenta de Conekta";
  },

  herramientas: [
    herramienta({
      nombre: "conekta_ordenes",
      descripcion:
        "Lista las órdenes de cobro recientes en Conekta (de la más nueva a la más vieja): fecha, monto, estado del pago, cliente y productos. Se puede buscar por correo o referencia y filtrar por estado. Solo lectura.",
      app: "conekta",
      agentes: ["iris"],
      proveedor: NOMBRE,
      esquema: esquema({
        buscar: { type: "string", description: "Correo del cliente o referencia de la orden." },
        estado: { type: "string", enum: ESTADOS_ORDEN, description: "Estado del pago (paid = pagadas, pending_payment = pendientes…). Vacío: todas." },
        limite: { type: "integer", minimum: 1, maximum: 50, description: "Cuántas órdenes. Por defecto 20." },
      }),
      async ejecutar(args, ctx) {
        const buscar = argTexto(args, "buscar", 120);
        const est = argTexto(args, "estado", 30);
        if (est && !ESTADOS_ORDEN.includes(est)) throw new ErrorProveedor(`"estado" puede ser ${ESTADOS_ORDEN.join(", ")}.`);
        const t = await ctx.token();
        const r = await api<Lista<Orden>>(t.access_token, "/orders", { limit: argEntero(args, "limite", 20, 1, 50), search: buscar || undefined, payment_status: est || undefined }, ctx.senal);
        const lista = r.data ?? [];
        if (!lista.length) return buscar || est ? "No encontré órdenes en Conekta con esos datos." : "No hay órdenes en Conekta.";
        return [
          `Órdenes de Conekta${buscar ? ` con "${linea(buscar, 60)}"` : ""} (${lista.length}${r.has_more ? ", hay más" : ""}):`,
          ...lista.map((o) => {
            const productos = (o.line_items?.data ?? [])
              .slice(0, 4)
              .map((p) => `${linea(p.name, 50)}${p.quantity && p.quantity > 1 ? ` x${p.quantity}` : ""}`)
              .filter(Boolean)
              .join(", ");
            return `- ${unir(
              fecha3(o.created_at),
              dinero(o.amount, o.currency, { centavos: true }),
              estado(o.payment_status),
              linea(o.customer_info?.name, 80),
              linea(o.customer_info?.email, 80),
              productos,
              metodo(o.charges?.data?.[0]?.payment_method),
              o.id ? `id ${linea(o.id, 40)}` : "",
            )}`;
          }),
        ].join("\n");
      },
    }),
    herramienta({
      nombre: "conekta_cargos",
      descripcion:
        "Lista los cargos (intentos de pago) recientes en Conekta: fecha, monto, estado, método (tarjeta, OXXO, SPEI), descripción y orden. Se puede buscar por correo o referencia. Solo lectura.",
      app: "conekta",
      agentes: ["iris"],
      proveedor: NOMBRE,
      esquema: esquema({
        buscar: { type: "string", description: "Correo o referencia." },
        limite: { type: "integer", minimum: 1, maximum: 50, description: "Cuántos cargos. Por defecto 20." },
      }),
      async ejecutar(args, ctx) {
        const buscar = argTexto(args, "buscar", 120);
        const t = await ctx.token();
        const r = await api<Lista<Cargo>>(t.access_token, "/charges", { limit: argEntero(args, "limite", 20, 1, 50), search: buscar || undefined }, ctx.senal);
        const lista = r.data ?? [];
        if (!lista.length) return buscar ? `No encontré cargos en Conekta con "${linea(buscar, 60)}".` : "No hay cargos en Conekta.";
        return [
          `Cargos de Conekta${buscar ? ` con "${linea(buscar, 60)}"` : ""} (${lista.length}${r.has_more ? ", hay más" : ""}):`,
          ...lista.map(
            (c) =>
              `- ${unir(
                fecha3(c.created_at),
                dinero(c.amount, c.currency, { centavos: true }),
                estado(c.status),
                metodo(c.payment_method),
                linea(c.description, 100),
                c.paid_at ? `pagado ${fecha3(c.paid_at)}` : "",
                c.order_id ? `orden ${linea(c.order_id, 40)}` : "",
              )}`,
          ),
        ].join("\n");
      },
    }),
  ],
};

/** Con el nombre del proveedor, como lo importa el registro. */
export { adaptador as conekta };
