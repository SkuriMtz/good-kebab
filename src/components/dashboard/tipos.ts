import type { IdAgente } from "@/lib/agentes";
import type { NombreIcono } from "@/components/base/Iconos";
import type { TonoInsignia } from "@/components/base/Insignia";
import type { TonoEstado } from "@/components/base/PuntoEstado";

/**
 * Tipos del dashboard de Atendel. Los usan las dos caras del mismo armazón:
 * /pruebalo (datos de ejemplo, src/lib/demo-dashboard.ts) y /panel (datos
 * reales de la cuenta). Ningún componente sabe de dónde vienen los datos.
 */

export type IdSeccion = "resumen" | "conversaciones" | "agentes" | "citas" | "correo" | "clientes" | "reportes" | "configuracion";

export type IdPestanaActividad = "actividad" | "pendientes" | "destacados";

/**
 * A dónde lleva algo: en el panel es una ruta (`href`); en /pruebalo es una
 * vista de la misma página (se cambia sin recargar). `con` abre un chat o
 * grupo concreto; `pestana` elige la pestaña de la actividad.
 */
export type Destino = { href: string } | { vista: IdSeccion; con?: string; pestana?: IdPestanaActividad };

export type ElementoNav = {
  id: IdSeccion;
  etiqueta: string;
  icono: NombreIcono;
  destino?: Destino;
  contador?: number;
  etiquetaContador?: string;
  /** Todavía no existe: se ve con la insignia "Pronto" y no lleva a ningún lado. */
  pronto?: boolean;
};

export type AgenteLateral = {
  id: IdAgente;
  estado: string;
  tono: TonoEstado;
  pulso?: boolean;
  destino?: Destino;
  /** Fuera del plan: "Con Atendel One". */
  bloqueado?: string;
};

export type GrupoLateral = {
  id: string;
  nombre: string;
  agentes: IdAgente[];
  destino: Destino;
  sinLeer?: number;
};

export type Usuario = {
  nombre: string;
  correo: string;
  foto?: string | null;
  estado?: { tono: TonoEstado; etiqueta: string };
};

export type Aviso = {
  id: string;
  agente?: IdAgente;
  titulo: string;
  detalle?: string;
  cuando: string;
  leido?: boolean;
  destino?: Destino;
};

/* ---------- Actividad ---------- */

export type Adjunto =
  | { tipo: "cita"; cuando: string; servicio: string; persona: string; estado?: { tono: TonoInsignia; texto: string } }
  | { tipo: "correo"; titulo: string; puntos: { etiqueta: string; texto: string }[] }
  | { tipo: "archivo"; nombre: string; detalle: string }
  | { tipo: "mensaje"; canal: string; texto: string };

export type Evento = {
  id: string;
  /** Encabezado del grupo: "Hoy", "Ayer", "6 de octubre". */
  dia: string;
  /** Cómo se lee la hora: "hace 25 min", "Ayer, 12:01". */
  cuando: string;
  /** Fecha ISO para <time dateTime>. */
  fecha?: string;
  /** Quién lo hizo: un agente o "tu" (la persona dueña de la cuenta). */
  quien: IdAgente | "tu";
  /** Lo que pasó, en minúsculas después del nombre: "agendó una cita para". */
  accion: string;
  /** El objeto, en negritas: "Sofía Ramírez". */
  objeto?: string;
  detalle?: string;
  /** Relevo: a quién le pasó el trabajo. */
  relevo?: IdAgente;
  /** Pasando ahora mismo (con "escribiendo…"). */
  vivo?: boolean;
  insignia?: { tono: TonoInsignia; texto: string };
  adjunto?: Adjunto;
  destino?: Destino;
};

export type Pendiente = {
  id: string;
  agente: IdAgente;
  titulo: string;
  para: string;
  canal: string;
  borrador: string;
  cuando: string;
};

export type Destacado = {
  id: string;
  agente: IdAgente;
  titulo: string;
  detalle?: string;
  insignia?: { tono: TonoInsignia; texto: string };
  cuando: string;
  destino?: Destino;
};

/* ---------- Resto del resumen ---------- */

export type Estadistica = { valor: string; etiqueta: string };

export type AgenteFijado = {
  id: IdAgente;
  estado: string;
  tono: TonoEstado;
  pulso?: boolean;
  /** Un dato corto del agente: "14 conversaciones hoy". */
  dato: string;
  bloqueado?: string;
  destino?: Destino;
};

export type ConversacionReciente = {
  id: string;
  nombre: string;
  agentes: IdAgente[];
  vistaPrevia: string;
  cuando: string;
  sinLeer?: number;
  destino: Destino;
};

export type Cita = {
  id: string;
  persona: string;
  servicio: string;
  hora: string;
  estado: { tono: TonoEstado; etiqueta: string };
};

export type DiaSemana = { corto: string; largo: string; valor: number; hoy?: boolean };

export type ItemParaTi = {
  id: string;
  tipo: "consejo" | "novedad";
  titulo: string;
  texto: string;
  accion?: { etiqueta: string; destino: Destino };
};

export type ResumenCorreo = {
  id: string;
  remitente: string | null;
  asunto: string | null;
  resumen: string;
  accion: string | null;
  cuando: string;
  nuevo?: boolean;
};

export type ResultadoBusqueda = {
  id: string;
  grupo: "Secciones" | "Agentes" | "Conversaciones" | "Actividad" | "Citas";
  titulo: string;
  detalle?: string;
  icono?: NombreIcono;
  agente?: IdAgente;
  destino: Destino;
};
