import type { Adaptador, Herramienta, Tokens } from "@/lib/nucleo-tipos";
import { argTexto, ErrorArgs, fechaMx, linea, pedirJson } from "../http";
import { ErrorApi } from "../oauth";
import { argDias, argLimite, argOpcion, consultar, dinero, entero, haceDias, propDias, propLimite, senalCorta, sumar, totales } from "./comun-ventas";

/**
 * FACTURAPI (CFDI de México), por llave: la persona pega la llave secreta de
 * SU organización (sk_live_… o sk_test_…), que saca en Facturapi →
 * su organización → Llaves de API. Las llaves de usuario (sk_user_…) no
 * sirven aquí. SOLO LECTURA: nada de timbrar, cancelar ni mandar facturas.
 * Docs: https://docs.facturapi.io/api/ (GET /v2/invoices, /v2/organizations/me)
 * Tokens: access_token = la llave (cifrada); extra.cuenta, extra.rfc y extra.modo.
 */

const API = "https://www.facturapi.io/v2";
const APP = "Facturapi";
const LLAVE = /^sk_(live|test)_[A-Za-z0-9]{10,}$/;

const pedido = (token: string, senal: AbortSignal) => ({ token, senal, proveedor: "facturapi" as const });
const llaveDe = async (ctx: { token: () => Promise<Tokens> }) => (await ctx.token()).access_token;

type Factura = {
  id: string;
  date?: string;
  created_at?: string;
  status?: string;
  cancellation_status?: string;
  payment_status?: string;
  type?: string;
  total?: number;
  currency?: string;
  series?: string;
  folio_number?: number;
  uuid?: string;
  payment_method?: string;
  customer?: { legal_name?: string; tax_id?: string } | null;
};
type Pagina = { data?: Factura[]; total_results?: number };

const ESTADO: Record<string, string> = { valid: "vigente", canceled: "cancelada", pending: "pendiente de timbrar", draft: "borrador" };
const CANCELACION: Record<string, string> = { pending: "cancelación en espera de que el cliente acepte", accepted: "cancelación aceptada", rejected: "cancelación rechazada", expired: "cancelación vencida" };
const TIPO: Record<string, string> = { I: "Ingreso", E: "Egreso (nota de crédito)", P: "Pago (complemento)", N: "Nómina", T: "Traslado" };
const ESTADOS = ["todas", "valid", "canceled", "pending", "draft"] as const;

const folio = (f: Factura) => (f.series || f.folio_number ? `${f.series ?? ""}${f.folio_number ?? ""}` : f.uuid ? `UUID ${f.uuid.slice(0, 8)}…` : f.id);

function renglon(f: Factura): string {
  const cancel = f.cancellation_status && f.cancellation_status !== "none" ? ` · ${CANCELACION[f.cancellation_status] ?? linea(f.cancellation_status, 30)}` : "";
  const pago = f.payment_method === "PPD" ? ` · ${f.payment_status === "paid" ? "pagada" : "pago en parcialidades (PPD), sin liquidar"}` : "";
  const cliente = f.customer ? `${linea(f.customer.legal_name, 80)}${f.customer.tax_id ? ` (RFC ${linea(f.customer.tax_id, 13)})` : ""}` : "sin cliente";
  return `- ${linea(folio(f), 30)} · ${fechaMx(f.date ?? f.created_at, true)} · ${TIPO[f.type ?? ""] ?? linea(f.type, 10)} · ${cliente} · ${dinero(f.total, f.currency)} · ${ESTADO[f.status ?? ""] ?? linea(f.status, 20)}${cancel}${pago}`;
}

function resumen(facturas: Factura[]): string {
  const vigentes = new Map<string, number>();
  let canceladas = 0;
  for (const f of facturas) {
    if (f.status === "valid" && f.type === "I") sumar(vigentes, f.currency, Number(f.total));
    if (f.status === "canceled") canceladas += 1;
  }
  return `Facturado vigente (ingresos): ${totales(vigentes)}${canceladas ? ` · ${entero(canceladas)} cancelada${canceladas === 1 ? "" : "s"}` : ""}.`;
}

/* ---------------- Herramientas (solo lectura) ---------------- */

