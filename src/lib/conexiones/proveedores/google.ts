import type { Adaptador, Herramienta, IdApp, Tokens } from "@/lib/nucleo-tipos";
import { argNumero, argTexto, ErrorArgs, fechaMx, linea, pedirBytes, pedirJson, pedirTexto, rangoFechas, recortar, sinHtml } from "../http";
import { ErrorOAuth, postarTokens, scopesDeTexto, venceEn } from "../oauth";
import { textoDeBytes } from "../extraer";

/**
 * GOOGLE: un solo cliente OAuth para Gmail, Calendar, Drive, Sheets,
 * Contactos y Perfil de Negocio. Los permisos se piden por partes
 * (include_granted_scopes) y SIEMPRE de solo lectura, salvo business.manage,
 * que Google solo ofrece así (aquí solo se usa para leer reseñas).
 * Tokens.extra: cuenta (correo), scopes (separados por espacio) y apps
 * (las que cubren esos scopes, separadas por coma).
 */

const G = "https://www.googleapis.com/auth/";
export const SCOPE_GOOGLE: Partial<Record<IdApp, string>> = {
  gmail: `${G}gmail.readonly`,
  google_calendar: `${G}calendar.readonly`,
  google_drive: `${G}drive.file`,
  google_sheets: `${G}spreadsheets.readonly`,
  google_contacts: `${G}contacts.readonly`,
  google_business: `${G}business.manage`,
  google_forms: `${G}forms.responses.readonly`,
};
/** Scopes que además pide una app (no cuentan para saber si se concedió). Forms: los títulos de las preguntas. */
const SCOPES_EXTRA_GOOGLE: Partial<Record<IdApp, string[]>> = { google_forms: [`${G}forms.body.readonly`] };
export const SCOPE_DRIVE_FILE = `${G}drive.file`;
const IDENTIDAD = ["openid", "email"];

const AUTORIZAR = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN = "https://oauth2.googleapis.com/token";
const REVOCAR = "https://oauth2.googleapis.com/revoke";
const USUARIO = "https://openidconnect.googleapis.com/v1/userinfo";

function cred() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) throw new ErrorOAuth("rechazo", "Falta configurar Google en Vercel.");
  return { clientId, clientSecret };
}

/** Las apps que cubren estos scopes. */
export function appsDeScopes(scopes: string[]): IdApp[] {
  const dados = new Set(scopes);
  return (Object.keys(SCOPE_GOOGLE) as IdApp[]).filter((a) => dados.has(SCOPE_GOOGLE[a] as string));
}

/** El correo del id_token (llega directo de Google por TLS en el intercambio). */
function correoDeIdToken(idToken: unknown): string | null {
  if (typeof idToken !== "string") return null;
  try {
    const carga = JSON.parse(Buffer.from(idToken.split(".")[1] ?? "", "base64url").toString("utf8")) as { email?: unknown };
    return typeof carga.email === "string" ? carga.email : null;
  } catch {
    return null;
  }
}

function aTokens(d: Record<string, unknown>, previo?: Tokens): Tokens {
  if (typeof d.access_token !== "string") throw new ErrorOAuth("rechazo", "Google no mandó el token.");
  const scopes = d.scope !== undefined ? scopesDeTexto(d.scope) : scopesDeTexto(previo?.extra?.scopes);
  const cuenta = correoDeIdToken(d.id_token) ?? previo?.extra?.cuenta;
  return {
    access_token: d.access_token,
    // Google no cambia el refresh token al renovar
    refresh_token: typeof d.refresh_token === "string" ? d.refresh_token : previo?.refresh_token,
    expira_en: venceEn(d.expires_in),
    extra: { scopes: scopes.join(" "), apps: appsDeScopes(scopes).join(","), ...(cuenta ? { cuenta } : {}) },
  };
}

/**
 * Para el Picker de Drive: un access token nuevo SOLO con drive.file (se
 * renueva pidiendo menos permisos). Si Google regresa más permisos que
 * drive.file, no se entrega.
 */
