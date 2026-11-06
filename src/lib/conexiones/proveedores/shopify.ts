import { createHmac } from "crypto";
import type { Adaptador, Herramienta, Tokens } from "@/lib/nucleo-tipos";
import { argNumero, argTexto, ErrorArgs, fechaMx, linea } from "../http";
import { ErrorApi, ErrorOAuth, iguales, venceEn } from "../oauth";
import { argDias, argLimite, argOpcion, consultar, dinero, entero, haceDias, propDias, propLimite, senalCorta, sumar, totales } from "./comun-ventas";

/**
 * SHOPIFY (OAuth por tienda, app pública del dueño en el Dev Dashboard).
 * - "Conectar" pide el dominio de la tienda (x.myshopify.com) en `?shop=`.
 * - Autorización: https://{shop}/admin/oauth/authorize con scopes de SOLO
 *   LECTURA y state. En el callback se verifica el HMAC (SHA-256 con el
 *   client secret sobre los parámetros ordenados, sin `hmac`).
 * - Tokens: POST https://{shop}/admin/oauth/access_token con `expiring=1`
 *   (las apps públicas nuevas usan tokens offline que vencen en 1 hora y se
 *   renuevan con un refresh_token de 90 días).
 * - Datos: GraphQL Admin API, versión estable 2026-10.
 * - Revocar: la mutación appUninstall (quita la app de la tienda).
 * Avisos: sin aprobación de Shopify, los datos protegidos de clientes
 * (nombre, correo…) salen ocultos fuera de las tiendas de desarrollo, y sin
 * read_all_orders solo se ven los pedidos de los últimos 60 días.
 * Docs: https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/authorization-code-grant
 * Tokens.extra: shop, scopes y cuenta.
 */

export const VERSION_API = "2026-10";
const APP = "Shopify";
export const SCOPES = ["read_orders", "read_products", "read_inventory", "read_customers"];
const TIENDA = /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/;
export const AVISO_OCULTOS =
  "Shopify oculta los datos personales de los clientes (nombre, correo, teléfono) hasta que apruebe a Atendel para «datos protegidos de clientes»; mientras, solo se ven en tiendas de desarrollo. Lo demás (montos, estados, productos) sí se ve.";
const AVISO_60 = "Shopify solo deja ver los pedidos de los últimos 60 días.";

function credenciales() {
  const id = process.env.SHOPIFY_CLIENT_ID?.trim();
  const secreto = process.env.SHOPIFY_CLIENT_SECRET?.trim();
  if (!id || !secreto) throw new ErrorOAuth("rechazo", "Falta configurar Shopify en Vercel.");
  return { id, secreto };
}

