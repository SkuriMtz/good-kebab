import type { Metadata } from "next";
import { PruebaloDashboard } from "@/components/dashboard/PruebaloDashboard";
import { destinoDeParametros } from "@/lib/demo-dashboard";
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
export default function Pruebalo({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  // La vista de la dirección se pinta desde el servidor: no aparece antes el inicio
  const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? null;
  const inicial = destinoDeParametros({ get: (clave) => uno(searchParams[clave]) });
  return <PruebaloDashboard version={VERSION} inicial={inicial} />;
}
