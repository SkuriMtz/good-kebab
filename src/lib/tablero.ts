/*
 * EL TABLERO (lo primero al entrar al panel): el resumen de TODO el negocio,
 * en filas que se deslizan a los lados y se bajan. Aquí se arma, sin efectos
 * (se prueba solo); los datos los junta src/lib/tablero-datos.ts.
 *
 * Cambia según cada quien, no solo los datos sino cómo se ve:
 * - Solo salen las filas y tarjetas de lo que tiene (sin WhatsApp no hay
 *   tarjeta de WhatsApp; sin apps, la fila de apps invita a conectar).
 * - Las filas se ordenan por lo que más importa ahora (lo que espera su OK y
 *   las apps con problema primero; luego lo que más se movió).
 * - En cada fila, la tarjeta más importante va en grande.
 * Todo lo que se muestra sale de datos reales (nada inventado); cada tarjeta
 * lleva a su sección.
 */

export type Tono = "normal" | "alerta" | "bien";

/** Donde la caja del Tablero deja lo que pediste para que el chat lo mande (sessionStorage de la pestaña). */
export const PEDIDO_TABLERO = "atendel-pedido";

export type Renglon = { id: string; texto: string; detalle?: string; hora?: string; href?: string };

export type IconoTablero = "mensaje" | "correo" | "clientes" | "calendario" | "reloj" | "check-doble" | "rayo" | "grafica" | "documento" | "alerta" | "negocio" | "conversaciones" | "enlace";

export type Tarjeta = {
  id: string;
  titulo: string;
  icono: IconoTablero;
  href: string;
  cifra?: { valor: number; etiqueta: string; antes: number | null };
  /** Los últimos días (para la mini gráfica). */
  serie?: number[];
  renglones: Renglon[];
  /** Si no hay nada que mostrar. */
  vacio?: string;
  tono?: Tono;
  /** Barras de cuánto se lleva (el uso del plan). */
  barras?: { id: string; texto: string; pct: number }[];
  /** Para las apps: su logo (id de la app) y su estado. */
  app?: { logo: string | null; cuenta: string | null; estado: "activa" | "error"; apps: string[] };
  peso: number;
  grande?: boolean;
};

export type FilaTablero = { id: string; titulo: string; href?: string; tarjetas: Tarjeta[]; peso: number };

export type Destacada = {
  id: string;
  etiqueta: string;
  titulo: string;
  detalle?: string;
  href: string;
  tono: Tono;
  /** Las noticias de tu industria llevan a su fuente (fuera de Atendel). */
  fuera?: { nombre: string };
  /** La foto de la noticia (guardada en la Supabase de Atendel). */
  foto?: string;
};

export type Acceso = { id: string; titulo: string; icono: IconoTablero; href: string };

/** Un mosaico (como Toddle): cada sección con su color, su dato principal y lo pendiente en un globito. */
export type Mosaico = { id: string; titulo: string; dato: string; cuenta?: number; href: string; icono: IconoTablero; color: "lila" | "amarillo" | "verde" | "azul" | "durazno" | "rosa" | "menta" | "gris" };

/** La columna de hoy: lo que viene y los pendientes en pestañas. */
export type PestanaHoy = { id: string; titulo: string; cuenta: number | null; renglones: Renglon[]; vacio: string; href: string };
export type Hoy = { viene: Renglon[]; pestanas: PestanaHoy[] };

export type DatosTablero = {
  destacadas: Destacada[];
  accesos: Acceso[];
  mosaicos: Mosaico[];
  hoy: Hoy;
  filas: FilaTablero[];
  /** Las noticias de tu industria (en la columna de hoy, debajo de los pendientes). */
  noticias: NoticiaTablero[];
  /** false: las noticias de tu industria no son de hoy y el Tablero las pide (/api/tablero/noticias). */
  noticiasAlDia: boolean;
};

export type NoticiaTablero = { id: string; titulo: string; resumen: string; fuente: string; url: string; foto?: string };

/* ---------- Lo que entra ---------- */

type Semana = { semana: number; antes: number; serie: number[] };

