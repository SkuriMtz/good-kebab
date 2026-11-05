import type { Adaptador, Herramienta, Tokens } from "@/lib/nucleo-tipos";
import { argTexto, ErrorArgs, fechaMx, linea, pedirJson, recortar } from "../http";
import { ErrorApi, ErrorOAuth, postarTokens, venceEn } from "../oauth";

/**
 * NOTION (integración pública). La persona elige en Notion qué páginas
 * comparte con Atendel: solo esas se pueden leer. Sin scopes ni PKCE; el
 * intercambio va con Basic auth (client_id:client_secret) y cuerpo JSON.
 * Al renovar, Notion cambia los dos tokens: se guardan los nuevos.
 * Tokens.extra: cuenta y workspace.
 */

const API = "https://api.notion.com/v1";
const VERSION = "2022-06-28";

function basic() {
  const id = process.env.NOTION_CLIENT_ID?.trim();
  const secreto = process.env.NOTION_CLIENT_SECRET?.trim();
  if (!id || !secreto) throw new ErrorOAuth("rechazo", "Falta configurar Notion en Vercel.");
  return { id, auth: `Basic ${Buffer.from(`${id}:${secreto}`).toString("base64")}` };
}

type Dueno = { user?: { name?: string | null; person?: { email?: string | null } | null } | null };

function aTokens(d: Record<string, unknown>, previo?: Tokens): Tokens {
  if (typeof d.access_token !== "string") throw new ErrorOAuth("rechazo", "Notion no mandó el token.");
  const dueno = (d.owner ?? {}) as Dueno;
  const correo = dueno.user?.person?.email ?? undefined;
  const espacio = typeof d.workspace_name === "string" && d.workspace_name ? d.workspace_name : undefined;
  const extra: Record<string, string> = { ...(previo?.extra ?? {}) };
  if (espacio) extra.workspace = espacio;
  if (correo || espacio) extra.cuenta = correo || (espacio as string);
  return {
    access_token: d.access_token,
    refresh_token: typeof d.refresh_token === "string" ? d.refresh_token : previo?.refresh_token,
    expira_en: venceEn(d.expires_in),
    extra,
  };
}

/* ---------------- Herramientas (solo lectura) ---------------- */

type Texto = { plain_text?: string };
type Pagina = { id: string; object?: string; url?: string; last_edited_time?: string; properties?: Record<string, { type?: string; title?: Texto[] } & Record<string, unknown>>; title?: Texto[] };
type Bloque = { id: string; type?: string; has_children?: boolean } & Record<string, unknown>;

