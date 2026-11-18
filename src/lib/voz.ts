import { MAX_VOZ } from "./ajustes";

/*
 * HUELLA DE VOZ: cómo escribe el dueño, para que lo que Atendel redacta a su
 * nombre suene a él. Se aprende de sus correos enviados (Gmail) o de textos
 * suyos que pega en Ajustes, y él la puede leer y corregir. Aquí van las
 * piezas sin efectos (para probarlas solas):
 * - quitarle a un correo lo citado (lo que escribió otra persona);
 * - limpiar lo que regresa la IA: sin enlaces, correos, teléfonos ni montos,
 *   y corta (es una descripción de estilo, no datos ni órdenes).
 */

/** Lo que escribió el dueño en un correo: sin lo citado («> …», «El lunes, Ana escribió:») ni la parte de abajo. */
export function cuerpoPropio(texto: string): string {
  const lineas: string[] = [];
  for (const l of texto.replace(/\r/g, "").split("\n")) {
    if (/^\s*(El|On)\b.{0,200}\b(escribió|wrote)\s*:?\s*$/i.test(l)) break;
    if (/^\s*-{2,}\s*(Mensaje original|Original Message|Forwarded message)/i.test(l)) break;
    if (/^\s*(De|From)\s*:\s*\S/i.test(l) && lineas.length > 2) break;
    if (/^\s*>/.test(l)) continue;
    lineas.push(l);
  }
  return lineas.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

const ENLACE = /\b(?:https?:\/\/|www\.)\S+/gi;
const CORREO = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,24}/gi;
const TELEFONO = /\+?\d[\d\s().-]{7,}\d/g;
const MONTO = /\$\s?\d[\d,.]*/g;

/** Lo que regresa la IA, listo para guardarse: renglones cortos que empiezan con «- », sin datos personales. */
export function limpiarVoz(texto: string): string {
  const renglones = texto
    .replace(/\r/g, "")
    .split("\n")
    .map((l) =>
      l
        .replace(ENLACE, "")
        .replace(CORREO, "")
        .replace(TELEFONO, "")
        .replace(MONTO, "")
        .replace(/[<>`]/g, "")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter((l) => /^-\s+\S/.test(l))
    .map((l) => (l.length > 200 ? `${l.slice(0, 199)}…` : l))
    .slice(0, 12);
  let salida = "";
  for (const r of renglones) {
    if ((salida ? salida.length + 1 : 0) + r.length > MAX_VOZ) break;
    salida += (salida ? "\n" : "") + r;
  }
  return salida;
}

/** Junta los textos de muestra (cada uno corto) hasta un tope, para mandarlos a la IA. */
export function muestras(textos: readonly string[], max = 12_000): string {
  let total = "";
  for (const t of textos) {
    const limpio = cuerpoPropio(t).slice(0, 1500).trim();
    if (limpio.length < 20) continue;
    const pieza = `<texto>\n${limpio.replace(/<\/?texto>/gi, "")}\n</texto>`;
    if (total.length + pieza.length > max) break;
    total += (total ? "\n" : "") + pieza;
  }
  return total;
}
