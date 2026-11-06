import type { Adaptador, Herramienta, Tokens } from "@/lib/nucleo-tipos";
import { argNumero, argTexto, ErrorArgs, fechaMx, linea, pedirJson } from "../http";
import { ErrorApi, ErrorOAuth, postarTokens } from "../oauth";
import { argDias, argLimite, argOpcion, consultar, dinero, entero, haceDias, propDias, propLimite, senalCorta, sumar, totales } from "./comun-ventas";

/**
 * TIENDANUBE / NUVEMSHOP (OAuth de la app del dueño en el Portal de Socios).
 * - Autorización: https://www.tiendanube.com/apps/{app_id}/authorize?state=…
 *   (la URL de redirección y los permisos se configuran en la app, no en la URL).
 * - Token: POST https://www.tiendanube.com/apps/authorize/token (JSON). No
 *   vence: deja de servir si la persona desinstala la app o se pide otro.
 *   Viene con user_id = el id de la tienda.
 * - Datos: Admin API 2025-03 (la estable): https://api.tiendanube.com/2025-03/{store_id}
 *   con Authorization: Bearer y un User-Agent con nombre y contacto (obligatorio).
 * Sin endpoint para revocar: se desinstala desde el administrador de la tienda.
 * Docs: https://tiendanube.github.io/api-documentation/authentication
 * Tokens.extra: store_id, scopes y cuenta.
 */

const API = "https://api.tiendanube.com/2025-03";
const APP = "Tiendanube";

function credenciales() {
  const id = process.env.TIENDANUBE_CLIENT_ID?.trim();
  const secreto = process.env.TIENDANUBE_CLIENT_SECRET?.trim();
  if (!id || !secreto) throw new ErrorOAuth("rechazo", "Falta configurar Tiendanube en Vercel.");
  if (!/^\d{1,12}$/.test(id)) throw new ErrorOAuth("rechazo", "TIENDANUBE_CLIENT_ID tiene que ser el número (ID) de la app.");
  return { id, secreto };
}

/** Tiendanube pide en cada llamada un User-Agent con el nombre de la app y un contacto. */
function agente() {
  const sitio = (process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "").trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  return sitio ? `Atendel (https://${sitio})` : "Atendel";
}

function tiendaDe(t: Tokens): string {
  const id = t.extra?.store_id ?? "";
  if (!/^\d{1,15}$/.test(id)) throw new ErrorArgs("Falta la tienda de Tiendanube: hay que volver a conectarla en Tu negocio → Apps.");
  return id;
}

const pedido = (t: Tokens, senal: AbortSignal) => ({ token: t.access_token, senal, proveedor: "tiendanube" as const, headers: { "User-Agent": agente() } });

/** Tiendanube contesta 404 cuando una lista viene vacía ("Last page is 0"). */
async function lista<T>(url: string, p: ReturnType<typeof pedido>): Promise<T[]> {
  try {
    const d = await pedirJson<T[]>(url, p);
    return Array.isArray(d) ? d : [];
  } catch (e) {
    if (e instanceof ErrorApi && e.status === 404) return [];
    throw e;
  }
}

/** Los textos de Tiendanube vienen por idioma ({es, pt, en}). */
const texto = (v: unknown): string => {
  if (typeof v === "string") return v;
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    const x = o.es ?? o.pt ?? o.en ?? Object.values(o)[0];
    return typeof x === "string" ? x : "";
  }
  return "";
};

/* ---------------- Herramientas (solo lectura) ---------------- */

type Orden = {
  id: number;
  number?: number | string;
  created_at?: string;
  status?: string;
  payment_status?: string;
  shipping_status?: string | null;
  total?: string | number;
  currency?: string;
  contact_name?: string | null;
  products?: { name?: unknown; quantity?: number | string }[];
};

