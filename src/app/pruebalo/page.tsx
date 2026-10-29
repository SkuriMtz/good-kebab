import type { Metadata } from "next";
import { PruebaloDashboard } from "@/components/dashboard/PruebaloDashboard";

export const metadata: Metadata = {
  title: "Pruébalo",
  description: "Así se ve Atendel por dentro: el panel de una clínica con datos de ejemplo y el chat con los agentes. No llama a la IA.",
};

/**
 * Pruébalo: el dashboard completo con datos de ejemplo de una clínica
 * (src/lib/demo-dashboard.ts). Resumen, Conversaciones (el chat de ejemplo
 * con grupos y PromptBar, del Grupo 2), Agentes y Correo, sin recargar.
 */
export default function Pruebalo() {
  return <PruebaloDashboard />;
}
