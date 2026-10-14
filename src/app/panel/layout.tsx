import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { ArmazonPanel } from "@/components/app/ArmazonPanel";
import { conversacionesDe, cuentaDe, sesion, usuarioDe } from "@/components/app/datos";
import { esIdAgente, type IdAgente } from "@/lib/agentes";

/**
 * El armazón del dashboard alrededor de todo el panel (/panel, /panel/chat,
 * /panel/agentes): barra superior, menú lateral con tus agentes y grupos, y
 * pie. Lee la cuenta una vez; las páginas reciben lo mismo sin repetir consultas.
 */
export default async function PanelLayout({ children }: { children: ReactNode }) {
  const { user } = await sesion();
  // El middleware ya manda a /entrar sin sesión; esto es una segunda barrera
  if (!user) redirect("/entrar");

  const [cuenta, conversaciones] = await Promise.all([cuentaDe(user.id), conversacionesDe(user.id)]);
  const proveedores = (user.app_metadata?.providers as string[] | undefined) ?? [];

  const deConversacion = (c: (typeof conversaciones)[number]): IdAgente[] => {
    const p = (c.participantes ?? []).filter(esIdAgente);
    return p.length >= 2 ? p : [c.agente as IdAgente];
  };
  const grupos = conversaciones
    .filter((c) => deConversacion(c).length > 1)
    .slice(0, 5)
    .map((c) => ({ id: c.id, nombre: c.titulo, agentes: deConversacion(c) }));

  return (
    <ArmazonPanel
      usuario={usuarioDe(user)}
      planId={cuenta.plan.id}
      activos={cuenta.activos}
      negocio={cuenta.negocio}
      conGoogle={proveedores.includes("google")}
      grupos={grupos}
      conversaciones={conversaciones.map((c) => ({ id: c.id, titulo: c.titulo, agentes: deConversacion(c) }))}
    >
      {children}
    </ArmazonPanel>
  );
}
