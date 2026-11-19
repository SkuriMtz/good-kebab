/*
 * Las pestañas de Tu negocio. Aparte de TuNegocio.tsx (que es solo del
 * navegador) porque el servidor también las usa (src/app/panel/page.tsx).
 */

export const PESTANAS_NEGOCIO = ["perfil", "reglas", "memoria", "documentos", "apps"] as const;
export type PestanaNegocio = (typeof PESTANAS_NEGOCIO)[number];
export const pestanaDe = (v: string | null | undefined): PestanaNegocio => (v === "procesos" ? "reglas" : (PESTANAS_NEGOCIO as readonly string[]).includes(v ?? "") ? (v as PestanaNegocio) : "perfil");
