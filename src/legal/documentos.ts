import type { Politica } from "./politicas";
import { AVISO_PRIVACIDAD } from "./aviso-privacidad";
import { PRIVACY_NOTICE } from "./aviso-privacidad.en";
import { COOKIES } from "./cookies";
import { COOKIES_EN } from "./cookies.en";
import { DPA } from "./dpa";
import { POLITICA_IA } from "./inteligencia-artificial";
import { PREGUNTAS_LEGALES } from "./preguntas";
import { PROVEEDORES } from "./proveedores";
import { REEMBOLSOS } from "./reembolsos";
import { SLA } from "./sla";
import { TERMINOS } from "./terminos";
import { TERMS } from "./terminos.en";
import { USO_ACEPTABLE } from "./uso-aceptable";

/** Lo que muestra la página de un documento: la etiqueta de arriba, el título, el tipo (ficha) y el texto en Markdown. */
export type VersionDoc = { etiqueta: string; titulo: string; tipo: string; texto: string };

/**
 * Los textos de cada documento (solo para el servidor: pesan). Sin `en`, el
 * documento todavía está solo en español. Las páginas /privacidad, /terminos
 * y /cookies arman su versión ellas mismas (llevan una entrada propia); aquí
 * van sus textos para contar secciones y buscar en el Centro de privacidad.
 */
export const DOCUMENTOS: Record<Politica, { es: VersionDoc; en?: VersionDoc }> = {
  privacidad: {
    es: { etiqueta: "Legal · Privacidad", titulo: "Aviso de Privacidad", tipo: "Aviso integral", texto: AVISO_PRIVACIDAD },
    en: { etiqueta: "Legal · Privacy", titulo: "Privacy Notice", tipo: "Comprehensive notice", texto: PRIVACY_NOTICE },
  },
  preguntas: {
    es: { etiqueta: "Legal · Preguntas", titulo: "Preguntas frecuentes", tipo: "Privacidad, seguridad y condiciones", texto: PREGUNTAS_LEGALES },
  },
  terminos: {
    es: { etiqueta: "Legal · Términos", titulo: "Términos y Condiciones de Uso", tipo: "Condiciones generales", texto: TERMINOS },
    en: { etiqueta: "Legal · Terms", titulo: "Terms and Conditions of Use", tipo: "General conditions", texto: TERMS },
  },
  cookies: {
    es: { etiqueta: "Legal · Cookies", titulo: "Política de Cookies", tipo: "Cookies y tecnologías similares", texto: COOKIES },
    en: { etiqueta: "Legal · Cookies", titulo: "Cookie Policy", tipo: "Cookies and similar technologies", texto: COOKIES_EN },
  },
  tratamiento: {
    es: { etiqueta: "Legal · Tratamiento de datos", titulo: "Acuerdo de Tratamiento de Datos Personales", tipo: "Acuerdo (DPA)", texto: DPA },
  },
  uso: {
    es: { etiqueta: "Legal · Uso aceptable", titulo: "Política de Uso Aceptable", tipo: "Reglas de uso", texto: USO_ACEPTABLE },
  },
  reembolsos: {
    es: { etiqueta: "Legal · Reembolsos", titulo: "Política de Cancelaciones y Reembolsos", tipo: "Planes Free, One y Max", texto: REEMBOLSOS },
  },
  ia: {
    es: { etiqueta: "Legal · Inteligencia artificial", titulo: "Política de Inteligencia Artificial", tipo: "Uso de la IA", texto: POLITICA_IA },
  },
  servicio: {
    es: { etiqueta: "Legal · Nivel de servicio", titulo: "Acuerdo de Nivel de Servicio", tipo: "Acuerdo (SLA)", texto: SLA },
  },
  proveedores: {
    es: { etiqueta: "Legal · Proveedores", titulo: "Lista de Proveedores y Subencargados", tipo: "Lista de proveedores", texto: PROVEEDORES },
  },
};

const normal = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** El texto de una línea de Markdown, sin marcas (negritas, cursivas, tablas, viñetas). */
const limpio = (l: string) =>
  l
    .replace(/^\s*(?:[-*]|\d+\.)\s+/, "")
    .replace(/\*\*|\*|`/g, "")
    .replace(/\|/g, " ")
    .replace(/\s+/g, " ")
    .trim();

type Seccion = { id: string | null; titulo: string; texto: string };

/** Las secciones de un texto (### …), con su id (seccion-N, como DocumentoMd) y su texto limpio. */
export function seccionesConTexto(texto: string): Seccion[] {
  const salida: Seccion[] = [{ id: null, titulo: "", texto: "" }];
  let n = 0;
  for (const linea of texto.split("\n")) {
    const l = linea.trimEnd();
    if (l.startsWith("### ")) {
      salida.push({ id: `seccion-${++n}`, titulo: limpio(l.slice(4)), texto: "" });
      continue;
    }
    if (!l.trim() || l.startsWith("# ") || l.startsWith("## ") || /^-{3,}$/.test(l.trim()) || /^\|?\s*:?-{3,}/.test(l.trim())) continue;
    const actual = salida[salida.length - 1];
    actual.texto += (actual.texto ? " " : "") + limpio(l);
  }
  return salida.filter((s) => s.id || s.texto);
}

/** Cuántas secciones tiene (o cuántas preguntas, si es de preguntas). */
export function cuenta(texto: string) {
  const preguntas = texto.match(/^\*\*¿/gm)?.length ?? 0;
  return preguntas > 0 ? { n: preguntas, que: "preguntas" as const } : { n: seccionesConTexto(texto).filter((s) => s.id).length, que: "secciones" as const };
}

export type Resultado = { id: Politica; seccion: string | null; titulo: string; antes: string; marca: string; despues: string };

/**
 * Busca las palabras en todos los documentos (sin acentos ni mayúsculas): una
 * sección sale si tiene todas. Devuelve un pedacito alrededor de la primera
 * palabra, con esa palabra aparte para resaltarla.
 */
export function buscar(consulta: string, version: (id: Politica) => VersionDoc, ids: readonly Politica[], max = 30): Resultado[] {
  const palabras = normal(consulta)
    .split(/\s+/)
    .filter((p) => p.length > 1)
    .slice(0, 8);
  if (!palabras.length) return [];
  const salida: Resultado[] = [];
  for (const id of ids) {
    for (const s of seccionesConTexto(version(id).texto)) {
      const todo = normal(`${s.titulo} ${s.texto}`);
      if (!palabras.every((p) => todo.includes(p))) continue;
      // El texto limpio y su versión sin acentos miden lo mismo (NFD quita solo las marcas)
      const base = s.texto || s.titulo;
      const sinAcentos = normal(base);
      const donde = sinAcentos.indexOf(palabras[0]);
      const desde = Math.max(0, (donde < 0 ? 0 : donde) - 90);
      if (donde < 0) {
        salida.push({ id, seccion: s.id, titulo: s.titulo, antes: base.slice(0, 200) + (base.length > 200 ? "…" : ""), marca: "", despues: "" });
      } else {
        const fin = donde + palabras[0].length;
        salida.push({
          id,
          seccion: s.id,
          titulo: s.titulo,
          antes: (desde > 0 ? "…" : "") + base.slice(desde, donde),
          marca: base.slice(donde, fin),
          despues: base.slice(fin, fin + 140) + (fin + 140 < base.length ? "…" : ""),
        });
      }
      if (salida.length >= max) return salida;
    }
  }
  return salida;
}