export type EntradaTablero = {
  /** "/panel" o "/pruebalo". */
  base: string;
  teNecesita: { id: string; titulo: string; detalle?: string; href: string }[];
  totalTeNecesita: number;
  /** Del total: lo que espera tu OK y lo que hay en la Oficina por revisar. */
  totalOk: number;
  totalOficina: number;
  viene: { id: string; titulo: string; cuando: string }[];
  hecho: { id: string; titulo: string; hace: string }[];
  /** null: WhatsApp no está conectado ni hay mensajes. */
  whatsapp: (Semana & { esperan: number; ultimos: Renglon[] }) | null;
  /** null: sin correo conectado. */
  correo: (Semana & { conAccion: number; ultimos: Renglon[] }) | null;
  clientes: (Semana & { nuevos: number }) | null;
  respuestas: Semana | null;
  citas: Semana | null;
  apps: { id: string; nombre: string; cuenta: string | null; logo: string | null; apps: string[]; estado: "activa" | "error" }[];
  uso: { semanaPct: number | null; trabajoPct: number | null };
  noticias: NoticiaTablero[];
  /** ¿Las noticias ya son de hoy? (si no se dice, sí: no se piden). */
  noticiasAlDia?: boolean;
};

/* ---------- El armado ---------- */

const v = (base: string, q: string) => `${base}?${q}`;
const pide = (base: string, texto: string) => `${base}?pide=${encodeURIComponent(texto)}`;

/** Ordena por peso y pone en grande la más importante de la fila. */
function fila(id: string, titulo: string, tarjetas: (Tarjeta | null | false)[], href?: string): FilaTablero | null {
  const t = tarjetas.filter((x): x is Tarjeta => Boolean(x)).sort((a, b) => b.peso - a.peso);
  if (!t.length) return null;
  t[0] = { ...t[0], grande: true };
  return { id, titulo, href, tarjetas: t, peso: t[0].peso };
}