export async function tokenSoloDriveFile(t: Tokens): Promise<{ access_token: string; expira_en?: number }> {
  if (!t.refresh_token) throw new ErrorOAuth("invalid_grant", "Sin refresh token.");
  const c = cred();
  const d = await postarTokens(TOKEN, {
    grant_type: "refresh_token",
    refresh_token: t.refresh_token,
    client_id: c.clientId,
    client_secret: c.clientSecret,
    scope: SCOPE_DRIVE_FILE,
  });
  if (typeof d.access_token !== "string") throw new ErrorOAuth("rechazo", "Google no mandó el token.");
  const scopes = scopesDeTexto(d.scope);
  const extra = scopes.filter((s) => s !== SCOPE_DRIVE_FILE && !["openid", "email", `${G}userinfo.email`, "profile", `${G}userinfo.profile`].includes(s));
  if (!scopes.includes(SCOPE_DRIVE_FILE) || extra.length) throw new ErrorOAuth("rechazo", "Google no dio un permiso limitado a drive.file.");
  return { access_token: d.access_token, expira_en: venceEn(d.expires_in) };
}

/* ---------------- Herramientas (solo lectura) ---------------- */

const GMAIL = "https://gmail.googleapis.com/gmail/v1/users/me";
const ID_GMAIL = /^[A-Za-z0-9_-]{6,64}$/;
const ID_DRIVE = /^[A-Za-z0-9_-]{10,200}$/;

type Cabecera = { name?: string; value?: string };
type Parte = { mimeType?: string; body?: { data?: string }; parts?: Parte[]; headers?: Cabecera[] };
type MensajeGmail = { id: string; snippet?: string; internalDate?: string; payload?: Parte };

const cabecera = (p: Parte | undefined, nombre: string) => p?.headers?.find((h) => h.name?.toLowerCase() === nombre.toLowerCase())?.value ?? "";
const b64 = (data?: string) => (data ? Buffer.from(data, "base64url").toString("utf8") : "");

/** El texto de un correo: la parte text/plain; si no hay, la HTML sin etiquetas. */
function cuerpoGmail(p: Parte | undefined): string {
  if (!p) return "";
  const buscar = (x: Parte, tipo: string): string | null => {
    if (x.mimeType === tipo && x.body?.data) return b64(x.body.data);
    for (const h of x.parts ?? []) {
      const r = buscar(h, tipo);
      if (r) return r;
    }
    return null;
  };
  const plano = buscar(p, "text/plain");
  if (plano) return plano;
  const html = buscar(p, "text/html");
  return html ? sinHtml(html) : b64(p.body?.data);
}

const tokenDe = async (ctx: { token: () => Promise<Tokens> }) => (await ctx.token()).access_token;

const gmailBuscar: Herramienta = {
  nombre: "gmail_buscar_correos",
  descripcion:
    "Busca correos en el Gmail de la persona (solo lectura). Acepta la sintaxis de búsqueda de Gmail (from:, subject:, is:unread, newer_than:7d). Sin consulta, trae los más recientes de la bandeja de entrada. Regresa id, fecha, remitente, asunto y un fragmento de cada uno.",
  app: "gmail",
  agentes: ["clara"],
  esquema: {
    type: "object",
    properties: {
      consulta: { type: "string", description: 'Qué buscar, p. ej. "factura is:unread" o "from:laura newer_than:3d".' },
      max: { type: "integer", description: "Cuántos correos traer (1 a 20, por omisión 10).", minimum: 1, maximum: 20 },
    },
    additionalProperties: false,
  },
  async ejecutar(args, ctx) {
    const consulta = argTexto(args, "consulta", { max: 300 });
    const max = argNumero(args, "max", { min: 1, max: 20, omision: 10 });
    const p = { token: await tokenDe(ctx), senal: ctx.senal, proveedor: "google" as const };
    const q = new URLSearchParams({ q: consulta || "in:inbox", maxResults: String(max) });
    const lista = await pedirJson<{ messages?: { id: string }[] }>(`${GMAIL}/messages?${q}`, p);
    const ids = (lista.messages ?? []).slice(0, max).map((m) => m.id).filter((id) => ID_GMAIL.test(id));
    if (!ids.length) return consulta ? `No hay correos que coincidan con «${linea(consulta, 80)}».` : "La bandeja de entrada está vacía.";
    const meta = "format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date";
    const correos = await Promise.all(ids.map((id) => pedirJson<MensajeGmail>(`${GMAIL}/messages/${id}?${meta}`, p)));
    return correos
      .map((m) => {
        const fecha = fechaMx(Number(m.internalDate)) || linea(cabecera(m.payload, "Date"), 60);
        return `- id: ${m.id} · ${fecha} · De: ${linea(cabecera(m.payload, "From"), 120)} · Asunto: ${linea(cabecera(m.payload, "Subject"), 160) || "(sin asunto)"}\n  ${linea(m.snippet, 300)}`;
      })
      .join("\n");
  },
};

