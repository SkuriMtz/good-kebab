import type { NombreIcono } from "@/components/base/Iconos";
import type { TonoInsignia } from "@/components/base/Insignia";
import type { TonoEstado } from "@/components/base/PuntoEstado";
import type { IdAgente } from "@/lib/agentes";

/**
 * Tipos del dashboard de Atendel (armazón + vista Resumen). Los usan el
 * ejemplo de /pruebalo (src/lib/demo-dashboard.ts) y el panel real.
 * Los textos admiten **negritas** (se pintan con <Negritas>).
 */

/** Algo que se puede tocar: navega (href) o hace algo aquí mismo (alElegir). */
export type Destino = { href?: string; alElegir?: () => void };

export type ElementoLateral = Destino & {
  id: string;
  etiqueta: string;
  icono: NombreIcono;
  contador?: number;
  etiquetaContador?: string;
  /** Todavía no existe: se ve con la insignia "Pronto" y no se puede tocar. */
  pronto?: boolean;
};

export type AgenteLateral = Destino & {
  id: IdAgente;
  nombre: string;
  estado: string;
  tono: TonoEstado;
  pulso?: boolean;
  /** No está en el plan: se ve apagado. */
  apagado?: boolean;
};

export type GrupoLateral = Destino & {
  id: string;
  nombre: string;
  agentes: IdAgente[];
};

export type Usuario = {
  nombre: string;
  correo: string;
  foto?: string | null;
  estado?: { tono: TonoEstado; etiqueta: string };
};

/* ---------- Lo que espera tu visto bueno ---------- */

export type QuienRelevo = IdAgente | "tu";

/** Un paso del camino que siguió un pendiente: quién hizo qué, en orden. El texto de un agente sigue a su nombre ("encontró…"); el tuyo va solo ("Falta **tu visto bueno**…"). */
export type PasoRelevo = { quien: QuienRelevo; texto: string; hora?: string };

export type VistaPrevia =
  | { tipo: "whatsapp"; para: string[]; texto: string }
  | { tipo: "correo"; para: string; asunto: string; texto: string }
  | { tipo: "documento"; archivo: string; detalle: string; puntos: string[]; para: string; texto: string }
  | { tipo: "resumen"; de: string; asunto: string; resumen: string; sugerencia?: string };

export type Pendiente = {
  id: string;
  agente: IdAgente;
  titulo: string;
  /** Línea de abajo: canal y para quién ("WhatsApp · 4 pacientes"). */
  detalle: string;
  hora: string;
  urgencia?: { tono: TonoInsignia; texto: string };
  nuevo?: boolean;
  vista: VistaPrevia;
  relevos: PasoRelevo[];
  caja: {
    titulo: string;
    detalle: string;
    revisiones: string[];
    /** Texto del botón principal ("Aprobar y enviar"). */
    accion: string;
    /** Qué queda en la actividad cuando lo apruebas. */
    hecho: string;
  };
};

/* ---------- Actividad (línea de tiempo) ---------- */

export type Evento =
  | {
      id: string;
      tipo: "simple";
      dia: string;
      hora: string;
      agente: QuienRelevo;
      icono: NombreIcono;
      texto: string;
      insignia?: { tono: TonoInsignia; texto: string };
    }
  | {
      id: string;
      tipo: "relevo";
      dia: string;
      hora: string;
      de: IdAgente;
      a: IdAgente;
      texto: string;
      respuesta?: string;
    }
  | {
      id: string;
      tipo: "caja";
      dia: string;
      hora: string;
      agente: IdAgente;
      titulo: string;
      lineas?: { etiqueta?: string; texto: string }[];
      archivo?: { nombre: string; detalle: string };
    };

export type Destacado = { id: string; agente: IdAgente; titulo: string; detalle: string };

/* ---------- Centro y columna derecha ---------- */

export type AgenteFijado = Destino & {
  id: IdAgente;
  nombre: string;
  area: string;
  abarca: string;
  lema: string;
  estado: { tono: TonoEstado; texto: string };
  /** Lo que hizo (o puede hacer) en corto: "14 citas hoy". */
  datos: string[];
  apagado?: boolean;
};

export type ConversacionReciente = Destino & {
  id: string;
  nombre: string;
  agentes: IdAgente[];
  ultimo: string;
  hora: string;
  sinLeer?: number;
};

export type Cita = {
  hora: string;
  nombre: string;
  servicio: string;
  estado: { tono: TonoEstado; texto: string };
};

export type Metrica = {
  etiqueta: string;
  valor: string;
  cambio?: { texto: string; tono: TonoInsignia };
};

export type Novedad = { fecha: string; titulo: string; detalle: string };

export type Consejo = Destino & { id: string; texto: string; accion: string };

export type ResultadoBusqueda = Destino & {
  id: string;
  etiqueta: string;
  detalle?: string;
  icono?: NombreIcono;
  agente?: IdAgente;
};

export type GrupoResultados = { titulo: string; elementos: ResultadoBusqueda[] };

/** Un correo que Clara ya leyó (historial del panel o bandeja del ejemplo). */
export type CorreoResumido = {
  id: string;
  remitente: string;
  asunto: string;
  resumen: string;
  sugerencia?: string | null;
  cuando: string;
  nuevo?: boolean;
  urgente?: boolean;
};