export function armarTablero(e: EntradaTablero): DatosTablero {
  const b = e.base;
  const conProblema = e.apps.filter((a) => a.estado === "error");

  /* Lo importante (la fila grande de arriba) */
  const destacadas: Destacada[] = [
    ...conProblema.map((a) => ({
      id: `app-${a.id}`,
      etiqueta: "Tus apps",
      titulo: `Vuelve a conectar ${a.nombre}`,
      detalle: a.cuenta ? `${a.cuenta}: dejó de funcionar y no puedo usarla.` : "Dejó de funcionar y no puedo usarla.",
      href: v(b, "vista=negocio&tab=apps"),
      tono: "alerta" as const,
    })),
    ...e.teNecesita.slice(0, 4).map((t) => ({ id: `ok-${t.id}`, etiqueta: "Te necesita", titulo: t.titulo, detalle: t.detalle, href: t.href, tono: "alerta" as const })),
  ].slice(0, 4);

  /* Accesos rápidos (solo los que aplican) */
  const accesos: Acceso[] = [
    ...(e.whatsapp ? [{ id: "clientes", titulo: "Contestar clientes", icono: "mensaje" as const, href: v(b, "vista=pendientes") }] : []),
    ...(e.correo ? [{ id: "correo", titulo: "Correo", icono: "correo" as const, href: v(b, "vista=correo") }] : []),
    { id: "agendar", titulo: "Agendar", icono: "calendario", href: pide(b, "Agenda una cita") },
    { id: "informe", titulo: "Informe del día", icono: "grafica", href: pide(b, "Dame el informe de hoy") },
    { id: "tareas", titulo: "Tareas", icono: "reloj", href: v(b, "vista=tareas") },
    { id: "oficina", titulo: "Hablar con Atendel", icono: "conversaciones", href: v(b, "vista=chat") },
  ];

  /* Clientes */
  const clientes = fila(
    "clientes",
    "Tus clientes",
    [
      e.whatsapp && {
        id: "whatsapp",
        titulo: "Clientes por WhatsApp",
        icono: "mensaje",
        href: v(b, "vista=pendientes"),
        cifra: { valor: e.whatsapp.semana, etiqueta: "mensajes esta semana", antes: e.whatsapp.antes },
        serie: e.whatsapp.serie,
        renglones: e.whatsapp.ultimos.slice(0, 3),
        vacio: "Nadie ha escrito esta semana.",
        tono: e.whatsapp.esperan ? "alerta" : "normal",
        peso: 60 + e.whatsapp.esperan * 12 + Math.min(e.whatsapp.semana, 40),
      },
      e.correo && {
        id: "correo",
        titulo: "Correos de clientes",
        icono: "correo",
        href: v(b, "vista=correo"),
        cifra: { valor: e.correo.semana, etiqueta: e.correo.conAccion ? `esta semana · ${e.correo.conAccion} piden algo` : "esta semana", antes: e.correo.antes },
        serie: e.correo.serie,
        renglones: e.correo.ultimos.slice(0, 3),
        vacio: "No llegaron correos de clientes esta semana.",
        peso: 50 + e.correo.conAccion * 6 + Math.min(e.correo.semana, 40),
      },
      e.clientes && {
        id: "personas",
        titulo: "Personas que te escribieron",
        icono: "clientes",
        href: v(b, "vista=estadisticas"),
        cifra: { valor: e.clientes.semana, etiqueta: e.clientes.nuevos ? `esta semana · ${e.clientes.nuevos} nuevas` : "esta semana", antes: e.clientes.antes },
        serie: e.clientes.serie,
        renglones: [],
        peso: 30 + Math.min(e.clientes.semana, 30),
      },
    ],
    v(b, "vista=estadisticas"),
  );

  /* Tu semana: citas y respuestas (lo que viene y lo hecho ya están en la columna de hoy) */
  const semana = fila(
    "semana",
    "Tu semana",
    [
      e.citas && {
        id: "citas",
        titulo: "Citas",
        icono: "calendario",
        href: v(b, "vista=citas"),
        cifra: { valor: e.citas.semana, etiqueta: "agendadas esta semana", antes: e.citas.antes },
        serie: e.citas.serie,
        renglones: [],
        peso: 45 + Math.min(e.citas.semana, 30),
      },
      e.respuestas && {
        id: "respuestas",
        titulo: "Respuestas a clientes",
        icono: "conversaciones",
        href: v(b, "vista=estadisticas"),
        cifra: { valor: e.respuestas.semana, etiqueta: "esta semana", antes: e.respuestas.antes },
        serie: e.respuestas.serie,
        renglones: [],
        peso: 20 + Math.min(e.respuestas.semana, 30),
      },
    ],
    v(b, "vista=estadisticas"),
  );

  /* Tus apps: cada cuenta, con su correo y si funciona */
  const apps = fila(
    "apps",
    "Tus apps",
    e.apps.length
      ? e.apps.map((a) => ({
          id: `app-${a.id}`,
          titulo: a.nombre,
          icono: "enlace" as const,
          href: v(b, "vista=negocio&tab=apps"),
          renglones: [],
          app: { logo: a.logo, cuenta: a.cuenta, estado: a.estado, apps: a.apps },
          tono: a.estado === "error" ? ("alerta" as const) : ("normal" as const),
          // Las que fallan, primero (y la fila sube)
          peso: a.estado === "error" ? 90 : 10,
        }))
      : [
          {
            id: "sin-apps",
            titulo: "Conecta tus apps",
            icono: "enlace",
            href: v(b, "vista=negocio&tab=apps"),
            renglones: [],
            vacio: "Conecta tu correo, agenda, WhatsApp o cobros para verlos aquí.",
            peso: 15,
          },
        ],
    v(b, "vista=negocio&tab=apps"),
  );

  /* Tu plan */
  const plan = fila(
    "plan",
    "Tu plan",
    [
      {
        id: "uso",
        titulo: "Uso de esta semana",
        icono: "grafica",
        href: v(b, "vista=ajustes"),
        renglones: [],
        barras: [
          ...(e.uso.semanaPct != null ? [{ id: "chat", texto: "Chat", pct: e.uso.semanaPct }] : []),
          ...(e.uso.trabajoPct != null ? [{ id: "trabajo", texto: "Trabajo por su cuenta", pct: e.uso.trabajoPct }] : []),
        ],
        vacio: "Sin datos de uso todavía.",
        tono: (e.uso.semanaPct ?? 0) >= 80 || (e.uso.trabajoPct ?? 0) >= 80 ? "alerta" : "normal",
        peso: (e.uso.semanaPct ?? 0) >= 80 || (e.uso.trabajoPct ?? 0) >= 80 ? 70 : 5,
      },
    ],
    v(b, "vista=ajustes"),
  );

  /* Mosaicos: solo las secciones con algo pendiente (máximo 4). Las demás ya están en el menú:
     repetirlas aquí era dar más opciones de las necesarias (ley de Hick). */
  const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;
  const mosaicos = (
    [
      { id: "ok", titulo: "Necesita tu OK", dato: e.totalOk ? plural(e.totalOk, "espera tu OK", "esperan tu OK") : "Nada pendiente", cuenta: e.totalOk, href: v(b, "vista=pendientes"), icono: "check-doble", color: "lila" },
      { id: "citas", titulo: "Citas", dato: e.citas ? `${plural(e.citas.semana, "agendada", "agendadas")} esta semana` : "Tu agenda", href: v(b, "vista=citas"), icono: "calendario", color: "amarillo" },
      e.whatsapp && { id: "clientes", titulo: "Clientes", dato: `${plural(e.whatsapp.semana, "mensaje", "mensajes")} esta semana`, cuenta: e.whatsapp.esperan, href: v(b, "vista=pendientes"), icono: "mensaje", color: "verde" },
      e.correo && { id: "correo", titulo: "Correo", dato: `${plural(e.correo.semana, "correo", "correos")} esta semana`, cuenta: e.correo.conAccion, href: v(b, "vista=correo"), icono: "correo", color: "azul" },
      { id: "oficina", titulo: "Oficina", dato: e.totalOficina ? `${e.totalOficina} por revisar` : "Archivos e informes", cuenta: e.totalOficina, href: v(b, "vista=oficina"), icono: "documento", color: "durazno" },
      { id: "tareas", titulo: "Tareas", dato: e.viene.length ? plural(e.viene.length, "programada", "programadas") : "Lo que Atendel hace solo", href: v(b, "vista=tareas"), icono: "reloj", color: "rosa" },
      { id: "estadisticas", titulo: "Estadísticas", dato: e.clientes ? `${plural(e.clientes.semana, "persona", "personas")} esta semana` : "Cómo va tu negocio", href: v(b, "vista=estadisticas"), icono: "grafica", color: "menta" },
      { id: "apps", titulo: "Apps conectadas", dato: e.apps.length ? plural(e.apps.length, "conectada", "conectadas") : "Conecta tus apps", cuenta: conProblema.length, href: v(b, "vista=negocio&tab=apps"), icono: "enlace", color: "gris" },
    ] as (Mosaico | null | false)[]
  )
    .filter((m): m is Mosaico => Boolean(m) && Boolean((m as Mosaico).cuenta))
    .slice(0, 4);

  /* Hoy: lo que viene y los pendientes en pestañas */
  const esOficina = (id: string) => /^(f|t|r)-/.test(id);
  const hoy: Hoy = {
    viene: e.viene.slice(0, 4).map((t) => ({ id: t.id, texto: t.titulo, hora: t.cuando })),
    pestanas: [
      { id: "ok", titulo: "Tu OK", cuenta: e.totalOk, renglones: e.teNecesita.filter((t) => !esOficina(t.id)).slice(0, 5).map((t) => ({ id: t.id, texto: t.titulo, detalle: t.detalle, href: t.href })), vacio: "Nada espera tu OK.", href: v(b, "vista=pendientes") },
      { id: "oficina", titulo: "Oficina", cuenta: e.totalOficina, renglones: e.teNecesita.filter((t) => esOficina(t.id)).slice(0, 5).map((t) => ({ id: t.id, texto: t.titulo, detalle: t.detalle, href: t.href })), vacio: "No hay nada por revisar.", href: v(b, "vista=oficina") },
      { id: "hecho", titulo: "Hecho", cuenta: null, renglones: e.hecho.slice(0, 5).map((h) => ({ id: h.id, texto: h.titulo, hora: h.hace })), vacio: "Todavía no hay nada terminado.", href: v(b, "vista=hecho") },
    ],
  };

  const filas = [clientes, semana, apps, plan].filter((f): f is FilaTablero => f !== null).sort((a, z) => z.peso - a.peso);
  return { destacadas, accesos, mosaicos, hoy, filas, noticias: e.noticias.slice(0, 3), noticiasAlDia: e.noticiasAlDia ?? true };
}

/** Cuánto cambió contra antes, en %, o null si antes no hubo nada (no se puede comparar). */
export function cambio(valor: number, antes: number | null): number | null {
  if (antes == null || antes <= 0) return null;
  return Math.round(((valor - antes) / antes) * 100);
}
