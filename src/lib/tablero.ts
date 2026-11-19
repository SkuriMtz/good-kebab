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

export type Renglon = { id: string; texto: string; detalle?: string; hora?: string };

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
};

export type Acceso = { id: string; titulo: string; icono: IconoTablero; href: string };

export type DatosTablero = { destacadas: Destacada[]; accesos: Acceso[]; filas: FilaTablero[] };

/* ---------- Lo que entra ---------- */

type Semana = { semana: number; antes: number; serie: number[] };

export type EntradaTablero = {
  /** "/panel" o "/pruebalo". */
  base: string;
  teNecesita: { id: string; titulo: string; detalle?: string; href: string }[];
  totalTeNecesita: number;
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
  noticias: { id: string; titulo: string; resumen: string; fuente: string; url: string }[];
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
    ...e.noticias.slice(0, 3).map((n) => ({ id: `n-${n.id}`, etiqueta: "Tu industria", titulo: n.titulo, detalle: n.resumen, href: n.url, tono: "normal" as const, fuera: { nombre: n.fuente } })),
  ];

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

  /* Agenda y tareas */
  const agenda = fila(
    "agenda",
    "Agenda y tareas",
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
      {
        id: "viene",
        titulo: "Lo que viene",
        icono: "reloj",
        href: v(b, "vista=tareas"),
        renglones: e.viene.slice(0, 3).map((t) => ({ id: t.id, texto: t.titulo, hora: t.cuando })),
        vacio: "No hay tareas programadas. Pídele a Atendel algo que se repita.",
        peso: 25 + e.viene.length * 4,
      },
    ],
    v(b, "vista=tareas"),
  );

  /* Lo que hizo Atendel */
  const hizo = fila(
    "hecho",
    "Lo que hizo Atendel",
    [
      {
        id: "hecho",
        titulo: "Lo último que terminó",
        icono: "check-doble",
        href: v(b, "vista=hecho"),
        renglones: e.hecho.slice(0, 3).map((h) => ({ id: h.id, texto: h.titulo, hora: h.hace })),
        vacio: "Todavía no hay nada terminado.",
        tono: "bien",
        peso: 20 + e.hecho.length * 3,
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
    v(b, "vista=hecho"),
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

  const filas = [clientes, agenda, hizo, apps, plan].filter((f): f is FilaTablero => f !== null).sort((a, z) => z.peso - a.peso);
  return { destacadas, accesos, filas };
}

/** Cuánto cambió contra antes, en %, o null si antes no hubo nada (no se puede comparar). */
export function cambio(valor: number, antes: number | null): number | null {
  if (antes == null || antes <= 0) return null;
  return Math.round(((valor - antes) / antes) * 100);
}
