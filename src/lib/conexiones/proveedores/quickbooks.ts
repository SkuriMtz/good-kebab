import type { Adaptador, Tokens } from "@/lib/nucleo-tipos";
import { ErrorOAuth } from "../oauth";
import { ErrorProveedor, argEntero, argTexto, consulta, esquema, formulario, herramienta, linea, pedirJson, sinRenovacion, unir, variable } from "./_comun-1";
import { basic3, dinero, fecha3, pedirToken3, sinAcentos } from "./_comun-3";

/**
 * QUICKBOOKS ONLINE (OAuth 2.0 de Intuit; developer.intuit.com y su
 * descubrimiento OpenID, nov 2026):
 * - Autorizar: https://appcenter.intuit.com/connect/oauth2 con client_id,
 *   response_type=code, scope=com.intuit.quickbooks.accounting,
 *   redirect_uri y state. Intuit regresa al callback con code, state y
 *   realmId (la empresa): se guarda en extra.realmId.
 * - Token: POST https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer
 *   (Basic client_id:client_secret). El access token dura 1 hora; el
 *   refresh token cambia en cada renovación (se guarda el nuevo).
 * - Revocar: POST https://developer.api.intuit.com/v2/oauth2/tokens/revoke.
 * - API: https://quickbooks.api.intuit.com/v3/company/{realmId}/query con
 *   minorversion=75 (desde ago 2025 las anteriores ya no se aceptan) y
 *   /companyinfo/{realmId}. Con las llaves de desarrollo (empresas de
 *   prueba) se pone QUICKBOOKS_AMBIENTE=sandbox en Vercel (opcional).
 */

const NOMBRE = "QuickBooks";
const AUTORIZAR = "https://appcenter.intuit.com/connect/oauth2";
const TOKEN = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
const REVOCAR = "https://developer.api.intuit.com/v2/oauth2/tokens/revoke";
const API = { produccion: "https://quickbooks.api.intuit.com", sandbox: "https://sandbox-quickbooks.api.intuit.com" } as const;
const VERSION_MENOR = "75";
export const SCOPES_QUICKBOOKS = ["com.intuit.quickbooks.accounting"];
const FORMA_REALM = /^\d{1,30}$/;

const credenciales = () => ({ id: variable("QUICKBOOKS_CLIENT_ID"), secreto: variable("QUICKBOOKS_CLIENT_SECRET") });
/** Opcional: "sandbox" para probar con las llaves de desarrollo de Intuit. */
const ambienteActual = () => (process.env.QUICKBOOKS_AMBIENTE?.trim().toLowerCase() === "sandbox" ? "sandbox" : "produccion");

type RespuestaToken = { access_token: string; refresh_token?: string; expires_in?: number; x_refresh_token_expires_in?: number };

const aTokens = (r: RespuestaToken, extra: Record<string, string>, anterior?: Tokens): Tokens => ({
  access_token: r.access_token,
  refresh_token: r.refresh_token ?? anterior?.refresh_token,
  expira_en: r.expires_in ? Date.now() + Number(r.expires_in) * 1000 : undefined,
  extra: { ...(anterior?.extra ?? {}), ...extra },
});

function base(t: Tokens) {
  const realm = t.extra?.realmId ?? "";
  if (!FORMA_REALM.test(realm)) throw new ErrorProveedor("Falta la empresa de QuickBooks en la conexión. Vuelve a conectarla en Tu negocio › Apps.");
  return `${API[t.extra?.ambiente === "sandbox" ? "sandbox" : "produccion"]}/v3/company/${realm}`;
}

function api<T>(t: Tokens, ruta: string, params: Record<string, string | number | undefined>, senal?: AbortSignal) {
  return pedirJson<T>(NOMBRE, `${base(t)}${ruta}${consulta({ ...params, minorversion: VERSION_MENOR })}`, {
    encabezados: { Authorization: `Bearer ${t.access_token}`, Accept: "application/json" },
    senal,
    interpretar: (estado) =>
      estado === 403 ? "QuickBooks no dio permiso para ver esto (la persona que conectó tiene que ser administradora de la empresa)." : undefined,
  });
}

/** SELECT de solo lectura; el texto del modelo nunca entra sin limpiar. */
const consultar = <T>(t: Tokens, select: string, senal: AbortSignal) => api<{ QueryResponse?: T }>(t, "/query", { query: select }, senal);

