import Link from "next/link";
import type { Plan } from "@/lib/planes";

/** Cuántos mensajes llevas este mes, con una barra que se va llenando. */
export function Uso({ usados, plan, compacto = false }: { usados: number; plan: Plan; compacto?: boolean }) {
  const proporcion = Math.min(1, usados / plan.mensajesMes);
  const casi = proporcion >= 0.85;
  return (
    <div>
      <div className={`flex text-[0.8125rem] ${compacto ? "flex-col items-start gap-1" : "items-baseline justify-between gap-4"}`}>
        <span className="text-tenue">
          <span className={`font-semibold tabular-nums ${casi ? "text-error" : "text-tinta"}`}>{usados.toLocaleString("es-MX")}</span> de{" "}
          {plan.mensajesMes.toLocaleString("es-MX")} mensajes este mes
        </span>
        {plan.id !== "max" ? (
          <Link href="/precios" className="font-medium text-enlace hover:underline">
            Mejorar plan
          </Link>
        ) : null}
      </div>
      <span className="uso__pista mt-2" aria-hidden="true">
        <span
          className={`uso__relleno${casi ? " uso__relleno--casi" : ""}`}
          style={{ width: `${Math.max(proporcion * 100, usados > 0 ? 2 : 0)}%` }}
        />
      </span>
    </div>
  );
}
