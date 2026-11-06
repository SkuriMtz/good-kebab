/**
 * LÍNEAS DE ESTADO EN EL STREAM DEL CHAT (POST /api/chat)
 *
 * Mientras un agente usa una app (p. ej. "Clara está revisando tu correo…"),
 * el servidor mete en el texto del stream un marco:
 *
 *   "\u0001" + texto del estado + "\u0002"
 *
 * Solo si el cliente lo pide (cuerpo `estados: true` o cabecera
 * `X-Atendel-Estados: 1`); sin pedirlo, el stream es el texto de siempre.
 * El texto del modelo nunca trae esos caracteres (el servidor los quita).
 * El marco de error de siempre ("\u0000ERROR:…") no cambia.
 *
 * Sin dependencias: se usa en el navegador y en el servidor.
 */

export const INICIO_ESTADO = "\u0001";
export const FIN_ESTADO = "\u0002";

export const marcoEstado = (texto: string) => `${INICIO_ESTADO}${texto.replace(/[\u0000-\u0002]/g, "")}${FIN_ESTADO}`;

/**
 * Separa el texto acumulado del stream en lo que se muestra y el estado
 * vigente. El estado vale mientras no llegue texto nuevo después de él; un
 * marco a medio llegar se esconde hasta que se complete.
 */
export function separarEstado(acumulado: string): { texto: string; estado: string | null } {
  let texto = "";
  let estado: string | null = null;
  let desde = 0;
  let largoAlEstado = 0;
  for (;;) {
    const a = acumulado.indexOf(INICIO_ESTADO, desde);
    if (a < 0) {
      texto += acumulado.slice(desde);
      break;
    }
    texto += acumulado.slice(desde, a);
    const b = acumulado.indexOf(FIN_ESTADO, a + 1);
    if (b < 0) break; // a medio llegar
    estado = acumulado.slice(a + 1, b) || null;
    largoAlEstado = texto.length;
    desde = b + 1;
  }
  if (estado !== null && texto.slice(largoAlEstado).trim()) estado = null;
  return { texto, estado };
}
