import type { Metadata } from "next";
import { TableroDemo } from "@/components/dashboard/TableroDemo";

export const metadata: Metadata = {
  title: "Pruébalo",
  description:
    "El panel de Atendel con datos de ejemplo de una clínica estética: lo que hicieron Lola, Clara, Víctor e Iris hoy, lo que espera tu visto bueno y el chat con tu equipo.",
};

/**
 * Pruébalo: el dashboard de Atendel completo, con datos de ejemplo (marcados
 * en pantalla) y el chat de demostración (guion local, sin llamar a la IA).
 */
export default function Pruebalo() {
  return <TableroDemo />;
}