/** "MiTienda", "mitienda.myshopify.com" o "https://mitienda.myshopify.com/admin" → "mitienda.myshopify.com"; si no, null. */
export function normalizarTienda(valor: string | undefined): string | null {
  let t = (valor ?? "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/[/?#].*$/, "");
  if (/^[a-z0-9][a-z0-9-]{0,60}$/.test(t)) t = `${t}.myshopify.com`;
  return t.length <= 100 && TIENDA.test(t) ? t : null;
}

/**
 * HMAC del callback: se quita `hmac`, se ordenan los demás parámetros, se
 * unen como k=v con & y se firma con el client secret (hex). Comparación en
 * tiempo constante.
 */
export function hmacValido(params: Record<string, string>, secreto: string): boolean {
  const firma = params.hmac ?? "";
  if (!/^[0-9a-f]{64}$/i.test(firma)) return false;
  const mensaje = Object.keys(params)
    .filter((k) => k !== "hmac" && k !== "signature")
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  const esperada = createHmac("sha256", secreto).update(mensaje).digest("hex");
  return iguales(esperada, firma.toLowerCase());
}

async function postarShopify(tienda: string, cuerpo: Record<string, string>): Promise<Record<string, unknown>> {
  let res: Response;
  try {
    res = await fetch(`https://${tienda}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams(cuerpo).toString(),
      cache: "no-store",
      signal: senalCorta(),
    });
  } catch {
    throw new ErrorOAuth("red", "No se pudo hablar con Shopify.");
  }
  const datos = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  // 400/401: el código o el refresh_token ya no sirven → hay que volver a conectar
  if (!res.ok) throw new ErrorOAuth(res.status === 400 || res.status === 401 ? "invalid_grant" : "rechazo", `HTTP ${res.status}`);
  return datos;
}

function aTokens(d: Record<string, unknown>, tienda: string, previo?: Tokens): Tokens {
  if (typeof d.access_token !== "string") throw new ErrorOAuth("rechazo", "Shopify no mandó el token.");
  const extra: Record<string, string> = { ...(previo?.extra ?? {}), shop: tienda };
  if (typeof d.scope === "string") extra.scopes = d.scope.split(",").join(" ");
  return {
    access_token: d.access_token,
    refresh_token: typeof d.refresh_token === "string" ? d.refresh_token : previo?.refresh_token,
    expira_en: venceEn(d.expires_in),
    extra,
  };
}

/** La tienda guardada, revisada otra vez antes de armar una URL con ella. */
function tiendaDe(t: Tokens): string {
  const s = t.extra?.shop ?? "";
  if (!TIENDA.test(s)) throw new ErrorArgs("Falta la tienda de Shopify: hay que volver a conectarla en Tu negocio → Apps.");
  return s;
}

type ErrorGql = { message?: string; extensions?: { code?: string } };

/** GraphQL Admin (solo consultas). `ocultos`: Shopify escondió datos protegidos de clientes. */
async function gql<T>(t: Tokens, senal: AbortSignal, query: string, variables: Record<string, unknown>): Promise<{ data: T | null; ocultos: boolean }> {
  const res = await fetch(`https://${tiendaDe(t)}/admin/api/${VERSION_API}/graphql.json`, {
    method: "POST",
    headers: { "X-Shopify-Access-Token": t.access_token, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
    signal: senal,
  });
  if (!res.ok) throw new ErrorApi(res.status, "shopify");
  const d = (await res.json()) as { data?: T | null; errors?: ErrorGql[] };
  const errores = d.errors ?? [];
  const ocultos = errores.some((e) => /not approved to access/i.test(e.message ?? ""));
  if (errores.some((e) => e.extensions?.code === "THROTTLED")) throw new ErrorApi(429, "shopify");
  const negado = errores.find((e) => e.extensions?.code === "ACCESS_DENIED" && !/not approved to access/i.test(e.message ?? ""));
  if (negado) throw new ErrorArgs("La conexión con Shopify no tiene permiso para ver esto. Vuelve a conectar Shopify y acepta todos los permisos de lectura.");
  if (!d.data && !ocultos) throw new ErrorArgs("Shopify no aceptó la consulta.");
  return { data: d.data ?? null, ocultos };
}

type Dinero = { amount?: string; currencyCode?: string } | null;

/* ---------------- Herramientas (solo lectura) ---------------- */

const ESTADOS_PAGO = ["todos", "paid", "pending", "authorized", "partially_paid", "refunded", "partially_refunded", "voided"] as const;
const ESTADO_PAGO: Record<string, string> = {
  PAID: "pagado",
  PENDING: "pendiente de pago",
  AUTHORIZED: "autorizado",
  PARTIALLY_PAID: "pagado en parte",
  REFUNDED: "reembolsado",
  PARTIALLY_REFUNDED: "reembolso parcial",
  VOIDED: "anulado",
  EXPIRED: "vencido",
};
const ESTADO_ENVIO: Record<string, string> = {
  FULFILLED: "enviado",
  UNFULFILLED: "sin enviar",
  PARTIALLY_FULFILLED: "enviado en parte",
  IN_PROGRESS: "preparándose",
  ON_HOLD: "en espera",
  SCHEDULED: "programado",
  RESTOCKED: "devuelto al inventario",
  PENDING_FULFILLMENT: "por preparar",
  OPEN: "abierto",
};

type Pedido = {
  name?: string;
  createdAt?: string;
  cancelledAt?: string | null;
  displayFinancialStatus?: string | null;
  displayFulfillmentStatus?: string | null;
  totalPriceSet?: { shopMoney?: Dinero } | null;
  customer?: { displayName?: string | null } | null;
  lineItems?: { nodes?: { title?: string; quantity?: number }[] } | null;
};

const Q_PEDIDOS = `query Pedidos($n: Int!, $q: String) {
  orders(first: $n, sortKey: CREATED_AT, reverse: true, query: $q) {
    nodes {
      name createdAt cancelledAt displayFinancialStatus displayFulfillmentStatus
      totalPriceSet { shopMoney { amount currencyCode } }
      customer { displayName }
      lineItems(first: 3) { nodes { title quantity } }
    }
  }
}`;

const pedidos: Herramienta = {
  nombre: "shopify_pedidos_recientes",
  descripcion:
    "Pedidos recientes de la tienda Shopify de la persona (solo lectura): número, fecha, total, estado de pago y de envío, cliente y artículos. Solo los últimos 60 días. Se puede filtrar por estado de pago.",
  app: "shopify",
  agentes: ["iris", "victor"],
  esquema: {
    type: "object",
    properties: {
      dias: propDias(60),
      estado_pago: { type: "string", enum: [...ESTADOS_PAGO], description: "paid = pagado, pending = pendiente, refunded = reembolsado… (por omisión, todos)." },
      limite: propLimite(50),
    },
    additionalProperties: false,
  },
  async ejecutar(args, ctx) {
    const dias = argDias(args, 60);
    const estado = argOpcion(args, "estado_pago", ESTADOS_PAGO, "todos");
    const limite = argLimite(args);
    return consultar(APP, ctx.senal, async (senal) => {
      const desde = haceDias(dias).toISOString().slice(0, 10);
      const q = `created_at:>=${desde}${estado !== "todos" ? ` financial_status:${estado}` : ""}`;
      const { data, ocultos } = await gql<{ orders?: { nodes?: Pedido[] } }>(await ctx.token(), senal, Q_PEDIDOS, { n: limite, q });
      const lista = data?.orders?.nodes ?? [];
      if (!lista.length) return `No hay pedidos en los últimos ${dias} días${estado !== "todos" ? ` con ese estado de pago` : ""}. ${AVISO_60}`;
      const vendido = new Map<string, number>();
      for (const p of lista) if (!p.cancelledAt) sumar(vendido, p.totalPriceSet?.shopMoney?.currencyCode, Number(p.totalPriceSet?.shopMoney?.amount));
      return [
        `Pedidos de los últimos ${dias} días (${lista.length}${lista.length >= limite ? ", los más recientes" : ""}). Total sin cancelados: ${totales(vendido)}.`,
        ...lista.map((p) => {
          const m = p.totalPriceSet?.shopMoney;
          const items = (p.lineItems?.nodes ?? []).map((i) => `${linea(i.title, 60)}${(i.quantity ?? 1) > 1 ? ` ×${i.quantity}` : ""}`);
          const cliente = p.customer?.displayName ? linea(p.customer.displayName, 60) : ocultos ? "cliente oculto por Shopify" : "sin cliente";
          const estadoP = p.cancelledAt ? "cancelado" : ESTADO_PAGO[p.displayFinancialStatus ?? ""] ?? linea(p.displayFinancialStatus, 30);
          return `- ${linea(p.name, 20)} · ${fechaMx(p.createdAt)} · ${dinero(m?.amount, m?.currencyCode)} · ${estadoP} · ${ESTADO_ENVIO[p.displayFulfillmentStatus ?? ""] ?? linea(p.displayFulfillmentStatus, 30)} · ${cliente} · ${items.join("; ")}`;
        }),
        dias === 60 || lista.length >= limite ? `(${AVISO_60})` : "",
        ocultos ? `(${AVISO_OCULTOS})` : "",
      ]
        .filter(Boolean)
        .join("\n");
    });
  },
};

type Producto = {
  title?: string;
  status?: string;
  totalInventory?: number | null;
  tracksInventory?: boolean | null;
  variants?: { nodes?: { title?: string; sku?: string | null; inventoryQuantity?: number | null }[] } | null;
};

const Q_INVENTARIO = `query Inventario($n: Int!, $q: String) {
  products(first: $n, sortKey: INVENTORY_TOTAL, query: $q) {
    nodes {
      title status totalInventory tracksInventory
      variants(first: 5) { nodes { title sku inventoryQuantity } }
    }
  }
}`;

const pocoInventario: Herramienta = {
  nombre: "shopify_productos_poco_inventario",
  descripcion: "Productos activos de la tienda Shopify a los que les queda poco inventario (solo lectura), del que tiene menos al que tiene más, con el detalle por variante. Por omisión, 5 piezas o menos.",
  app: "shopify",
  agentes: ["iris", "victor"],
  esquema: {
    type: "object",
    properties: { umbral: { type: "integer", minimum: 0, maximum: 1000, description: "Piezas o menos (por omisión 5)." }, limite: propLimite(50) },
    additionalProperties: false,
  },
  async ejecutar(args, ctx) {
    const umbral = argNumero(args, "umbral", { min: 0, max: 1000, omision: 5 });
    const limite = argLimite(args);
    return consultar(APP, ctx.senal, async (senal) => {
      const { data } = await gql<{ products?: { nodes?: Producto[] } }>(await ctx.token(), senal, Q_INVENTARIO, { n: limite, q: `inventory_total:<=${umbral} status:active` });
      const lista = (data?.products?.nodes ?? []).filter((p) => p.tracksInventory !== false && typeof p.totalInventory === "number" && p.totalInventory <= umbral);
      if (!lista.length) return `Ningún producto activo tiene ${umbral} piezas o menos (de los que llevan control de inventario).`;
      return [
        `Productos con ${umbral} piezas o menos (${lista.length}):`,
        ...lista.map((p) => {
          const variantes = (p.variants?.nodes ?? []).filter((v) => (p.variants?.nodes?.length ?? 0) > 1 && typeof v.inventoryQuantity === "number");
          const detalle = variantes.length ? ` (${variantes.map((v) => `${linea(v.title, 30)}: ${v.inventoryQuantity}`).join(", ")})` : "";
          return `- ${linea(p.title, 80)} · quedan ${entero(p.totalInventory)}${detalle}`;
        }),
      ].join("\n");
    });
  },
};

type Cliente = {
  displayName?: string | null;
  numberOfOrders?: string | number | null;
  amountSpent?: Dinero;
  createdAt?: string;
  lastOrder?: { name?: string; createdAt?: string } | null;
};

const Q_CLIENTES = `query Clientes($n: Int!, $q: String) {
  customers(first: $n, sortKey: UPDATED_AT, reverse: true, query: $q) {
    nodes {
      displayName numberOfOrders createdAt
      amountSpent { amount currencyCode }
      lastOrder { name createdAt }
    }
  }
}`;

const clientes: Herramienta = {
  nombre: "shopify_clientes",
  descripcion:
    "Clientes de la tienda Shopify (solo lectura): nombre, cuántos pedidos ha hecho, cuánto ha gastado y su último pedido. Se puede buscar por nombre o correo, o ver los que más han comprado.",
  app: "shopify",
  agentes: ["iris", "victor"],
  esquema: {
    type: "object",
    properties: {
      consulta: { type: "string", description: "Nombre o correo a buscar (opcional)." },
      orden: { type: "string", enum: ["recientes", "mas_compras"], description: "recientes (por omisión) o mas_compras." },
      limite: propLimite(50, 15),
    },
    additionalProperties: false,
  },
  async ejecutar(args, ctx) {
    const consulta = argTexto(args, "consulta", { max: 100 }).replace(/["\\]/g, " ").trim();
    const orden = argOpcion(args, "orden", ["recientes", "mas_compras"] as const, "recientes");
    const limite = argLimite(args, 50, 15);
    return consultar(APP, ctx.senal, async (senal) => {
      const n = orden === "mas_compras" ? 100 : limite;
      const { data, ocultos } = await gql<{ customers?: { nodes?: Cliente[] } }>(await ctx.token(), senal, Q_CLIENTES, { n, q: consulta || null });
      let lista = data?.customers?.nodes ?? [];
      if (!lista.length) return ocultos ? AVISO_OCULTOS : consulta ? `No encontré clientes con «${linea(consulta, 60)}».` : "La tienda todavía no tiene clientes.";
      if (orden === "mas_compras") lista = [...lista].sort((a, b) => Number(b.amountSpent?.amount ?? 0) - Number(a.amountSpent?.amount ?? 0)).slice(0, limite);
      const sinNombre = lista.filter((c) => !c.displayName).length;
      return [
        orden === "mas_compras" ? `Clientes que más han comprado (de los ${n} con actividad más reciente):` : `Clientes${consulta ? ` que coinciden con «${linea(consulta, 60)}»` : " con actividad reciente"} (${lista.length}):`,
        ...lista.map((c) => {
          const ultimo = c.lastOrder ? ` · último pedido ${linea(c.lastOrder.name, 20)} (${fechaMx(c.lastOrder.createdAt, true)})` : "";
          return `- ${c.displayName ? linea(c.displayName, 60) : "cliente oculto por Shopify"} · ${entero(c.numberOfOrders)} pedido${Number(c.numberOfOrders) === 1 ? "" : "s"} · gastó ${dinero(c.amountSpent?.amount, c.amountSpent?.currencyCode)}${ultimo}`;
        }),
        ocultos || sinNombre ? `(${AVISO_OCULTOS})` : "",
      ]
        .filter(Boolean)
        .join("\n");
    });
  },
};

/* ---------------- El adaptador ---------------- */

export const shopify: Adaptador = {
  proveedor: "shopify",
  autenticacion: "oauth",
  variables: ["SHOPIFY_CLIENT_ID", "SHOPIFY_CLIENT_SECRET"],
  requiereAprobacion: "Para ver nombres y correos de clientes en cualquier tienda, Shopify tiene que aprobar a Atendel para «datos protegidos de clientes» (se pide en el Dev Dashboard). Mientras, esos datos solo se ven en tiendas de desarrollo.",
  urlAutorizacion({ state, redirectUri, query }) {
    const tienda = normalizarTienda(query?.shop);
    if (!tienda) throw new ErrorArgs("Escribe el dominio de tu tienda, como mitienda.myshopify.com.");
    const q = new URLSearchParams({ client_id: credenciales().id, scope: SCOPES.join(","), redirect_uri: redirectUri, state });
    return `https://${tienda}/admin/oauth/authorize?${q}`;
  },
  async intercambiar({ code, query }) {
    const { id, secreto } = credenciales();
    const q = query ?? {};
    const tienda = normalizarTienda(q.shop);
    // El shop tiene que venir ya en su forma exacta (es el que firmó Shopify)
    if (!tienda || q.shop !== tienda) throw new ErrorOAuth("rechazo", "La tienda no es válida.");
    if (!hmacValido({ ...q, code }, secreto)) throw new ErrorOAuth("rechazo", "La firma de Shopify no coincide.");
    const ts = Number(q.timestamp);
    if (q.timestamp !== undefined && (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > 86_400)) throw new ErrorOAuth("rechazo", "La respuesta de Shopify es muy vieja.");
    const d = await postarShopify(tienda, { client_id: id, client_secret: secreto, code, expiring: "1" });
    return aTokens(d, tienda);
  },
  async renovar(t) {
    if (!t.refresh_token) throw new ErrorOAuth("invalid_grant", "Sin refresh token.");
    const { id, secreto } = credenciales();
    const tienda = t.extra?.shop ?? "";
    if (!TIENDA.test(tienda)) throw new ErrorOAuth("invalid_grant", "Sin tienda.");
    const d = await postarShopify(tienda, { client_id: id, client_secret: secreto, grant_type: "refresh_token", refresh_token: t.refresh_token });
    return aTokens(d, tienda, t);
  },
  async revocar(t) {
    // Quita la app de la tienda: el token deja de servir
    await gql(t, senalCorta(), "mutation { appUninstall { userErrors { message } } }", {}).catch(() => undefined);
  },
  async cuenta(t) {
    try {
      const { data } = await gql<{ shop?: { name?: string; myshopifyDomain?: string } }>(t, senalCorta(), "query { shop { name myshopifyDomain } }", {});
      const nombre = linea(data?.shop?.name, 80);
      const dominio = data?.shop?.myshopifyDomain ?? t.extra?.shop ?? "";
      if (nombre) return dominio ? `${nombre} (${dominio})` : nombre;
    } catch {
      /* se usa el dominio */
    }
    return t.extra?.shop ?? "Tu tienda de Shopify";
  },
  herramientas: [pedidos, pocoInventario, clientes],
};
