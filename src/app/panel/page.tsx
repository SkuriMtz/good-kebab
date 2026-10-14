import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Panel } from "./Panel";

export const metadata: Metadata = { title: "Panel" };

/** /panel: el Resumen del día. Con ?vista=correo, el correo con Clara (modo de prueba, Gmail e historial). */
export default async function PanelPage({ searchParams }: { searchParams: { vista?: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // El middleware ya redirige a /entrar sin sesión; esto es una segunda barrera
  if (!user) redirect("/entrar");

  const proveedores = (user.app_metadata?.providers as string[] | undefined) ?? [];
  return (
    <Panel
      email={user.email ?? ""}
      conGoogle={proveedores.includes("google")}
      vista={searchParams.vista === "correo" ? "correo" : "resumen"}
    />
  );
}
