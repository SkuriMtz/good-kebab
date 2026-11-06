import type { Adaptador, Tokens } from "@/lib/nucleo-tipos";
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
  pedirJson,
  pedirToken,
  sinRenovacion,
  unir,
  variable,
} from "./_comun-1";

/**
 * TYPEFORM (OAuth 2; typeform.com/developers, nov 2026):
 * - Autorizar: https://api.typeform.com/oauth/authorize con scope
 *   "accounts:read forms:read responses:read offline" (offline = refresh token).
 * - Token: POST https://api.typeform.com/oauth/token (formulario con
 *   client_id y client_secret). El access token dura una semana.
 * - API: /me, /forms y /forms/{id}/responses.
 *   (Las cuentas del centro de datos de la UE usan api.eu.typeform.com; esta
 *   versión usa el de siempre.)
 */

const NOMBRE = "Typeform";
const API = "https://api.typeform.com";
export const SCOPES_TYPEFORM = ["accounts:read", "forms:read", "responses:read", "offline"];

const credenciales = () => ({ id: variable("TYPEFORM_CLIENT_ID"), secreto: variable("TYPEFORM_CLIENT_SECRET") });

type RespuestaToken = { access_token: string; refresh_token?: string; expires_in?: number; scope?: string };
const aTokens = (r: RespuestaToken, anterior?: Tokens): Tokens => ({
  access_token: r.access_token,
  refresh_token: r.refresh_token ?? anterior?.refresh_token,
  expira_en: expiraEn(r.expires_in),
  extra: { ...(anterior?.extra ?? {}), ...(r.scope ? { scopes: r.scope } : {}) },
});

function api<T>(t: Tokens, ruta: string, params: Record<string, string | number | undefined> = {}, senal?: AbortSignal) {
  return pedirJson<T>(NOMBRE, `${API}${ruta}${consulta(params)}`, { encabezados: { Authorization: `Bearer ${t.access_token}` }, senal });
}

type Respuesta = {
  submitted_at?: string;
  answers?: {
    field?: { id?: string; ref?: string };
    type?: string;
    text?: string;
    email?: string;
    phone_number?: string;
    url?: string;
    number?: number;
    boolean?: boolean;
    date?: string;
    choice?: { label?: string; other?: string };
    choices?: { labels?: string[]; other?: string };
    file_url?: string;
  }[];
};

function valor(a: NonNullable<Respuesta["answers"]>[number]): string {
  switch (a.type) {
    case "choice":
      return linea(a.choice?.label ?? a.choice?.other, 120);
    case "choices":
      return linea([...(a.choices?.labels ?? []), a.choices?.other].filter(Boolean).join(", "), 200);
    case "boolean":
      return a.boolean ? "sí" : "no";
    case "number":
      return String(a.number ?? "");
    case "file_url":
      return "(archivo adjunto)";
    default:
      return linea(a.text ?? a.email ?? a.phone_number ?? a.url ?? a.date ?? "", 300);
  }
}

/** Acepta el id o el link del formulario (https://xxx.typeform.com/to/<id>). */
const idForm = (v: string) => (v.match(/\/to\/([A-Za-z0-9]{4,20})/)?.[1] ?? v).trim();