const gmailLeer: Herramienta = {
  nombre: "gmail_leer_correo",
  descripcion: "Lee un correo de Gmail completo por su id (el que dio gmail_buscar_correos). Solo lectura. Regresa remitente, para, asunto, fecha y el texto (máximo 4000 caracteres).",
  app: "gmail",
  agentes: ["clara"],
  esquema: {
    type: "object",
    properties: { id: { type: "string", description: "El id del correo." } },
    required: ["id"],
    additionalProperties: false,
  },
  async ejecutar(args, ctx) {
    const id = argTexto(args, "id", { requerido: true, max: 64, patron: ID_GMAIL });
    const p = { token: await tokenDe(ctx), senal: ctx.senal, proveedor: "google" as const };
    const m = await pedirJson<MensajeGmail>(`${GMAIL}/messages/${id}?format=full`, p);
    return [
      `De: ${linea(cabecera(m.payload, "From"), 200)}`,
      `Para: ${linea(cabecera(m.payload, "To"), 300)}`,
      `Asunto: ${linea(cabecera(m.payload, "Subject"), 200) || "(sin asunto)"}`,
      `Fecha: ${fechaMx(Number(m.internalDate)) || linea(cabecera(m.payload, "Date"), 60)}`,
      "",
      recortar(cuerpoGmail(m.payload) || m.snippet || "(sin texto)", 4000),
    ].join("\n");
  },
};

type EventoG = { summary?: string; status?: string; location?: string; start?: { dateTime?: string; date?: string }; end?: { dateTime?: string; date?: string } };

