import type { Adaptador, Tokens } from "@/lib/nucleo-tipos";
import { rangoFechas } from "../http";
import { ErrorProveedor, argEntero, argTexto, consulta, esquema, herramienta, linea, pedirJson, sinRenovacion, unir, variable } from "./_comun-1";
import { dinero, fecha3, pedirToken3, sinAcentos } from "./_comun-3";

/**
 * SQUARE (OAuth, flujo con código y secreto; developer.squareup.com, nov 2026):
 * - Autorizar: https://connect.squareup.com/oauth2/authorize con client_id,
 *   scope (separado por espacios), session=false y state. Si el Application
 *   ID es de Sandbox ("sandbox-…"), todo va a connect.squareupsandbox.com.
 * - Token: POST /oauth2/token (JSON: client_id, client_secret, code,
 *   grant_type). El access token dura 30 días; el refresh token del flujo con
 *   secreto no vence y Square regresa el mismo al renovar.
 * - Revocar: POST /oauth2/revoke con "Authorization: Client <secreto>".
 * - Versión del API: Square-Version 2026-09-16.
 * - Lee: GET /v2/merchants/me, GET /v2/payments, GET /v2/customers,
 *   POST /v2/customers/search, GET /v2/bookings (máximo 31 días) y
 *   POST /v2/customers/bulk-retrieve (nombres de quien reservó).
 */

const NOMBRE = "Square";
const VERSION = "2026-09-16";
export const SCOPES_SQUARE = ["MERCHANT_PROFILE_READ", "PAYMENTS_READ", "CUSTOMERS_READ", "APPOINTMENTS_READ", "APPOINTMENTS_ALL_READ"];

const credenciales = () => ({ id: variable("SQUARE_CLIENT_ID"), secreto: variable("SQUARE_CLIENT_SECRET") });
/** El Application ID de Sandbox empieza con "sandbox-": así se sabe a qué servidor ir. */
const esSandbox = (id: string) => id.startsWith("sandbox-");
const hostDe = (sandbox: boolean) => (sandbox ? "https://connect.squareupsandbox.com" : "https://connect.squareup.com");
const hostTokens = (t: Tokens) => hostDe(t.extra?.ambiente === "sandbox");

type RespuestaToken = { access_token: string; refresh_token?: string; expires_at?: string; merchant_id?: string };

const aTokens = (r: RespuestaToken, sandbox: boolean, anterior?: Tokens): Tokens => {
  const vence = r.expires_at ? Date.parse(r.expires_at) : NaN;
  const extra: Record<string, string> = { ...(anterior?.extra ?? {}), ambiente: sandbox ? "sandbox" : "produccion" };
  if (r.merchant_id && /^[A-Za-z0-9_-]{3,64}$/.test(r.merchant_id)) extra.comercio = r.merchant_id;
  return {
    access_token: r.access_token,
    refresh_token: r.refresh_token ?? anterior?.refresh_token,
    expira_en: Number.isFinite(vence) ? vence : undefined,
    extra,
  };
};

