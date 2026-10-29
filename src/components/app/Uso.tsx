import Link from "next/link";
import { BarraProgreso } from "@/components/base/BarraProgreso";
import type { Plan } from "@/lib/planes";

const formato = new Intl.NumberFormat("es-MX");

/**
 * Cuántos mensajes llevas este mes, con la barra de progreso de la base
 * (ámbar desde el 80%, rojo al tope; el color nunca va solo: hay texto).
 * Lo usan "Agentes" del panel y la lista del chat (`compacto`).
 * El plan no se cambia desde aquí: "Ver los planes" solo informa.
 */
export function Uso({ usados, plan, compacto = false }: { usados: number; plan: Plan; compacto?: boolean }) {
  const restantes = Math.max(0, plan.mensajesMes - usados);
  return (
    <div className={`uso${compacto ? " uso--compacto" : ""}`}>
      <BarraProgreso
        etiqueta="Mensajes este mes"
        valor={usados}
        max={plan.mensajesMes}
        unidad="mensajes"
        detalle={usados >= plan.mensajesMes ? "Llegaste al tope de tu plan este mes." : `Te quedan ${formato.format(restantes)}.`}
      />
      {plan.id !== "max" ? (
        <Link href="/precios" className="dash-enlace dash-enlace--chico uso__planes">
          Ver los planes
        </Link>
      ) : null}
    </div>
  );
}