const verAgenda: Herramienta = {
  nombre: "google_calendar_ver_agenda",
  descripcion:
    "Ve los eventos y citas del Google Calendar principal de la persona entre dos fechas (solo lectura). Fechas AAAA-MM-DD, hora de la Ciudad de México. Sin fechas, trae de hoy a 7 días; máximo dos meses.",
  app: "google_calendar",
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
    const q = new URLSearchParams({
      timeMin: r.desde.toISOString(),
      timeMax: r.hasta.toISOString(),
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "100",
      timeZone: "America/Mexico_City",
    });
    const d = await pedirJson<{ items?: EventoG[] }>(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${q}`, {
      token: await tokenDe(ctx),
      senal: ctx.senal,
      proveedor: "google",
    });
    const eventos = (d.items ?? []).filter((e) => e.status !== "cancelled");
    const titulo = `Agenda del ${fechaMx(r.desde, true)} al ${fechaMx(r.hasta, true)}:`;
    if (!eventos.length) return `${titulo} no hay eventos.`;
    return [
      titulo,
      ...eventos.map((e) => {
        const todoElDia = !e.start?.dateTime;
        const cuando = todoElDia ? `${fechaMx(`${e.start?.date}T12:00:00-06:00`, true)} (todo el día)` : `${fechaMx(e.start?.dateTime)} a ${fechaMx(e.end?.dateTime).split(", ").pop()}`;
        return `- ${cuando}: ${linea(e.summary, 160) || "(sin título)"}${e.location ? ` · ${linea(e.location, 120)}` : ""}`;
      }),
    ].join("\n");
  },
};

type ArchivoDrive = { id: string; name?: string; mimeType?: string; modifiedTime?: string; webViewLink?: string; size?: string };
const DRIVE = "https://www.googleapis.com/drive/v3/files";
const EXPORTAR: Record<string, string> = {
  "application/vnd.google-apps.document": "text/plain",
  "application/vnd.google-apps.presentation": "text/plain",
  "application/vnd.google-apps.spreadsheet": "text/csv",
};
const escaparQ = (t: string) => t.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

const driveBuscar: Herramienta = {
  nombre: "drive_buscar",
  descripcion:
    "Busca entre los archivos de Google Drive que la persona eligió compartir con Atendel (solo esos: el permiso es drive.file). Busca por nombre y contenido. Sin consulta, trae los más recientes. Regresa id, nombre, tipo y fecha.",
  app: "google_drive",
  agentes: ["iris"],
  esquema: {
    type: "object",
    properties: { consulta: { type: "string", description: "Palabras a buscar en el nombre o el contenido." } },
    additionalProperties: false,
  },
  async ejecutar(args, ctx) {
    const consulta = argTexto(args, "consulta", { max: 200 });
    const filtro = consulta ? `trashed = false and (name contains '${escaparQ(consulta)}' or fullText contains '${escaparQ(consulta)}')` : "trashed = false";
    const q = new URLSearchParams({ q: filtro, pageSize: "15", fields: "files(id,name,mimeType,modifiedTime,webViewLink)" });
    if (!consulta) q.set("orderBy", "modifiedTime desc");
    const d = await pedirJson<{ files?: ArchivoDrive[] }>(`${DRIVE}?${q}`, { token: await tokenDe(ctx), senal: ctx.senal, proveedor: "google" });
    const archivos = d.files ?? [];
    if (!archivos.length) {
      return "No encontré archivos. Con este permiso solo se ven los que la persona eligió con «Elegir de Drive» en Tu negocio → Documentos; si falta alguno, que lo elija ahí.";
    }
    return archivos.map((a) => `- id: ${a.id} · ${linea(a.name, 160)} · ${linea(a.mimeType, 80)} · ${fechaMx(a.modifiedTime)}`).join("\n");
  },
};

/** Lee un archivo de Drive a texto (Docs, Hojas y Presentaciones se exportan; PDF/Word/texto se descargan). */
export async function leerArchivoDrive(id: string, token: string, senal: AbortSignal): Promise<{ nombre: string; texto: string; url: string | null; mime: string }> {
  const p = { token, senal, proveedor: "google" as const };
  const a = await pedirJson<ArchivoDrive>(`${DRIVE}/${id}?fields=id,name,mimeType,size,webViewLink`, p);
  const mime = a.mimeType ?? "";
  const nombre = a.name ?? "Archivo de Drive";
  let texto: string;
  if (EXPORTAR[mime]) texto = await pedirTexto(`${DRIVE}/${id}/export?mimeType=${encodeURIComponent(EXPORTAR[mime])}`, p);
  else if (mime.startsWith("application/vnd.google-apps.")) throw new ErrorArgs("Ese tipo de archivo de Google no se puede leer como texto.");
  else {
    const { bytes } = await pedirBytes(`${DRIVE}/${id}?alt=media`, p);
    texto = await textoDeBytes(bytes, mime, nombre);
  }
  return { nombre, texto, url: a.webViewLink ?? null, mime };
}

const driveLeer: Herramienta = {
  nombre: "drive_leer_archivo",
  descripcion: "Lee un archivo de Google Drive por su id (de drive_buscar): Google Docs, Hojas, Presentaciones, PDF, Word o texto. Solo lectura; regresa máximo 4000 caracteres.",
  app: "google_drive",
  agentes: ["iris"],
  esquema: { type: "object", properties: { id: { type: "string", description: "El id del archivo." } }, required: ["id"], additionalProperties: false },
  async ejecutar(args, ctx) {
    const id = argTexto(args, "id", { requerido: true, max: 200, patron: ID_DRIVE });
    const r = await leerArchivoDrive(id, await tokenDe(ctx), ctx.senal);
    return `Archivo: ${linea(r.nombre, 200)} (${r.mime})\n\n${recortar(r.texto || "(sin texto)", 4000)}`;
  },
};

/** Acepta el id o el link completo de la hoja. */
const idDeHoja = (t: string) => t.match(/\/spreadsheets\/d\/([A-Za-z0-9_-]{10,200})/)?.[1] ?? t;

const leerHoja: Herramienta = {
  nombre: "sheets_leer_hoja",
  descripcion:
    "Lee valores de una hoja de Google Sheets (solo lectura). Recibe el id o el link de la hoja y, opcional, un rango en notación A1 (p. ej. \"Ventas!A1:F50\"). Sin rango, lee las primeras 200 filas de la primera pestaña y dice qué pestañas hay.",
  app: "google_sheets",
  agentes: ["iris"],
  esquema: {
    type: "object",
    properties: {
      spreadsheetId: { type: "string", description: "El id o el link de la hoja de cálculo." },
      rango: { type: "string", description: 'Rango A1 opcional, p. ej. "Hoja1!A1:D100".' },
    },
    required: ["spreadsheetId"],
    additionalProperties: false,
  },
  async ejecutar(args, ctx) {
    const id = idDeHoja(argTexto(args, "spreadsheetId", { requerido: true, max: 400 }));
    if (!ID_DRIVE.test(id)) throw new ErrorArgs('"spreadsheetId" no parece el id ni el link de una hoja de Google.');
    let rango = argTexto(args, "rango", { max: 200 });
    const p = { token: await tokenDe(ctx), senal: ctx.senal, proveedor: "google" as const };
    const base = `https://sheets.googleapis.com/v4/spreadsheets/${id}`;
    const info = await pedirJson<{ properties?: { title?: string }; sheets?: { properties?: { title?: string } }[] }>(
      `${base}?fields=properties.title,sheets.properties.title`,
      p,
    );
    const pestanas = (info.sheets ?? []).map((s) => s.properties?.title ?? "").filter(Boolean);
    if (!rango) rango = `'${(pestanas[0] ?? "Sheet1").replace(/'/g, "''")}'!A1:Z200`;
    const v = await pedirJson<{ range?: string; values?: unknown[][] }>(`${base}/values/${encodeURIComponent(rango)}?valueRenderOption=FORMATTED_VALUE`, p);
    const filas = (v.values ?? []).slice(0, 200).map((f) => f.map((c) => linea(c, 120)).join(" | "));
    return [
      `Hoja: ${linea(info.properties?.title, 200)} · Pestañas: ${pestanas.map((t) => linea(t, 60)).join(", ")}`,
      `Rango: ${linea(v.range ?? rango, 120)}`,
      "",
      filas.length ? recortar(filas.join("\n"), 6000) : "(sin datos en ese rango)",
    ].join("\n");
  },
};

