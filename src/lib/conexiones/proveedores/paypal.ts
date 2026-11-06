import type { Adaptador, Tokens } from "@/lib/nucleo-tipos";
import { ErrorProveedor, argEntero, argTexto, consulta, esquema, formulario, herramienta, linea, pedirJson, sinRenovacion, unir } from "./_comun-1";
import { basic3, dinero, fecha3, partirLlave, pedirToken3 } from "./_comun-3";

/**
 * PAYPAL (por llave; developer.paypal.com, nov 2026):
 * - La persona crea una app REST en developer.paypal.com → Apps & Credentials
 *   (Live), le activa "Transaction search" y pega "clientId:secret".
 * - Con eso se pide un token de client credentials:
 *   POST https://api-m.paypal.com/v1/oauth2/token (Basic clientId:secret,
 *   grant_type=client_credentials). Dura ~9 horas; se guarda la llave como
 *   refresh_token (cifrada) para volver a pedirlo solo.
 *   Si la llave es de Sandbox, se usa https://api-m.sandbox.paypal.com.
 * - Lee: GET /v1/reporting/transactions (scope reporting/search/read;
 *   máximo 31 días por consulta; tarda hasta 3 horas en aparecer) y
 *   GET /v1/reporting/balances (scope reporting/balances/read).
 * - No hay API para revocar la llave: se borra o rota en el panel de PayPal.
 */

const NOMBRE = "PayPal";
const HOST = { live: "https://api-m.paypal.com", sandbox: "https://api-m.sandbox.paypal.com" } as const;
type Ambiente = keyof typeof HOST;
const FORMATO = "clientId:secret (los dos de tu app REST de PayPal, separados por dos puntos)";
const FORMA_PARTE = /^[A-Za-z0-9_-]{20,200}$/;

type RespuestaToken = { access_token: string; expires_in?: number; app_id?: string; scope?: string };

const ambienteDe = (t: Tokens): Ambiente => (t.extra?.ambiente === "sandbox" ? "sandbox" : "live");

async function token(llave: string, ambiente: Ambiente, renovando: boolean) {
  const [id, secreto] = partirLlave(llave, NOMBRE, FORMATO);
  return pedirToken3<RespuestaToken>(NOMBRE, `${HOST[ambiente]}/v1/oauth2/token`, {
    cuerpo: formulario({ grant_type: "client_credentials" }),
    encabezados: { Authorization: basic3(id, secreto), "Content-Type": "application/x-www-form-urlencoded" },
    renovando,
  });
}

const aTokens = (r: RespuestaToken, llave: string, ambiente: Ambiente, anterior?: Tokens): Tokens => {
  const extra: Record<string, string> = { ...(anterior?.extra ?? {}), ambiente };
  if (r.app_id && /^[A-Za-z0-9_-]{3,80}$/.test(r.app_id)) extra.app = r.app_id;
  return {
    access_token: r.access_token,
    // La llave queda cifrada como "refresh": con ella se pide el siguiente token
    refresh_token: llave,
    expira_en: r.expires_in ? Date.now() + Number(r.expires_in) * 1000 : undefined,
    extra,
  };
};

function api<T>(t: Tokens, ruta: string, params: Record<string, string | number | undefined>, senal: AbortSignal) {
  return pedirJson<T>(NOMBRE, `${HOST[ambienteDe(t)]}${ruta}${consulta(params)}`, {
    encabezados: { Authorization: `Bearer ${t.access_token}`, Accept: "application/json" },
    senal,
    interpretar: (estado) =>
      estado === 403
        ? 'PayPal no dio permiso para ver esto. En tu app de developer.paypal.com activa "Transaction search" (y espera unos minutos).'
        : undefined,
  });
}

const ESTADO: Record<string, string> = { S: "completado", P: "pendiente", D: "rechazado", V: "reembolsado" };

type Money = { currency_code?: string; value?: string };
type Transaccion = {
  transaction_info?: {
    transaction_id?: string;
    transaction_event_code?: string;
    transaction_initiation_date?: string;
    transaction_amount?: Money;
    fee_amount?: Money;
    transaction_status?: string;
    transaction_subject?: string;
    transaction_note?: string;
    invoice_id?: string;
  };
  payer_info?: { email_address?: string; payer_name?: { given_name?: string; surname?: string; alternate_full_name?: string } };
};
type Busqueda = { transaction_details?: Transaccion[]; total_items?: number; total_pages?: number };

