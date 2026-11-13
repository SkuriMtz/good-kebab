/**
 * PRESENTACIONES (.pptx) que arma tu equipo (Iris, sobre todo).
 *
 * Lo mismo corre en el servidor (la herramienta crear_presentacion del chat,
 * que guarda el archivo en Storage) y en el navegador (la descarga de
 * ejemplo de /pruebalo). Diseño sobrio y del negocio, no de Atendel:
 * portada con el título y diapositivas de título + puntos.
 */

export type Diapositiva = { titulo: string; puntos: string[] };
export type DatosPresentacion = { titulo: string; subtitulo?: string; negocio?: string; diapositivas: Diapositiva[] };

export const MAX_DIAPOSITIVAS = 15;
export const MAX_PUNTOS = 8;

const limpio = (v: unknown, max: number) =>
  typeof v === "string"
    ? v
        .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, max)
    : "";

/** Lo que pide la IA → una presentación válida (o un error en palabras). */
export function validarPresentacion(args: Record<string, unknown>): DatosPresentacion | string {
  const titulo = limpio(args.titulo, 120);
  if (!titulo) return "Falta el título de la presentación.";
  const lista = Array.isArray(args.diapositivas) ? args.diapositivas : [];
  const diapositivas = lista
    .slice(0, MAX_DIAPOSITIVAS)
    .map((d) => {
      const o = (d && typeof d === "object" ? d : {}) as Record<string, unknown>;
      const puntos = (Array.isArray(o.puntos) ? o.puntos : []).map((p) => limpio(p, 220)).filter(Boolean).slice(0, MAX_PUNTOS);
      return { titulo: limpio(o.titulo, 120), puntos };
    })
    .filter((d) => d.titulo || d.puntos.length);
  if (!diapositivas.length) return "La presentación necesita al menos una diapositiva con título o puntos.";
  return { titulo, subtitulo: limpio(args.subtitulo, 160) || undefined, diapositivas };
}

/** "Presentación de ejemplo" → "Presentacion-de-ejemplo.pptx" */
export function nombreArchivo(titulo: string) {
  const base = titulo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 ]+/g, " ")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
  return `${base || "Presentacion"}.pptx`;
}

const TINTA = "111827";
const GRIS = "6B7280";
const ACENTO = "2563EB";
const LETRA = "Arial";

/** Arma el .pptx y regresa sus bytes. */
export async function generarPresentacion(p: DatosPresentacion): Promise<Uint8Array> {
  const { default: PptxGenJS } = await import("pptxgenjs");
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE"; // 13.33 × 7.5 in
  pptx.title = p.titulo;
  if (p.negocio) pptx.company = p.negocio;
  const fecha = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Mexico_City" }).format(new Date());
  const total = p.diapositivas.length + 1;

  // Portada
  const portada = pptx.addSlide();
  portada.background = { color: "FFFFFF" };
  portada.addShape("rect", { x: 0, y: 0, w: 0.28, h: 7.5, fill: { color: ACENTO }, line: { color: ACENTO } });
  portada.addText(p.titulo, { x: 0.9, y: 2.3, w: 11.6, h: 1.6, fontFace: LETRA, fontSize: 40, bold: true, color: TINTA, valign: "bottom", fit: "shrink" });
  portada.addShape("rect", { x: 0.9, y: 4.05, w: 1.4, h: 0.06, fill: { color: ACENTO }, line: { color: ACENTO } });
  if (p.subtitulo) portada.addText(p.subtitulo, { x: 0.9, y: 4.3, w: 11.6, h: 0.9, fontFace: LETRA, fontSize: 20, color: GRIS, valign: "top", fit: "shrink" });
  portada.addText([p.negocio, fecha].filter(Boolean).join("  ·  "), { x: 0.9, y: 6.6, w: 11.6, h: 0.4, fontFace: LETRA, fontSize: 12, color: GRIS });

  // Contenido
  p.diapositivas.forEach((d, i) => {
    const s = pptx.addSlide();
    s.background = { color: "FFFFFF" };
    s.addText(d.titulo || p.titulo, { x: 0.8, y: 0.45, w: 11.7, h: 0.9, fontFace: LETRA, fontSize: 28, bold: true, color: TINTA, valign: "middle", fit: "shrink" });
    s.addShape("rect", { x: 0.8, y: 1.38, w: 11.7, h: 0.02, fill: { color: "E5E7EB" }, line: { color: "E5E7EB" } });
    if (d.puntos.length) {
      s.addText(
        d.puntos.map((t) => ({ text: t, options: { bullet: { indent: 18 }, breakLine: true } })),
        { x: 0.8, y: 1.7, w: 11.7, h: 4.9, fontFace: LETRA, fontSize: d.puntos.length > 5 ? 20 : 24, color: TINTA, valign: "top", paraSpaceAfter: 12, lineSpacingMultiple: 1.1 },
      );
    }
    s.addText([p.negocio, `${i + 2} / ${total}`].filter(Boolean).join("  ·  "), { x: 0.8, y: 6.9, w: 11.7, h: 0.35, fontFace: LETRA, fontSize: 10, color: GRIS, align: "right" });
  });

  return (await pptx.write({ outputType: "uint8array" })) as Uint8Array;
}

export const TIPO_PPTX = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