/* ---------------- Google Forms (forms.responses.readonly + forms.body.readonly) ---------------- */

type Pregunta = { title?: string; questionItem?: { question?: { questionId?: string } }; questionGroupItem?: { questions?: { questionId?: string; rowQuestion?: { title?: string } }[] } };
type RespuestaForm = { createTime?: string; lastSubmittedTime?: string; respondentEmail?: string; answers?: Record<string, { questionId?: string; textAnswers?: { answers?: { value?: string }[] } }> };

/** Acepta el id o el link del formulario (…/forms/d/<id>/edit). Los links /forms/d/e/… son de "responder" y no sirven. */
const idDeForm = (v: string) => (v.match(/\/forms\/d\/(?!e\/)([A-Za-z0-9_-]{20,})/)?.[1] ?? v).trim();

const formsRespuestas: Herramienta = {
  nombre: "google_forms_respuestas",
  descripcion:
    "Lee las respuestas más recientes de un formulario de Google Forms, con cada pregunta y lo que contestaron (solo lectura). Recibe el id o el link de edición del formulario (el que termina en /edit).",
  app: "google_forms",
  agentes: ["victor"],
  esquema: {
    type: "object",
    properties: {
      formulario: { type: "string", description: "El id o el link de edición del formulario (docs.google.com/forms/d/<id>/edit)." },
      limite: { type: "integer", minimum: 1, maximum: 25, description: "Cuántas respuestas (de la más reciente). Por defecto 10." },
    },
    required: ["formulario"],
    additionalProperties: false,
  },
  async ejecutar(args, ctx) {
    const id = idDeForm(argTexto(args, "formulario", { requerido: true, max: 400 }));
    if (!/^[A-Za-z0-9_-]{20,}$/.test(id))
      throw new ErrorArgs('"formulario" no parece el id ni el link de edición de un Google Form (el link de responder, /forms/d/e/…, no sirve).');
    const limite = argNumero(args, "limite", { min: 1, max: 25, omision: 10 });
    const p = { token: await tokenDe(ctx), senal: ctx.senal, proveedor: "google" as const };
    const base = `https://forms.googleapis.com/v1/forms/${id}`;
    const [form, r] = await Promise.all([
      pedirJson<{ info?: { title?: string; documentTitle?: string }; items?: Pregunta[] }>(base, p).catch(() => null),
      pedirJson<{ responses?: RespuestaForm[] }>(`${base}/responses`, p),
    ]);
    const titulos = new Map<string, string>();
    for (const it of form?.items ?? []) {
      const q = it.questionItem?.question?.questionId;
      if (q) titulos.set(q, linea(it.title, 80));
      for (const g of it.questionGroupItem?.questions ?? []) if (g.questionId) titulos.set(g.questionId, linea(`${it.title ?? ""} ${g.rowQuestion?.title ?? ""}`, 80));
    }
    const lista = [...(r.responses ?? [])].sort((a, b) => (b.lastSubmittedTime ?? "").localeCompare(a.lastSubmittedTime ?? "")).slice(0, limite);
    const nombre = linea(form?.info?.title ?? form?.info?.documentTitle ?? "el formulario", 100);
    if (!lista.length) return `"${nombre}" no tiene respuestas todavía.`;
    return recortar(
      [
        `Respuestas de "${nombre}" (${lista.length} de ${r.responses?.length ?? lista.length}, de la más reciente):`,
        ...lista.map((x) =>
          [
            `• ${[fechaMx(x.lastSubmittedTime ?? x.createTime), x.respondentEmail].filter(Boolean).join(" · ") || "sin fecha"}`,
            ...Object.values(x.answers ?? {}).map(
              (a) => `  - ${titulos.get(a.questionId ?? "") || "Pregunta"}: ${linea((a.textAnswers?.answers ?? []).map((v) => v.value).filter(Boolean).join(", "), 300) || "(archivo o sin texto)"}`,
            ),
          ].join("\n"),
        ),
      ].join("\n"),
    );
  },
};