const ESTADOS_PAGO = ["todos", "pending", "authorized", "paid", "abandoned", "refunded", "voided"] as const;
const ESTADO_PAGO: Record<string, string> = {
  pending: "pendiente de pago",
  authorized: "autorizado",
  paid: "pagado",
  partially_paid: "pagado en parte",
  abandoned: "abandonado",
  refunded: "reembolsado",
  partially_refunded: "reembolso parcial",
  voided: "anulado",
};
const ESTADO_ENVIO: Record<string, string> = { unpacked: "sin empacar", unfulfilled: "sin enviar", fulfilled: "enviado", shipped: "enviado", unshipped: "sin enviar", partially_fulfilled: "enviado en parte", delivered: "entregado" };

const pedidos: Herramienta = {
  nombre: "tiendanube_pedidos_recientes",
  descripcion: "Pedidos recientes de la tienda Tiendanube de la persona (solo lectura): número, fecha, total, estado de pago y de envío, cliente y productos. Se puede filtrar por estado de pago.",
  app: "tienda_nube",
  agentes: ["iris", "victor"],
  esquema: {
    type: "object",
    properties: {
      dias: propDias(365),
      estado_pago: { type: "string", enum: [...ESTADOS_PAGO], description: "paid = pagado, pending = pendiente… (por omisión, todos)." },
      limite: propLimite(50),
    },
    additionalProperties: false,
  },
  async ejecutar(args, ctx) {
    const dias = argDias(args, 365);
    const estado = argOpcion(args, "estado_pago", ESTADOS_PAGO, "todos");
    const limite = argLimite(args);
    return consultar(APP, ctx.senal, async (senal) => {
      const t = await ctx.token();
      const q = new URLSearchParams({
        per_page: String(limite),
        created_at_min: haceDias(dias).toISOString(),
        fields: "id,number,created_at,status,payment_status,shipping_status,total,currency,contact_name,products",
      });
      if (estado !== "todos") q.set("payment_status", estado);
      const ordenes = (await lista<Orden>(`${API}/${tiendaDe(t)}/orders?${q}`, pedido(t, senal))).sort((a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")));
      if (!ordenes.length) return `No hay pedidos en los últimos ${dias} días${estado !== "todos" ? " con ese estado de pago" : ""}.`;
      const pagado = new Map<string, number>();
      for (const o of ordenes) if (o.payment_status === "paid") sumar(pagado, o.currency, Number(o.total));
      return [
        `Pedidos de los últimos ${dias} días (${ordenes.length}${ordenes.length >= limite ? ", los más recientes" : ""}). Pagados en esta lista: ${totales(pagado)}.`,
        ...ordenes.map((o) => {
          const prods = (o.products ?? []).slice(0, 3).map((p) => `${linea(texto(p.name), 60)}${Number(p.quantity ?? 1) > 1 ? ` ×${p.quantity}` : ""}`);
          const est = o.status === "cancelled" ? "cancelado" : ESTADO_PAGO[o.payment_status ?? ""] ?? linea(o.payment_status, 30);
          const envio = o.shipping_status ? ` · ${ESTADO_ENVIO[o.shipping_status] ?? linea(o.shipping_status, 30)}` : "";
          return `- #${linea(o.number ?? o.id, 20)} · ${fechaMx(o.created_at)} · ${dinero(o.total, o.currency)} · ${est}${envio} · ${linea(o.contact_name || "sin nombre", 60)} · ${prods.join("; ")}`;
        }),
      ].join("\n");
    });
  },
};

type Producto = { id: number; name?: unknown; published?: boolean; variants?: { price?: string | number | null; stock?: number | null; stock_management?: boolean }[] };

const productos: Herramienta = {
  nombre: "tiendanube_productos",
  descripcion:
    "Productos de la tienda Tiendanube (solo lectura): nombre, precio, inventario y si está publicado. Se puede buscar por nombre o pedir solo los que tienen poco inventario.",
  app: "tienda_nube",
  agentes: ["iris", "victor"],
  esquema: {
    type: "object",
    properties: {
      consulta: { type: "string", description: "Nombre o SKU a buscar (opcional)." },
      poco_inventario: { type: "integer", minimum: 0, maximum: 1000, description: "Si se da, solo los que tienen esas piezas o menos." },
      limite: propLimite(50),
    },
    additionalProperties: false,
  },
  async ejecutar(args, ctx) {
    const consulta = argTexto(args, "consulta", { max: 100 });
    const umbral = args.poco_inventario === undefined || args.poco_inventario === null ? null : argNumero(args, "poco_inventario", { min: 0, max: 1000, omision: 5 });
    const limite = argLimite(args);
    return consultar(APP, ctx.senal, async (senal) => {
      const t = await ctx.token();
      const q = new URLSearchParams({ per_page: umbral === null ? String(limite) : "200", fields: "id,name,published,variants" });
      if (consulta) q.set("q", consulta);
      const todos = await lista<Producto>(`${API}/${tiendaDe(t)}/products?${q}`, pedido(t, senal));
      const conStock = todos.map((p) => {
        const vs = p.variants ?? [];
        const controlados = vs.filter((v) => typeof v.stock === "number");
        return { p, stock: controlados.length ? controlados.reduce((s, v) => s + (v.stock ?? 0), 0) : null, precio: vs[0]?.price };
      });
      const elegidos = (umbral === null ? conStock : conStock.filter((x) => x.stock !== null && x.stock <= umbral).sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0))).slice(0, limite);
      if (!elegidos.length) return umbral !== null ? `Ningún producto tiene ${umbral} piezas o menos (de los que llevan inventario).` : consulta ? `No encontré productos con «${linea(consulta, 60)}».` : "La tienda todavía no tiene productos.";
      return [
        umbral !== null ? `Productos con ${umbral} piezas o menos (${elegidos.length}):` : `Productos${consulta ? ` que coinciden con «${linea(consulta, 60)}»` : ""} (${elegidos.length}):`,
        ...elegidos.map(({ p, stock, precio }) => `- ${linea(texto(p.name), 80) || "sin nombre"} · ${precio !== undefined && precio !== null ? dinero(precio, "MXN") : "sin precio"} · ${stock === null ? "inventario sin límite" : `quedan ${entero(stock)}`}${p.published === false ? " · no publicado" : ""}`),
      ].join("\n");
    });
  },
};

