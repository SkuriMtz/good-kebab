/**
 * Los datos del responsable que piden el aviso de privacidad y los términos.
 * Los pone el dueño de Atendel (nunca se inventan). Mientras falte alguno,
 * las páginas /privacidad y /terminos no se publican (dan 404) y no salen en
 * el pie ni en el sitemap.
 */
export const DATOS_LEGALES = {
  /** Nombre completo de la persona o razón social de la empresa responsable. */
  responsable: "Santiago Kuri Martinez",
  /** Correo para temas de privacidad y de los términos. */
  correo: "",
  /** Domicilio (al menos ciudad y estado) del responsable. */
  domicilio: "Monterrey, Nuevo León, México",
  /** Ciudad cuyos tribunales resuelven cualquier desacuerdo (normalmente la del domicilio). */
  jurisdiccion: "Monterrey, Nuevo León, México",
  /** Fecha de la última actualización de los textos (AAAA-MM-DD). */
  actualizado: "2026-11-17",
};

export type DatosLegales = typeof DATOS_LEGALES;

/** ¿Ya están todos los datos para publicar? */
export const legalesCompletos = (d: DatosLegales = DATOS_LEGALES) => Boolean(d.responsable.trim() && d.correo.trim() && d.domicilio.trim() && d.jurisdiccion.trim());
