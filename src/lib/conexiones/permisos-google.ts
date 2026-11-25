import type { IdApp } from "@/lib/nucleo-tipos";

/**
 * Los permisos de Google, por app, pedidos POR PARTES (como recomienda Google):
 * - Al conectar una app solo se pide LEER (lo mínimo para que tu equipo trabaje).
 * - El permiso de HACER cosas (mandar correos, crear o mover citas, crear tareas)
 *   se pide la primera vez que Atendel lo necesita: aparece «Dar permiso» y se
 *   abre Google solo con ese permiso (include_granted_scopes conserva los demás).
 * Para saber si una app quedó conectada o si ya puede escribir, también cuentan
 * los permisos más amplios que daban las versiones anteriores (quien conectó
 * antes no tiene que volver a conectar). Sin nada de servidor: se usa también
 * en el navegador y en las pruebas.
 */

const G = "https://www.googleapis.com/auth/";

type PermisosApp = {
  /** Lo que se pide al conectar (el primero es el que dice que la app está conectada). */
  leer: string[];
  /** Otros permisos con los que también se puede leer (los de antes o más amplios). */
  leerCon?: string[];
  /** Lo que se pide la primera vez que hace falta hacer algo. */
  escribir?: string[];
  /** Con cualquiera de estos ya se puede escribir. */
  escribirCon?: string[];
  /** Lo que se puede hacer con el permiso de escribir, para el botón «Dar permiso». */
  hace?: string;
};

export const PERMISOS_GOOGLE: Partial<Record<IdApp, PermisosApp>> = {
  gmail: {
    leer: [`${G}gmail.readonly`],
    escribir: [`${G}gmail.send`],
    escribirCon: [`${G}gmail.send`, `${G}gmail.compose`, `${G}gmail.modify`, "https://mail.google.com/"],
    hace: "mandar correos desde tu Gmail",
  },
  google_calendar: {
    // Solo los eventos (no la configuración ni la lista de calendarios): es lo único que se lee
    leer: [`${G}calendar.events.readonly`],
    leerCon: [`${G}calendar.readonly`, `${G}calendar.events`, `${G}calendar`],
    escribir: [`${G}calendar.events`],
    escribirCon: [`${G}calendar.events`, `${G}calendar`],
    hace: "crear, mover y cancelar citas en tu calendario",
  },
  google_tasks: {
    leer: [`${G}tasks.readonly`],
    leerCon: [`${G}tasks`],
    escribir: [`${G}tasks`],
    escribirCon: [`${G}tasks`],
    hace: "crear y completar tus tareas",
  },
  google_drive: { leer: [`${G}drive.file`] },
  google_sheets: { leer: [`${G}spreadsheets.readonly`] },
  google_contacts: { leer: [`${G}contacts.readonly`] },
  // Google solo ofrece este permiso para el Perfil de Negocio (aquí solo se leen reseñas)
  google_business: { leer: [`${G}business.manage`] },
  // Las respuestas y los títulos de las preguntas
  google_forms: { leer: [`${G}forms.responses.readonly`, `${G}forms.body.readonly`] },
};

export const SCOPE_DRIVE_FILE = `${G}drive.file`;
/** Lo de entrar: el correo de la cuenta de Google que se conecta. */
export const IDENTIDAD_GOOGLE = ["openid", "email"];

/** ¿Esta app de Google tiene un permiso aparte para hacer cosas? */
export const tieneEscritura = (app: IdApp): boolean => Boolean(PERMISOS_GOOGLE[app]?.escribir?.length);

/** Qué puede hacer con el permiso de escribir («mandar correos desde tu Gmail»). */
export const queHaceAlEscribir = (app: IdApp): string | null => PERMISOS_GOOGLE[app]?.hace ?? null;

/** Las apps de Google que quedan conectadas con estos permisos. */
export function appsDeScopesGoogle(scopes: readonly string[]): IdApp[] {
  const dados = new Set(scopes);
  return (Object.keys(PERMISOS_GOOGLE) as IdApp[]).filter((a) => {
    const p = PERMISOS_GOOGLE[a]!;
    return [p.leer[0], ...(p.leerCon ?? [])].some((s) => dados.has(s));
  });
}

/** ¿Ya dio permiso de hacer cosas en esta app? (Si la app no tiene permiso aparte, sí.) */
export function puedeEscribir(app: IdApp, scopes: readonly string[]): boolean {
  const p = PERMISOS_GOOGLE[app];
  if (!p?.escribir?.length) return true;
  const dados = new Set(scopes);
  return (p.escribirCon ?? p.escribir).some((s) => dados.has(s));
}

/**
 * Lo que se le pide a Google al conectar: entrar, LEER las apps pedidas y, solo
 * para las de `escribir`, el permiso de hacer cosas.
 */
export function scopesParaConectar(apps: readonly IdApp[], escribir: readonly IdApp[] = []): string[] {
  const conEscritura = new Set(escribir);
  return Array.from(
    new Set([
      ...IDENTIDAD_GOOGLE,
      ...apps.flatMap((a) => {
        const p = PERMISOS_GOOGLE[a];
        if (!p) return [];
        return [...p.leer, ...(conEscritura.has(a) ? (p.escribir ?? []) : [])];
      }),
    ]),
  );
}

/** El enlace que abre Google solo para dar el permiso de hacer cosas en esa app. */
export const enlaceDarPermiso = (app: IdApp) => `/panel?conectar=${app}&permiso=escribir`;