type Persona = { names?: { displayName?: string }[]; emailAddresses?: { value?: string }[]; phoneNumbers?: { value?: string }[]; organizations?: { name?: string }[] };
const PEOPLE = "https://people.googleapis.com/v1";
const contactosBuscar: Herramienta = {
  nombre: "google_contactos_buscar",
  descripcion: "Busca en los contactos de Google de la persona por nombre, correo o teléfono (solo lectura). Sin consulta, trae los modificados más recientemente.",
  app: "google_contacts",
  agentes: ["victor", "lola"],
  esquema: { type: "object", properties: { consulta: { type: "string", description: "Nombre, correo o teléfono." } }, additionalProperties: false },
  async ejecutar(args, ctx) {
    const consulta = argTexto(args, "consulta", { max: 120 });
    const p = { token: await tokenDe(ctx), senal: ctx.senal, proveedor: "google" as const };
    const campos = "names,emailAddresses,phoneNumbers,organizations";
    let personas: Persona[];
    if (consulta) {
      // Google pide una búsqueda vacía antes para preparar su índice
      await pedirJson(`${PEOPLE}/people:searchContacts?query=&readMask=names`, p).catch(() => null);
      const d = await pedirJson<{ results?: { person?: Persona }[] }>(`${PEOPLE}/people:searchContacts?${new URLSearchParams({ query: consulta, readMask: campos, pageSize: "15" })}`, p);
      personas = (d.results ?? []).map((r) => r.person ?? {});
    } else {
      const d = await pedirJson<{ connections?: Persona[] }>(`${PEOPLE}/people/me/connections?personFields=${campos}&pageSize=25&sortOrder=LAST_MODIFIED_DESCENDING`, p);
      personas = d.connections ?? [];
    }
    if (!personas.length) return consulta ? `No hay contactos que coincidan con «${linea(consulta, 80)}».` : "No hay contactos.";
    return personas
      .map((x) => {
        const datos = [
          ...(x.emailAddresses ?? []).map((e) => linea(e.value, 120)),
          ...(x.phoneNumbers ?? []).map((t) => linea(t.value, 40)),
          ...(x.organizations ?? []).map((o) => linea(o.name, 80)),
        ].filter(Boolean);
        return `- ${linea(x.names?.[0]?.displayName, 120) || "(sin nombre)"}${datos.length ? ` · ${datos.join(" · ")}` : ""}`;
      })
      .join("\n");
  },
};

