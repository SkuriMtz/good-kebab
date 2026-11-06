/**
 * LIMPIAR DATOS ANTES DE PONERLOS EN EL SYSTEM DEL CHAT
 *
 * El system lleva bloques de DATOS (perfil, documentos, correos) entre
 * marcas como <perfil_del_negocio>…</perfil_del_negocio>. Si un documento
 * o un correo trajera "</perfil_del_negocio>" podría "cerrar" el bloque y
 * hacerse pasar por instrucciones. Por eso, a todo dato que viene de afuera:
 * - se le quitan las marcas de TODOS los bloques (también con espacios,
 *   mayúsculas, caracteres invisibles o los signos < > / de ancho completo),
 *   repitiendo hasta que no quede ninguna;
 * - se le quitan los caracteres de control y las marcas "@@" de los grupos;
 * - y se recorta a un tope.
 * Sin "server-only" a propósito: es puro y se prueba con un script local.
 */

/** Las marcas de los bloques de datos del system. */
export const ETIQUETAS_DE_DATOS = ["perfil_del_negocio", "documentos_del_negocio", "correos_recientes", "documento", "fragmento"] as const;

const ABRE = "[<\\uff1c\\ufe64]";
const BARRA = "[/\\uff0f\\\\]";
const CIERRA = "[>\\uff1e\\ufe65]";
const NOMBRES = ETIQUETAS_DE_DATOS.map((e) => e.split("_").join("[\\s_-]*")).join("|");
const MARCA = new RegExp(`${ABRE}\\s*${BARRA}?\\s*(?:${NOMBRES})\\b[^>\\uff1e\\ufe65]{0,200}${CIERRA}`, "gi");
const INVISIBLES = /[\u200b-\u200f\u2060-\u2064\ufeff\u00ad\u202a-\u202e\u2066-\u2069]/g;

/** Quita las marcas de los bloques (repite hasta que no quede ninguna). */
export function quitarMarcas(texto: string): string {
  let t = texto.replace(INVISIBLES, "");
  for (let i = 0; i < 10; i++) {
    const siguiente = t.replace(MARCA, " ");
    if (siguiente === t) break;
    t = siguiente;
  }
  return t;
}

/**
 * Un dato limpio para el system. Con `lineas` conserva los saltos de línea
 * (listas de precios, horarios); sin él, queda en una sola línea.
 */
export function limpiarDato(texto: string | null | undefined, tope: number, opciones: { lineas?: boolean } = {}): string {
  let t = quitarMarcas(String(texto ?? "")).replace(/@@/g, "@");
  if (opciones.lineas) {
    t = t
      .replace(/\r\n?/g, "\n")
      .replace(/[\u0000-\u0008\u000b-\u001f\u007f]+/g, " ")
      .split("\n")
      .map((l) => l.replace(/[ \t]+/g, " ").trim())
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  } else {
    t = t.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();
  }
  return t.length > tope ? `${t.slice(0, Math.max(0, tope - 1)).trimEnd()}…` : t;
}
