import type { IdAgente } from "./agentes";

/** Color y rasgo de cada personaje. Los colores se ven bien sobre fondo claro y oscuro. */
export const PERSONAJES: Record<IdAgente, { color: string; rasgo: string; fase: number }> = {
  lola: { color: "#ff8a6b", rasgo: "audífonos con micrófono", fase: 0.4 },
  clara: { color: "#7fb2ff", rasgo: "lentes redondos", fase: 2.1 },
  victor: { color: "#5fd09f", rasgo: "moño", fase: 3.7 },
  iris: { color: "#f6c64a", rasgo: "chongo con lápiz", fase: 5.2 },
};
