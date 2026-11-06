import type { Adaptador, IdApp, Tokens } from "@/lib/nucleo-tipos";
import {
  ErrorProveedor,
  argEntero,
  argTexto,
  consulta,
  esquema,
  expiraEn,
  fecha,
  formulario,
  herramienta,
  linea,
  pedir,
  pedirJson,
  pedirToken,
  sinRenovacion,
  unir,
  variable,
} from "./_comun-1";

/**
 * ZOHO (OAuth con varios centros de datos; zoho.com/crm/developer/docs/api/v8
 * y zoho.com/books/api/v3, nov 2026). Un solo cliente para Zoho CRM y Zoho Books.
 * - Autorizar siempre en https://accounts.zoho.com/oauth/v2/auth (Zoho manda
 *   a EU, IN, AU… según la cuenta), con access_type=offline para tener
 *   refresh token. En el callback llegan `location` y `accounts-server`: el
 *   token se pide a ESE servidor (de una lista fija, para no mandar el código
 *   a otro lado) y la respuesta trae `api_domain` (www.zohoapis.<región>).
 *   En la consola de Zoho hay que activar "Multi-DC" para el cliente.
 * - CRM: /crm/v8/Contacts y /crm/v8/Deals (y su /search).
 * - Books: /books/v3/organizations, /invoices y /contacts con organization_id.
 * - Revocar: POST <accounts-server>/oauth/v2/token/revoke con el refresh token.
 */

const NOMBRE = "Zoho";
const AUTORIZAR = "https://accounts.zoho.com/oauth/v2/auth";
const IDENTIDAD = ["AaaServer.profile.READ"];
export const SCOPES_ZOHO: Partial<Record<IdApp, string[]>> = {
  zoho_crm: ["ZohoCRM.modules.contacts.READ", "ZohoCRM.modules.deals.READ"],
  zoho_books: ["ZohoBooks.invoices.READ", "ZohoBooks.contacts.READ", "ZohoBooks.settings.READ"],
};

/** Los servidores de cuentas de Zoho por región (solo a estos se manda el código). */
const SERVIDORES = new Set([
  "https://accounts.zoho.com",
  "https://accounts.zoho.eu",
  "https://accounts.zoho.in",
  "https://accounts.zoho.com.au",
  "https://accounts.zoho.jp",
  "https://accounts.zoho.ca",
  "https://accounts.zoho.sa",
  "https://accounts.zoho.uk",
  "https://accounts.zoho.com.cn",
]);
const API_VALIDA = /^https:\/\/www\.zohoapis\.(com|eu|in|com\.au|jp|ca|sa|uk|com\.cn)$/;

const credenciales = () => ({ id: variable("ZOHO_CLIENT_ID"), secreto: variable("ZOHO_CLIENT_SECRET") });

function servidorDe(v: string | undefined): string {
  const s = (v ?? "https://accounts.zoho.com").trim().replace(/\/+$/, "");
  if (!SERVIDORES.has(s)) throw new ErrorProveedor("Zoho respondió desde un servidor que no se reconoce. Intenta conectar de nuevo.");
  return s;
}

type RespuestaToken = { access_token: string; refresh_token?: string; expires_in?: number; api_domain?: string; scope?: string };

function aTokens(r: RespuestaToken, extra: Record<string, string>, anterior?: Tokens): Tokens {
  const e = { ...(anterior?.extra ?? {}), ...extra };
  if (r.api_domain) {
    if (!API_VALIDA.test(r.api_domain)) throw new ErrorProveedor("Zoho regresó un dominio de API que no se reconoce.");
    e.api = r.api_domain;
  }
  return { access_token: r.access_token, refresh_token: r.refresh_token ?? anterior?.refresh_token, expira_en: expiraEn(r.expires_in), extra: e };
}

const apiDe = (t: Tokens) => (t.extra?.api && API_VALIDA.test(t.extra.api) ? t.extra.api : "https://www.zohoapis.com");

