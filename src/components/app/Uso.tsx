import Link from "next/link";
import type { Plan } from "@/lib/planes";

/** Cuántos mensajes llevas este mes, con una línea que se va llenando. */
export function Uso({ usados, plan, compacto = false }: { usados: number; plan: Plan; compacto?: boolean }) {
  const proporcion = Math.min(1, usados / plan.mensajesMes);
  const casi = proporcion >= 0.85;
  return (
    <div className={compacto ? "" : "border-t hairline pt-4"}>
      <div
        className={`flex text-[0.8125rem] ${compacto ? "flex-col items-start gap-1" : "items-baseline justify-between gap-4"}`}
      >
        <span className="text-ash">
          <span className={`tabular-nums ${casi ? "text-signal" : "text-bone"}`}>{usados.toLocaleString("es-MX")}</span> de{" "}
          {plan.mensajesMes.toLocaleString("es-MX")} mensajes este mes
        </span>
        {plan.id !== "max" ? (
          <Link href="/#planes" className="uppercase tracking-[0.04em] text-silver underline-offset-4 hover:text-bone hover:underline">
            Mejorar plan
          </Link>
        ) : null}
      </div>
      <span className="mt-2 block h-px w-full bg-white/15" aria-hidden="true">
        <span
          className={`block h-px ${casi ? "bg-signal" : "bg-bone"}`}
          style={{ width: `${Math.max(proporcion * 100, usados > 0 ? 2 : 0)}%` }}
        />
      </span>
    </div>
  );
}
