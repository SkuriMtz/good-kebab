import type { Adaptador, Herramienta, IdApp, Tokens } from "@/lib/nucleo-tipos";
import { argNumero, argTexto, ErrorArgs, fechaMx, linea, pedirBytes, pedirJson, rangoFechas, recortar } from "../http";
import { ErrorOAuth, postarTokens, scopesDeTexto, venceEn } from "../oauth";
import { textoDeBytes } from "../extraer";

/**
 * MICROSOFT (Graph, tenant "common": cuentas personales y de trabajo).
 * Outlook (Mail.Read), Calendario (Calendars.Read), OneDrive y Excel
 * (Files.Read) y Contactos (Contacts.Read), siempre con offline_access y
 * User.Read. Todo de solo lectura.
 * Microsoft cambia el refresh token en cada renovación: se guarda el nuevo.
 * No tiene un endpoint para revocar el permiso de una app: al desconectar se
 * borra la fila y la guía explica cómo quitar el permiso en la cuenta.
 * Tokens.extra: cuenta, scopes y apps.
 */

const BASE = "https://login.microsoftonline.com/common/oauth2/v2.0";
const GRAPH = "https://graph.microsoft.com/v1.0";

export const SCOPE_MICROSOFT: Partial<Record<IdApp, string>> = {
  outlook: "Mail.Read",
  outlook_calendar: "Calendars.Read",
  onedrive: "Files.Read",
  excel: "Files.Read",
  outlook_contacts: "Contacts.Read",
};
const SIEMPRE = ["offline_access", "User.Read"];

function cred() {
  const clientId = process.env.MICROSOFT_CLIENT_ID?.trim();
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) throw new ErrorOAuth("rechazo", "Falta configurar Microsoft en Vercel.");
  return { clientId, clientSecret };
}

