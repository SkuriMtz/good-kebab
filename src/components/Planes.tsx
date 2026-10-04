import Link from "next/link";
import { Check, claseBoton } from "./Buttons";
import { PLANES } from "@/lib/planes";

const NOMBRE_CORTO: Record<string, string> = { free: "Free", one: "One", max: "Max" };

/** Free → One → Max (gratis, medio y completo) en tres columnas de texto, sin cajas. */
export function Planes() {
  return (
    <div>
      <ol className="grid gap-[var(--spacing-60)] lg:grid-cols-3 lg:gap-[var(--spacing-36)]">
        {PLANES.map((p) => (
          <li key={p.id} className="flex flex-col">
            <p className="flex min-h-[20px] items-center gap-[var(--spacing-12)]">
              <span className="pill">Atendel · {p.nivel}</span>
              {p.id === "max" ? <span className="pill pill--fuerte">Desbloquea todo</span> : null}
            </p>
            <h3 className="t-display mt-[var(--spacing-18)]">{NOMBRE_CORTO[p.id]}</h3>
            <p className="t-sub mt-[var(--spacing-24)] !text-[var(--c-acento)]">{p.precio ?? "Próximamente"}</p>
            <p className="t-cuerpo mt-[var(--spacing-6)]">{p.resumen}</p>
            <ul className="lista-check mt-[var(--spacing-30)]">
              {p.incluye.map((x) => (
                <li key={x} className="t-editorial">
                  <Check className="h-4 w-4" />
                  {x}
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-[var(--spacing-36)]">
              {p.id === "free" ? (
                <Link href="/entrar" className={claseBoton("primario")}>
                  Empezar gratis
                </Link>
              ) : (
                <p className="t-chico">Muy pronto. Mientras, empieza con Free.</p>
              )}
            </div>
          </li>
        ))}
      </ol>
      <p className="t-chico mt-[var(--spacing-60)] max-w-[640px]">
        Todos los planes: entras con tu correo, sin contraseña · funciona en celular y computadora · cada negocio ve solo
        lo suyo.
      </p>
    </div>
  );
}
