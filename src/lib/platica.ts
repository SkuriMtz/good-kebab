/*
 * MODO PLÁTICA (hablarle a Atendel y que conteste en voz): las piezas sin
 * efectos, para probarlas solas. Las usan el navegador (ModoPlatica) y el
 * servidor (/api/platica/*).
 * - La voz la pone un servicio aparte (ElevenLabs): escucha (voz → texto) y
 *   habla (texto → voz). Lo que cuesta se suma al uso del chat.
 * - La respuesta se va diciendo por frases mientras llega (como ChatGPT): no
 *   espera a que termine todo.
 */

/** Lo que se agrega al mensaje cuando viene del modo plática (no a las instrucciones: así no se rompe la caché). */
export const INSTRUCCIONES_VOZ = `<modo_voz>
El dueño te está HABLANDO en voz alta (su voz se pasó a texto, puede traer errores de dictado: entiende la intención) y va a OÍR tu respuesta, no a leerla.
- Contesta corto y natural, como en una llamada: de 1 a 4 frases. Lo más importante primero (si pregunta un número, empieza por el número).
- Sin tablas, listas, títulos, negritas, enlaces, emojis ni direcciones web: frases completas.
- Si algo es largo (un informe), di lo principal y ofrece mandarle el detalle por escrito en el chat.
- Las reglas de siempre siguen igual: lo que necesita su OK se queda esperando su OK en la pantalla.
</modo_voz>`;

/** Costos de la voz, en micro-dólares (precios públicos de ElevenLabs, nov 2026). */
export const COSTO_HABLAR_POR_LETRA = 40; // $0.04 por cada 1,000 caracteres
export const COSTO_ESCUCHAR_POR_SEGUNDO = 56; // $0.20 por hora (redondeado hacia arriba)

/** Topes. */
export const MAX_FRASE = 700; // lo que se manda a decir de una vez
export const MAX_AUDIO_BYTES = 3_000_000; // ~1 minuto de voz (sobra)
export const MIN_AUDIO_BYTES = 1_000;

/** Lo que cuesta escuchar `segundos` de audio. */
export const costoEscuchar = (segundos: number) => Math.max(1, Math.ceil(Math.max(0, segundos) * COSTO_ESCUCHAR_POR_SEGUNDO));
/** Lo que cuesta decir un texto. */
export const costoHablar = (texto: string) => Math.max(1, texto.length * COSTO_HABLAR_POR_LETRA);

const EMOJI = /[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu;

/** Un texto del chat (con Markdown) listo para decirse: sin enlaces, marcas, tablas ni emojis. */
export function textoParaVoz(md: string): string {
  return (
    md
      .replace(/\r/g, "")
      // [texto](enlace) → texto; las direcciones sueltas no se leen
      .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/\bhttps?:\/\/\S+|\bwww\.\S+/gi, "")
      .replace(/<[^>]{0,200}>/g, " ")
      // Tablas: las rayas de separación fuera, las barras como pausas
      .replace(/^\s*\|?\s*:?-{3,}.*$/gm, "")
      .replace(/\s*\|\s*/g, ", ")
      // Títulos, viñetas y citas: fuera la marca, queda el texto
      .replace(/^\s{0,3}#{1,6}\s+/gm, "")
      .replace(/^\s*(?:[-*•]|\d+[.)])\s+/gm, "")
      .replace(/^\s*>\s?/gm, "")
      // Negritas, cursivas, código
      .replace(/(\*\*|__|\*|_|~~|`{1,3})/g, "")
      .replace(EMOJI, "")
      .replace(/[ \t]+/g, " ")
      .replace(/ ?\n+ ?/g, "\n")
      .replace(/^[,\s]+|[,\s]+$/g, "")
  );
}

/**
 * De la respuesta que va llegando (Markdown), las frases completas que siguen
 * después de `desde`, juntas en pedazos de al menos ~60 letras (menos llamadas
 * y suena más natural). Con `fin`, también lo que sobra. Regresa hasta dónde
 * se tomó, para la siguiente vez.
 */
export function frasesListas(texto: string, desde: number, fin: boolean): { frases: string[]; hasta: number } {
  const frases: string[] = [];
  let inicio = desde;
  let corte = -1;
  // Fin de frase: . ! ? … o : seguidos de espacio o salto, o un salto de línea
  const fines = /[.!?…:](?=\s)|\n/g;
  fines.lastIndex = desde;
  for (let m = fines.exec(texto); m; m = fines.exec(texto)) {
    corte = m.index + 1;
    if (corte - inicio >= 60) {
      const f = textoParaVoz(texto.slice(inicio, corte));
      if (f) frases.push(...partirLargo(f));
      inicio = corte;
    }
  }
  if (fin && inicio < texto.length) {
    const f = textoParaVoz(texto.slice(inicio));
    if (f) frases.push(...partirLargo(f));
    inicio = texto.length;
  }
  return { frases, hasta: inicio };
}

/** Un pedazo muy largo (sin puntos) se corta en comas o espacios para no pasar del tope. */
function partirLargo(f: string): string[] {
  const salida: string[] = [];
  let resto = f.replace(/\n/g, " ").trim();
  while (resto.length > MAX_FRASE) {
    const ventana = resto.slice(0, MAX_FRASE);
    const corte = Math.max(ventana.lastIndexOf(", "), ventana.lastIndexOf(" "));
    const i = corte > MAX_FRASE * 0.5 ? corte + 1 : MAX_FRASE;
    salida.push(resto.slice(0, i).trim());
    resto = resto.slice(i).trim();
  }
  if (resto) salida.push(resto);
  return salida;
}