export const adaptador: Adaptador = {
  proveedor: "typeform",
  autenticacion: "oauth",
  variables: ["TYPEFORM_CLIENT_ID", "TYPEFORM_CLIENT_SECRET"],

  urlAutorizacion({ state, redirectUri }) {
    return `${API}/oauth/authorize${consulta({ client_id: credenciales().id, redirect_uri: redirectUri, scope: SCOPES_TYPEFORM.join(" "), state })}`;
  },

  async intercambiar({ code, redirectUri }) {
    const { id, secreto } = credenciales();
    return aTokens(
      await pedirToken<RespuestaToken>(NOMBRE, `${API}/oauth/token`, formulario({ grant_type: "authorization_code", code, client_id: id, client_secret: secreto, redirect_uri: redirectUri })),
    );
  },

  async renovar(t) {
    if (!t.refresh_token) throw sinRenovacion(NOMBRE);
    const { id, secreto } = credenciales();
    return aTokens(
      await pedirToken<RespuestaToken>(
        NOMBRE,
        `${API}/oauth/token`,
        formulario({ grant_type: "refresh_token", refresh_token: t.refresh_token, client_id: id, client_secret: secreto, scope: SCOPES_TYPEFORM.join(" ") }),
      ),
      t,
    );
  },

  async cuenta(t) {
    const yo = await api<{ alias?: string; email?: string }>(t, "/me");
    return yo.email || yo.alias || "Cuenta de Typeform";
  },

  herramientas: [
    herramienta({
      nombre: "typeform_formularios",
      descripcion: "Lista los formularios de Typeform de la cuenta (nombre, id, última actualización y enlace). Solo lectura.",
      app: "typeform",
      agentes: ["victor"],
      proveedor: NOMBRE,
      esquema: esquema({
        buscar: { type: "string", description: "Texto para filtrar por nombre del formulario." },
      }),
      async ejecutar(args, ctx) {
        const r = await api<{ items?: { id: string; title?: string; last_updated_at?: string; _links?: { display?: string } }[] }>(
          await ctx.token(),
          "/forms",
          { search: argTexto(args, "buscar", 100) || undefined, page_size: 50 },
          ctx.senal,
        );
        const lista = r.items ?? [];
        if (!lista.length) return "No hay formularios en Typeform.";
        return [
          `Formularios de Typeform (${lista.length}):`,
          ...lista.map((f) => `- ${unir(linea(f.title, 100), `id ${f.id}`, f.last_updated_at ? `actualizado ${fecha(f.last_updated_at)}` : "", f._links?.display)}`),
        ].join("\n");
      },
    }),
    herramienta({
      nombre: "typeform_respuestas",
      descripcion: "Lee las respuestas más recientes de un formulario de Typeform, con cada pregunta y lo que contestaron. Solo lectura.",
      app: "typeform",
      agentes: ["victor"],
      proveedor: NOMBRE,
      esquema: esquema(
        {
          formulario: { type: "string", description: "Id o link del formulario (de typeform_formularios)." },
          limite: { type: "integer", minimum: 1, maximum: 25, description: "Cuántas respuestas. Por defecto 10." },
        },
        ["formulario"],
      ),
      async ejecutar(args, ctx) {
        const id = idForm(argTexto(args, "formulario", 300));
        if (!/^[A-Za-z0-9]{4,20}$/.test(id)) throw new ErrorProveedor("Ese no parece el id de un formulario de Typeform. Búscalo con typeform_formularios.");
        const t = await ctx.token();
        const [form, r] = await Promise.all([
          api<{ title?: string; fields?: { id?: string; ref?: string; title?: string }[] }>(t, `/forms/${id}`, {}, ctx.senal),
          api<{ total_items?: number; items?: Respuesta[] }>(t, `/forms/${id}/responses`, { page_size: argEntero(args, "limite", 10, 1, 25), completed: "true" }, ctx.senal),
        ]);
        const preguntas = new Map<string, string>();
        for (const f of form.fields ?? []) if (f.id) preguntas.set(f.id, linea(f.title, 80));
        const lista = r.items ?? [];
        if (!lista.length) return `El formulario "${linea(form.title, 80)}" no tiene respuestas todavía.`;
        return [
          `Respuestas de "${linea(form.title, 80)}" (${lista.length} de ${r.total_items ?? lista.length}, de la más reciente):`,
          ...lista.map((x) =>
            [`• ${fecha(x.submitted_at) || "sin fecha"}`, ...(x.answers ?? []).map((a) => `  - ${preguntas.get(a.field?.id ?? "") || a.field?.ref || "Pregunta"}: ${valor(a)}`)].join("\n"),
          ),
        ].join("\n");
      },
    }),
  ],
};

/** Con el nombre del proveedor, como lo importa el registro. */
export { adaptador as typeform };