/* ---------------- El adaptador ---------------- */

export const tiendanube: Adaptador = {
  proveedor: "tiendanube",
  autenticacion: "oauth",
  variables: ["TIENDANUBE_CLIENT_ID", "TIENDANUBE_CLIENT_SECRET"],
  urlAutorizacion({ state }) {
    return `https://www.tiendanube.com/apps/${credenciales().id}/authorize?${new URLSearchParams({ state })}`;
  },
  async intercambiar({ code }) {
    const { id, secreto } = credenciales();
    const d = await postarTokens("https://www.tiendanube.com/apps/authorize/token", { client_id: id, client_secret: secreto, grant_type: "authorization_code", code }, {}, true);
    if (typeof d.access_token !== "string") throw new ErrorOAuth("rechazo", "Tiendanube no mandó el token.");
    const tienda = String(d.user_id ?? d.store_id ?? "");
    if (!/^\d{1,15}$/.test(tienda)) throw new ErrorOAuth("rechazo", "Tiendanube no mandó el id de la tienda.");
    return { access_token: d.access_token, extra: { store_id: tienda, ...(typeof d.scope === "string" ? { scopes: d.scope.split(",").join(" ") } : {}) } };
  },
  async cuenta(t) {
    try {
      const s = await pedirJson<{ name?: unknown; original_domain?: string }>(`${API}/${tiendaDe(t)}/store`, pedido(t, senalCorta()));
      const nombre = linea(texto(s.name), 80);
      return nombre ? (s.original_domain ? `${nombre} (${linea(s.original_domain, 80)})` : nombre) : "Tu tienda de Tiendanube";
    } catch {
      return "Tu tienda de Tiendanube";
    }
  },
  herramientas: [pedidos, productos],
};
