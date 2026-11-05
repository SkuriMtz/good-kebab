import type { Metadata } from "next";
import { PanelDemo } from "@/components/panel/PanelDemo";
import { saludoDeHora } from "@/components/panel/pedidos";
import { DEMO_USUARIA } from "@/lib/demo-dashboard";

export const metadata: Metadata = {
  title: "Pruébalo",
  description: "Así se ve Atendel por dentro: el panel de un negocio con datos de ejemplo y el chat con los agentes. No llama a la IA.",
};

/**
 * Pruébalo: el panel nuevo con datos de ejemplo de un negocio inventado
 * (src/lib/demo-dashboard.ts). La vista sale de la dirección y se pinta
 * desde el servidor (?vista=agentes, ?con=lola…): no aparece antes el
 * Inicio. Lo demás pasa en el navegador. El chat es el guion local de
 * ChatDemo: no llama a la IA.
 */
export default function Pruebalo({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  // La página depende de la dirección: se pinta en cada visita con la vista pedida
  void searchParams;
  const ahora = Date.now();
  return <PanelDemo saludo={`${saludoDeHora(new Date(ahora))}, ${DEMO_USUARIA.nombre.split(" ")[0]}`} ahora={ahora} />;
}
