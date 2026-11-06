import type { Adaptador, Herramienta, Tokens } from "@/lib/nucleo-tipos";
import { ErrorArgs, fechaMx, linea, pedirJson } from "../http";
import { ErrorApi } from "../oauth";
import { argDias, argLimite, consultar, desdeCentavos, dinero, haceDias, propDias, propLimite, senalCorta, sumar, totales } from "./comun-ventas";

/**
 * STRIPE, por llave: la persona crea en su panel de Stripe una llave
 * RESTRINGIDA (rk_live_… o rk_test_…) con permiso de solo lectura en
 * Balance, Charges, PaymentIntents y Customers, y la pega en la tarjeta.
 * Las llaves secretas (sk_…) se rechazan: dan permiso de todo.
 * Docs: https://docs.stripe.com/keys y https://docs.stripe.com/api
 * Tokens: access_token = la llave (cifrada); extra.cuenta y extra.modo.
 */

const API = "https://api.stripe.com/v1";
const APP = "Stripe";
const RESTRINGIDA = /^rk_(live|test)_[A-Za-z0-9]{10,}$/;
export const MENSAJE_NO_RESTRINGIDA = "Esa llave no es restringida: usa una llave restringida de solo lectura (empieza con rk_live_). Créala en Stripe → Desarrolladores → Llaves de API → Crear llave restringida.";

const pedido = (token: string, senal: AbortSignal) => ({ token, senal, proveedor: "stripe" as const });
const llaveDe = async (ctx: { token: () => Promise<Tokens> }) => (await ctx.token()).access_token;

type Lista<T> = { data?: T[]; has_more?: boolean };
type Cargo = {
  id: string;
  amount?: number;
  amount_refunded?: number;
  currency?: string;
  created?: number;
  status?: string;
  paid?: boolean;
  refunded?: boolean;
  description?: string | null;
  customer?: string | null;
  receipt_email?: string | null;
  billing_details?: { name?: string | null; email?: string | null } | null;
  payment_method_details?: { type?: string } | null;
  failure_message?: string | null;
};
type Intento = { id: string; amount?: number; currency?: string; created?: number; status?: string; description?: string | null; customer?: string | null };
type Saldo = { available?: { amount: number; currency: string }[]; pending?: { amount: number; currency: string }[] };
type Cuenta = { id?: string; email?: string | null; business_profile?: { name?: string | null } | null; settings?: { dashboard?: { display_name?: string | null } } | null };

const ESTADO_INTENTO: Record<string, string> = {
  requires_payment_method: "esperando el método de pago",
  requires_confirmation: "por confirmar",
  requires_action: "esperando que el cliente autorice",
  processing: "procesando",
  requires_capture: "autorizado, falta capturar",
  canceled: "cancelado",
  succeeded: "cobrado",
};

const quien = (c: Cargo) => linea(c.billing_details?.name || c.billing_details?.email || c.receipt_email || c.customer || "cliente sin nombre", 80);
const estadoCargo = (c: Cargo) =>
  c.refunded ? "reembolsado" : (c.amount_refunded ?? 0) > 0 ? "reembolso parcial" : c.status === "succeeded" ? "cobrado" : c.status === "pending" ? "pendiente" : c.status === "failed" ? "rechazado" : linea(c.status, 30);

/** Lista paginada de cargos de los últimos `dias` (máximo `paginas` × 100). */
async function cargosDesde(token: string, senal: AbortSignal, dias: number, maximo: number, paginas = 1): Promise<Cargo[]> {
  const desde = Math.floor(haceDias(dias).getTime() / 1000);
  const todos: Cargo[] = [];
  let despues = "";
  for (let i = 0; i < paginas && todos.length < maximo; i++) {
    const q = new URLSearchParams({ limit: String(Math.min(100, maximo - todos.length)), "created[gte]": String(desde) });
    if (despues) q.set("starting_after", despues);
    const d = await pedirJson<Lista<Cargo>>(`${API}/charges?${q}`, pedido(token, senal));
    const lote = d.data ?? [];
    todos.push(...lote);
    if (!d.has_more || !lote.length) break;
    despues = lote[lote.length - 1].id;
  }
  return todos;
}

/* ---------------- Herramientas (solo lectura) ---------------- */