/** Para LIKE: solo letras, números, espacios y . , & @ _ - (sin comillas ni comodines). */
const limpio = (s: string) =>
  s
    .replace(/[^\p{L}\p{N} .,&@_-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);

type Ref = { value?: string; name?: string };
type Factura = { Id?: string; DocNumber?: string; TxnDate?: string; DueDate?: string; TotalAmt?: number; Balance?: number; CustomerRef?: Ref; CurrencyRef?: Ref; BillEmail?: { Address?: string }; EmailStatus?: string };
type Pago = { Id?: string; TxnDate?: string; TotalAmt?: number; UnappliedAmt?: number; CustomerRef?: Ref; CurrencyRef?: Ref; PaymentRefNum?: string; PaymentMethodRef?: Ref; PrivateNote?: string };
type Cliente = { Id?: string; DisplayName?: string; CompanyName?: string; PrimaryEmailAddr?: { Address?: string }; PrimaryPhone?: { FreeFormNumber?: string }; Mobile?: { FreeFormNumber?: string }; Balance?: number; CurrencyRef?: Ref; Active?: boolean; PrimaryTaxIdentifier?: string };

export const adaptador: Adaptador = {
  proveedor: "quickbooks",
  autenticacion: "oauth",
  variables: ["QUICKBOOKS_CLIENT_ID", "QUICKBOOKS_CLIENT_SECRET"],
  requiereAprobacion:
    "Intuit pide llenar el perfil y el cuestionario de la app para darte las llaves de producción; mientras, solo funciona con empresas de prueba (sandbox).",

  urlAutorizacion({ state, redirectUri }) {
    return `${AUTORIZAR}${consulta({ client_id: credenciales().id, response_type: "code", scope: SCOPES_QUICKBOOKS.join(" "), redirect_uri: redirectUri, state })}`;
  },

  async intercambiar({ code, redirectUri, query }) {
    const realm = query?.realmId ?? "";
    if (!FORMA_REALM.test(realm)) throw new ErrorOAuth("rechazo", "QuickBooks no dijo qué empresa se conectó. Intenta de nuevo.");
    const { id, secreto } = credenciales();
    const r = await pedirToken3<RespuestaToken>(NOMBRE, TOKEN, {
      cuerpo: formulario({ grant_type: "authorization_code", code, redirect_uri: redirectUri }),
      encabezados: { Authorization: basic3(id, secreto), "Content-Type": "application/x-www-form-urlencoded" },
    });
    const t = aTokens(r, { realmId: realm, ambiente: ambienteActual() });
    try {
      const c = await api<{ CompanyInfo?: { CompanyName?: string; LegalName?: string } }>(t, `/companyinfo/${realm}`, {});
      const nombre = c.CompanyInfo?.CompanyName || c.CompanyInfo?.LegalName;
      if (nombre) t.extra!.empresa = linea(nombre, 120);
    } catch {
      // Sin el nombre de la empresa también se conecta
    }
    return t;
  },

  async renovar(t) {
    if (!t.refresh_token) throw sinRenovacion(NOMBRE);
    const { id, secreto } = credenciales();
    const r = await pedirToken3<RespuestaToken>(NOMBRE, TOKEN, {
      cuerpo: formulario({ grant_type: "refresh_token", refresh_token: t.refresh_token }),
      encabezados: { Authorization: basic3(id, secreto), "Content-Type": "application/x-www-form-urlencoded" },
      renovando: true,
    });
    return aTokens(r, {}, t);
  },

  async revocar(t) {
    const token = t.refresh_token ?? t.access_token;
    if (!token) return;
    const { id, secreto } = credenciales();
    await pedirJson(NOMBRE, REVOCAR, {
      metodo: "POST",
      encabezados: { Authorization: basic3(id, secreto), Accept: "application/json", "Content-Type": "application/json" },
      cuerpo: JSON.stringify({ token }),
    }).catch(() => undefined);
  },

  async cuenta(t) {
    if (t.extra?.empresa) return unir(t.extra.empresa, t.extra.ambiente === "sandbox" ? "pruebas (sandbox)" : "");
    const realm = t.extra?.realmId ?? "";
    const c = await api<{ CompanyInfo?: { CompanyName?: string } }>(t, `/companyinfo/${realm}`, {});
    return linea(c.CompanyInfo?.CompanyName, 120) || "Empresa de QuickBooks";
  },

  herramientas: [
    herramienta({
      nombre: "quickbooks_facturas",
      descripcion:
        "Lista las facturas de QuickBooks, de la más nueva a la más vieja: número, fecha, cliente, total, saldo por cobrar y vencimiento. Se puede pedir solo las que tienen saldo y filtrar por nombre del cliente. Solo lectura.",
      app: "quickbooks",
      agentes: ["iris", "victor"],
      proveedor: NOMBRE,
      esquema: esquema({
        cliente: { type: "string", description: "Nombre (o parte) del cliente." },
        pendientes: { type: "boolean", description: "true = solo las que tienen saldo por cobrar." },
        limite: { type: "integer", minimum: 1, maximum: 50, description: "Cuántas facturas. Por defecto 20." },
      }),
      async ejecutar(args, ctx) {
        const cliente = sinAcentos(argTexto(args, "cliente", 120));
        const pendientes = args.pendientes === true || args.pendientes === "true";
        const limite = argEntero(args, "limite", 20, 1, 50);
        const t = await ctx.token();
        // Invoice no filtra por nombre del cliente: con nombre se traen 100 y se filtran aquí
        const r = await consultar<{ Invoice?: Factura[] }>(
          t,
          `SELECT * FROM Invoice${pendientes ? " WHERE Balance > '0'" : ""} ORDERBY TxnDate DESC MAXRESULTS ${cliente ? 100 : limite}`,
          ctx.senal,
        );
        const lista = (r.QueryResponse?.Invoice ?? []).filter((f) => !cliente || sinAcentos(f.CustomerRef?.name ?? "").includes(cliente)).slice(0, limite);
        if (!lista.length) return cliente || pendientes ? "No encontré facturas en QuickBooks con esos datos." : "No hay facturas en QuickBooks.";
        return [
          `Facturas de QuickBooks${pendientes ? " con saldo" : ""} (${lista.length}, de la más reciente):`,
          ...lista.map(
            (f) =>
              `- ${unir(
                f.DocNumber ? `factura ${linea(f.DocNumber, 30)}` : "",
                fecha3(f.TxnDate, true),
                linea(f.CustomerRef?.name, 80),
                `total ${dinero(f.TotalAmt, f.CurrencyRef?.value)}`,
                Number(f.Balance) > 0 ? `por cobrar ${dinero(f.Balance, f.CurrencyRef?.value)}` : "pagada",
                f.DueDate ? `vence ${fecha3(f.DueDate, true)}` : "",
                linea(f.BillEmail?.Address, 80),
              )}`,
          ),
        ].join("\n");
      },
    }),
    herramienta({
      nombre: "quickbooks_pagos",
      descripcion: "Lista los pagos recibidos de clientes en QuickBooks, del más nuevo al más viejo: fecha, cliente, monto, referencia y lo que quedó sin aplicar. Solo lectura.",
      app: "quickbooks",
      agentes: ["iris"],
      proveedor: NOMBRE,
      esquema: esquema({ limite: { type: "integer", minimum: 1, maximum: 50, description: "Cuántos pagos. Por defecto 20." } }),
      async ejecutar(args, ctx) {
        const t = await ctx.token();
        const r = await consultar<{ Payment?: Pago[] }>(t, `SELECT * FROM Payment ORDERBY TxnDate DESC MAXRESULTS ${argEntero(args, "limite", 20, 1, 50)}`, ctx.senal);
        const lista = r.QueryResponse?.Payment ?? [];
        if (!lista.length) return "No hay pagos recibidos en QuickBooks.";
        return [
          `Pagos recibidos en QuickBooks (${lista.length}, del más reciente):`,
          ...lista.map(
            (p) =>
              `- ${unir(
                fecha3(p.TxnDate, true),
                linea(p.CustomerRef?.name, 80),
                dinero(p.TotalAmt, p.CurrencyRef?.value),
                linea(p.PaymentMethodRef?.name, 30),
                p.PaymentRefNum ? `ref ${linea(p.PaymentRefNum, 30)}` : "",
                Number(p.UnappliedAmt) > 0 ? `sin aplicar ${dinero(p.UnappliedAmt, p.CurrencyRef?.value)}` : "",
                linea(p.PrivateNote, 80),
              )}`,
          ),
        ].join("\n");
      },
    }),
    herramienta({
      nombre: "quickbooks_clientes",
      descripcion: "Busca clientes en QuickBooks por nombre: nombre, empresa, correo, teléfono y saldo pendiente. Sin texto, regresa los modificados más recientemente. Solo lectura.",
      app: "quickbooks",
      agentes: ["iris", "victor"],
      proveedor: NOMBRE,
      esquema: esquema({
        buscar: { type: "string", description: "Nombre (o parte) del cliente." },
        limite: { type: "integer", minimum: 1, maximum: 50, description: "Cuántos clientes. Por defecto 20." },
      }),
      async ejecutar(args, ctx) {
        const buscar = limpio(argTexto(args, "buscar", 120));
        const limite = argEntero(args, "limite", 20, 1, 50);
        const t = await ctx.token();
        const r = await consultar<{ Customer?: Cliente[] }>(
          t,
          `SELECT * FROM Customer${buscar ? ` WHERE DisplayName LIKE '%${buscar}%'` : ""} ORDERBY MetaData.LastUpdatedTime DESC MAXRESULTS ${limite}`,
          ctx.senal,
        );
        const lista = r.QueryResponse?.Customer ?? [];
        if (!lista.length) return buscar ? `No encontré clientes en QuickBooks con "${buscar}".` : "No hay clientes en QuickBooks.";
        return [
          `Clientes de QuickBooks${buscar ? ` con "${buscar}"` : ""} (${lista.length}):`,
          ...lista.map(
            (c) =>
              `- ${unir(
                linea(c.DisplayName, 100) || "Sin nombre",
                c.CompanyName && c.CompanyName !== c.DisplayName ? linea(c.CompanyName, 80) : "",
                linea(c.PrimaryEmailAddr?.Address, 80),
                linea(c.PrimaryPhone?.FreeFormNumber || c.Mobile?.FreeFormNumber, 30),
                Number(c.Balance) > 0 ? `saldo ${dinero(c.Balance, c.CurrencyRef?.value)}` : "",
                c.Active === false ? "inactivo" : "",
              )}`,
          ),
        ].join("\n");
      },
    }),
  ],
};

/** Con el nombre del proveedor, como lo importa el registro. */
export { adaptador as quickbooks };
