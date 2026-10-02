import { PillLink } from "./Buttons";
import { PLANES } from "@/lib/planes";

const NOMBRE_CORTO: Record<string, string> = { free: "Free", one: "One", max: "Max" };

/** Free → One → Max, como tres columnas unidas por una línea que avanza. */
export function Planes() {
  return (
    <div>
      <ol className="grid grid-cols-1 border-b hairline md:grid-cols-3">
        {PLANES.map((p, i) => {
          const destacado = p.id === "one";
          return (
            <li
              key={p.id}
              className={`plan relative flex flex-col border-t hairline py-8 md:px-8 md:py-10 ${
                i > 0 ? "md:border-l" : "md:pl-0"
              } ${i === PLANES.length - 1 ? "md:pr-0" : ""}`}
            >
              <div className="flex items-baseline justify-between gap-4">
                <p className="font-cond text-base uppercase tracking-[0.03em] text-ash">Atendel</p>
                {destacado ? (
                  <p className="flex items-center gap-2 text-[0.75rem] uppercase tracking-[0.06em] text-bone">
                    <span className="h-1.5 w-1.5 bg-signal" aria-hidden="true" />
                    Desbloquea todo
                  </p>
                ) : null}
              </div>
              <h3 className="editorial mt-1 text-[clamp(4rem,8vw,7rem)] leading-[0.9]">{NOMBRE_CORTO[p.id]}</h3>
              <p className="mt-5 text-heading-2xs">{p.precio ?? "Precio muy pronto"}</p>
              <p className="mt-2 text-body text-silver">{p.resumen}</p>
              <ul className="mt-6 flex flex-col gap-2.5 border-t hairline pt-5 text-body">
                {p.incluye.map((x) => (
                  <li key={x} className="flex items-start gap-3">
                    <svg className="mt-[0.45em] h-3 w-3 shrink-0 text-silver" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="M2 6.4 4.8 9 10 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
                    </svg>
                    {x}
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-8">
                {p.id === "free" ? (
                  <PillLink href="/entrar">Empezar gratis</PillLink>
                ) : (
                  <p className="text-[0.875rem] text-ash">
                    Muy pronto. Mientras, empieza con Free.
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-6 text-[0.875rem] text-ash">
        Todos los planes: entras con tu correo, sin contraseña · funciona en celular y computadora · cada negocio ve solo
        lo suyo.
      </p>
    </div>
  );
}
