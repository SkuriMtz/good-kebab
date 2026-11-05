/**
 * El estado de las herramientas en el chat: mientras un agente usa una app
 * (buscar correos, ver la agenda, leer un documento), el stream de
 * /api/chat trae una línea de estado ("Clara está revisando tu correo…")
 * que se pinta tenue, con los triangulitos de "escribiendo…".
 *
 * EL FORMATO LO DEFINE D (integraciones), en src/app/api/chat/route.ts.
 * Este es el único lugar que lo lee: cuando llegue, aquí se separa el
 * estado del texto. Mientras, el texto pasa tal cual y no hay estado.
 */
export function separarEstado(acumulado: string): { texto: string; estado: string | null } {
  return { texto: acumulado, estado: null };
}
