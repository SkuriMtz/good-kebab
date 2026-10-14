import type { NombreIcono } from "@/components/base/Iconos";
import type { TonoInsignia } from "@/components/base/Insignia";
import type { TonoEstado } from "@/components/base/PuntoEstado";
import type { IdAgente } from "@/lib/agentes";

/*
 * Lo que necesita el dashboard para pintarse. Lo llenan dos fuentes:
 * - /pruebalo: src/lib/demo-dashboard.ts (datos de ejemplo de una clínica).
 * - /panel: src/app/panel/page.tsx (datos reales de la cuenta, o vacío).
 * Todo es serializable (sin funciones) salvo `Accion.alElegir`, que solo
 * usa la demostración desde el navegador.
 */

/** Algo que se puede hacer: un enlace (`href`) o un cambio de vista (`alElegir`). */
export type Accion = {
  etiqueta: string;
  href?: string;
  alElegir?: () => void;
  icono?: NombreIcono;
};

/** Tareas de un día, por agente. `fecha` en AAAA-MM-DD (día de la clínica). */
export type DiaActividad = { fecha: string; porAgente: Partial<Record<IdAgente, number>> };

export type Actividad = {
  dias: DiaActividad[];
  /** Cómo se llama lo que se cuenta ("tarea" / "tareas"). */
  unidad: { una: string; varias: string };
  /** Qué cuenta cada cuadro, en una línea. */
  explicacion: string;
  /** Agentes que aparecen en el filtro (los del plan). */
  agentes: IdAgente[];
};

export type Bienvenida = {
  fecha: string;
  nombre: string;
  resumen: string;
  /** Tres cifras del día ("14 citas hoy"). */
  hoy: { valor: string; etiqueta: string }[];
  /** La primera es el botón principal (azul); las demás, sutiles. */
  acciones: Accion[];
};

export type AgenteFijado = {
  id: IdAgente;
  estado: { tono: TonoEstado; texto: string; pulso?: boolean };
  descripcion: string;
  /** La cifra del mes ("86 citas agendadas"). */
  cifra?: { valor: number; etiqueta: string };
  secundaria?: string;
  /** Tareas por día (últimos 30). */
  serie?: number[];
  /** Su plan no lo incluye: "Con Atendel One". */
  bloqueado?: string;
  accion: Accion;
};

export type Evento = {
  id: string;
  agente: IdAgente;
  /** Lo que hizo, después de su nombre ("agendó a Valeria Montes"). */
  texto: string;
  detalle?: string;
  hora: string;
  insignia?: { tono: TonoInsignia; texto: string };
  archivo?: string;
  /** A quién le pasó la conversación (relevo entre agentes). */
  relevo?: IdAgente;
  accion?: Accion;
};
export type GrupoEventos = { dia: string; eventos: Evento[] };

export type Pendiente = {
  id: string;
  agente: IdAgente;
  titulo: string;
  /** El mensaje o la sugerencia tal cual. */
  cita: string;
  detalle: string;
  revisar?: Accion;
  /** Solo en la demostración: aprobar cambia el estado aquí mismo. */
  aprobable?: boolean;
};

export type Destacado = { id: string; agente?: IdAgente; cifra: string; texto: string; detalle?: string };

export type ConversacionReciente = {
  id: string;
  titulo: string;
  agentes: IdAgente[];
  vista: string;
  hora: string;
  sinLeer?: number;
  accion: Accion;
};

export type Negocio = {
  nombre: string;
  giro?: string;
  correo?: string;
  plan: string;
  /** Uso del plan en el mes. */
  uso: { etiqueta: string; valor: number; max: number; detalle: string };
  accion?: Accion;
};

export type Cita = {
  id: string;
  hora: string;
  dia: string;
  cliente: string;
  servicio: string;
  agente?: IdAgente;
  estado: { tono: TonoInsignia; texto: string };
};

export type Metrica = {
  id: string;
  etiqueta: string;
  valor: number;
  /** Por día, del más viejo al de hoy. */
  serie: number[];
  /** El mismo número en el periodo anterior (para el cambio). */
  anterior?: number;
  periodo: string;
  agente?: IdAgente;
};

export type Recomendacion = { id: string; agente?: IdAgente; texto: string; accion?: Accion };
export type Novedad = { id: string; fecha: string; titulo: string; texto: string };

/** Mensaje de "todavía no hay nada" para una sección, con su salida. */
export type Vacio = { titulo: string; texto: string; accion?: Accion; pronto?: boolean };

export type DatosResumen = {
  ejemplo: boolean;
  bienvenida: Bienvenida;
  actividad: Actividad;
  fijados: AgenteFijado[];
  eventos: GrupoEventos[];
  eventosVacio: Vacio;
  pendientes: Pendiente[];
  pendientesVacio: Vacio;
  /** Cómo se llama la pestaña de pendientes en esta fuente. */
  pendientesEtiqueta: string;
  destacados: Destacado[];
  destacadosVacio: Vacio;
  conversaciones: ConversacionReciente[];
  conversacionesVacio: Vacio;
  todasConversaciones: Accion;
  negocio: Negocio;
  /** `null`: la agenda todavía no existe en esta fuente (se dice "Pronto"). */
  citas: Cita[] | null;
  citasVacio: Vacio;
  metricas: Metrica[];
  recomendaciones: Recomendacion[];
  novedades: Novedad[];
};
