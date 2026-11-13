/**
 * Lo que la IA de /pruebalo manda junto al texto, sin que se vea: una
 * tarjeta (la presentación que armó) o un envío que deja en Pendientes. Va
 * en JSON entre \u0003 y \u0004 (el chat real usa \u0001 y \u0002 para el
 * estado y \u0000 para los errores).
 */

export const INICIO_DATO = "\u0003";
export const FIN_DATO = "\u0004";

export type DatoDemo =
  | { tipo: "presentacion"; archivo: string; datos: { titulo: string; subtitulo?: string; negocio?: string; diapositivas: { titulo: string; puntos: string[] }[] } }
  | { tipo: "envio"; pendiente: { id: string; agente: string; titulo: string; para: string; texto: string; nota: string } };

export const marcoDato = (d: DatoDemo) => `${INICIO_DATO}${JSON.stringify(d)}${FIN_DATO}`;

/** Saca del texto acumulado los datos completos; lo que quede a medias se queda fuera hasta que llegue completo. */
export function separarDatos(acumulado: string): { texto: string; datos: DatoDemo[] } {
  const datos: DatoDemo[] = [];
  let texto = acumulado.replace(new RegExp(`${INICIO_DATO}([^${FIN_DATO}]*)${FIN_DATO}`, "g"), (_m, json: string) => {
    try {
      datos.push(JSON.parse(json) as DatoDemo);
    } catch {
      /* incompleto o roto: se ignora */
    }
    return "";
  });
  const abierto = texto.indexOf(INICIO_DATO);
  if (abierto >= 0) texto = texto.slice(0, abierto);
  // Los estados (\u0001…\u0002) no se muestran en la demostración
  texto = texto.replace(/\u0001[^\u0002]*\u0002/g, "").replace(/\u0001[^\u0002]*$/, "");
  return { texto, datos };
}
