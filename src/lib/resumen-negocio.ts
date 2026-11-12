import type { DatosNegocio } from "@/lib/estadisticas-negocio";

/**
 * Lo que el panel de información (la columna de la derecha del chat) necesita de
 * las estadísticas: las mismas cifras, sin la lista de clientes. Lo usan la API
 * (/api/negocio/resumen) y /pruebalo (con los datos de ejemplo).
 */
export type ResumenInfo = Pick<DatosNegocio, "negocio" | "periodo" | "canales" | "clientes" | "citas" | "correos" | "respuestas" | "serie" | "series" | "porHora" | "temas"> & {
  /** Movimiento por día de la semana (0 = lunes), sumando todas las horas. */
  porSemana: number[] | null;
};

export const resumirNegocio = (d: DatosNegocio): ResumenInfo => ({
  negocio: d.negocio,
  periodo: d.periodo,
  canales: d.canales,
  clientes: d.clientes,
  citas: d.citas,
  correos: d.correos,
  respuestas: d.respuestas,
  serie: d.serie,
  series: d.series,
  porHora: d.porHora,
  porSemana: d.calor ? d.calor.map((fila) => fila.reduce((a, b) => a + b, 0)) : null,
  temas: d.temas.slice(0, 3),
});
