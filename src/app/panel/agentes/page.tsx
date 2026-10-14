import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cuentaDe, sesion } from "@/components/app/datos";
import { momento } from "@/components/dashboard/momento";
import { MisAgentes } from "./MisAgentes";

export const metadata: Metadata = { title: "Mis agentes" };

export default async function MisAgentesPage() {
  const { user } = await sesion();
  if (!user) redirect("/entrar");

  // La misma lectura que hizo el layout (no se repite la consulta)
  const cuenta = await cuentaDe(user.id);
  const m = momento();
  return (
    <MisAgentes
      userId={user.id}
      planId={cuenta.plan.id}
      elegidosIniciales={cuenta.elegidos}
      usados={cuenta.usados}
      mes={m.mes}
      renueva={m.renueva}
    />
  );
}
