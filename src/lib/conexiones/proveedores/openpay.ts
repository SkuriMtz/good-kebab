import type { Adaptador, Tokens } from "@/lib/nucleo-tipos";
import { ErrorProveedor, argEntero, argTexto, consulta, esquema, herramienta, linea, pedirJson, unir } from "./_comun-1";
import { basic3, diaMx, dinero, fecha3, llaveRechazada, partirLlave, sinAcentos } from "./_comun-3";

/**
 * OPENPAY MÉXICO (por llave; documents.openpay.mx y SDKs oficiales, nov 2026):
 * - La persona copia su ID de comercio y su llave PRIVADA ("sk_…") en
 *   dashboard.openpay.mx → Configuración → Llaves de API y pega
 *   "merchantId:privateKey".
 * - HTTP Basic con la llave privada como usuario y contraseña vacía.
 *   Producción https://api.openpay.mx/v1/{merchantId}; si la llave es de
 *   pruebas, https://sandbox-api.openpay.mx/v1/{merchantId}.
 * - Valida con GET /v1/{merchantId} (nombre y correo del comercio).
 * - Lee: GET /v1/{merchantId}/charges y /customers (creation[gte],
 *   creation[lte], offset y limit hasta 100). Montos en pesos.
 * - No hay API para revocar la llave: se regenera en el panel de Openpay.
 */

const NOMBRE = "Openpay";
const HOST = { produccion: "https://api.openpay.mx", sandbox: "https://sandbox-api.openpay.mx" } as const;
type Ambiente = keyof typeof HOST;
const FORMATO = "merchantId:privateKey (tu ID de comercio y tu llave privada sk_…, separados por dos puntos)";
const FORMA_COMERCIO = /^m[a-z0-9]{10,40}$/;
const FORMA_LLAVE = /^sk_[A-Za-z0-9]{10,100}$/;

const ambienteDe = (t: Tokens): Ambiente => (t.extra?.ambiente === "sandbox" ? "sandbox" : "produccion");

function api<T>(ambiente: Ambiente, comercio: string, llave: string, ruta: string, params: Record<string, string | number | undefined>, senal?: AbortSignal) {
  return pedirJson<T>(NOMBRE, `${HOST[ambiente]}/v1/${comercio}${ruta}${consulta(params)}`, {
    encabezados: { Authorization: basic3(llave, ""), Accept: "application/json" },
    senal,
    interpretar: (estado) => (estado === 401 ? "Openpay ya no reconoce la llave. Vuelve a pegar tu llave privada en Tu negocio › Apps." : undefined),
  });
}

const deTokens = <T>(t: Tokens, ruta: string, params: Record<string, string | number | undefined>, senal: AbortSignal) => {
  const comercio = t.extra?.comercio ?? "";
  if (!FORMA_COMERCIO.test(comercio)) throw new ErrorProveedor("Falta el ID de comercio de Openpay. Vuelve a pegar tu llave en Tu negocio › Apps.");
  return api<T>(ambienteDe(t), comercio, t.access_token, ruta, params, senal);
};

const ESTADO: Record<string, string> = {
  completed: "pagado",
  in_progress: "en proceso",
  charge_pending: "pendiente de pago",
  failed: "falló",
  cancelled: "cancelado",
  refunded: "reembolsado",
  chargeback_pending: "contracargo pendiente",
  chargeback_accepted: "contracargo aceptado",
  chargeback_adjustment: "ajuste por contracargo",
};
const ESTADOS = Object.keys(ESTADO);

type Cargo = {
  id?: string;
  amount?: number;
  currency?: string;
  status?: string;
  creation_date?: string;
  operation_date?: string;
  description?: string;
  method?: string;
  order_id?: string;
  error_message?: string | null;
  card?: { brand?: string; card_number?: string; holder_name?: string };
  customer_id?: string | null;
};
type Cliente = { id?: string; name?: string; last_name?: string; email?: string; phone_number?: string; creation_date?: string; external_id?: string | null };

function metodo(c: Cargo): string {
  if (c.method === "card") return unir("tarjeta", linea(c.card?.brand, 20), c.card?.card_number ? `****${c.card.card_number.slice(-4)}` : "");
  if (c.method === "store") return "efectivo en tienda";
  if (c.method === "bank_account") return "transferencia SPEI";
  return linea(c.method, 30);
}