const pagosRecientes: Herramienta = {
  nombre: "stripe_pagos_recientes",
  descripcion:
    "Pagos recientes de la cuenta de Stripe de la persona (solo lectura): cobros con tarjeta (cobrados, rechazados o reembolsados) y pagos que siguen sin completarse. Regresa fecha, monto, estado y cliente, más el total cobrado.",
  app: "stripe",
  agentes: ["iris"],
  esquema: { type: "object", properties: { dias: propDias(90), limite: propLimite(50) }, additionalProperties: false },
  async ejecutar(args, ctx) {
    const dias = argDias(args);
    const limite = argLimite(args);
    return consultar(APP, ctx.senal, async (senal) => {
      const token = await llaveDe(ctx);
      const desde = String(Math.floor(haceDias(dias).getTime() / 1000));
      const [cargos, intentos] = await Promise.allSettled([
        cargosDesde(token, senal, dias, limite),
        pedirJson<Lista<Intento>>(`${API}/payment_intents?${new URLSearchParams({ limit: "50", "created[gte]": desde })}`, pedido(token, senal)),
      ]);
      if (cargos.status === "rejected" && intentos.status === "rejected") throw cargos.reason;
      const lineas: string[] = [];
      if (cargos.status === "fulfilled") {
        const cobrado = new Map<string, number>();
        for (const c of cargos.value) if (c.status === "succeeded") sumar(cobrado, c.currency, desdeCentavos((c.amount ?? 0) - (c.amount_refunded ?? 0), c.currency));
        lineas.push(`Cobros de los últimos ${dias} días (${cargos.value.length}${cargos.value.length >= limite ? ", los más recientes" : ""}). Cobrado neto: ${totales(cobrado)}.`);
        for (const c of cargos.value) {
          const falla = c.status === "failed" && c.failure_message ? ` (${linea(c.failure_message, 80)})` : "";
          lineas.push(`- ${fechaMx((c.created ?? 0) * 1000)} · ${dinero(desdeCentavos(c.amount, c.currency), c.currency)} · ${estadoCargo(c)}${falla} · ${quien(c)}${c.description ? ` · ${linea(c.description, 80)}` : ""}`);
        }
        if (!cargos.value.length) lineas.push("- No hay cobros en ese periodo.");
      } else if (cargos.reason instanceof ErrorApi && cargos.reason.status === 401) {
        throw cargos.reason;
      } else {
        lineas.push("(La llave no deja ver los cobros: dale permiso de lectura en «Charges».)");
      }
      if (intentos.status === "fulfilled") {
        const abiertos = (intentos.value.data ?? []).filter((i) => i.status && i.status !== "succeeded" && i.status !== "canceled");
        if (abiertos.length) {
          lineas.push("", `Pagos sin completar (${abiertos.length}):`);
          for (const i of abiertos.slice(0, 15)) lineas.push(`- ${fechaMx((i.created ?? 0) * 1000)} · ${dinero(desdeCentavos(i.amount, i.currency), i.currency)} · ${ESTADO_INTENTO[i.status ?? ""] ?? linea(i.status, 30)}${i.description ? ` · ${linea(i.description, 80)}` : ""}`);
        }
      } else if (intentos.reason instanceof ErrorApi && intentos.reason.status === 401) {
        throw intentos.reason;
      }
      return lineas.join("\n");
    });
  },
};

const saldo: Herramienta = {
  nombre: "stripe_saldo",
  descripcion: "Saldo de la cuenta de Stripe (solo lectura): lo disponible para depositar y lo que sigue pendiente, por moneda.",
  app: "stripe",
  agentes: ["iris"],
  esquema: { type: "object", properties: {}, additionalProperties: false },
  async ejecutar(_args, ctx) {
    return consultar(APP, ctx.senal, async (senal) => {
      const d = await pedirJson<Saldo>(`${API}/balance`, pedido(await llaveDe(ctx), senal));
      const fila = (xs: Saldo["available"]) => {
        const m = new Map<string, number>();
        for (const x of xs ?? []) sumar(m, x.currency, desdeCentavos(x.amount, x.currency));
        return totales(m);
      };
      return [`Saldo de Stripe:`, `- Disponible: ${fila(d.available)}`, `- Pendiente (aún no se libera): ${fila(d.pending)}`].join("\n");
    });
  },
};

