import type { Adaptador, Herramienta, Tokens } from "@/lib/nucleo-tipos";
import { ErrorArgs, fechaMx, linea, pedirJson } from "../http";
import { ErrorOAuth, postarTokens, venceEn } from "../oauth";
import { argDias, argLimite, argOpcion, consultar, dinero, entero, haceDias, propDias, propLimite, senalCorta, sumar, totales } from "./comun-ventas";

/**
 * MERCADO LIBRE MÉXICO (OAuth de la app del dueño en el DevCenter).
 * - Autorización: https://auth.mercadolibre.com.mx/authorization (state y
 *   PKCE S256; PKCE se activa en la app y entonces es obligatorio).
 * - Tokens: POST https://api.mercadolibre.com/oauth/token (formulario). El
 *   access_token dura 6 horas y el refresh_token es de UN SOLO USO: cada
 *   renovación trae uno nuevo y se guarda (tokens.ts ya lo hace).
 * - Datos: /orders/search?seller= y /questions/search?seller_id=&status=UNANSWERED&api_version=4.
 * - Revocar: DELETE /users/{user_id}/applications/{app_id}.
 * Docs: https://developers.mercadolibre.com.mx/es_ar/autenticacion-y-autorizacion
 * Tokens.extra: user_id, cuenta y scopes.
 */

const API = "https://api.mercadolibre.com";
const APP = "Mercado Libre";

function credenciales() {
  const id = process.env.MERCADOLIBRE_CLIENT_ID?.trim();
  const secreto = process.env.MERCADOLIBRE_CLIENT_SECRET?.trim();
  if (!id || !secreto) throw new ErrorOAuth("rechazo", "Falta configurar Mercado Libre en Vercel.");
  return { id, secreto };
}

