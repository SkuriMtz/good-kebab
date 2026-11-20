import type { Idioma } from "@/i18n";
import type { Politica } from "./politicas";
import { AVISO_PRIVACIDAD } from "./aviso-privacidad";
import { PRIVACY_NOTICE } from "./aviso-privacidad.en";
import { TEXTO as PRIVACIDAD_PT } from "./aviso-privacidad.pt";
import { TEXTO as PRIVACIDAD_FR } from "./aviso-privacidad.fr";
import { TEXTO as PRIVACIDAD_DE } from "./aviso-privacidad.de";
import { TEXTO as PRIVACIDAD_IT } from "./aviso-privacidad.it";
import { TEXTO as PRIVACIDAD_ZH } from "./aviso-privacidad.zh";
import { ACCESO_DATOS } from "./acceso-datos";
import { TEXTO as ACCESO_EN } from "./acceso-datos.en";
import { TEXTO as ACCESO_PT } from "./acceso-datos.pt";
import { TEXTO as ACCESO_FR } from "./acceso-datos.fr";
import { TEXTO as ACCESO_DE } from "./acceso-datos.de";
import { TEXTO as ACCESO_IT } from "./acceso-datos.it";
import { TEXTO as ACCESO_ZH } from "./acceso-datos.zh";
import { PREGUNTAS_LEGALES } from "./preguntas";
import { TEXTO as PREGUNTAS_EN } from "./preguntas.en";
import { TEXTO as PREGUNTAS_PT } from "./preguntas.pt";
import { TEXTO as PREGUNTAS_FR } from "./preguntas.fr";
import { TEXTO as PREGUNTAS_DE } from "./preguntas.de";
import { TEXTO as PREGUNTAS_IT } from "./preguntas.it";
import { TEXTO as PREGUNTAS_ZH } from "./preguntas.zh";
import { TERMINOS } from "./terminos";
import { TERMS } from "./terminos.en";
import { TEXTO as TERMINOS_PT } from "./terminos.pt";
import { TEXTO as TERMINOS_FR } from "./terminos.fr";
import { TEXTO as TERMINOS_DE } from "./terminos.de";
import { TEXTO as TERMINOS_IT } from "./terminos.it";
import { TEXTO as TERMINOS_ZH } from "./terminos.zh";
import { COOKIES } from "./cookies";
import { COOKIES_EN } from "./cookies.en";
import { TEXTO as COOKIES_PT } from "./cookies.pt";
import { TEXTO as COOKIES_FR } from "./cookies.fr";
import { TEXTO as COOKIES_DE } from "./cookies.de";
import { TEXTO as COOKIES_IT } from "./cookies.it";
import { TEXTO as COOKIES_ZH } from "./cookies.zh";
import { DPA } from "./dpa";
import { TEXTO as TRATAMIENTO_EN } from "./dpa.en";
import { TEXTO as TRATAMIENTO_PT } from "./dpa.pt";
import { TEXTO as TRATAMIENTO_FR } from "./dpa.fr";
import { TEXTO as TRATAMIENTO_DE } from "./dpa.de";
import { TEXTO as TRATAMIENTO_IT } from "./dpa.it";
import { TEXTO as TRATAMIENTO_ZH } from "./dpa.zh";
import { USO_ACEPTABLE } from "./uso-aceptable";
import { TEXTO as USO_EN } from "./uso-aceptable.en";
import { TEXTO as USO_PT } from "./uso-aceptable.pt";
import { TEXTO as USO_FR } from "./uso-aceptable.fr";
import { TEXTO as USO_DE } from "./uso-aceptable.de";
import { TEXTO as USO_IT } from "./uso-aceptable.it";
import { TEXTO as USO_ZH } from "./uso-aceptable.zh";
import { REEMBOLSOS } from "./reembolsos";
import { TEXTO as REEMBOLSOS_EN } from "./reembolsos.en";
import { TEXTO as REEMBOLSOS_PT } from "./reembolsos.pt";
import { TEXTO as REEMBOLSOS_FR } from "./reembolsos.fr";
import { TEXTO as REEMBOLSOS_DE } from "./reembolsos.de";
import { TEXTO as REEMBOLSOS_IT } from "./reembolsos.it";
import { TEXTO as REEMBOLSOS_ZH } from "./reembolsos.zh";
import { POLITICA_IA } from "./inteligencia-artificial";
import { TEXTO as IA_EN } from "./inteligencia-artificial.en";
import { TEXTO as IA_PT } from "./inteligencia-artificial.pt";
import { TEXTO as IA_FR } from "./inteligencia-artificial.fr";
import { TEXTO as IA_DE } from "./inteligencia-artificial.de";
import { TEXTO as IA_IT } from "./inteligencia-artificial.it";
import { TEXTO as IA_ZH } from "./inteligencia-artificial.zh";
import { SLA } from "./sla";
import { TEXTO as SERVICIO_EN } from "./sla.en";
import { TEXTO as SERVICIO_PT } from "./sla.pt";
import { TEXTO as SERVICIO_FR } from "./sla.fr";
import { TEXTO as SERVICIO_DE } from "./sla.de";
import { TEXTO as SERVICIO_IT } from "./sla.it";
import { TEXTO as SERVICIO_ZH } from "./sla.zh";
import { PROVEEDORES } from "./proveedores";
import { TEXTO as PROVEEDORES_EN } from "./proveedores.en";
import { TEXTO as PROVEEDORES_PT } from "./proveedores.pt";
import { TEXTO as PROVEEDORES_FR } from "./proveedores.fr";
import { TEXTO as PROVEEDORES_DE } from "./proveedores.de";
import { TEXTO as PROVEEDORES_IT } from "./proveedores.it";
import { TEXTO as PROVEEDORES_ZH } from "./proveedores.zh";

