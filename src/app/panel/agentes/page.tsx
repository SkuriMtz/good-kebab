import { redirect } from "next/navigation";

/** /panel/agentes ya no está en el menú: los agentes y sus reglas viven en Ajustes > Agentes. */
export default function AgentesPage() {
  redirect("/panel?vista=ajustes&seccion=agentes");
}
