import Link from "next/link";
import { Check, claseBoton } from "./Buttons";
import { PLANES } from "@/lib/planes";

const NOMBRE_CORTO: Record<string, string> = { free: "Free", one: "One", max: "Max" };

/** Free → One → Max (gratis, medio y completo) en tres tarjetas; Max, el completo, va en la isla oscura. */
export function Planes() {
  return (
    <div>
      <ol className="grid gap-4 lg:grid-cols-3">
        {PLANES.map((p) => {
          const destacado = p.id === "max";
          return (
            <li key={p.id} className={`flex flex-col !p-6 sm:!p-8 ${destacado ? "isla-oscura" : "tarjeta"}`}>
              <div className="flex min-h-[28px] items-center justify-between gap-3">
                <p className="t-chico">Atendel · {p.nivel}</p>
                {destacado ? <p className="pill pill--fuerte">Desbloquea todo</p> : null}
              </div>
              <h3 className="mt-3 text-[2.75rem] font-bold leading-none tracking-[-0.035em]">{NOMBRE_CORTO[p.id]}</h3>
              <p className="mt-6 text-[1.125rem] font-semibold">{p.precio ?? "Próximamente"}</p>
              <p className="t-cuerpo mt-1">{p.resumen}</p>
              <ul className="lista-check mt-6 border-t border-[var(--linea)] pt-6 text-[0.9375rem]">
                {p.incluye.map((x) => (
                  <li key={x}>
                    <Check className="h-4 w-4 text-enlace" />
                    {x}
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-8">
                {p.id === "free" ? (
                  <Link href="/entrar" className={`${claseBoton("primario", "grande")} w-full`}>
                    Empezar gratis
                  </Link>
                ) : (
                  <p className="t-chico">Muy pronto. Mientras, empieza con Free.</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      <p className="t-chico mx-auto mt-6 max-w-[640px] text-center">
        Todos los planes: entras con tu correo, sin contraseña · funciona en celular y computadora · cada negocio ve solo
        lo suyo.
      </p>
    </div>
  );
}
