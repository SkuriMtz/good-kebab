import type { Metadata } from "next";
import { DashboardDemo } from "@/components/dashboard/DashboardDemo";
import { momento } from "@/components/dashboard/momento";
import { esVistaDemo } from "@/lib/demo-dashboard";

export const metadata: Metadata = {
  title: "Pruébalo",
  description: "Recorre Atendel con los datos de ejemplo de una clínica: el resumen del día, el chat con los agentes, tu equipo y el correo.",
};

// El saludo ("Buenos días…") y las fechas se calculan en cada visita con la hora de México
export const dynamic = "force-dynamic";

/**
 * Pruébalo: el dashboard de Atendel con datos de ejemplo de una clínica
 * (src/lib/demo-dashboard.ts). Nada aquí llama a la IA: el chat es el guion
 * local de ChatDemo. ?vista=conversaciones|agentes|correo abre esa sección.
 */
export default function Pruebalo({ searchParams }: { searchParams: { vista?: string; pestana?: string; con?: string } }) {
  const vista = esVistaDemo(searchParams.vista) ? searchParams.vista : "resumen";
  const pestana = searchParams.pestana === "pendientes" || searchParams.pestana === "destacados" ? searchParams.pestana : "actividad";
  const con = typeof searchParams.con === "string" ? searchParams.con : null;
  return <DashboardDemo m={momento()} vistaInicial={vista} pestanaInicial={pestana} conInicial={con} />;
}
