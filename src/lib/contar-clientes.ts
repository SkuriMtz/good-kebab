/*
 * «¿CUÁNTOS CLIENTES PREGUNTARON POR…?»: las piezas sin efectos (para
 * probarlas solas). La herramienta del chat (herramientas/atendel.ts) lee los
 * mensajes y aquí se cuentan, sin acentos ni mayúsculas: «envio» encuentra
 * «Envíos» y «¿hacen envío?».
 */

/** Para comparar sin acentos ni mayúsculas. */
export const normalizar = (t: string) => t.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

const escapar = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Las palabras a buscar, limpias: solo letras, números y espacios; de 2 a 40 caracteres; hasta 6. */
export function palabrasDeBusqueda(v: unknown): string[] {
  const lista = Array.isArray(v) ? v : typeof v === "string" ? [v] : [];
  const salida = new Set<string>();
  for (const x of lista) {
    if (typeof x !== "string") continue;
    const p = normalizar(x)
      .replace(/[^\p{L}\p{N} ]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (p.length >= 2 && p.length <= 40) salida.add(p);
    if (salida.size >= 6) break;
  }
  return [...salida];
}

/** Una expresión por palabra: empieza donde empieza una palabra (así «envio» encuentra «envios» pero no «reenvio»). */
export function buscadores(palabras: readonly string[]): RegExp[] {
  return palabras.map((p) => new RegExp(`(^|[^\\p{L}\\p{N}])${escapar(p).replace(/ /g, "\\s+")}`, "u"));
}

export const menciona = (texto: string | null | undefined, res: readonly RegExp[]) => {
  if (!texto) return false;
  const t = normalizar(texto);
  return res.some((r) => r.test(t));
};

/** Cuántos clientes distintos (por teléfono) y cuántos mensajes lo mencionan, con hasta 5 ejemplos (uno por cliente). */
export function contarMenciones(mensajes: readonly { telefono: unknown; texto: unknown }[], res: readonly RegExp[]) {
  const clientes = new Set<string>();
  const ejemplos: string[] = [];
  let total = 0;
  for (const m of mensajes) {
    const texto = typeof m.texto === "string" ? m.texto : "";
    if (!menciona(texto, res)) continue;
    total++;
    const tel = String(m.telefono ?? "");
    if (clientes.has(tel)) continue;
    clientes.add(tel);
    if (ejemplos.length < 5) ejemplos.push(texto.replace(/\s+/g, " ").trim().slice(0, 120));
  }
  return { clientes: clientes.size, mensajes: total, ejemplos };
}