export const adaptador: Adaptador = {
  proveedor: "paypal",
  autenticacion: "llave",
  variables: [],

  async validarLlave(llave) {
    const [id, secreto] = partirLlave(llave, NOMBRE, FORMATO);
    if (!FORMA_PARTE.test(id) || !FORMA_PARTE.test(secreto)) throw new ErrorProveedor(`Esa no parece una llave de PayPal. Pega ${FORMATO}.`);
    const limpia = `${id}:${secreto}`;
    try {
      return aTokens(await token(limpia, "live", false), limpia, "live");
    } catch (e) {
      // ¿Es una llave de Sandbox? (para probar antes de usar la de producción)
      try {
        return aTokens(await token(limpia, "sandbox", false), limpia, "sandbox");
      } catch {
        throw e;
      }
    }
  },

  async renovar(t) {
    if (!t.refresh_token) throw sinRenovacion(NOMBRE);
    const ambiente = ambienteDe(t);
    return aTokens(await token(t.refresh_token, ambiente, true), t.refresh_token, ambiente, t);
  },

  async cuenta(t) {
    return unir("PayPal", t.extra?.ambiente === "sandbox" ? "pruebas (Sandbox)" : "", t.extra?.app ? `app ${t.extra.app}` : "") || "Cuenta de PayPal";
  },

  herramientas: [
    herramienta({
      nombre: "paypal_transacciones",
      descripcion:
        "Lista los movimientos recientes de la cuenta de PayPal del negocio (cobros, reembolsos, comisiones): fecha, monto, estado, quién pagó y concepto. Máximo los últimos 31 días; PayPal tarda hasta 3 horas en mostrar un movimiento. Solo lectura.",
      app: "paypal",
      agentes: ["iris"],
      proveedor: NOMBRE,
      esquema: esquema({
        dias: { type: "integer", minimum: 1, maximum: 31, description: "Cuántos días hacia atrás. Por defecto 30." },
        estado: { type: "string", enum: ["S", "P", "D", "V"], description: "S completados, P pendientes, D rechazados, V reembolsados. Vacío: todos." },
        limite: { type: "integer", minimum: 1, maximum: 50, description: "Cuántos movimientos. Por defecto 20." },
      }),
      async ejecutar(args, ctx) {
        const dias = argEntero(args, "dias", 30, 1, 31);
        const limite = argEntero(args, "limite", 20, 1, 50);
        const estado = argTexto(args, "estado", 1).toUpperCase();
        if (estado && !ESTADO[estado]) throw new ErrorProveedor('"estado" puede ser S, P, D o V.');
        const fin = new Date();
        const inicio = new Date(fin.getTime() - dias * 86_400_000);
        const t = await ctx.token();
        const params = {
          start_date: inicio.toISOString().replace(/\.\d{3}Z$/, "Z"),
          end_date: fin.toISOString().replace(/\.\d{3}Z$/, "Z"),
          fields: "transaction_info,payer_info",
          transaction_status: estado || undefined,
          page_size: 100,
          page: 1,
        };
        let r = await api<Busqueda>(t, "/v1/reporting/transactions", params, ctx.senal);
        // PayPal ordena del más viejo al más nuevo: si hay varias páginas, la última trae lo reciente
        const paginas = Number(r.total_pages ?? 1);
        if (paginas > 1) r = await api<Busqueda>(t, "/v1/reporting/transactions", { ...params, page: Math.min(paginas, 100) }, ctx.senal);
        const lista = (r.transaction_details ?? [])
          .slice()
          .sort((a, b) => String(b.transaction_info?.transaction_initiation_date ?? "").localeCompare(String(a.transaction_info?.transaction_initiation_date ?? "")))
          .slice(0, limite);
        if (!lista.length) return `No hay movimientos en PayPal en los últimos ${dias} días (los de las últimas 3 horas pueden no aparecer aún).`;
        return [
          `Movimientos de PayPal, últimos ${dias} días (${lista.length} de ${r.total_items ?? lista.length}, del más reciente):`,
          ...lista.map((x) => {
            const i = x.transaction_info ?? {};
            const n = x.payer_info?.payer_name;
            const quien = linea(n?.alternate_full_name || [n?.given_name, n?.surname].filter(Boolean).join(" "), 80);
            const comision = Number(i.fee_amount?.value ?? 0) ? `comisión ${dinero(i.fee_amount?.value, i.fee_amount?.currency_code)}` : "";
            return `- ${unir(
              fecha3(i.transaction_initiation_date),
              dinero(i.transaction_amount?.value, i.transaction_amount?.currency_code),
              ESTADO[i.transaction_status ?? ""] ?? i.transaction_status,
              quien,
              linea(x.payer_info?.email_address, 80),
              linea(i.transaction_subject || i.transaction_note, 120),
              i.invoice_id ? `factura ${linea(i.invoice_id, 40)}` : "",
              comision,
              i.transaction_id ? `id ${i.transaction_id}` : "",
            )}`;
          }),
        ].join("\n");
      },
    }),
    herramienta({
      nombre: "paypal_saldo",
      descripcion: "Muestra el saldo de la cuenta de PayPal del negocio por moneda (total, disponible y retenido). Solo lectura.",
      app: "paypal",
      agentes: ["iris"],
      proveedor: NOMBRE,
      esquema: esquema({}),
      async ejecutar(_args, ctx) {
        const t = await ctx.token();
        const r = await api<{ balances?: { currency?: string; primary?: boolean; total_balance?: Money; available_balance?: Money; withheld_balance?: Money }[]; as_of_time?: string }>(
          t,
          "/v1/reporting/balances",
          {},
          ctx.senal,
        ).catch((e: unknown) => {
          if (e instanceof ErrorProveedor && e.status === 403)
            throw new ErrorProveedor("PayPal no dio permiso para ver el saldo con esta llave. Los movimientos sí se pueden consultar con paypal_transacciones.", 403);
          throw e;
        });
        const saldos = r.balances ?? [];
        if (!saldos.length) return "PayPal no regresó saldos para esta cuenta.";
        return [
          `Saldo de PayPal${r.as_of_time ? ` al ${fecha3(r.as_of_time)}` : ""}:`,
          ...saldos.map(
            (s) =>
              `- ${unir(
                s.currency ?? s.total_balance?.currency_code,
                s.primary ? "principal" : "",
                `total ${dinero(s.total_balance?.value, s.total_balance?.currency_code ?? s.currency)}`,
                s.available_balance ? `disponible ${dinero(s.available_balance.value, s.available_balance.currency_code ?? s.currency)}` : "",
                Number(s.withheld_balance?.value ?? 0) ? `retenido ${dinero(s.withheld_balance?.value, s.withheld_balance?.currency_code ?? s.currency)}` : "",
              )}`,
          ),
        ].join("\n");
      },
    }),
  ],
};

/** Con el nombre del proveedor, como lo importa el registro. */
export { adaptador as paypal };
