import { AGENTE_POR_ID, AGENTES_INFO, type AgenteInfo, type IdAgente } from "@/lib/agentes";
import { PLANES, type Plan } from "@/lib/planes";
import { en } from "./en";
import { es } from "./es";

/**
 * Idiomas del sitio público. El inglés es el de siempre; el español, a un
 * botón (EN / ES en la barra). La elección vive en la cookie
 * `atendel-idioma`: el servidor la lee con cookies() (src/i18n/servidor.ts) y
 * el navegador la cambia y pide la página otra vez (src/i18n/Idioma.tsx).
 * El panel (/panel) y /pruebalo siguen en español.
 */
export const IDIOMAS = ["en", "es"] as const;
export type Idioma = (typeof IDIOMAS)[number];
export const IDIOMA_COOKIE = "atendel-idioma";
export const IDIOMA_POR_DEFECTO: Idioma = "en";

export const esIdioma = (v: unknown): v is Idioma => v === "en" || v === "es";
export const idiomaDe = (v: unknown): Idioma => (esIdioma(v) ? v : IDIOMA_POR_DEFECTO);

export type { Diccionario } from "./es";

/** Los textos de un idioma: `t(idioma).barra.precios`. */
export function t(idioma: Idioma) {
  return idioma === "es" ? es : en;
}

/** Números con el formato de cada idioma (1,000 · 3,000). */
export const numero = (idioma: Idioma, n: number) => n.toLocaleString(idioma === "es" ? "es-MX" : "en-US");

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
