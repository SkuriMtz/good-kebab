import type { Adaptador, Herramienta, Tokens } from "@/lib/nucleo-tipos";
import { fechaMx, linea, pedirJson } from "../http";
import { ErrorOAuth, postarTokens, venceEn } from "../oauth";
import { argDias, argLimite, argOpcion, consultar, dinero, entero, propDias, propLimite, senalCorta, sumar, totales } from "./comun-ventas";

/**
 * MERCADO PAGO (OAuth de la app del dueño en "Tus integraciones").
 * - Autorización: https://auth.mercadopago.com/authorization (platform_id=mp,
 *   state y PKCE S256; PKCE se activa en la app y entonces es obligatorio).
 * - Tokens: POST https://api.mercadopago.com/oauth/token en JSON. El
 *   access_token dura 180 días; al renovar, cambia también el refresh_token.
 * - Datos: GET /v1/payments/search (pagos de los últimos 12 meses).
 * Docs: https://www.mercadopago.com.mx/developers/es/docs/security/oauth
 * Sin endpoint para revocar: la persona quita el permiso desde su cuenta.
 * Tokens.extra: user_id, cuenta y scopes.
 */

const API = "https://api.mercadopago.com";
const APP = "Mercado Pago";

function credenciales() {
  const id = process.env.MERCADOPAGO_CLIENT_ID?.trim();
  const secreto = process.env.MERCADOPAGO_CLIENT_SECRET?.trim();
  if (!id || !secreto) throw new ErrorOAuth("rechazo", "Falta configurar Mercado Pago en Vercel.");
  return { id, secreto };
}

function aTokens(d: Record<string, unknown>, previo?: Tokens): Tokens {
  if (typeof d.access_token !== "string") throw new ErrorOAuth("rechazo", "Mercado Pago no mandó el token.");
  const extra: Record<string, string> = { ...(previo?.extra ?? {}) };
  if (d.user_id !== undefined && d.user_id !== null) extra.user_id = String(d.user_id);
  if (typeof d.scope === "string") extra.scopes = d.scope;
  return {
    access_token: d.access_token,
    refresh_token: typeof d.refresh_token === "string" ? d.refresh_token : previo?.refresh_token,
    expira_en: venceEn(d.expires_in),
    extra,
  };
}

/* ---------------- Herramientas (solo lectura) ---------------- */

type Pago = {
  id: number | string;
  date_created?: string;
  date_approved?: string | null;
  status?: string;
  status_detail?: string;
  transaction_amount?: number;
  currency_id?: string;
  description?: string | null;
  payment_method_id?: string;
  payment_type_id?: string;
  payer?: { email?: string | null; first_name?: string | null; last_name?: string | null } | null;
  transaction_details?: { net_received_amount?: number } | null;
};
type Busqueda = { results?: Pago[]; paging?: { total?: number; limit?: number; offset?: number } };

const ESTADOS = ["todos", "approved", "pending", "in_process", "authorized", "rejected", "refunded", "cancelled", "charged_back", "in_mediation"] as const;
const ESTADO: Record<string, string> = {
  approved: "aprobado",
  pending: "pendiente",
  in_process: "en revisión",
  authorized: "autorizado",
  rejected: "rechazado",
  refunded: "devuelto",
  cancelled: "cancelado",
  charged_back: "contracargo",
  in_mediation: "en disputa",
};
const TIPO: Record<string, string> = {
  credit_card: "tarjeta de crédito",
  debit_card: "tarjeta de débito",
  account_money: "dinero en cuenta",
  ticket: "efectivo (OXXO u otro)",
  bank_transfer: "transferencia",
  atm: "cajero",
  digital_currency: "Mercado Crédito",
  prepaid_card: "tarjeta prepago",
};

const pedido = (token: string, senal: AbortSignal) => ({ token, senal, proveedor: "mercadopago" as const });

function buscarPagos(token: string, senal: AbortSignal, o: { dias: number; limite: number; offset?: number; estado?: string }) {
  const q = new URLSearchParams({
    sort: "date_created",
    criteria: "desc",
    range: "date_created",
    begin_date: `NOW-${o.dias}DAYS`,
    end_date: "NOW",
    limit: String(o.limite),
    offset: String(o.offset ?? 0),
  });
  if (o.estado && o.estado !== "todos") q.set("status", o.estado);
  return pedirJson<Busqueda>(`${API}/v1/payments/search?${q}`, pedido(token, senal));
}

const pagador = (p: Pago) => linea([p.payer?.first_name, p.payer?.last_name].filter(Boolean).join(" ") || p.payer?.email || "pagador sin nombre", 80);