const plano = (t?: Texto[]) => (t ?? []).map((x) => x.plain_text ?? "").join("");
const tituloDe = (p: Pagina) => {
  if (p.title) return plano(p.title);
  const prop = Object.values(p.properties ?? {}).find((x) => x.type === "title");
  return plano(prop?.title);
};
/** Acepta el id (con o sin guiones) o el link de la página. */
function idNotion(t: string): string {
  const limpio = t.replace(/-/g, "");
  const m = limpio.match(/([0-9a-f]{32})(?:\?|$|#)/i) ?? limpio.match(/([0-9a-f]{32})/i);
  if (!m) throw new ErrorArgs('"id" no parece el id ni el link de una página de Notion.');
  return m[1].toLowerCase();
}

const tokenDe = async (ctx: { token: () => Promise<Tokens> }) => (await ctx.token()).access_token;
const pedido = (token: string, senal: AbortSignal) => ({ token, senal, proveedor: "notion" as const, headers: { "Notion-Version": VERSION } });

function textoDeBloque(b: Bloque): string {
  const tipo = b.type ?? "";
  const datos = (b[tipo] ?? {}) as { rich_text?: Texto[]; checked?: boolean; title?: string; cells?: Texto[][] };
  if (tipo === "child_page" || tipo === "child_database") return `[${tipo === "child_page" ? "Página" : "Base de datos"}: ${linea(datos.title, 160)}]`;
  if (tipo === "table_row") return (datos.cells ?? []).map((c) => linea(plano(c), 120)).join(" | ");
  const t = plano(datos.rich_text);
  if (!t) return "";
  if (tipo.startsWith("heading_")) return `${"#".repeat(Number(tipo.slice(-1)) || 1)} ${t}`;
  if (tipo === "bulleted_list_item") return `- ${t}`;
  if (tipo === "numbered_list_item") return `1. ${t}`;
  if (tipo === "to_do") return `[${datos.checked ? "x" : " "}] ${t}`;
  if (tipo === "quote") return `> ${t}`;
  return t;
}

const buscar: Herramienta = {
  nombre: "notion_buscar",
  descripcion: "Busca páginas y bases de datos de Notion que la persona compartió con Atendel, por título (solo lectura). Sin consulta, trae las editadas más recientemente. Regresa id, título y fecha.",
  app: "notion",
  agentes: ["iris"],
  esquema: { type: "object", properties: { consulta: { type: "string", description: "Palabras del título." } }, additionalProperties: false },
  async ejecutar(args, ctx) {
    const consulta = argTexto(args, "consulta", { max: 200 });
    const d = await pedirJson<{ results?: Pagina[] }>(`${API}/search`, {
      ...pedido(await tokenDe(ctx), ctx.senal),
      metodo: "POST",
      cuerpo: { query: consulta, page_size: 15, sort: { direction: "descending", timestamp: "last_edited_time" } },
    });
    const r = d.results ?? [];
    if (!r.length) return "No encontré nada. Solo se ven las páginas que la persona compartió con Atendel desde Notion (menú «…» → Conexiones).";
    return r.map((p) => `- id: ${p.id} · ${p.object === "database" ? "Base de datos" : "Página"} · ${linea(tituloDe(p), 160) || "(sin título)"} · editada ${fechaMx(p.last_edited_time)}`).join("\n");
  },
};

const leer: Herramienta = {
  nombre: "notion_leer_pagina",
  descripcion: "Lee el contenido de una página de Notion (o las filas de una base de datos) por su id o link, de las que la persona compartió con Atendel. Solo lectura; máximo 4000 caracteres.",
  app: "notion",
  agentes: ["iris"],
  esquema: { type: "object", properties: { id: { type: "string", description: "El id o el link de la página." } }, required: ["id"], additionalProperties: false },
  async ejecutar(args, ctx) {
    const id = idNotion(argTexto(args, "id", { requerido: true, max: 400 }));
    const p = pedido(await tokenDe(ctx), ctx.senal);
    let pagina: Pagina;
    try {
      pagina = await pedirJson<Pagina>(`${API}/pages/${id}`, p);
    } catch (e) {
      if (!(e instanceof ErrorApi) || (e.status !== 400 && e.status !== 404)) throw e;
      // ¿Es una base de datos? Se leen sus filas
      const filas = await pedirJson<{ results?: Pagina[] }>(`${API}/databases/${id}/query`, { ...p, metodo: "POST", cuerpo: { page_size: 25 } });
      return [`Base de datos (${(filas.results ?? []).length} filas):`, ...(filas.results ?? []).map((f) => `- id: ${f.id} · ${linea(tituloDe(f), 200) || "(sin título)"}`)].join("\n");
    }
    const hijos = await pedirJson<{ results?: Bloque[]; has_more?: boolean }>(`${API}/blocks/${id}/children?page_size=100`, p);
    const lineas = (hijos.results ?? []).map(textoDeBloque).filter(Boolean);
    return [
      `Página: ${linea(tituloDe(pagina), 200) || "(sin título)"} · editada ${fechaMx(pagina.last_edited_time)}`,
      "",
      recortar(lineas.join("\n") || "(página vacía)", 4000),
      hijos.has_more ? "\n(La página sigue: aquí van los primeros 100 bloques.)" : "",
    ].join("\n");
  },
};

/* ---------------- El adaptador ---------------- */

export const notion: Adaptador = {
  proveedor: "notion",
  autenticacion: "oauth",
  variables: ["NOTION_CLIENT_ID", "NOTION_CLIENT_SECRET"],
  urlAutorizacion({ state, redirectUri }) {
    const q = new URLSearchParams({ client_id: basic().id, response_type: "code", owner: "user", redirect_uri: redirectUri, state });
    return `${API}/oauth/authorize?${q}`;
  },
  async intercambiar({ code, redirectUri }) {
    const d = await postarTokens(`${API}/oauth/token`, { grant_type: "authorization_code", code, redirect_uri: redirectUri }, { Authorization: basic().auth }, true);
    return aTokens(d);
  },
  async renovar(t) {
    if (!t.refresh_token) throw new ErrorOAuth("invalid_grant", "Sin refresh token.");
    const d = await postarTokens(`${API}/oauth/token`, { grant_type: "refresh_token", refresh_token: t.refresh_token }, { Authorization: basic().auth }, true);
    return aTokens(d, t);
  },
  async revocar(t) {
    await fetch(`${API}/oauth/revoke`, {
      method: "POST",
      headers: { Authorization: basic().auth, "Content-Type": "application/json" },
      body: JSON.stringify({ token: t.access_token }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  },
  async cuenta(t) {
    return t.extra?.cuenta ?? "Tu espacio de Notion";
  },
  herramientas: [buscar, leer],
};
