import type { Adaptador, Tokens } from "@/lib/nucleo-tipos";
import { ErrorProveedor, argEntero, argTexto, consulta, esquema, herramienta, linea, normalizar, pedirJson, unir } from "./_comun-1";

/**
 * AIRTABLE (por llave: Personal Access Token; airtable.com/developers, nov 2026):
 * - La persona crea el token en airtable.com/create/tokens con los scopes
 *   data.records:read y schema.bases:read (y user.email:read para mostrar
 *   su correo) y le da acceso a las bases que quiera.
 * - Lee: /v0/meta/whoami, /v0/meta/bases, /v0/meta/bases/{base}/tables y
 *   /v0/{base}/{tabla} (registros).
 * - Airtable no deja revocar un token por API: se borra en su página.
 */

const NOMBRE = "Airtable";
const API = "https://api.airtable.com/v0";
const FORMA_BASE = /^app[A-Za-z0-9]{14}$/;

function api<T>(token: string, ruta: string, params: Record<string, string | number | undefined> = {}, senal?: AbortSignal) {
  return pedirJson<T>(NOMBRE, `${API}${ruta}${consulta(params)}`, {
    encabezados: { Authorization: `Bearer ${token}` },
    senal,
    interpretar: (estado) => {
      if (estado === 401) return "Airtable no reconoció el token. Revisa que lo copiaste completo.";
      if (estado === 403) return "Tu token de Airtable no tiene permiso para esa base. Agrégala al token en airtable.com/create/tokens.";
      if (estado === 404) return "No encontré esa base o tabla en Airtable.";
      return undefined;
    },
  });
}

function baseDe(args: Record<string, unknown>) {
  const base = argTexto(args, "base_id", 40);
  if (!FORMA_BASE.test(base)) throw new ErrorProveedor('El id de la base de Airtable empieza con "app" (míralo con airtable_bases).');
  return base;
}

/** Un valor de celda en texto corto (listas, adjuntos, colaboradores…). */
function valor(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (Array.isArray(v)) return v.map(valor).filter(Boolean).join(", ");
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    return linea(o.name ?? o.filename ?? o.email ?? o.text ?? o.label ?? "", 80);
  }
  if (typeof v === "boolean") return v ? "sí" : "no";
  return linea(v, 160);
}

type Registro = { id: string; fields?: Record<string, unknown> };

export const adaptador: Adaptador = {
  proveedor: "airtable",
  autenticacion: "llave",
  variables: [],

  async validarLlave(llave) {
    const token = llave.trim();
    if (!/^pat[A-Za-z0-9]{10,}\.[A-Za-z0-9]{20,}$/.test(token))
      throw new ErrorProveedor('Ese no parece un token de Airtable. Debe empezar con "pat" (créalo en airtable.com/create/tokens).');
    const yo = await api<{ id?: string; email?: string }>(token, "/meta/whoami");
    const t: Tokens = { access_token: token, extra: {} };
    if (yo.id) t.extra!.usuario = yo.id;
    if (yo.email) t.extra!.correo = yo.email;
    return t;
  },

  async cuenta(t) {
    if (t.extra?.correo) return t.extra.correo;
    const yo = await api<{ id?: string; email?: string }>(t.access_token, "/meta/whoami");
    return yo.email || "Cuenta de Airtable";
  },

  herramientas: [
    herramienta({
      nombre: "airtable_bases",
      descripcion:
        "Lista las bases de Airtable a las que tiene acceso el token. Con base_id, muestra sus tablas y los campos de cada una. Solo lectura.",
      app: "airtable",
      agentes: ["iris"],
      proveedor: NOMBRE,
      esquema: esquema({ base_id: { type: "string", description: 'Id de la base ("app…") para ver sus tablas. Vacío para ver todas las bases.' } }),
      async ejecutar(args, ctx) {
        const t = await ctx.token();
        if (!argTexto(args, "base_id")) {
          const r = await api<{ bases?: { id: string; name?: string; permissionLevel?: string }[] }>(t.access_token, "/meta/bases", {}, ctx.senal);
          const bases = r.bases ?? [];
          if (!bases.length) return "El token no tiene acceso a ninguna base. Agrégale bases en airtable.com/create/tokens.";
          return [`Bases de Airtable (${bases.length}):`, ...bases.map((b) => `- ${unir(linea(b.name, 100), b.id, b.permissionLevel)}`)].join("\n");
        }
        const base = baseDe(args);
        const r = await api<{ tables?: { id: string; name?: string; fields?: { name?: string; type?: string }[] }[] }>(
          t.access_token,
          `/meta/bases/${base}/tables`,
          {},
          ctx.senal,
        );
        const tablas = r.tables ?? [];
        if (!tablas.length) return "Esa base no tiene tablas.";
        return [
          `Tablas de la base ${base} (${tablas.length}):`,
          ...tablas.map((x) => `- ${unir(linea(x.name, 80), x.id)}: ${(x.fields ?? []).map((f) => f.name).filter(Boolean).slice(0, 30).join(", ")}`),
        ].join("\n");
      },
    }),
    herramienta({
      nombre: "airtable_registros",
      descripcion: "Lee los registros de una tabla de Airtable, con un texto opcional para filtrarlos. Solo lectura.",
      app: "airtable",
      agentes: ["iris"],
      proveedor: NOMBRE,
      esquema: esquema(
        {
          base_id: { type: "string", description: 'Id de la base ("app…").' },
          tabla: { type: "string", description: "Nombre o id de la tabla." },
          buscar: { type: "string", description: "Texto para quedarse solo con los registros que lo contengan." },
          limite: { type: "integer", minimum: 1, maximum: 50, description: "Cuántos registros como máximo. Por defecto 20." },
        },
        ["base_id", "tabla"],
      ),
      async ejecutar(args, ctx) {
        const base = baseDe(args);
        const tabla = argTexto(args, "tabla", 120);
        if (!tabla) throw new ErrorProveedor("Dime de qué tabla de Airtable quieres los registros.");
        const buscar = normalizar(argTexto(args, "buscar", 200));
        const limite = argEntero(args, "limite", 20, 1, 50);
        const t = await ctx.token();
        const r = await api<{ records?: Registro[] }>(
          t.access_token,
          `/${base}/${encodeURIComponent(tabla)}`,
          { pageSize: buscar ? 100 : limite },
          ctx.senal,
        );
        const filas = (r.records ?? [])
          .map((x) =>
            Object.entries(x.fields ?? {})
              .map(([k, v]) => {
                const s = valor(v);
                return s ? `${linea(k, 40)}: ${s}` : "";
              })
              .filter(Boolean)
              .join("; "),
          )
          .filter((s) => s && (!buscar || normalizar(s).includes(buscar)))
          .slice(0, limite);
        if (!filas.length) return buscar ? "Ningún registro tiene ese texto (se revisaron los primeros 100)." : "Esa tabla no tiene registros.";
        return [`Registros de "${linea(tabla, 60)}" (${filas.length}):`, ...filas.map((f) => `- ${f}`)].join("\n");
      },
    }),
  ],
};

/** Con el nombre del proveedor, como lo importa el registro. */
export { adaptador as airtable };