/** GET a Zoho. Zoho responde 204 (sin cuerpo) cuando no hay resultados. */
async function api<T>(t: Tokens, ruta: string, params: Record<string, string | number | undefined>, senal?: AbortSignal): Promise<T | null> {
  const r = await pedir(NOMBRE, `${apiDe(t)}${ruta}${consulta(params)}`, {
    encabezados: { Authorization: `Zoho-oauthtoken ${t.access_token}` },
    senal,
    interpretar: (estado, c) => {
      const codigo = String((c as { code?: unknown } | null)?.code ?? "");
      if (estado === 401 || codigo === "INVALID_TOKEN" || codigo === "57") return { mensaje: "La conexión con Zoho ya no es válida. Vuelve a conectarla en Tu negocio › Apps.", status: 401 };
      if (codigo === "OAUTH_SCOPE_MISMATCH" || codigo === "NO_PERMISSION") return { mensaje: "A la conexión con Zoho le falta un permiso. Vuelve a conectarla y acepta todos los permisos.", status: 403 };
      return undefined;
    },
  });
  if (r.status === 204) return null;
  try {
    return (await r.json()) as T;
  } catch {
    throw new ErrorProveedor("Zoho respondió algo que no entendí. Intenta de nuevo en un momento.");
  }
}

type Registro = Record<string, unknown> & { id: string };
const nombreDe = (v: unknown) => (v && typeof v === "object" ? linea((v as { name?: unknown }).name, 80) : linea(v, 80));

async function crm(t: Tokens, modulo: "Contacts" | "Deals", campos: string[], args: Record<string, unknown>, senal: AbortSignal) {
  const q = argTexto(args, "buscar", 100);
  const limite = argEntero(args, "limite", 20, 1, 50);
  const fields = campos.join(",");
  const r = q
    ? await api<{ data?: Registro[] }>(t, `/crm/v8/${modulo}/search`, { word: q, fields, per_page: limite }, senal)
    : await api<{ data?: Registro[] }>(t, `/crm/v8/${modulo}`, { fields, per_page: limite, sort_by: "Modified_Time", sort_order: "desc" }, senal);
  return { q, lista: r?.data ?? [] };
}

async function organizacion(t: Tokens, senal?: AbortSignal): Promise<string> {
  if (t.extra?.org_books) return t.extra.org_books;
  const r = await api<{ organizations?: { organization_id?: string; is_default_org?: boolean }[] }>(t, "/books/v3/organizations", {}, senal);
  const orgs = r?.organizations ?? [];
  const org = (orgs.find((o) => o.is_default_org) ?? orgs[0])?.organization_id;
  if (!org) throw new ErrorProveedor("No encontré una organización en Zoho Books.");
  return org;
}

const dinero = (v: unknown, moneda?: unknown) => (v === undefined || v === null || v === "" ? "" : `$${Number(v).toLocaleString("es-MX", { maximumFractionDigits: 2 })}${moneda ? ` ${moneda}` : ""}`);

