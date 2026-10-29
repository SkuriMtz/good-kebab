import { AGENTE_POR_ID, type IdAgente } from "@/lib/agentes";

/** "Lola y Víctor", "Clara e Iris", "Lola, Clara y Víctor". */
export function nombresAgentes(ids: readonly IdAgente[]) {
  const n = ids.map((id) => AGENTE_POR_ID[id].nombre);
  if (n.length < 2) return n.join("");
  const ultimo = n[n.length - 1];
  return `${n.slice(0, -1).join(", ")} ${/^[iIíÍ]/.test(ultimo) ? "e" : "y"} ${ultimo}`;
}

/** Quita acentos y mayúsculas para buscar ("victor" encuentra a "Víctor"). */
export const sinAcentos = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLocaleLowerCase("es-MX")
    .trim();
