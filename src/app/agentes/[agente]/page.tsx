import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Sitio } from "@/components/Sitio";
import { PerfilAgente } from "@/components/agentes/PerfilAgente";
import { AGENTE_POR_ID, IDS_AGENTES, esIdAgente } from "@/lib/agentes";

/** Las cuatro páginas se generan al construir el sitio; cualquier otra dirección da 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return IDS_AGENTES.map((agente) => ({ agente }));
}

export function generateMetadata({ params }: { params: { agente: string } }): Metadata {
  if (!esIdAgente(params.agente)) return { title: "Agentes" };
  const a = AGENTE_POR_ID[params.agente];
  return { title: `${a.nombre} · ${a.area}`, description: `${a.nombre}, tu agente de ${a.area.toLowerCase()}: ${a.lema}` };
}

/** /agentes/lola, /agentes/clara, /agentes/victor, /agentes/iris: el perfil de cada agente. */
export default function PaginaAgente({ params }: { params: { agente: string } }) {
  if (!esIdAgente(params.agente)) notFound();
  return (
    <Sitio>
      <PerfilAgente agente={params.agente} />
    </Sitio>
  );
}