/**
 * El texto (Markdown) de cada documento en cada idioma. Vale el español; los
 * demás son traducciones (solo del servidor: pesan).
 */
export const TEXTOS_LEGALES: Record<Politica, Record<Idioma, string>> = {
  privacidad: { es: AVISO_PRIVACIDAD, en: PRIVACY_NOTICE, pt: PRIVACIDAD_PT, fr: PRIVACIDAD_FR, de: PRIVACIDAD_DE, it: PRIVACIDAD_IT, zh: PRIVACIDAD_ZH },
  acceso: { es: ACCESO_DATOS, en: ACCESO_EN, pt: ACCESO_PT, fr: ACCESO_FR, de: ACCESO_DE, it: ACCESO_IT, zh: ACCESO_ZH },
  preguntas: { es: PREGUNTAS_LEGALES, en: PREGUNTAS_EN, pt: PREGUNTAS_PT, fr: PREGUNTAS_FR, de: PREGUNTAS_DE, it: PREGUNTAS_IT, zh: PREGUNTAS_ZH },
  terminos: { es: TERMINOS, en: TERMS, pt: TERMINOS_PT, fr: TERMINOS_FR, de: TERMINOS_DE, it: TERMINOS_IT, zh: TERMINOS_ZH },
  cookies: { es: COOKIES, en: COOKIES_EN, pt: COOKIES_PT, fr: COOKIES_FR, de: COOKIES_DE, it: COOKIES_IT, zh: COOKIES_ZH },
  tratamiento: { es: DPA, en: TRATAMIENTO_EN, pt: TRATAMIENTO_PT, fr: TRATAMIENTO_FR, de: TRATAMIENTO_DE, it: TRATAMIENTO_IT, zh: TRATAMIENTO_ZH },
  uso: { es: USO_ACEPTABLE, en: USO_EN, pt: USO_PT, fr: USO_FR, de: USO_DE, it: USO_IT, zh: USO_ZH },
  reembolsos: { es: REEMBOLSOS, en: REEMBOLSOS_EN, pt: REEMBOLSOS_PT, fr: REEMBOLSOS_FR, de: REEMBOLSOS_DE, it: REEMBOLSOS_IT, zh: REEMBOLSOS_ZH },
  ia: { es: POLITICA_IA, en: IA_EN, pt: IA_PT, fr: IA_FR, de: IA_DE, it: IA_IT, zh: IA_ZH },
  servicio: { es: SLA, en: SERVICIO_EN, pt: SERVICIO_PT, fr: SERVICIO_FR, de: SERVICIO_DE, it: SERVICIO_IT, zh: SERVICIO_ZH },
  proveedores: { es: PROVEEDORES, en: PROVEEDORES_EN, pt: PROVEEDORES_PT, fr: PROVEEDORES_FR, de: PROVEEDORES_DE, it: PROVEEDORES_IT, zh: PROVEEDORES_ZH },
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
export function buscar(consulta: string, texto: (id: Politica) => string, ids: readonly Politica[], max = 30): Resultado[] {
  const palabras = normal(consulta)
    .split(/\s+/)
    .filter((p) => p.length > 1)
    .slice(0, 8);
  if (!palabras.length) return [];
  const salida: Resultado[] = [];
  for (const id of ids) {
    for (const s of seccionesConTexto(texto(id))) {
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