function api<T>(t: Tokens, ruta: string, o: { params?: Record<string, string | number | undefined>; cuerpo?: unknown; senal?: AbortSignal } = {}) {
  return pedirJson<T>(NOMBRE, `${hostTokens(t)}${ruta}${consulta(o.params ?? {})}`, {
    metodo: o.cuerpo !== undefined ? "POST" : "GET",
    encabezados: {
      Authorization: `Bearer ${t.access_token}`,
      "Square-Version": VERSION,
      Accept: "application/json",
      ...(o.cuerpo !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    cuerpo: o.cuerpo !== undefined ? JSON.stringify(o.cuerpo) : undefined,
    senal: o.senal,
    interpretar: (estado) =>
      estado === 403 ? "A la conexión con Square le falta un permiso (o tu plan de Square no lo incluye). Vuelve a conectarla y acepta todos los permisos." : undefined,
  });
}

type Money = { amount?: number; currency?: string };
type Pago = {
  id?: string;
  created_at?: string;
  amount_money?: Money;
  total_money?: Money;
  refunded_money?: Money;
  status?: string;
  source_type?: string;
  card_details?: { card?: { card_brand?: string; last_4?: string } };
  note?: string;
  receipt_number?: string;
  buyer_email_address?: string;
};
type ClienteSq = {
  id?: string;
  given_name?: string;
  family_name?: string;
  company_name?: string;
  email_address?: string;
  phone_number?: string;
  created_at?: string;
  note?: string;
};
type Reserva = {
  id?: string;
  status?: string;
  start_at?: string;
  customer_id?: string;
  customer_note?: string;
  seller_note?: string;
  appointment_segments?: { duration_minutes?: number }[];
};

const ESTADO_PAGO: Record<string, string> = { COMPLETED: "completado", APPROVED: "aprobado", PENDING: "pendiente", CANCELED: "cancelado", FAILED: "falló" };
const ESTADO_CITA: Record<string, string> = {
  PENDING: "por confirmar",
  ACCEPTED: "confirmada",
  CANCELLED_BY_CUSTOMER: "cancelada por el cliente",
  CANCELLED_BY_SELLER: "cancelada por el negocio",
  DECLINED: "rechazada",
  NO_SHOW: "no llegó",
};
const FUENTE: Record<string, string> = { CARD: "tarjeta", CASH: "efectivo", BANK_ACCOUNT: "cuenta bancaria", WALLET: "billetera", EXTERNAL: "externo", SQUARE_ACCOUNT: "saldo de Square" };

const nombreCliente = (c?: ClienteSq) => linea([c?.given_name, c?.family_name].filter(Boolean).join(" ") || c?.company_name, 80);

export const adaptador: Adaptador = {
  proveedor: "square",
  autenticacion: "oauth",
  variables: ["SQUARE_CLIENT_ID", "SQUARE_CLIENT_SECRET"],

  urlAutorizacion({ state }) {
    const { id } = credenciales();
    const sandbox = esSandbox(id);
    return `${hostDe(sandbox)}/oauth2/authorize${consulta({
      client_id: id,
      scope: SCOPES_SQUARE.join(" "),
      // En producción, false obliga a elegir la cuenta (Sandbox lo ignora)
      session: sandbox ? undefined : "false",
      state,
    })}`;
  },

  async intercambiar({ code }) {
    const { id, secreto } = credenciales();
    const sandbox = esSandbox(id);
    const r = await pedirToken3<RespuestaToken>(NOMBRE, `${hostDe(sandbox)}/oauth2/token`, {
      cuerpo: JSON.stringify({ client_id: id, client_secret: secreto, code, grant_type: "authorization_code" }),
      encabezados: { "Content-Type": "application/json", "Square-Version": VERSION },
    });
    const t = aTokens(r, sandbox);
    try {
      const m = await api<{ merchant?: { business_name?: string; country?: string; currency?: string } }>(t, "/v2/merchants/me");
      if (m.merchant?.business_name) t.extra!.negocio = linea(m.merchant.business_name, 120);
      if (m.merchant?.currency) t.extra!.moneda = linea(m.merchant.currency, 3);
    } catch {
      // Sin el nombre del negocio también se conecta
    }
    return t;
  },

  async renovar(t) {
    if (!t.refresh_token) throw sinRenovacion(NOMBRE);
    const { id, secreto } = credenciales();
    const r = await pedirToken3<RespuestaToken>(NOMBRE, `${hostTokens(t)}/oauth2/token`, {
      cuerpo: JSON.stringify({ client_id: id, client_secret: secreto, refresh_token: t.refresh_token, grant_type: "refresh_token" }),
      encabezados: { "Content-Type": "application/json", "Square-Version": VERSION },
      renovando: true,
    });
    return aTokens(r, t.extra?.ambiente === "sandbox", t);
  },

  async revocar(t) {
    const { id, secreto } = credenciales();
    await pedirJson(NOMBRE, `${hostTokens(t)}/oauth2/revoke`, {
      metodo: "POST",
      encabezados: { Authorization: `Client ${secreto}`, "Content-Type": "application/json", "Square-Version": VERSION },
      cuerpo: JSON.stringify({ client_id: id, access_token: t.access_token }),
    }).catch(() => undefined);
  },

  async cuenta(t) {
    if (t.extra?.negocio) return unir(t.extra.negocio, t.extra.ambiente === "sandbox" ? "Sandbox" : "");
    const m = await api<{ merchant?: { business_name?: string } }>(t, "/v2/merchants/me");
    return linea(m.merchant?.business_name, 120) || "Cuenta de Square";
  },

  herramientas: [
    herramienta({
      nombre: "square_pagos",
      descripcion:
        "Lista los pagos recientes cobrados con Square (del más nuevo al más viejo): fecha, monto, estado, forma de pago, nota y número de recibo. Solo lectura.",
      app: "square",
      agentes: ["iris"],
      proveedor: NOMBRE,
      esquema: esquema({
        dias: { type: "integer", minimum: 1, maximum: 365, description: "Cuántos días hacia atrás. Por defecto 30." },
        limite: { type: "integer", minimum: 1, maximum: 50, description: "Cuántos pagos. Por defecto 20." },
      }),
      async ejecutar(args, ctx) {
        const dias = argEntero(args, "dias", 30, 1, 365);
        const t = await ctx.token();
        const r = await api<{ payments?: Pago[]; cursor?: string }>(t, "/v2/payments", {
          params: { begin_time: new Date(Date.now() - dias * 86_400_000).toISOString(), sort_order: "DESC", limit: argEntero(args, "limite", 20, 1, 50) },
          senal: ctx.senal,
        });
        const lista = r.payments ?? [];
        if (!lista.length) return `No hay pagos en Square en los últimos ${dias} días.`;
        return [
          `Pagos de Square, últimos ${dias} días (${lista.length}${r.cursor ? ", hay más" : ""}):`,
          ...lista.map((p) => {
            const card = p.card_details?.card;
            const m = p.total_money ?? p.amount_money;
            return `- ${unir(
              fecha3(p.created_at),
              dinero(m?.amount, m?.currency, { centavos: true }),
              p.status ? ESTADO_PAGO[p.status] ?? linea(p.status, 20) : "",
              p.source_type === "CARD" && card ? unir("tarjeta", linea(card.card_brand, 20), card.last_4 ? `****${linea(card.last_4, 4)}` : "") : FUENTE[p.source_type ?? ""] ?? linea(p.source_type, 20),
              p.refunded_money?.amount ? `reembolsado ${dinero(p.refunded_money.amount, p.refunded_money.currency, { centavos: true })}` : "",
              linea(p.buyer_email_address, 80),
              linea(p.note, 100),
              p.receipt_number ? `recibo ${linea(p.receipt_number, 20)}` : "",
            )}`;
          }),
        ].join("\n");
      },
    }),
    herramienta({
      nombre: "square_clientes",
      descripcion:
        "Busca clientes en el directorio de Square (nombre, correo, teléfono, empresa y nota). Con un correo o teléfono busca en Square; con un nombre filtra los 100 más recientes. Sin texto, regresa los más recientes. Solo lectura.",
      app: "square",
      agentes: ["iris", "victor"],
      proveedor: NOMBRE,
      esquema: esquema({
        buscar: { type: "string", description: "Nombre, correo o teléfono del cliente." },
        limite: { type: "integer", minimum: 1, maximum: 50, description: "Cuántos clientes. Por defecto 20." },
      }),
      async ejecutar(args, ctx) {
        const buscar = argTexto(args, "buscar", 120);
        const limite = argEntero(args, "limite", 20, 1, 50);
        const t = await ctx.token();
        let lista: ClienteSq[];
        const digitos = buscar.replace(/[^\d+]/g, "");
        if (buscar.includes("@") || (digitos.length >= 7 && digitos.length >= buscar.replace(/\s/g, "").length - 2)) {
          const filtro = buscar.includes("@") ? { email_address: { fuzzy: buscar } } : { phone_number: { fuzzy: digitos } };
          const r = await api<{ customers?: ClienteSq[] }>(t, "/v2/customers/search", { cuerpo: { query: { filter: filtro }, limit: limite }, senal: ctx.senal });
          lista = r.customers ?? [];
        } else {
          const r = await api<{ customers?: ClienteSq[] }>(t, "/v2/customers", { params: { limit: 100, sort_field: "CREATED_AT", sort_order: "DESC" }, senal: ctx.senal });
          const q = sinAcentos(buscar);
          lista = (r.customers ?? []).filter((c) => !q || sinAcentos([nombreCliente(c), c.company_name, c.email_address].filter(Boolean).join(" ")).includes(q));
        }
        lista = lista.slice(0, limite);
        if (!lista.length) return buscar ? `No encontré clientes en Square con "${linea(buscar, 60)}".` : "No hay clientes en Square.";
        return [
          `Clientes de Square${buscar ? ` con "${linea(buscar, 60)}"` : ""} (${lista.length}):`,
          ...lista.map(
            (c) =>
              `- ${unir(
                nombreCliente(c) || "Sin nombre",
                linea(c.email_address, 80),
                linea(c.phone_number, 30),
                c.company_name && nombreCliente(c) !== c.company_name ? linea(c.company_name, 60) : "",
                c.created_at ? `alta ${fecha3(c.created_at, true)}` : "",
                linea(c.note, 100),
              )}`,
          ),
        ].join("\n");
      },
    }),
    herramienta({
      nombre: "square_citas",
      descripcion:
        "Lista las citas de Square Appointments en un rango de fechas (por omisión hoy y los 7 días siguientes; máximo 31 días): hora, cliente, duración, estado y notas. Solo lectura.",
      app: "square",
      agentes: ["lola", "iris"],
      proveedor: NOMBRE,
      esquema: esquema({
        desde: { type: "string", description: "Fecha inicial AAAA-MM-DD. Por defecto hoy." },
        hasta: { type: "string", description: "Fecha final AAAA-MM-DD. Por defecto 7 días después de desde." },
        limite: { type: "integer", minimum: 1, maximum: 50, description: "Cuántas citas. Por defecto 30." },
      }),
      async ejecutar(args, ctx) {
        const r0 = rangoFechas(argTexto(args, "desde", 40), argTexto(args, "hasta", 40));
        if (r0.hasta.getTime() - r0.desde.getTime() > 31 * 86_400_000) throw new ErrorProveedor("Square solo deja ver 31 días de citas a la vez: pide un rango más corto.");
        const limite = argEntero(args, "limite", 30, 1, 50);
        const t = await ctx.token();
        const r = await api<{ bookings?: Reserva[]; cursor?: string }>(t, "/v2/bookings", {
          params: { start_at_min: r0.desde.toISOString(), start_at_max: r0.hasta.toISOString(), limit: 100 },
          senal: ctx.senal,
        }).catch((e: unknown) => {
          if (e instanceof ErrorProveedor && e.status === 403)
            throw new ErrorProveedor("Square no dejó ver las citas: revisa que uses Square Appointments y vuelve a conectar aceptando todos los permisos.", 403);
          throw e;
        });
        const citas = (r.bookings ?? [])
          .slice()
          .sort((a, b) => String(a.start_at ?? "").localeCompare(String(b.start_at ?? "")))
          .slice(0, limite);
        if (!citas.length) return "No hay citas en Square Appointments en esas fechas.";
        // Los nombres de quien reservó (una sola consulta)
        const ids = Array.from(new Set(citas.map((c) => c.customer_id).filter((x): x is string => !!x))).slice(0, 100);
        const nombres = new Map<string, ClienteSq>();
        if (ids.length) {
          try {
            const b = await api<{ responses?: Record<string, { customer?: ClienteSq }> }>(t, "/v2/customers/bulk-retrieve", { cuerpo: { customer_ids: ids }, senal: ctx.senal });
            for (const [id, v] of Object.entries(b.responses ?? {})) if (v.customer) nombres.set(id, v.customer);
          } catch {
            // Sin nombres, la cita igual se muestra
          }
        }
        return [
          `Citas de Square (${citas.length}${r.cursor ? ", hay más" : ""}):`,
          ...citas.map((c) => {
            const cli = c.customer_id ? nombres.get(c.customer_id) : undefined;
            const minutos = (c.appointment_segments ?? []).reduce((s, x) => s + (Number(x.duration_minutes) || 0), 0);
            return `- ${unir(
              fecha3(c.start_at),
              nombreCliente(cli) || (c.customer_id ? "cliente sin nombre" : ""),
              linea(cli?.phone_number, 30),
              minutos ? `${minutos} min` : "",
              c.status ? ESTADO_CITA[c.status] ?? linea(c.status, 30) : "",
              c.customer_note ? `nota del cliente: ${linea(c.customer_note, 100)}` : "",
              c.seller_note ? `nota interna: ${linea(c.seller_note, 100)}` : "",
            )}`;
          }),
        ].join("\n");
      },
    }),
  ],
};

/** Con el nombre del proveedor, como lo importa el registro. */
export { adaptador as square };