type Resena = { reviewer?: { displayName?: string }; starRating?: string; comment?: string; createTime?: string; reviewReply?: { comment?: string } };
const ESTRELLAS: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };
const resenas: Herramienta = {
  nombre: "google_business_resenas",
  descripcion: "Lee las reseñas recientes de los negocios de la persona en Google (Perfil de Negocio), con estrellas, comentario y si ya tienen respuesta. Solo lectura.",
  app: "google_business",
  agentes: ["victor"],
  esquema: {
    type: "object",
    properties: { max: { type: "integer", description: "Reseñas por negocio (1 a 50, por omisión 20).", minimum: 1, maximum: 50 } },
    additionalProperties: false,
  },
  async ejecutar(args, ctx) {
    const max = argNumero(args, "max", { min: 1, max: 50, omision: 20 });
    const p = { token: await tokenDe(ctx), senal: ctx.senal, proveedor: "google" as const };
    const cuentas = await pedirJson<{ accounts?: { name?: string }[] }>("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", p);
    const cuenta = cuentas.accounts?.[0]?.name;
    if (!cuenta || !/^accounts\/\d+$/.test(cuenta)) return "La cuenta de Google no tiene negocios en Perfil de Negocio.";
    const locs = await pedirJson<{ locations?: { name?: string; title?: string }[] }>(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${cuenta}/locations?readMask=name,title&pageSize=5`,
      p,
    );
    const partes: string[] = [];
    for (const l of (locs.locations ?? []).filter((x) => /^locations\/\d+$/.test(x.name ?? ""))) {
      const r = await pedirJson<{ reviews?: Resena[]; averageRating?: number; totalReviewCount?: number }>(
        `https://mybusiness.googleapis.com/v4/${cuenta}/${l.name}/reviews?pageSize=${max}&orderBy=${encodeURIComponent("updateTime desc")}`,
        p,
      );
      partes.push(
        [
          `${linea(l.title, 120)} · promedio ${r.averageRating ?? "?"} de 5 · ${r.totalReviewCount ?? 0} reseñas`,
          ...(r.reviews ?? []).map(
            (x) =>
              `- ${ESTRELLAS[x.starRating ?? ""] ?? "?"}★ · ${fechaMx(x.createTime, true)} · ${linea(x.reviewer?.displayName, 80)}: ${linea(x.comment, 400) || "(sin comentario)"}${x.reviewReply?.comment ? " · Ya tiene respuesta." : " · Sin respuesta."}`,
          ),
        ].join("\n"),
      );
    }
    return partes.length ? partes.join("\n\n") : "No encontré negocios en el Perfil de Negocio de esta cuenta.";
  },
};

/* ---------------- El adaptador ---------------- */

export const google: Adaptador = {
  proveedor: "google",
  autenticacion: "oauth",
  variables: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
  requiereAprobacion:
    "Mientras Google no verifique la app, solo se conectan los usuarios de prueba que agregues (hasta 100). Gmail es un permiso restringido: abrirlo a todos pide verificación y una revisión de seguridad. Perfil de Negocio además pide que Google apruebe el acceso a su API.",
  urlAutorizacion({ state, redirectUri, apps, codeChallenge }) {
    const scopes = Array.from(
      new Set([...IDENTIDAD, ...apps.flatMap((a) => [SCOPE_GOOGLE[a], ...(SCOPES_EXTRA_GOOGLE[a] ?? [])]).filter((x): x is string => Boolean(x))]),
    );
    const q = new URLSearchParams({
      client_id: cred().clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: scopes.join(" "),
      access_type: "offline",
      prompt: "consent",
      include_granted_scopes: "true",
      state,
    });
    if (codeChallenge) {
      q.set("code_challenge", codeChallenge);
      q.set("code_challenge_method", "S256");
    }
    return `${AUTORIZAR}?${q}`;
  },
  async intercambiar({ code, redirectUri, codeVerifier }) {
    const c = cred();
    const d = await postarTokens(TOKEN, {
      code,
      client_id: c.clientId,
      client_secret: c.clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      ...(codeVerifier ? { code_verifier: codeVerifier } : {}),
    });
    return aTokens(d);
  },
  async renovar(t) {
    if (!t.refresh_token) throw new ErrorOAuth("invalid_grant", "Sin refresh token.");
    const c = cred();
    const d = await postarTokens(TOKEN, { grant_type: "refresh_token", refresh_token: t.refresh_token, client_id: c.clientId, client_secret: c.clientSecret });
    return aTokens(d, t);
  },
  async revocar(t) {
    await fetch(REVOCAR, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token: t.refresh_token ?? t.access_token }).toString(),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  },
  async cuenta(t) {
    if (t.extra?.cuenta) return t.extra.cuenta;
    const r = await fetch(USUARIO, { headers: { Authorization: `Bearer ${t.access_token}` }, cache: "no-store", signal: AbortSignal.timeout(10_000) }).catch(() => null);
    const u = r?.ok ? ((await r.json().catch(() => ({}))) as { email?: unknown }) : {};
    return typeof u.email === "string" ? u.email : "Cuenta de Google";
  },
  herramientas: [gmailBuscar, gmailLeer, verAgenda, driveBuscar, driveLeer, leerHoja, contactosBuscar, resenas, formsRespuestas],
};
