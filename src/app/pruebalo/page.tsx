import type { Metadata } from "next";
import { DashboardDemo } from "@/components/dashboard/DashboardDemo";

export const metadata: Metadata = {
  title: "Pruébalo",
  description:
    "El panel de Atendel con datos de ejemplo de una clínica: lo que hicieron Lola, Clara, Víctor e Iris hoy, las citas, los correos y el chat con tu equipo.",
};

/**
 * Pruébalo: el dashboard completo con datos de ejemplo de una clínica
 * (Resumen, Conversaciones con el chat de demostración, Agentes, Citas y
 * Correo). Las vistas cambian sin recargar. El chat es un guion local:
 * no llama a la IA.
 */
export default function Pruebalo() {
  return <DashboardDemo />;
}
