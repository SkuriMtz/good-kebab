import Link from "next/link";
import { BarraProgreso } from "@/components/base/BarraProgreso";
import type { Plan } from "@/lib/planes";

/** Cuántos mensajes llevas este mes, con la barra de la base (ámbar desde 80%, roja al tope). */
export function Uso({ usados, plan, compacto = false }: { usados: number; plan: Plan; compacto?: boolean }) {
  const quedan = Math.max(0, plan.mensajesMes - usados);
  const detalle =
    usados >= plan.mensajesMes
      ? "Llegaste al tope de tu plan este mes."
      : usados / plan.mensajesMes >= 0.8
        ? `Te quedan ${quedan.toLocaleString("es-MX")} mensajes este mes.`
        : compacto
          ? null
          : "Se renueva el día 1 de cada mes.";
  return (
    <div className={compacto ? "tb-uso tb-uso--compacto" : "tb-uso"}>
      <BarraProgreso etiqueta="Mensajes este mes" valor={usados} max={plan.mensajesMes} unidad="mensajes" detalle={detalle} />
      {plan.id !== "max" ? (
        <Link href="/precios" className="tb-enlace tb-uso__enlace">
          Ver planes
        </Link>
      ) : null}
    </div>
  );
}
