import Link from "next/link";
import { BarraProgreso } from "@/components/base/BarraProgreso";
import type { Plan } from "@/lib/planes";

/**
 * Cuántos mensajes llevas este mes (lo usan el chat y Mis agentes).
 * La barra de la base: ámbar desde el 80% y roja al llegar al tope, con la
 * cifra escrita para que el color nunca vaya solo.
 */
export function Uso({ usados, plan, compacto = false }: { usados: number; plan: Plan; compacto?: boolean }) {
  const quedan = Math.max(0, plan.mensajesMes - usados);
  return (
    <div className="uso-app" data-compacto={compacto || undefined}>
      <BarraProgreso
        etiqueta="Mensajes de este mes"
        valor={usados}
        max={plan.mensajesMes}
        unidad="mensajes"
        detalle={
          <>
            {quedan ? `Te quedan ${quedan.toLocaleString("es-MX")}.` : "Llegaste al límite de este mes."}
            {plan.id !== "max" ? (
              <>
                {" "}
                <Link href="/precios" className="uso-app__enlace">
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
