import Link from "next/link";
import { BarraProgreso } from "@/components/base/BarraProgreso";
import type { Plan } from "@/lib/planes";

const mesActual = () => new Intl.DateTimeFormat("es-MX", { month: "long" }).format(new Date());

/**
 * Cuántos mensajes llevas este mes, con la barra de la base (ámbar desde el
 * 80% y rojo al tope). La usan "Tu equipo" y el chat (versión `compacto`).
 * El plan no se cambia desde aquí: el enlace solo lleva a ver los planes.
 */
export function Uso({ usados, plan, compacto = false }: { usados: number; plan: Plan; compacto?: boolean }) {
  const quedan = Math.max(0, plan.mensajesMes - usados);
  return (
    <div className={`tb-uso${compacto ? " tb-uso--compacto" : ""}`}>
      <BarraProgreso
        etiqueta={compacto ? "Mensajes del mes" : `Mensajes de ${mesActual()}`}
        valor={usados}
        max={plan.mensajesMes}
        unidad="mensajes"
        detalle={
          <>
            {quedan === 0 ? "Llegaste al tope de tu plan este mes." : `Te quedan ${quedan.toLocaleString("es-MX")} este mes.`}
            {plan.id !== "max" ? (
              <>
                {" "}
                <Link href="/precios" className="tb-uso__enlace">
                  Ver planes
                </Link>
              </>
            ) : null}
          </>
        }
      />
    </div>
  );
}
