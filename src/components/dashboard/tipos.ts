import type { NombreIcono } from "@/components/base/Iconos";
import type { TonoInsignia } from "@/components/base/Insignia";
import type { TonoEstado } from "@/components/base/PuntoEstado";
import type { IdAgente } from "@/lib/agentes";

/**
 * Piezas de datos que comparten el dashboard de ejemplo (/pruebalo) y el
 * real (/panel). Cada pieza sabe a dónde lleva con `href` (navega) o con
 * `alElegir` (cambia de vista sin recargar, como en /pruebalo).
 */

export type Accion = { href?: string; alElegir?: () => void };

export type IdVista =
  | "resumen"
  | "conversaciones"
  | "agentes"
  | "citas"
  | "correo"
  | "clientes"
  | "reportes"
  | "configuracion";

export type ElementoNav = Accion & {
  id: IdVista;
  etiqueta: string;
  icono: NombreIcono;
  /** Todavía no existe: se ve con la insignia "Pronto" y no lleva a ningún lado. */
  pronto?: boolean;
  contador?: number;
  etiquetaContador?: string;
};

export type Estado = { tono: TonoEstado; etiqueta: string; pulso?: boolean };

export type AgenteLateral = Accion & {
  id: IdAgente;
  estado: Estado;
  /** Si su plan no lo incluye: "Con Atendel One". */
  bloqueado?: string;
};

export type GrupoLateral = Accion & {
  id: string;
  nombre: string;
  agentes: IdAgente[];
  sinLeer?: number;
};

export type Usuario = {
  nombre: string;
  correo: string;
  foto?: string | null;
  estado?: { tono: TonoEstado; etiqueta: string };
};

/** Un aviso de la campana. `fecha` (ISO) o `haceMin` (ejemplo, relativo a ahora). */
export type Aviso = Accion & {
  id: string;
  agente?: IdAgente;
  titulo: string;
  detalle?: string;
  fecha?: string;
  haceMin?: number;
  leido?: boolean;
};

export type ResultadoBusqueda = Accion & {
  id: string;
  grupo: string;
  titulo: string;
  detalle?: string;
  agente?: IdAgente;
  icono?: NombreIcono;
  /** Texto extra para que la búsqueda lo encuentre (no se muestra). */
  claves?: string;
};

/* ---------- Línea de tiempo de actividad ---------- */

export type InsigniaDato = { tono: TonoInsignia; texto: string };

export type ElementoLista = { id: string; titulo: string; detalle?: string; insignia?: InsigniaDato; hora?: string };

/** El objeto del evento, incrustado debajo de la frase (como la tarjeta del repositorio en el feed). */
export type TarjetaEvento =
  | { tipo: "cita"; titulo: string; detalle: string; insignia?: InsigniaDato; antes?: string }
  | { tipo: "mensaje"; para?: string; texto: string; pie?: string }
  | { tipo: "archivo"; nombre: string; detalle: string }
  | { tipo: "lista"; elementos: ElementoLista[]; pie?: string };

export type Evento = {
  id: string;
  agente: IdAgente;
  /** En un relevo: a quién le pasó el trabajo. */
  con?: IdAgente;
  verbo: string;
  objeto?: string;
  complemento?: string;
  fecha?: string;
  haceMin?: number;
  insignia?: InsigniaDato;
  tarjeta?: TarjetaEvento;
  /** Evento agrupado: varias cosas iguales en una sola fila que se despliega. */
  agrupado?: { etiqueta: string; elementos: ElementoLista[] };
  /** Botón al pie del evento (ver en el chat, revisar…). */
  accion?: Accion & { etiqueta: string };
};

/* ---------- Columna derecha ---------- */

export type Cita = { id: string; paciente: string; servicio: string; hora: string; estado: InsigniaDato };

export type Metrica = { id: string; etiqueta: string; valor: number; delta?: number; periodo?: string };

export type Novedad = { id: string; fecha: string; titulo: string; texto: string; href?: string };

export type Consejo = Accion & { id: string; agente?: IdAgente; titulo: string; texto: string; etiquetaAccion: string };