const recientes: Herramienta = {
  nombre: "facturapi_facturas_recientes",
  descripcion:
    "Facturas electrónicas (CFDI) recientes que emitió la persona en Facturapi (solo lectura): folio, fecha, tipo, cliente con su RFC, total y estado (vigente, cancelada, pendiente o borrador). No timbra ni cancela nada.",
  app: "cfdi",
  agentes: ["iris"],
  esquema: {
    type: "object",
    properties: {
      dias: propDias(365),
      estado: { type: "string", enum: [...ESTADOS], description: "valid = vigente, canceled = cancelada, pending, draft (por omisión, todas)." },
      limite: propLimite(50),
    },
    additionalProperties: false,
  },
  async ejecutar(args, ctx) {
    const dias = argDias(args, 365);
    const estado = argOpcion(args, "estado", ESTADOS, "todas");
    const limite = argLimite(args);
    return consultar(APP, ctx.senal, async (senal) => {
      // El API no filtra por estado: se piden más y se filtran aquí
      const q = new URLSearchParams({ limit: String(estado === "todas" ? limite : 100), "date[gte]": haceDias(dias).toISOString() });
      const d = await pedirJson<Pagina>(`${API}/invoices?${q}`, pedido(await llaveDe(ctx), senal));
      const todas = d.data ?? [];
      const lista = (estado === "todas" ? todas : todas.filter((f) => f.status === estado)).slice(0, limite);
      if (!lista.length) return `No hay facturas${estado !== "todas" ? ` con estado "${ESTADO[estado]}"` : ""} en los últimos ${dias} días.`;
      const total = d.total_results ?? todas.length;
      return [`Facturas de los últimos ${dias} días: ${entero(total)}${total > lista.length ? ` (aquí ${lista.length})` : ""}. ${resumen(lista)}`, ...lista.map(renglon)].join("\n");
    });
  },
};

const buscar: Herramienta = {
  nombre: "facturapi_buscar_facturas",
  descripcion:
    "Busca facturas CFDI en Facturapi por cliente (nombre o razón social), RFC, folio o UUID (solo lectura) y dice su estado: vigente, cancelada, pendiente; si es PPD, si ya se pagó.",
  app: "cfdi",
  agentes: ["iris"],
  esquema: {
    type: "object",
    properties: {
      consulta: { type: "string", description: "Nombre o razón social del cliente, RFC, folio o UUID." },
      limite: propLimite(50),
    },
    required: ["consulta"],
    additionalProperties: false,
  },
  async ejecutar(args, ctx) {
    const consulta = argTexto(args, "consulta", { requerido: true, max: 120 });
    const limite = argLimite(args);
    return consultar(APP, ctx.senal, async (senal) => {
      // Un RFC se busca en mayúsculas (Facturapi lo compara exacto)
      const rfc = /^[A-Za-zÑñ&]{3,4}\d{6}[A-Za-z0-9]{3}$/.test(consulta) ? consulta.toUpperCase() : consulta;
      const d = await pedirJson<Pagina>(`${API}/invoices?${new URLSearchParams({ q: rfc, limit: String(limite) })}`, pedido(await llaveDe(ctx), senal));
      const lista = d.data ?? [];
      if (!lista.length) return `No encontré facturas con «${linea(consulta, 60)}».`;
      const total = d.total_results ?? lista.length;
      return [`Facturas que coinciden con «${linea(consulta, 60)}»: ${entero(total)}${total > lista.length ? ` (aquí las ${lista.length} más recientes)` : ""}. ${resumen(lista)}`, ...lista.map(renglon)].join("\n");
    });
  },
};

/* ---------------- El adaptador ---------------- */

type Organizacion = { legal?: { name?: string; legal_name?: string; tax_id?: string } | null };

export const facturapi: Adaptador = {
  proveedor: "facturapi",
  autenticacion: "llave",
  variables: [],
  async validarLlave(llave) {
    const k = llave.trim();
    if (k.startsWith("sk_user_")) throw new ErrorArgs("Esa es tu llave de usuario. Pega la llave secreta de la organización (Facturapi → tu organización → Llaves de API).");
    if (!LLAVE.test(k)) throw new ErrorArgs("Esa no parece una llave de Facturapi: pega la llave secreta de tu organización (empieza con sk_live_).");
    let org: Organizacion;
    try {
      org = await pedirJson<Organizacion>(`${API}/organizations/me`, { token: k, senal: senalCorta(), proveedor: "facturapi" });
    } catch (e) {
      if (e instanceof ErrorApi && (e.status === 401 || e.status === 403)) throw new ErrorArgs("Facturapi no reconoce esa llave. Revisa que la copiaste completa.");
      throw new ErrorArgs("No se pudo revisar la llave con Facturapi. Intenta de nuevo.");
    }
    const modo = k.startsWith("sk_live_") ? "live" : "test";
    const nombre = linea(org.legal?.name || org.legal?.legal_name || "", 120);
    const extra: Record<string, string> = { modo };
    if (org.legal?.tax_id) extra.rfc = linea(org.legal.tax_id, 13);
    extra.cuenta = `${nombre || "Tu organización de Facturapi"}${extra.rfc ? ` · RFC ${extra.rfc}` : ""}${modo === "test" ? " (modo de prueba)" : ""}`;
    return { access_token: k, extra };
  },
  async cuenta(t) {
    return t.extra?.cuenta ?? "Tu organización de Facturapi";
  },
  herramientas: [recientes, buscar],
};
