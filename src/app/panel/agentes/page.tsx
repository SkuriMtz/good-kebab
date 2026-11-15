import { redirect } from "next/navigation";

/** /panel/agentes ya no está en el menú: las reglas viven en Tu negocio > Reglas. */
export default function AgentesPage() {
  redirect("/panel?vista=negocio&tab=reglas");
}
