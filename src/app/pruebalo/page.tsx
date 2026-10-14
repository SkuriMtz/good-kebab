import type { Metadata } from "next";
import { FichasAgentes } from "@/components/agentes/FichasAgentes";
import { PruebaloDashboard } from "@/components/dashboard/Pruebalo";

export const metadata: Metadata = {
  title: "Pruébalo",
  description:
    "Así se ve el panel de Atendel un día normal en una clínica: lo que espera tu visto bueno, la actividad de tus agentes y el chat con ellos. Datos de ejemplo.",
};

/**
 * Pruébalo: el dashboard de Atendel con datos de ejemplo de una clínica
 * (src/lib/demo-dashboard.ts). Resumen, Conversaciones (el chat de ejemplo,
 * con grupos y PromptBar), Agentes y Correo cambian sin recargar.
 * Nada llama a la IA.
 */
export default function Pruebalo() {
  return (
    <>
      <PruebaloDashboard />
      <FichasAgentes />
    </>
  );
}
