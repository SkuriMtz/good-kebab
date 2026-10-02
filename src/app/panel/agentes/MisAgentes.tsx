"use client";

import Link from "next/link";
import { useState } from "react";
import { Arrow, TriSpinner } from "@/components/Buttons";
import { NavApp } from "@/components/app/NavApp";
import { Uso } from "@/components/app/Uso";
import { AGENTES_INFO, type IdAgente } from "@/lib/agentes";
import { PLAN_POR_ID, type IdPlan } from "@/lib/planes";
import { createClient } from "@/lib/supabase/client";

const dos = (n: number) => String(n).padStart(2, "0");

function Candado() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="2.5" y="6" width="9" height="6.5" stroke="currentColor" />
      <path d="M4.5 6V4.2a2.5 2.5 0 0 1 5 0V6" stroke="currentColor" />
    </svg>
  );
}

/**
 * "Mis agentes": la persona arma su equipo. En Free solo trabaja Clara;
 * con One o Max elige a quien quiera (al menos uno).
 */
export function MisAgentes({
  email,
  userId,
  planId,
  elegidosIniciales,
  usados,
}: {
  email: string;
  userId: string;
  planId: IdPlan;
  elegidosIniciales: IdAgente[];
  usados: number;
}) {
  const plan = PLAN_POR_ID[planId];
  const libre = plan.id !== "free";
  const [elegidos, setElegidos] = useState<IdAgente[]>(libre ? elegidosIniciales : ["clara"]);
  const [guardando, setGuardando] = useState<IdAgente | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function alternar(id: IdAgente) {
    if (!libre || guardando) return;
    const esta = elegidos.includes(id);
    if (esta && elegidos.length === 1) {
      setError("Tu equipo necesita al menos un agente.");
      return;
    }
    const nuevos = esta ? elegidos.filter((x) => x !== id) : [...elegidos, id];
    const anteriores = elegidos;
    setElegidos(nuevos);
    setGuardando(id);
    setError(null);
    const { error: e } = await createClient()
      .from("agentes_elegidos")
      .upsert({ owner_id: userId, agentes: nuevos, actualizado_en: new Date().toISOString() });
    setGuardando(null);
    if (e) {
      setElegidos(anteriores);
      setError("No se pudo guardar el cambio. Intenta de nuevo.");
    }
  }

  return (
    <>
      <NavApp email={email} />
      <main className="page-enter mx-auto max-w-page px-6 pb-[96px] pt-[120px] lg:px-10 lg:pt-[150px]">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="font-cond text-base uppercase tracking-[0.03em] text-ash">{plan.nombre}</p>
            <h1 className="editorial mt-3 text-heading-lg">Tu equipo.</h1>
            <p className="mt-5 max-w-[520px] text-body text-silver">
              {libre
                ? "Elige quién trabaja contigo. Puedes cambiarlo cuando quieras; solo los agentes de tu equipo aparecen en el chat."
                : "Con Atendel Free trabajas con Clara. Con Atendel One desbloqueas a todo el equipo y eliges a quien quieras."}
            </p>
          </div>
          <div className="lg:col-span-5">
            <Uso usados={usados} plan={plan} />
          </div>
        </div>

        {error ? (
          <p role="alert" className="mt-8 text-body text-signal">
            {error}
          </p>
        ) : null}

        <ul className="mt-12 border-b hairline lg:mt-16">
          {AGENTES_INFO.map((a, i) => {
            const permitido = plan.agentes.includes(a.id);
            const enEquipo = permitido && elegidos.includes(a.id);
            return (
              <li
                key={a.id}
                className="grid grid-cols-1 gap-x-8 gap-y-4 border-t hairline py-7 md:grid-cols-[minmax(0,4fr)_minmax(0,5fr)_270px] md:items-center"
              >
                <div className="flex items-baseline gap-4">
                  <span className={`font-cond text-base ${enEquipo ? "text-signal" : "text-ash"}`}>{dos(i + 1)}</span>
                  <div>
                    <p className={`editorial text-[clamp(2.25rem,4vw,3.5rem)] leading-none ${permitido ? "" : "text-ash"}`}>
                      {a.nombre}
                    </p>
                    <p className="mt-2 font-cond text-base uppercase tracking-[0.03em] text-ash">{a.area}</p>
                  </div>
                </div>
                <div className="pl-[34px] md:pl-0">
                  <p className="text-body text-silver">{a.lema}</p>
                  <p className="mt-2 text-[0.875rem] text-ash">{a.capacidades.join(" · ")}</p>
                </div>
                <div className="flex items-center gap-6 pl-[34px] md:justify-end md:pl-0">
                  {!permitido ? (
                    <Link href="/#planes" className="btn-ghost">
                      <Candado />
                      Con Atendel One
                    </Link>
                  ) : libre ? (
                    <button
                      type="button"
                      className={enEquipo ? "btn-pill !min-h-[44px]" : "btn-ghost"}
                      aria-pressed={enEquipo}
                      onClick={() => alternar(a.id)}
                      disabled={guardando !== null}
                    >
                      {guardando === a.id ? <TriSpinner className="h-3 w-3" /> : null}
                      {enEquipo ? "En tu equipo" : "+ Agregar"}
                    </button>
                  ) : (
                    <span className="text-nav font-medium uppercase text-silver">En tu equipo</span>
                  )}
                  {enEquipo ? (
                    <Link href={`/panel/chat?agente=${a.id}`} className="btn-ghost !text-bone">
                      Hablar
                      <Arrow />
                    </Link>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>

        {!libre ? (
          <div className="mt-12 flex flex-col items-start gap-4 border hairline p-6 md:flex-row md:items-center md:justify-between lg:p-8">
            <p className="max-w-[560px] text-body text-silver">
              Con <span className="text-bone">Atendel One</span> tienes a los seis: Lola en WhatsApp, Víctor en ventas,
              Óscar en la operación, Lucía con tus clientes e Iris investigando.
            </p>
            <Link href="/#planes" className="btn-pill">
              Ver planes
              <Arrow />
            </Link>
          </div>
        ) : null}
      </main>
    </>
  );
}
