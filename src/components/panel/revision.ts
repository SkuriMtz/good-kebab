import { esIdAgente, type IdAgente } from "@/lib/agentes";

/*
 * Lo de la revisión diaria que también usa el servidor (src/app/panel/page.tsx).
 * Va aparte de RevisionDiaria.tsx porque ese archivo es solo del navegador
 * ("use client"), y el servidor no puede llamar funciones de ahí.
 */

export type FaltaRevision = { texto: string; href: string };
export type ParteRevision = { agente: IdAgente; faltan: FaltaRevision[] };
export type DatosRevision = { id?: string; fecha: string; creado: string; partes: ParteRevision[]; faltan: number; leida?: boolean };

/** Lee lo que guardó la base de datos, sin confiar en su forma. */
export function partesDe(valor: unknown): ParteRevision[] {
  if (!Array.isArray(valor)) return [];
  return valor.flatMap((p) => {
    if (!p || typeof p !== "object") return [];
    const { agente, faltan } = p as { agente?: unknown; faltan?: unknown };
    if (!esIdAgente(agente)) return [];
    const lista = Array.isArray(faltan)
      ? faltan.flatMap((f) => {
          const x = f as { texto?: unknown; href?: unknown };
          // Solo enlaces del panel
          return typeof x?.texto === "string" && typeof x?.href === "string" && x.href.startsWith("/") && !x.href.startsWith("//") ? [{ texto: x.texto.slice(0, 300), href: x.href.slice(0, 300) }] : [];
        })
      : [];
    return [{ agente, faltan: lista }];
  });
}
