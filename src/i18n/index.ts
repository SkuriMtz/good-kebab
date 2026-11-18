import { AGENTE_POR_ID, AGENTES_INFO, type AgenteInfo, type IdAgente } from "@/lib/agentes";
import { PLANES, type Plan } from "@/lib/planes";
import { de } from "./de";
import { en } from "./en";
import { es, type Diccionario } from "./es";
import { fr } from "./fr";
import { it } from "./it";
import { pt } from "./pt";
import { zh } from "./zh";

/**
 * Idiomas del sitio público: inglés (el de siempre), español, portugués,
 * francés, alemán, italiano y chino (el selector con el globo del menú). La elección vive en la cookie
 * `atendel-idioma`: el servidor la lee con cookies() (src/i18n/servidor.ts) y
 * el navegador la cambia y pide la página otra vez (src/i18n/Idioma.tsx).
 * El panel (/panel) y /pruebalo siguen en español.
 */
export const IDIOMAS = ["en", "es", "pt", "fr", "de", "it", "zh"] as const;
export type Idioma = (typeof IDIOMAS)[number];
export const IDIOMA_COOKIE = "atendel-idioma";
export const IDIOMA_POR_DEFECTO: Idioma = "en";

export const esIdioma = (v: unknown): v is Idioma => typeof v === "string" && (IDIOMAS as readonly string[]).includes(v);
export const idiomaDe = (v: unknown): Idioma => (esIdioma(v) ? v : IDIOMA_POR_DEFECTO);

export type { Diccionario } from "./es";

/** El nombre de cada idioma en su propio idioma (el selector). */
export const NOMBRE_IDIOMA: Record<Idioma, string> = {
  en: "English",
  es: "Español",
  pt: "Português",
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
  zh: "中文",
};

/** Para fechas y números (Intl) y para <html lang>. */
export const LOCALE: Record<Idioma, string> = {
  en: "en-US",
  es: "es-MX",
  pt: "pt-BR",
  fr: "fr-FR",
  de: "de-DE",
  it: "it-IT",
  zh: "zh-CN",
};

const DICCIONARIOS: Record<Idioma, Diccionario> = { en, es, pt, fr, de, it, zh };

/** Los textos de un idioma: `t(idioma).barra.precios`. */
export function t(idioma: Idioma): Diccionario {
  return DICCIONARIOS[idioma] ?? en;
}

/** Números con el formato de cada idioma (1,000 · 3.000). */
export const numero = (idioma: Idioma, n: number) => n.toLocaleString(LOCALE[idioma]);

/* ---------- Agentes y planes con los textos de cada idioma ---------- */

/** Los agentes (src/lib/agentes.ts) con su área, lema y demás en el idioma pedido. */
export function agentesDe(idioma: Idioma): AgenteInfo[] {
  const d = t(idioma);
  return AGENTES_INFO.map((a) => ({ ...a, ...d.agentes[a.id] }));
}

export function agenteDe(idioma: Idioma, id: IdAgente): AgenteInfo {
  return { ...AGENTE_POR_ID[id], ...t(idioma).agentes[id] };
}

/** Los planes (src/lib/planes.ts) con nivel, precio, resumen e "incluye" en el idioma pedido. */
export function planesDe(idioma: Idioma): Plan[] {
  const d = t(idioma);
  return PLANES.map((p) => ({ ...p, ...d.planes[p.id] }));
}

/** El plan más sencillo que trae a ese agente, en el idioma pedido. */
export function planMinimoDe(idioma: Idioma, agente: IdAgente): Plan {
  const planes = planesDe(idioma);
  return planes.find((p) => p.agentes.includes(agente)) ?? planes[planes.length - 1];
}
