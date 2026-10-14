import type { ReactNode } from "react";
import type { NombreIcono } from "@/components/base/Iconos";
import type { TonoInsignia } from "@/components/base/Insignia";
import type { TonoEstado } from "@/components/base/PuntoEstado";
import type { IdAgente } from "@/lib/agentes";

/**
 * Piezas de datos que comparten /pruebalo (datos de ejemplo) y /panel
 * (datos reales). El armazón no sabe de dónde vienen: solo las pinta.
 */

/** Las vistas del menú lateral. Las que todavía no existen van con "Pronto". */
export type IdVista = "resumen" | "conversaciones" | "agentes" | "citas" | "correo" | "clientes" | "reportes" | "configuracion";

/** A dónde lleva algo: un enlace de verdad (panel) o una función (demo, sin recargar). */
export type Destino = { href?: string; alElegir?: () => void };

export type ElementoNav = Destino & {
  id: IdVista;
  etiqueta: string;
  icono: NombreIcono;
  /** Todavía no existe: insignia "Pronto" y no se puede elegir. */
  pronto?: boolean;
  /** Pendientes (conversaciones sin leer, por ejemplo). */
  contador?: number;
  etiquetaContador?: string;
};

export type EstadoAgente = Destino & {
  id: IdAgente;
  tono: TonoEstado;
  /** Qué hace ahora o cómo está ("Contestando un WhatsApp", "En tu equipo"). */
  etiqueta: string;
  pulso?: boolean;
  /** No está en su plan: con qué plan llega ("Con Atendel One"). */
  bloqueado?: string;
};

export type GrupoLateral = Destino & {
  id: string;
  nombre: string;
  agentes: IdAgente[];
  sinLeer?: number;
};

export type Aviso = Destino & {
  id: string;
  agente?: IdAgente;
  /** Lo que pasó, en una o dos líneas. */
  texto: string;
  /** "Hace 12 min", "08:52"… */
  cuando: string;
  nuevo: boolean;
};

/** Un renglón de la paleta de comandos (⌘K). */
export type ElementoPaleta = Destino & {
  id: string;
  grupo: "Ir a" | "Agentes" | "Conversaciones" | "Crear" | "Preferencias";
  etiqueta: string;
  descripcion?: string;
  icono?: NombreIcono;
  /** Personaje(s) en vez de ícono. */
  agentes?: IdAgente[];
  atajo?: string[];
  pronto?: boolean;
  /** Palabras extra para encontrarlo ("whatsapp", "citas"…). */
  palabras?: string;
};

export type Usuario = {
  nombre: string;
  correo: string;
  foto?: string | null;
  estado: { tono: TonoEstado; etiqueta: string };
};

/** Un momento de la línea de tiempo de actividad de los agentes. */
export type TipoEvento = "cita" | "correo" | "recordatorio" | "relevo" | "archivo" | "mensaje" | "reporte";

export type Evento = {
  id: string;
  agente: IdAgente;
  /** A quién le pasó el trabajo (relevos entre agentes). */
  para?: IdAgente;
  tipo: TipoEvento;
  /** Lo que hizo, sin el nombre (el nombre va en negritas antes). */
  texto: string;
  hora: string;
  insignia?: { tono: TonoInsignia; texto: string };
  /** Algo más que se muestra dentro, como en el feed de un repositorio. */
  detalle?: DetalleEvento;
};

export type DetalleEvento =
  | { tipo: "lista"; titulo?: string; renglones: { marca: string; tono: TonoInsignia; texto: string }[] }
  | { tipo: "archivo"; nombre: string; descripcion: string }
  | { tipo: "cita"; quien: string; servicio: string; cuando: string }
  | { tipo: "texto"; texto: string };

export type DiaActividad = { dia: string; eventos: Evento[] };

/** Algo que un agente preparó y no sale sin tu visto bueno. */
export type Pendiente = {
  id: string;
  agente: IdAgente;
  titulo: string;
  mensaje: string;
  para: string;
  canal: string;
  cuando: string;
  nota?: string;
};

export type Destacado = {
  id: string;
  agente: IdAgente;
  marca: string;
  tono: TonoInsignia;
  texto: string;
  cuando: string;
};

export type ConversacionReciente = Destino & {
  id: string;
  nombre: string;
  agentes: IdAgente[];
  vistaPrevia: string;
  cuando: string;
  sinLeer?: number;
};

export type Cita = { id: string; cuando: string; hora: string; quien: string; servicio: string; tono: TonoEstado; estado: string };

export type Metrica = { id: string; etiqueta: string; valor: string; cambio?: string; tonoCambio?: TonoInsignia; nota?: string };

export type Novedad = { id: string; titulo: string; texto: string };

/** Una pieza de texto que puede llevar el nombre resaltado. */
export type Texto = string | ReactNode;
