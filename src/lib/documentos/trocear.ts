/**
 * TROCEO DE DOCUMENTOS (función pura, sin red ni base de datos)
 *
 * Parte el texto de un documento en fragmentos de ~1200 caracteres que se
 * enciman ~150 con el anterior, para que una idea que queda en la orilla no
 * se pierda. Corta primero por párrafo; si un párrafo es muy largo, por
 * oración; y si una oración es enorme, por palabra.
 *
 * Cada fragmento se guarda en `fragmentos_doc` (máximo 4000 caracteres y
 * 500 fragmentos por documento, que también revisa la base de datos).
 */

export const TAMANO_FRAGMENTO = 1200;
export const ENCIME_FRAGMENTO = 150;
/** Fragmentos por documento (la tabla tiene CHECK orden < 500). */
export const MAX_FRAGMENTOS = 500;
/** Largo máximo del texto de un fragmento (CHECK de la tabla). */
export const MAX_TEXTO_FRAGMENTO = 4000;

export type OpcionesTroceo = {
  tamano?: number;
  encime?: number;
  maxFragmentos?: number;
};

/**
 * Deja el texto listo para trocear: saltos de línea normales, sin
 * caracteres de control ni invisibles, espacios simples y como mucho una
 * línea en blanco seguida.
 */
export function normalizarTexto(texto: string): string {
  return (texto ?? "")
    // Mitades sueltas de un carácter (pasan en PDFs mal hechos): Postgres no las acepta
    .replace(/[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/g, "\ufffd")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u200b-\u200d\u2060\ufeff\u00ad]/g, "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/g, " ")
    .replace(/[\t\u00a0\u2000-\u200a\u202f\u205f\u3000]/g, " ")
    .replace(/[\u2028\u2029]/g, "\n")
    .split("\n")
    .map((linea) => linea.replace(/ {2,}/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

type Pieza = { texto: string; parrafoNuevo: boolean };

/** Corta un texto largo por palabras, en pedazos de máximo `tamano`. */
function porPalabras(texto: string, tamano: number): string[] {
  const salida: string[] = [];
  let resto = texto;
  while (resto.length > tamano) {
    let corte = resto.lastIndexOf(" ", tamano);
    if (corte < tamano * 0.5) corte = tamano; // una "palabra" enorme: se corta parejo
    salida.push(resto.slice(0, corte).trim());
    resto = resto.slice(corte).trim();
  }
  if (resto) salida.push(resto);
  return salida;
}

/** Un párrafo largo → oraciones (o líneas); una oración enorme → palabras. */
function porOraciones(parrafo: string, tamano: number): string[] {
  const oraciones = parrafo
    .split(/(?<=[.!?…;:])\s+|\n+/)
    .map((o) => o.trim())
    .filter(Boolean);
  return oraciones.flatMap((o) => (o.length > tamano ? porPalabras(o, tamano) : [o]));
}

/** Las piezas en orden, marcando cuáles empiezan un párrafo nuevo. */
function piezasDe(texto: string, tamano: number): Pieza[] {
  const piezas: Pieza[] = [];
  for (const parrafo of texto.split(/\n{2,}/)) {
    const p = parrafo.trim();
    if (!p) continue;
    const partes = p.length > tamano ? porOraciones(p, tamano) : [p];
    partes.forEach((t, i) => piezas.push({ texto: t, parrafoNuevo: i === 0 }));
  }
  return piezas;
}

/**
 * Lo que se repite al inicio del fragmento siguiente: los últimos ~`encime`
 * caracteres, empezando en un inicio de oración si hay uno cerca, o si no
 * en un inicio de palabra (nunca a media palabra).
 */
export function colaParaEncime(texto: string, encime: number): string {
  if (encime <= 0) return "";
  if (texto.length <= encime) return texto.trim();
  const ventana = texto.slice(texto.length - encime);
  const oracion = /[.!?…]\s+(?=\S)/.exec(ventana);
  if (oracion && ventana.length - (oracion.index + oracion[0].length) >= 40) {
    return ventana.slice(oracion.index + oracion[0].length).trim();
  }
  const palabra = /\s+(?=\S)/.exec(ventana);
  return (palabra ? ventana.slice(palabra.index + palabra[0].length) : ventana).trim();
}

/** Parte el texto en fragmentos encimados. Texto vacío → []. */
export function trocear(texto: string, opciones: OpcionesTroceo = {}): string[] {
  const tamano = Math.max(200, Math.min(opciones.tamano ?? TAMANO_FRAGMENTO, MAX_TEXTO_FRAGMENTO / 2));
  const encime = Math.max(0, Math.min(opciones.encime ?? ENCIME_FRAGMENTO, Math.floor(tamano / 3)));
  const maximo = Math.max(1, opciones.maxFragmentos ?? MAX_FRAGMENTOS);

  const limpio = normalizarTexto(texto);
  if (!limpio) return [];

  const fragmentos: string[] = [];
  let actual = "";
  let hayNuevo = false; // ¿el fragmento en curso tiene algo además del encime?

  for (const pieza of piezasDe(limpio, tamano)) {
    const separador = (cuerpo: string) => (cuerpo ? (pieza.parrafoNuevo ? "\n\n" : " ") : "");
    if (hayNuevo && actual.length + separador(actual).length + pieza.texto.length > tamano) {
      fragmentos.push(actual.trim());
      if (fragmentos.length >= maximo) return fragmentos;
      actual = colaParaEncime(actual, encime);
      hayNuevo = false;
    }
    actual += separador(actual) + pieza.texto;
    hayNuevo = true;
  }
  if (hayNuevo && actual.trim()) fragmentos.push(actual.trim());
  return fragmentos.slice(0, maximo).map((f) => f.slice(0, MAX_TEXTO_FRAGMENTO));
}
