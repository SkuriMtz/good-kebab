import { IDS_AGENTES, type IdAgente } from "./agentes";

export type Intervencion = { agente: IdAgente; texto: string };

const MARCA = new RegExp(`^@@(${IDS_AGENTES.join("|")})\\b[ \\t]*\\n?`, "gm");

/**
 * En un chat de grupo la IA marca cada intervención con una línea "@@id".
 * Esto la parte en pedazos, uno por agente. Lo que llegue antes de la
 * primera marca (o de alguien que no está en el grupo) se le da al primero.
 * `enCurso`: oculta una marca a medio escribir al final.
 */
export function partirIntervenciones(texto: string, participantes: readonly IdAgente[], enCurso = false): Intervencion[] {
  let t = texto;
  if (enCurso) t = t.replace(/(^|\n)@@\w*$/, "");
  const piezas: Intervencion[] = [];
  let quien: IdAgente = participantes[0];
  let desde = 0;
  MARCA.lastIndex = 0;
  for (let m = MARCA.exec(t); m; m = MARCA.exec(t)) {
    const antes = t.slice(desde, m.index).trim();
    if (antes) piezas.push({ agente: quien, texto: antes });
    const id = m[1] as IdAgente;
    quien = participantes.includes(id) ? id : participantes[0];
    desde = m.index + m[0].length;
  }
  const resto = t.slice(desde).trim();
  if (resto || piezas.length === 0) piezas.push({ agente: quien, texto: resto });
  return piezas;
}

/** Para mandar el historial a la IA: vuelve a poner las marcas. */
export const conMarca = (agente: IdAgente, texto: string) => `@@${agente}\n${texto}`;