export const adaptador: Adaptador = {
  proveedor: "openpay",
  autenticacion: "llave",
  variables: [],

  async validarLlave(llave) {
    const [comercio, privada] = partirLlave(llave, NOMBRE, FORMATO);
    if (!FORMA_COMERCIO.test(comercio) || !FORMA_LLAVE.test(privada)) throw new ErrorProveedor(`Esa no parece una llave de Openpay. Pega ${FORMATO}.`);
    for (const ambiente of ["produccion", "sandbox"] as const) {
      try {
        const m = await api<{ id?: string; name?: string; email?: string }>(ambiente, comercio, privada, "", {});
        const extra: Record<string, string> = { comercio, ambiente };
        if (m.name) extra.nombre = linea(m.name, 120);
        if (m.email) extra.correo = linea(m.email, 120);
        return { access_token: privada, extra };
      } catch (e) {
        // 401/404 en producción: puede ser una llave de pruebas
        if (!(e instanceof ErrorProveedor) || ![401, 403, 404].includes(e.status)) throw e;
      }
    }
    throw llaveRechazada(NOMBRE, "panel de Openpay → Configuración → Llaves de API");
  },

  async cuenta(t) {
    return unir(t.extra?.nombre || t.extra?.correo || "Openpay", ambienteDe(t) === "sandbox" ? "pruebas (Sandbox)" : "") || "Cuenta de Openpay";
  },

  herramientas: [
    herramienta({
      nombre: "openpay_cargos",
      descripcion:
        "Lista los cargos recientes en Openpay (tarjeta, efectivo en tienda o SPEI), del más nuevo al más viejo: fecha, monto, estado, método, descripción y orden. Solo lectura.",
      app: "openpay",
      agentes: ["iris"],
      proveedor: NOMBRE,
      esquema: esquema({
        dias: { type: "integer", minimum: 1, maximum: 365, description: "Cuántos días hacia atrás. Por defecto 30." },
        estado: { type: "string", enum: ESTADOS, description: "completed = pagados, charge_pending = pendientes, failed = fallidos… Vacío: todos." },
        limite: { type: "integer", minimum: 1, maximum: 50, description: "Cuántos cargos. Por defecto 20." },
      }),
      async ejecutar(args, ctx) {
        const dias = argEntero(args, "dias", 30, 1, 365);
        const limite = argEntero(args, "limite", 20, 1, 50);
        const est = argTexto(args, "estado", 30);
        if (est && !ESTADO[est]) throw new ErrorProveedor(`"estado" puede ser ${ESTADOS.join(", ")}.`);
        const t = await ctx.token();
        const r = await deTokens<Cargo[]>(t, "/charges", { "creation[gte]": diaMx(dias), status: est || undefined, offset: 0, limit: 100 }, ctx.senal);
        const lista = (Array.isArray(r) ? r : [])
          .slice()
          .sort((a, b) => String(b.creation_date ?? "").localeCompare(String(a.creation_date ?? "")))
          .slice(0, limite);
        if (!lista.length) return `No hay cargos en Openpay en los últimos ${dias} días${est ? ` con estado ${ESTADO[est]}` : ""}.`;
        return [
          `Cargos de Openpay, últimos ${dias} días (${lista.length}, del más reciente):`,
          ...lista.map(
            (c) =>
              `- ${unir(
                fecha3(c.operation_date || c.creation_date),
                dinero(c.amount, c.currency),
                c.status ? ESTADO[c.status] ?? linea(c.status, 30) : "",
                metodo(c),
                linea(c.card?.holder_name, 60),
                linea(c.description, 100),
                c.order_id ? `orden ${linea(c.order_id, 40)}` : "",
                c.error_message ? `motivo: ${linea(c.error_message, 80)}` : "",
              )}`,
          ),
        ].join("\n");
      },
    }),
    herramienta({
      nombre: "openpay_clientes",
      descripcion: "Lista o busca los clientes guardados en Openpay (nombre, correo, teléfono y alta). Sin texto, regresa los más recientes. Solo lectura.",
      app: "openpay",
      agentes: ["iris", "victor"],
      proveedor: NOMBRE,
      esquema: esquema({
        buscar: { type: "string", description: "Nombre, correo o teléfono a buscar." },
        limite: { type: "integer", minimum: 1, maximum: 50, description: "Cuántos clientes. Por defecto 20." },
      }),
      async ejecutar(args, ctx) {
        const buscar = sinAcentos(argTexto(args, "buscar", 120));
        const limite = argEntero(args, "limite", 20, 1, 50);
        const t = await ctx.token();
        const r = await deTokens<Cliente[]>(t, "/customers", { offset: 0, limit: 100 }, ctx.senal);
        const lista = (Array.isArray(r) ? r : [])
          .filter((c) => !buscar || sinAcentos([c.name, c.last_name, c.email, c.phone_number, c.external_id].filter(Boolean).join(" ")).includes(buscar))
          .sort((a, b) => String(b.creation_date ?? "").localeCompare(String(a.creation_date ?? "")))
          .slice(0, limite);
        if (!lista.length) return buscar ? "No encontré clientes en Openpay con ese texto (se revisaron los 100 más recientes)." : "No hay clientes guardados en Openpay.";
        return [
          `Clientes de Openpay${buscar ? " que coinciden" : ""} (${lista.length}):`,
          ...lista.map(
            (c) =>
              `- ${unir(
                linea([c.name, c.last_name].filter(Boolean).join(" "), 80) || "Sin nombre",
                linea(c.email, 80),
                linea(c.phone_number, 30),
                c.creation_date ? `alta ${fecha3(c.creation_date, true)}` : "",
                c.external_id ? `ref ${linea(c.external_id, 40)}` : "",
              )}`,
          ),
        ].join("\n");
      },
    }),
  ],
};

/** Con el nombre del proveedor, como lo importa el registro. */
export { adaptador as openpay };
