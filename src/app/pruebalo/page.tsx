import type { Metadata } from "next";
import { PruebaloDashboard } from "@/components/dashboard/PruebaloDashboard";
import { VERSION } from "@/lib/version";

export const metadata: Metadata = {
  title: "Pruébalo",
  description: "Así se ve Atendel por dentro: el panel de un negocio con datos de ejemplo y el chat con los agentes. No llama a la IA.",
};

/**
 * Pruébalo: el panel completo con datos de ejemplo de un negocio inventado
 * (src/lib/demo-dashboard.ts). Inicio, Chat (el chat de ejemplo con grupos
 * y PromptBar), Agentes, Pendientes, Estadísticas y Correo, sin recargar.
 */
export default function Pruebalo() {
  return <PruebaloDashboard version={VERSION} />;
}