const mejoresClientes: Herramienta = {
  nombre: "stripe_clientes_con_mas_pagos",
  descripcion:
    "Clientes que más han pagado por Stripe en un periodo (solo lectura): suma de cobros exitosos menos reembolsos, cuántos pagos hizo cada uno y su último pago. Revisa hasta 300 cobros.",
  app: "stripe",
  agentes: ["iris", "victor"],
  esquema: { type: "object", properties: { dias: propDias(365, 90), limite: propLimite(20, 10) }, additionalProperties: false },
  async ejecutar(args, ctx) {
    const dias = argDias(args, 365, 90);
    const limite = argLimite(args, 20, 10);
    return consultar(APP, ctx.senal, async (senal) => {
      const cargos = await cargosDesde(await llaveDe(ctx), senal, dias, 300, 3);
      const grupos = new Map<string, { nombre: string; total: Map<string, number>; pagos: number; ultimo: number; orden: number }>();
      for (const c of cargos) {
        if (c.status !== "succeeded") continue;
        const clave = c.customer || c.billing_details?.email || c.receipt_email || c.billing_details?.name || "";
        if (!clave) continue;
        const g = grupos.get(clave) ?? { nombre: quien(c), total: new Map(), pagos: 0, ultimo: 0, orden: 0 };
        const neto = desdeCentavos((c.amount ?? 0) - (c.amount_refunded ?? 0), c.currency);
        sumar(g.total, c.currency, neto);
        g.pagos += 1;
        g.ultimo = Math.max(g.ultimo, c.created ?? 0);
        // Para ordenar se usa la moneda principal (MXN) y, si no, el total en su moneda
        g.orden += Number.isFinite(neto) ? neto : 0;
        if (g.nombre === "cliente sin nombre" || g.nombre.startsWith("cus_")) g.nombre = quien(c);
        grupos.set(clave, g);
      }
      const top = Array.from(grupos.values())
        .sort((a, b) => b.orden - a.orden)
        .slice(0, limite);
      if (!top.length) return `No hay pagos exitosos con cliente identificado en los últimos ${dias} días.`;
      return [
        `Clientes con más pagos en los últimos ${dias} días (de ${cargos.length} cobros revisados):`,
        ...top.map((g, i) => `${i + 1}. ${g.nombre} · ${totales(g.total)} · ${g.pagos} pago${g.pagos === 1 ? "" : "s"} · último ${fechaMx(g.ultimo * 1000, true)}`),
      ].join("\n");
    });
  },
};

/* ---------------- El adaptador ---------------- */

export const stripe: Adaptador = {
  proveedor: "stripe",
  autenticacion: "llave",
  variables: [],
  async validarLlave(llave) {
    const k = llave.trim();
    if (/^(sk|pk)_/.test(k)) throw new ErrorArgs(MENSAJE_NO_RESTRINGIDA);
    if (!RESTRINGIDA.test(k)) throw new ErrorArgs("Esa no parece una llave de Stripe: usa una llave restringida de solo lectura (empieza con rk_live_).");
    try {
      await pedirJson(`${API}/balance`, { token: k, senal: senalCorta(), proveedor: "stripe" });
    } catch (e) {
      if (e instanceof ErrorApi && e.status === 401) throw new ErrorArgs("Stripe no reconoce esa llave. Revisa que la copiaste completa.");
      if (e instanceof ErrorApi && e.status === 403) throw new ErrorArgs("La llave no tiene permiso para ver el saldo: en Stripe, dale permiso de lectura en «Balance».");
      throw new ErrorArgs("No se pudo revisar la llave con Stripe. Intenta de nuevo.");
    }
    const extra: Record<string, string> = { modo: k.startsWith("rk_live_") ? "live" : "test" };
    try {
      const c = await pedirJson<Cuenta>(`${API}/account`, { token: k, senal: senalCorta(), proveedor: "stripe" });
      const nombre = c.business_profile?.name || c.settings?.dashboard?.display_name || c.email || "";
      if (nombre) extra.cuenta = linea(nombre, 120);
    } catch {
      /* sin permiso de "Account" también sirve; la tarjeta dice "Stripe" */
    }
    if (extra.modo === "test") extra.cuenta = `${extra.cuenta ?? "Stripe"} (modo de prueba)`;
    return { access_token: k, extra };
  },
  async cuenta(t) {
    return t.extra?.cuenta ?? "Tu cuenta de Stripe";
  },
  herramientas: [pagosRecientes, saldo, mejoresClientes],
};