export const adaptador: Adaptador = {
  proveedor: "zoho",
  autenticacion: "oauth",
  variables: ["ZOHO_CLIENT_ID", "ZOHO_CLIENT_SECRET"],

  urlAutorizacion({ state, redirectUri, apps }) {
    const propias = apps.filter((a) => SCOPES_ZOHO[a]);
    const scopes = [...IDENTIDAD, ...(propias.length ? propias : (Object.keys(SCOPES_ZOHO) as IdApp[])).flatMap((a) => SCOPES_ZOHO[a] ?? [])];
    return `${AUTORIZAR}${consulta({
      scope: Array.from(new Set(scopes)).join(","),
      client_id: credenciales().id,
      response_type: "code",
      access_type: "offline",
      prompt: "consent",
      redirect_uri: redirectUri,
      state,
    })}`;
  },

  async intercambiar({ code, redirectUri, query }) {
    const { id, secreto } = credenciales();
    const servidor = servidorDe(query?.["accounts-server"]);
    const r = await pedirToken<RespuestaToken>(
      NOMBRE,
      `${servidor}/oauth/v2/token`,
      formulario({ grant_type: "authorization_code", client_id: id, client_secret: secreto, redirect_uri: redirectUri, code }),
    );
    const t = aTokens(r, { servidor });
    // Correo de la cuenta (mejor esfuerzo)
    try {
      const yo = await pedirJson<{ Email?: string; Display_Name?: string }>(NOMBRE, `${servidor}/oauth/user/info`, {
        encabezados: { Authorization: `Zoho-oauthtoken ${t.access_token}` },
      });
      if (yo.Email) t.extra!.correo = yo.Email;
      else if (yo.Display_Name) t.extra!.nombre = yo.Display_Name;
    } catch {
      // sin correo también se conecta
    }
    return t;
  },

  async renovar(t) {
    if (!t.refresh_token) throw sinRenovacion(NOMBRE);
    const { id, secreto } = credenciales();
    const servidor = servidorDe(t.extra?.servidor);
    const r = await pedirToken<RespuestaToken & { error?: string }>(
      NOMBRE,
      `${servidor}/oauth/v2/token`,
      formulario({ grant_type: "refresh_token", client_id: id, client_secret: secreto, refresh_token: t.refresh_token }),
      {},
      (_e, c) => /invalid_code|invalid_token/.test(String((c as { error?: unknown } | null)?.error ?? "")),
    );
    return aTokens(r, {}, t);
  },

  async revocar(t) {
    if (!t.refresh_token) return;
    await pedir(NOMBRE, `${servidorDe(t.extra?.servidor)}/oauth/v2/token/revoke${consulta({ token: t.refresh_token })}`, { metodo: "POST" }).catch(() => undefined);
  },

  async cuenta(t) {
    return t.extra?.correo || t.extra?.nombre || "Cuenta de Zoho";
  },

  herramientas: [
    herramienta({
      nombre: "zoho_crm_contactos",
      descripcion: "Busca contactos en Zoho CRM (nombre, correo, teléfono y empresa). Sin texto, regresa los modificados más recientemente. Solo lectura.",
      app: "zoho_crm",
      agentes: ["victor"],
      proveedor: "Zoho CRM",
      esquema: esquema({
        buscar: { type: "string", description: "Nombre, correo, teléfono o empresa a buscar." },
        limite: { type: "integer", minimum: 1, maximum: 50, description: "Cuántos contactos. Por defecto 20." },
      }),
      async ejecutar(args, ctx) {
        const { q, lista } = await crm(await ctx.token(), "Contacts", ["First_Name", "Last_Name", "Email", "Phone", "Mobile", "Account_Name", "Modified_Time"], args, ctx.senal);
        if (!lista.length) return q ? `No encontré contactos en Zoho CRM con "${q}".` : "No hay contactos en Zoho CRM.";
        return [
          `Contactos de Zoho CRM${q ? ` con "${q}"` : ""} (${lista.length}):`,
          ...lista.map((c) => `- ${unir(linea([c.First_Name, c.Last_Name].filter(Boolean).join(" "), 80) || "Sin nombre", linea(c.Email, 80), linea(c.Phone ?? c.Mobile, 30), nombreDe(c.Account_Name))}`),
        ].join("\n");
      },
    }),
    herramienta({
      nombre: "zoho_crm_tratos",
      descripcion: "Busca tratos (deals) en Zoho CRM: nombre, monto, etapa, cliente y fecha de cierre. Sin texto, regresa los modificados más recientemente. Solo lectura.",
      app: "zoho_crm",
      agentes: ["victor"],
      proveedor: "Zoho CRM",
      esquema: esquema({
        buscar: { type: "string", description: "Texto a buscar en los tratos." },
        limite: { type: "integer", minimum: 1, maximum: 50, description: "Cuántos tratos. Por defecto 20." },
      }),
      async ejecutar(args, ctx) {
        const { q, lista } = await crm(await ctx.token(), "Deals", ["Deal_Name", "Amount", "Stage", "Closing_Date", "Account_Name", "Contact_Name", "Modified_Time"], args, ctx.senal);
        if (!lista.length) return q ? `No encontré tratos en Zoho CRM con "${q}".` : "No hay tratos en Zoho CRM.";
        return [
          `Tratos de Zoho CRM${q ? ` con "${q}"` : ""} (${lista.length}):`,
          ...lista.map((d) => `- ${unir(linea(d.Deal_Name, 100) || "Sin nombre", dinero(d.Amount), d.Stage ? `etapa ${linea(d.Stage, 40)}` : "", nombreDe(d.Account_Name) || nombreDe(d.Contact_Name), d.Closing_Date ? `cierre ${linea(d.Closing_Date, 12)}` : "")}`),
        ].join("\n");
      },
    }),
    herramienta({
      nombre: "zoho_books_facturas",
      descripcion: "Lista las facturas de Zoho Books (número, cliente, fecha, total, saldo y estado), con filtro por estado o cliente. Solo lectura.",
      app: "zoho_books",
      agentes: ["clara", "iris"],
      proveedor: "Zoho Books",
      esquema: esquema({
        estado: { type: "string", enum: ["todas", "pendientes", "vencidas", "pagadas", "borrador"], description: "Qué facturas. Por defecto todas." },
        cliente: { type: "string", description: "Nombre del cliente para filtrar." },
        limite: { type: "integer", minimum: 1, maximum: 50, description: "Cuántas facturas. Por defecto 20." },
      }),
      async ejecutar(args, ctx) {
        const t = await ctx.token();
        const org = await organizacion(t, ctx.senal);
        const filtro = { pendientes: "Status.Unpaid", vencidas: "Status.OverDue", pagadas: "Status.Paid", borrador: "Status.Draft" }[argTexto(args, "estado", 20)];
        const r = await api<{ invoices?: { invoice_number?: string; customer_name?: string; date?: string; due_date?: string; total?: number; balance?: number; status?: string; currency_code?: string }[] }>(
          t,
          "/books/v3/invoices",
          { organization_id: org, filter_by: filtro, customer_name_contains: argTexto(args, "cliente", 100) || undefined, sort_column: "date", sort_order: "D", per_page: argEntero(args, "limite", 20, 1, 50) },
          ctx.senal,
        );
        const facturas = r?.invoices ?? [];
        if (!facturas.length) return "No encontré facturas en Zoho Books con ese filtro.";
        return [
          `Facturas de Zoho Books (${facturas.length}):`,
          ...facturas.map((f) => `- ${unir(f.invoice_number, linea(f.customer_name, 80), f.date ? fecha(`${f.date}T12:00:00Z`).split(",").slice(0, 2).join(",") : "", `total ${dinero(f.total, f.currency_code)}`, f.balance ? `saldo ${dinero(f.balance, f.currency_code)}` : "", f.status)}`),
        ].join("\n");
      },
    }),
    herramienta({
      nombre: "zoho_books_contactos",
      descripcion: "Busca clientes y proveedores en Zoho Books (nombre, empresa, correo, teléfono y saldo por cobrar). Solo lectura.",
      app: "zoho_books",
      agentes: ["clara", "iris"],
      proveedor: "Zoho Books",
      esquema: esquema({
        buscar: { type: "string", description: "Nombre, empresa o correo a buscar." },
        limite: { type: "integer", minimum: 1, maximum: 50, description: "Cuántos contactos. Por defecto 20." },
      }),
      async ejecutar(args, ctx) {
        const t = await ctx.token();
        const org = await organizacion(t, ctx.senal);
        const r = await api<{ contacts?: { contact_name?: string; company_name?: string; email?: string; phone?: string; contact_type?: string; outstanding_receivable_amount?: number; currency_code?: string }[] }>(
          t,
          "/books/v3/contacts",
          { organization_id: org, search_text: argTexto(args, "buscar", 100) || undefined, per_page: argEntero(args, "limite", 20, 1, 50) },
          ctx.senal,
        );
        const contactos = r?.contacts ?? [];
        if (!contactos.length) return "No encontré contactos en Zoho Books.";
        return [
          `Contactos de Zoho Books (${contactos.length}):`,
          ...contactos.map((c) => `- ${unir(linea(c.contact_name, 80), linea(c.company_name, 60), c.email, c.phone, c.contact_type === "vendor" ? "proveedor" : "cliente", c.outstanding_receivable_amount ? `por cobrar ${dinero(c.outstanding_receivable_amount, c.currency_code)}` : "")}`),
        ].join("\n");
      },
    }),
  ],
};

/** Con el nombre del proveedor, como lo importa el registro. */
export { adaptador as zoho };