/** "https://graph.microsoft.com/Mail.Read" → "mail.read" (para comparar). */
const normal = (s: string) => s.replace(/^https:\/\/graph\.microsoft\.com\//i, "").toLowerCase();

export function appsDeScopes(scopes: string[]): IdApp[] {
  const dados = new Set(scopes.map(normal));
  return (Object.keys(SCOPE_MICROSOFT) as IdApp[]).filter((a) => dados.has(normal(SCOPE_MICROSOFT[a] as string)));
}

const scopesDeApps = (apps: IdApp[]) =>
  Array.from(new Set([...SIEMPRE, ...apps.map((a) => SCOPE_MICROSOFT[a]).filter((x): x is string => Boolean(x))]));

function aTokens(d: Record<string, unknown>, previo?: Tokens): Tokens {
  if (typeof d.access_token !== "string") throw new ErrorOAuth("rechazo", "Microsoft no mandó el token.");
  const scopes = d.scope !== undefined ? scopesDeTexto(d.scope) : scopesDeTexto(previo?.extra?.scopes);
  return {
    access_token: d.access_token,
    refresh_token: typeof d.refresh_token === "string" ? d.refresh_token : previo?.refresh_token,
    expira_en: venceEn(d.expires_in),
    extra: { ...(previo?.extra ?? {}), scopes: scopes.join(" "), apps: appsDeScopes(scopes).join(",") },
  };
}

/* ---------------- Herramientas (solo lectura) ---------------- */

const tokenDe = async (ctx: { token: () => Promise<Tokens> }) => (await ctx.token()).access_token;
const ID_GRAPH = /^[A-Za-z0-9_=+\/!.-]{5,400}$/;
const sinComillas = (t: string) => t.replace(/["\\]/g, " ").trim();

type Correo = {
  id: string;
  subject?: string;
  bodyPreview?: string;
  receivedDateTime?: string;
  from?: { emailAddress?: { name?: string; address?: string } };
  toRecipients?: { emailAddress?: { name?: string; address?: string } }[];
  body?: { content?: string };
};
const quien = (e?: { name?: string; address?: string }) => (e ? linea(e.name ? `${e.name} <${e.address ?? ""}>` : e.address, 160) : "");

const outlookBuscar: Herramienta = {
  nombre: "outlook_buscar_correos",
  descripcion:
    "Busca correos en el Outlook (o Hotmail) de la persona por palabras, remitente o asunto (solo lectura; acepta from: y subject:). Sin consulta, trae los más recientes de la bandeja de entrada. Regresa id, fecha, remitente, asunto y un fragmento.",
  app: "outlook",
  agentes: ["clara"],
  esquema: {
    type: "object",
    properties: {
      consulta: { type: "string", description: 'Qué buscar, p. ej. "factura" o "from:laura".' },
      max: { type: "integer", description: "Cuántos correos traer (1 a 20, por omisión 10).", minimum: 1, maximum: 20 },
    },
    additionalProperties: false,
  },
  async ejecutar(args, ctx) {
    // Los operadores de Gmail (is:unread, newer_than:…) no existen en Outlook: se quitan
    const consulta = sinComillas(argTexto(args, "consulta", { max: 300 }).replace(/\b(is|in|label|newer_than|older_than|category|has):\S+/gi, " "));
    const max = argNumero(args, "max", { min: 1, max: 20, omision: 10 });
    const campos = "$select=id,subject,from,receivedDateTime,bodyPreview";
    const url = consulta
      ? `${GRAPH}/me/messages?$search=${encodeURIComponent(`"${consulta}"`)}&$top=${max}&${campos}`
      : `${GRAPH}/me/mailFolders/inbox/messages?$top=${max}&$orderby=${encodeURIComponent("receivedDateTime desc")}&${campos}`;
    const d = await pedirJson<{ value?: Correo[] }>(url, { token: await tokenDe(ctx), senal: ctx.senal, proveedor: "microsoft" });
    const correos = d.value ?? [];
    if (!correos.length) return consulta ? `No hay correos que coincidan con «${linea(consulta, 80)}».` : "La bandeja de entrada está vacía.";
    return correos
      .map((m) => `- id: ${m.id} · ${fechaMx(m.receivedDateTime)} · De: ${quien(m.from?.emailAddress)} · Asunto: ${linea(m.subject, 160) || "(sin asunto)"}\n  ${linea(m.bodyPreview, 300)}`)
      .join("\n");
  },
};

const outlookLeer: Herramienta = {
  nombre: "outlook_leer_correo",
  descripcion: "Lee un correo de Outlook completo por su id (de outlook_buscar_correos). Solo lectura; regresa remitente, para, asunto, fecha y el texto (máximo 4000 caracteres).",
  app: "outlook",
  agentes: ["clara"],
  esquema: { type: "object", properties: { id: { type: "string", description: "El id del correo." } }, required: ["id"], additionalProperties: false },
  async ejecutar(args, ctx) {
    const id = argTexto(args, "id", { requerido: true, max: 400, patron: ID_GRAPH });
    const m = await pedirJson<Correo>(`${GRAPH}/me/messages/${encodeURIComponent(id)}?$select=subject,from,toRecipients,receivedDateTime,body`, {
      token: await tokenDe(ctx),
      senal: ctx.senal,
      proveedor: "microsoft",
      headers: { Prefer: 'outlook.body-content-type="text"' },
    });
    return [
      `De: ${quien(m.from?.emailAddress)}`,
      `Para: ${(m.toRecipients ?? []).map((r) => quien(r.emailAddress)).join(", ")}`,
      `Asunto: ${linea(m.subject, 200) || "(sin asunto)"}`,
      `Fecha: ${fechaMx(m.receivedDateTime)}`,
      "",
      recortar(m.body?.content || "(sin texto)", 4000),
    ].join("\n");
  },
};

type Evento = { subject?: string; isAllDay?: boolean; isCancelled?: boolean; start?: { dateTime?: string }; end?: { dateTime?: string }; location?: { displayName?: string } };
/** Graph regresa la hora local (Prefer: outlook.timezone) sin desfase: se le pone el de México. */
const local = (t?: string) => (t ? `${t.replace(/\.\d+$/, "")}-06:00` : "");

const outlookAgenda: Herramienta = {
  nombre: "outlook_ver_agenda",
  descripcion:
    "Ve los eventos y citas del calendario de Outlook de la persona entre dos fechas (solo lectura). Fechas AAAA-MM-DD, hora de la Ciudad de México. Sin fechas, de hoy a 7 días; máximo dos meses.",
  app: "outlook_calendar",
  agentes: ["lola"],
  esquema: {
    type: "object",
    properties: {
      desde: { type: "string", description: "Fecha inicial AAAA-MM-DD (por omisión, hoy)." },
      hasta: { type: "string", description: "Fecha final AAAA-MM-DD (incluida)." },
    },
    additionalProperties: false,
  },
  async ejecutar(args, ctx) {
    const r = rangoFechas(argTexto(args, "desde", { max: 40 }), argTexto(args, "hasta", { max: 40 }));
    const q = `startDateTime=${encodeURIComponent(r.desde.toISOString())}&endDateTime=${encodeURIComponent(r.hasta.toISOString())}&$top=100&$orderby=${encodeURIComponent("start/dateTime")}&$select=subject,start,end,location,isAllDay,isCancelled`;
    const d = await pedirJson<{ value?: Evento[] }>(`${GRAPH}/me/calendarView?${q}`, {
      token: await tokenDe(ctx),
      senal: ctx.senal,
      proveedor: "microsoft",
      headers: { Prefer: 'outlook.timezone="America/Mexico_City"' },
    });
    const eventos = (d.value ?? []).filter((e) => !e.isCancelled);
    const titulo = `Agenda del ${fechaMx(r.desde, true)} al ${fechaMx(r.hasta, true)}:`;
    if (!eventos.length) return `${titulo} no hay eventos.`;
    return [
      titulo,
      ...eventos.map((e) => {
        const cuando = e.isAllDay ? `${fechaMx(local(e.start?.dateTime), true)} (todo el día)` : `${fechaMx(local(e.start?.dateTime))} a ${fechaMx(local(e.end?.dateTime)).split(", ").pop()}`;
        return `- ${cuando}: ${linea(e.subject, 160) || "(sin título)"}${e.location?.displayName ? ` · ${linea(e.location.displayName, 120)}` : ""}`;
      }),
    ].join("\n");
  },
};

type Item = { id: string; name?: string; size?: number; webUrl?: string; lastModifiedDateTime?: string; file?: { mimeType?: string }; folder?: unknown };
const MIME_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const onedriveBuscar: Herramienta = {
  nombre: "onedrive_buscar",
  descripcion: "Busca archivos en el OneDrive de la persona por nombre o contenido (solo lectura). Sin consulta, trae los usados recientemente. Regresa id, nombre, tipo y fecha.",
  app: "onedrive",
  agentes: ["iris"],
  esquema: { type: "object", properties: { consulta: { type: "string", description: "Palabras a buscar." } }, additionalProperties: false },
  async ejecutar(args, ctx) {
    const consulta = argTexto(args, "consulta", { max: 200 });
    const campos = "$select=id,name,file,folder,size,lastModifiedDateTime,webUrl";
    const url = consulta
      ? `${GRAPH}/me/drive/root/search(q='${encodeURIComponent(consulta.replace(/'/g, "''"))}')?$top=15&${campos}`
      : `${GRAPH}/me/drive/recent?$top=15`;
    const d = await pedirJson<{ value?: Item[] }>(url, { token: await tokenDe(ctx), senal: ctx.senal, proveedor: "microsoft" });
    const items = (d.value ?? []).filter((i) => !i.folder);
    if (!items.length) return consulta ? `No encontré archivos con «${linea(consulta, 80)}».` : "No hay archivos recientes.";
    return items.map((i) => `- id: ${i.id} · ${linea(i.name, 160)} · ${linea(i.file?.mimeType, 80)} · ${fechaMx(i.lastModifiedDateTime)}`).join("\n");
  },
};

const onedriveLeer: Herramienta = {
  nombre: "onedrive_leer",
  descripcion: "Lee un archivo de OneDrive por su id (de onedrive_buscar): Word, PDF o texto. Para hojas de Excel usa excel_leer_hoja. Solo lectura; máximo 4000 caracteres.",
  app: "onedrive",
  agentes: ["iris"],
  esquema: { type: "object", properties: { id: { type: "string", description: "El id del archivo." } }, required: ["id"], additionalProperties: false },
  async ejecutar(args, ctx) {
    const id = argTexto(args, "id", { requerido: true, max: 400, patron: ID_GRAPH });
    const p = { token: await tokenDe(ctx), senal: ctx.senal, proveedor: "microsoft" as const };
    const i = await pedirJson<Item>(`${GRAPH}/me/drive/items/${encodeURIComponent(id)}?$select=id,name,file,size,webUrl`, p);
    const mime = i.file?.mimeType ?? "";
    if (!i.file) throw new ErrorArgs("Eso es una carpeta, no un archivo.");
    if (mime === MIME_XLSX) throw new ErrorArgs("Es una hoja de Excel: léela con excel_leer_hoja.");
    const { bytes } = await pedirBytes(`${GRAPH}/me/drive/items/${encodeURIComponent(id)}/content`, p);
    const texto = await textoDeBytes(bytes, mime, i.name ?? "");
    return `Archivo: ${linea(i.name, 200)} (${mime})\n\n${recortar(texto || "(sin texto)", 4000)}`;
  },
};

const excelLeer: Herramienta = {
  nombre: "excel_leer_hoja",
  descripcion:
    "Lee una hoja de un archivo de Excel guardado en OneDrive (solo lectura). Recibe el id del archivo (de onedrive_buscar), y opcional el nombre de la hoja y un rango (p. ej. \"A1:F50\"). Sin rango, lee lo usado de la hoja (hasta 200 filas) y dice qué hojas hay.",
  app: "excel",
  agentes: ["iris"],
  esquema: {
    type: "object",
    properties: {
      id: { type: "string", description: "El id del archivo de Excel en OneDrive." },
      hoja: { type: "string", description: "Nombre de la hoja (por omisión, la primera)." },
      rango: { type: "string", description: 'Rango opcional, p. ej. "A1:D100".' },
    },
    required: ["id"],
    additionalProperties: false,
  },
  async ejecutar(args, ctx) {
    const id = argTexto(args, "id", { requerido: true, max: 400, patron: ID_GRAPH });
    const rango = argTexto(args, "rango", { max: 40, patron: /^[A-Za-z]{1,3}\d{1,7}(:[A-Za-z]{1,3}\d{1,7})?$/ });
    const p = { token: await tokenDe(ctx), senal: ctx.senal, proveedor: "microsoft" as const };
    const base = `${GRAPH}/me/drive/items/${encodeURIComponent(id)}/workbook/worksheets`;
    const hojas = await pedirJson<{ value?: { name?: string }[] }>(`${base}?$select=name`, p);
    const nombres = (hojas.value ?? []).map((h) => h.name ?? "").filter(Boolean);
    const hoja = argTexto(args, "hoja", { max: 100 }) || nombres[0];
    if (!hoja) return "El archivo no tiene hojas.";
    const ruta = `${base}/${encodeURIComponent(hoja)}`;
    const v = await pedirJson<{ address?: string; values?: unknown[][] }>(
      rango ? `${ruta}/range(address='${rango}')?$select=address,values` : `${ruta}/usedRange(valuesOnly=true)?$select=address,values`,
      p,
    );
    const filas = (v.values ?? []).slice(0, 200).map((f) => f.map((c) => linea(c, 120)).join(" | "));
    return [`Hojas: ${nombres.map((n) => linea(n, 60)).join(", ")}`, `Rango: ${linea(v.address, 120)}`, "", filas.length ? recortar(filas.join("\n"), 6000) : "(sin datos)"].join("\n");
  },
};

type Contacto = { displayName?: string; emailAddresses?: { address?: string }[]; mobilePhone?: string; businessPhones?: string[]; companyName?: string };
const contactosBuscar: Herramienta = {
  nombre: "outlook_contactos_buscar",
  descripcion: "Busca en los contactos de Outlook de la persona por nombre (solo lectura). Sin consulta, trae los primeros por orden alfabético.",
  app: "outlook_contacts",
  agentes: ["victor", "lola"],
  esquema: { type: "object", properties: { consulta: { type: "string", description: "Nombre o apellido." } }, additionalProperties: false },
  async ejecutar(args, ctx) {
    const consulta = argTexto(args, "consulta", { max: 120 }).replace(/'/g, "''");
    const campos = "$select=displayName,emailAddresses,mobilePhone,businessPhones,companyName&$top=20";
    const filtro = consulta
      ? `&$filter=${encodeURIComponent(`startswith(displayName,'${consulta}') or startswith(givenName,'${consulta}') or startswith(surname,'${consulta}')`)}`
      : `&$orderby=displayName`;
    const d = await pedirJson<{ value?: Contacto[] }>(`${GRAPH}/me/contacts?${campos}${filtro}`, { token: await tokenDe(ctx), senal: ctx.senal, proveedor: "microsoft" });
    const lista = d.value ?? [];
    if (!lista.length) return consulta ? "No hay contactos con ese nombre." : "No hay contactos.";
    return lista
      .map((c) => {
        const datos = [...(c.emailAddresses ?? []).map((e) => linea(e.address, 120)), linea(c.mobilePhone, 40), ...(c.businessPhones ?? []).map((t) => linea(t, 40)), linea(c.companyName, 80)].filter(Boolean);
        return `- ${linea(c.displayName, 120) || "(sin nombre)"}${datos.length ? ` · ${datos.join(" · ")}` : ""}`;
      })
      .join("\n");
  },
};

/* ---------------- El adaptador ---------------- */

export const microsoft: Adaptador = {
  proveedor: "microsoft",
  autenticacion: "oauth",
  variables: ["MICROSOFT_CLIENT_ID", "MICROSOFT_CLIENT_SECRET"],
  urlAutorizacion({ state, redirectUri, apps, codeChallenge }) {
    const q = new URLSearchParams({
      client_id: cred().clientId,
      response_type: "code",
      redirect_uri: redirectUri,
      response_mode: "query",
      scope: scopesDeApps(apps).join(" "),
      state,
      prompt: "select_account",
    });
    if (codeChallenge) {
      q.set("code_challenge", codeChallenge);
      q.set("code_challenge_method", "S256");
    }
    return `${BASE}/authorize?${q}`;
  },
  async intercambiar({ code, redirectUri, codeVerifier }) {
    const c = cred();
    const d = await postarTokens(`${BASE}/token`, {
      client_id: c.clientId,
      client_secret: c.clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      ...(codeVerifier ? { code_verifier: codeVerifier } : {}),
    });
    return aTokens(d);
  },
  async renovar(t) {
    if (!t.refresh_token) throw new ErrorOAuth("invalid_grant", "Sin refresh token.");
    const c = cred();
    const scopes = scopesDeTexto(t.extra?.scopes);
    const d = await postarTokens(`${BASE}/token`, {
      client_id: c.clientId,
      client_secret: c.clientSecret,
      grant_type: "refresh_token",
      refresh_token: t.refresh_token,
      scope: Array.from(new Set([...SIEMPRE, ...scopes.filter((s) => !/^(openid|profile|email)$/i.test(s))])).join(" "),
    });
    return aTokens(d, t);
  },
  async cuenta(t) {
    if (t.extra?.cuenta) return t.extra.cuenta;
    try {
      const r = await fetch(`${GRAPH}/me?$select=mail,userPrincipalName,displayName`, {
        headers: { Authorization: `Bearer ${t.access_token}` },
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      });
      if (r.ok) {
        const u = (await r.json()) as { mail?: string | null; userPrincipalName?: string | null; displayName?: string | null };
        return u.mail || u.userPrincipalName || u.displayName || "Cuenta de Microsoft";
      }
    } catch {
      /* sin la cuenta también se conecta */
    }
    return "Cuenta de Microsoft";
  },
  herramientas: [outlookBuscar, outlookLeer, outlookAgenda, onedriveBuscar, onedriveLeer, excelLeer, contactosBuscar],
};