const pagosRecibidos: Herramienta = {
  nombre: "mercadopago_pagos_recibidos",
  descripcion:
    "Pagos que la persona recibió en Mercado Pago (solo lectura), del más reciente al más viejo: fecha, monto, estado (aprobado, pendiente, rechazado, devuelto…), medio de pago y quién pagó. Se puede filtrar por estado.",
  app: "mercado_pago",
  agentes: ["iris"],
  esquema: {
    type: "object",
    properties: {
      dias: propDias(365),
      estado: { type: "string", enum: [...ESTADOS], description: "approved = aprobado, pending = pendiente, rejected = rechazado, refunded = devuelto… (por omisión, todos)." },
      limite: propLimite(50),
    },
    additionalProperties: false,
  },
  async ejecutar(args, ctx) {
    const dias = argDias(args, 365);
    const estado = argOpcion(args, "estado", ESTADOS, "todos");
    const limite = argLimite(args);
    return consultar(APP, ctx.senal, async (senal) => {
      const d = await buscarPagos((await ctx.token()).access_token, senal, { dias, limite, estado });
      const pagos = d.results ?? [];
      if (!pagos.length) return `No hay pagos${estado !== "todos" ? ` con estado "${ESTADO[estado] ?? estado}"` : ""} en los últimos ${dias} días.`;
      const total = d.paging?.total ?? pagos.length;
      return [
        `Pagos recibidos en los últimos ${dias} días: ${entero(total)}${total > pagos.length ? ` (aquí los ${pagos.length} más recientes)` : ""}.`,
        ...pagos.map((p) => {
          const neto = p.status === "approved" && typeof p.transaction_details?.net_received_amount === "number" ? ` (te quedan ${dinero(p.transaction_details.net_received_amount, p.currency_id)})` : "";
          const medio = TIPO[p.payment_type_id ?? ""] ?? linea(p.payment_method_id, 30);
          return `- ${fechaMx(p.date_created)} · ${dinero(p.transaction_amount, p.currency_id)}${neto} · ${ESTADO[p.status ?? ""] ?? linea(p.status, 30)} · ${medio || "medio no dicho"} · ${pagador(p)}${p.description ? ` · ${linea(p.description, 80)}` : ""} · id ${p.id}`;
        }),
      ].join("\n");
    });
  },
};

const resumenPagos: Herramienta = {
  nombre: "mercadopago_resumen_pagos",
  descripcion: "Resumen de los pagos de Mercado Pago de un periodo (solo lectura): cuántos y cuánto dinero hay en cada estado (aprobados, pendientes, rechazados, devueltos) y lo que te queda después de comisiones. Revisa hasta 500 pagos.",
  app: "mercado_pago",
  agentes: ["iris"],
  esquema: { type: "object", properties: { dias: propDias(365) }, additionalProperties: false },
  async ejecutar(args, ctx) {
    const dias = argDias(args, 365);
    return consultar(APP, ctx.senal, async (senal) => {
      const token = (await ctx.token()).access_token;
      const pagos: Pago[] = [];
      let total = 0;
      for (let offset = 0; offset < 500; offset += 100) {
        const d = await buscarPagos(token, senal, { dias, limite: 100, offset });
        const lote = d.results ?? [];
        pagos.push(...lote);
        total = d.paging?.total ?? pagos.length;
        if (lote.length < 100 || pagos.length >= total) break;
      }
      if (!pagos.length) return `No hay pagos en los últimos ${dias} días.`;
      const grupos = new Map<string, { n: number; monto: Map<string, number> }>();
      const neto = new Map<string, number>();
      for (const p of pagos) {
        const k = p.status ?? "otro";
        const g = grupos.get(k) ?? { n: 0, monto: new Map() };
        g.n += 1;
        sumar(g.monto, p.currency_id, Number(p.transaction_amount));
        grupos.set(k, g);
        if (p.status === "approved") sumar(neto, p.currency_id, Number(p.transaction_details?.net_received_amount ?? p.transaction_amount));
      }
      return [
        `Pagos de Mercado Pago, últimos ${dias} días (${entero(pagos.length)}${total > pagos.length ? ` de ${entero(total)}; el resumen usa los más recientes` : ""}):`,
        ...Array.from(grupos.entries())
          .sort((a, b) => b[1].n - a[1].n)
          .map(([k, g]) => `- ${ESTADO[k] ?? linea(k, 30)}: ${entero(g.n)} · ${totales(g.monto)}`),
        `Te queda de lo aprobado, después de comisiones: ${totales(neto)}.`,
      ].join("\n");
    });
  },
};

/* ---------------- El adaptador ---------------- */

export const mercadopago: Adaptador = {
  proveedor: "mercadopago",
  autenticacion: "oauth",
  variables: ["MERCADOPAGO_CLIENT_ID", "MERCADOPAGO_CLIENT_SECRET"],
  urlAutorizacion({ state, redirectUri, codeChallenge }) {
    const q = new URLSearchParams({ client_id: credenciales().id, response_type: "code", platform_id: "mp", state, redirect_uri: redirectUri });
    if (codeChallenge) {
      q.set("code_challenge", codeChallenge);
      q.set("code_challenge_method", "S256");
    }
    return `https://auth.mercadopago.com/authorization?${q}`;
  },
  async intercambiar({ code, redirectUri, codeVerifier }) {
    const { id, secreto } = credenciales();
    const cuerpo: Record<string, string> = { client_id: id, client_secret: secreto, grant_type: "authorization_code", code, redirect_uri: redirectUri };
    if (codeVerifier) cuerpo.code_verifier = codeVerifier;
    return aTokens(await postarTokens(`${API}/oauth/token`, cuerpo, {}, true));
  },
  async renovar(t) {
    if (!t.refresh_token) throw new ErrorOAuth("invalid_grant", "Sin refresh token.");
    const { id, secreto } = credenciales();
    const d = await postarTokens(`${API}/oauth/token`, { client_id: id, client_secret: secreto, grant_type: "refresh_token", refresh_token: t.refresh_token }, {}, true);
    return aTokens(d, t);
  },
  async cuenta(t) {
    if (t.extra?.cuenta) return t.extra.cuenta;
    try {
      const u = await pedirJson<{ nickname?: string; first_name?: string; last_name?: string; email?: string }>(`${API}/users/me`, { token: t.access_token, senal: senalCorta(), proveedor: "mercadopago" });
      const nombre = [u.first_name, u.last_name].filter(Boolean).join(" ") || u.nickname || "";
      return linea(u.email ? `${nombre ? `${nombre} · ` : ""}${u.email}` : nombre, 160) || "Tu cuenta de Mercado Pago";
    } catch {
      return "Tu cuenta de Mercado Pago";
    }
  },
  herramientas: [pagosRecibidos, resumenPagos],
};