function aTokens(d: Record<string, unknown>, previo?: Tokens): Tokens {
  if (typeof d.access_token !== "string") throw new ErrorOAuth("rechazo", "Mercado Libre no mandó el token.");
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

/** El id de vendedor guardado (solo dígitos: va dentro de URLs). */
function vendedor(t: Tokens): string {
  const id = t.extra?.user_id ?? "";
  if (!/^\d{1,20}$/.test(id)) throw new ErrorArgs("Falta el id de la cuenta de Mercado Libre: hay que volver a conectarla en Tu negocio → Apps.");
  return id;
}

const pedido = (token: string, senal: AbortSignal) => ({ token, senal, proveedor: "mercadolibre" as const });

/* ---------------- Herramientas (solo lectura) ---------------- */

type Orden = {
  id: number;
  date_created?: string;
  status?: string;
  total_amount?: number;
  paid_amount?: number;
  currency_id?: string;
  buyer?: { id?: number | string; nickname?: string } | null;
  order_items?: { item?: { title?: string }; quantity?: number }[];
};
type Pregunta = { id: number; date_created?: string; item_id?: string; status?: string; text?: string; from?: { id?: number } };

const ESTADOS_ORDEN = ["todos", "paid", "confirmed", "payment_required", "payment_in_process", "partially_paid", "cancelled"] as const;
const ESTADO_ORDEN: Record<string, string> = {
  confirmed: "confirmada",
  payment_required: "esperando pago",
  payment_in_process: "pago en proceso",
  partially_paid: "pagada en parte",
  paid: "pagada",
  partially_refunded: "reembolsada en parte",
  pending_cancel: "cancelándose",
  cancelled: "cancelada",
  invalid: "inválida",
};

const ordenes: Herramienta = {
  nombre: "mercadolibre_ordenes_recientes",
  descripcion:
    "Ventas recientes de la persona en Mercado Libre (solo lectura), de la más nueva a la más vieja: fecha, número de orden, estado, total, qué se vendió y el comprador. Se puede filtrar por estado.",
  app: "mercado_libre",
  agentes: ["iris", "victor"],
  esquema: {
    type: "object",
    properties: {
      dias: propDias(90),
      estado: { type: "string", enum: [...ESTADOS_ORDEN], description: "paid = pagada, cancelled = cancelada… (por omisión, todas)." },
      limite: propLimite(50),
    },
    additionalProperties: false,
  },
  async ejecutar(args, ctx) {
    const dias = argDias(args);
    const estado = argOpcion(args, "estado", ESTADOS_ORDEN, "todos");
    const limite = argLimite(args);
    return consultar(APP, ctx.senal, async (senal) => {
      const t = await ctx.token();
      const q = new URLSearchParams({ seller: vendedor(t), sort: "date_desc", limit: String(limite), "order.date_created.from": haceDias(dias).toISOString() });
      if (estado !== "todos") q.set("order.status", estado);
      const d = await pedirJson<{ results?: Orden[]; paging?: { total?: number } }>(`${API}/orders/search?${q}`, pedido(t.access_token, senal));
      const lista = d.results ?? [];
      if (!lista.length) return `No hay ventas${estado !== "todos" ? ` con estado "${ESTADO_ORDEN[estado] ?? estado}"` : ""} en los últimos ${dias} días.`;
      const vendido = new Map<string, number>();
      for (const o of lista) if (o.status === "paid") sumar(vendido, o.currency_id, Number(o.total_amount));
      const total = d.paging?.total ?? lista.length;
      return [
        `Ventas de los últimos ${dias} días: ${entero(total)}${total > lista.length ? ` (aquí las ${lista.length} más recientes)` : ""}. Pagadas en esta lista: ${totales(vendido)}.`,
        ...lista.map((o) => {
          const items = (o.order_items ?? []).slice(0, 3).map((i) => `${linea(i.item?.title, 60)}${(i.quantity ?? 1) > 1 ? ` ×${i.quantity}` : ""}`);
          return `- ${fechaMx(o.date_created)} · orden ${o.id} · ${ESTADO_ORDEN[o.status ?? ""] ?? linea(o.status, 30)} · ${dinero(o.total_amount, o.currency_id)} · ${items.join("; ") || "sin artículos"} · comprador ${linea(o.buyer?.nickname || o.buyer?.id || "sin nombre", 40)}`;
        }),
      ].join("\n");
    });
  },
};

const preguntas: Herramienta = {
  nombre: "mercadolibre_preguntas_sin_responder",
  descripcion: "Preguntas de compradores que siguen sin contestar en las publicaciones de Mercado Libre de la persona (solo lectura): fecha, publicación y la pregunta. Sirve para proponer respuestas; no contesta nada.",
  app: "mercado_libre",
  agentes: ["iris", "victor"],
  esquema: { type: "object", properties: { limite: propLimite(50) }, additionalProperties: false },
  async ejecutar(args, ctx) {
    const limite = argLimite(args);
    return consultar(APP, ctx.senal, async (senal) => {
      const t = await ctx.token();
      const q = new URLSearchParams({ seller_id: vendedor(t), status: "UNANSWERED", sort_fields: "date_created", sort_types: "DESC", limit: String(limite), api_version: "4" });
      const d = await pedirJson<{ questions?: Pregunta[]; total?: number }>(`${API}/questions/search?${q}`, pedido(t.access_token, senal));
      const lista = (d.questions ?? []).filter((p) => !p.status || p.status === "UNANSWERED");
      if (!lista.length) return "No hay preguntas sin contestar.";
      // Títulos de las publicaciones (si no se pueden leer, se muestra el id)
      const titulos = new Map<string, string>();
      const ids = Array.from(new Set(lista.map((p) => p.item_id).filter((x): x is string => typeof x === "string" && /^[A-Z]{3}\d{1,15}$/.test(x)))).slice(0, 20);
      if (ids.length) {
        try {
          const items = await pedirJson<{ code?: number; body?: { id?: string; title?: string } }[]>(`${API}/items?${new URLSearchParams({ ids: ids.join(","), attributes: "id,title" })}`, pedido(t.access_token, senal));
          for (const i of Array.isArray(items) ? items : []) if (i.code === 200 && i.body?.id && i.body.title) titulos.set(i.body.id, i.body.title);
        } catch {
          /* sin títulos también sirve */
        }
      }
      const total = d.total ?? lista.length;
      return [
        `Preguntas sin contestar: ${entero(total)}${total > lista.length ? ` (aquí las ${lista.length} más recientes)` : ""}.`,
        ...lista.map((p) => `- ${fechaMx(p.date_created)} · ${linea(titulos.get(p.item_id ?? "") ?? p.item_id ?? "publicación", 80)} · «${linea(p.text, 300)}» · id ${p.id}`),
      ].join("\n");
    });
  },
};

/* ---------------- El adaptador ---------------- */

export const mercadolibre: Adaptador = {
  proveedor: "mercadolibre",
  autenticacion: "oauth",
  variables: ["MERCADOLIBRE_CLIENT_ID", "MERCADOLIBRE_CLIENT_SECRET"],
  urlAutorizacion({ state, redirectUri, codeChallenge }) {
    const q = new URLSearchParams({ response_type: "code", client_id: credenciales().id, redirect_uri: redirectUri, state });
    if (codeChallenge) {
      q.set("code_challenge", codeChallenge);
      q.set("code_challenge_method", "S256");
    }
    return `https://auth.mercadolibre.com.mx/authorization?${q}`;
  },
  async intercambiar({ code, redirectUri, codeVerifier }) {
    const { id, secreto } = credenciales();
    const cuerpo: Record<string, string> = { grant_type: "authorization_code", client_id: id, client_secret: secreto, code, redirect_uri: redirectUri };
    if (codeVerifier) cuerpo.code_verifier = codeVerifier;
    return aTokens(await postarTokens(`${API}/oauth/token`, cuerpo));
  },
  async renovar(t) {
    if (!t.refresh_token) throw new ErrorOAuth("invalid_grant", "Sin refresh token.");
    const { id, secreto } = credenciales();
    return aTokens(await postarTokens(`${API}/oauth/token`, { grant_type: "refresh_token", client_id: id, client_secret: secreto, refresh_token: t.refresh_token }), t);
  },
  async revocar(t) {
    const usuario = t.extra?.user_id ?? "";
    if (!/^\d{1,20}$/.test(usuario)) return;
    await fetch(`${API}/users/${usuario}/applications/${encodeURIComponent(credenciales().id)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${t.access_token}` },
      cache: "no-store",
      signal: senalCorta(),
    });
  },
  async cuenta(t) {
    if (t.extra?.cuenta) return t.extra.cuenta;
    try {
      const u = await pedirJson<{ nickname?: string; first_name?: string; last_name?: string }>(`${API}/users/me`, { token: t.access_token, senal: senalCorta(), proveedor: "mercadolibre" });
      return linea(u.nickname || [u.first_name, u.last_name].filter(Boolean).join(" "), 120) || "Tu cuenta de Mercado Libre";
    } catch {
      return "Tu cuenta de Mercado Libre";
    }
  },
  herramientas: [ordenes, preguntas],
};
