import { PillLink } from "./Buttons";
import { PLANES } from "@/lib/planes";

const NOMBRE_CORTO: Record<string, string> = { free: "Free", one: "One", max: "Max" };

/** Free → One → Max (gratis, medio y completo), como tres tarjetas; Max, el completo, va en un bloque oscuro. */
export function Planes() {
  return (
    <div>
      <ol className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {PLANES.map((p) => {
          const destacado = p.id === "max";
          return (
            <li key={p.id} className={`plan plan-tarjeta relative ${destacado ? "bloque-oscuro" : "tarjeta"}`}>
              <div className="flex min-h-[28px] items-center justify-between gap-4">
                <p className="etiqueta etiqueta--suave">
                  Atendel · <span className="text-bone">{p.nivel}</span>
                </p>
                {destacado ? (
                  <p className="plan-insignia">
                    <span className="h-1.5 w-1.5 rounded-full bg-bone" aria-hidden="true" />
                    Desbloquea todo
                  </p>
                ) : null}
              </div>
              <h3 className="display mt-3 !text-[clamp(3rem,5.6vw,5.5rem)]">
                {NOMBRE_CORTO[p.id]}
              </h3>
              <p className="etiqueta mt-6 border-t border-dashed hairline pt-5">{p.precio ?? "Próximamente"}</p>
              <p className="texto-suave mt-1">{p.resumen}</p>
              <ul className="mt-8 flex flex-col gap-3.5 text-[0.9375rem]">
                {p.incluye.map((x) => (
                  <li key={x} className="flex items-start gap-3">
                    <span
                      className="mt-[0.2em] grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-bone/10"
                      aria-hidden="true"
                    >
                      <svg className="h-2.5 w-2.5 text-bone" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6.4 4.8 9 10 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    {x}
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-12">
                {p.id === "free" ? (
                  <PillLink href="/entrar">Empezar gratis</PillLink>
                ) : (
                  <p className="text-[0.875rem] text-ash">Muy pronto. Mientras, empieza con Free.</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      <p className="etiqueta etiqueta--suave mt-8 leading-relaxed">
        Todos los planes: entras con tu correo, sin contraseña · funciona en celular y computadora · cada negocio ve solo
        lo suyo.
      </p>
    </div>
  );
}
