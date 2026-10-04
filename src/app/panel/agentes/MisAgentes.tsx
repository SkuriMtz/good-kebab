"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { Arrow, Check, claseBoton, Spinner } from "@/components/Buttons";
import { NavApp } from "@/components/app/NavApp";
import { Uso } from "@/components/app/Uso";
import { PERSONAJES, Personaje } from "@/components/agentes/Personaje";
import { AGENTES_INFO, type IdAgente } from "@/lib/agentes";
import { PLAN_POR_ID, planMinimo, type IdPlan } from "@/lib/planes";
import { createClient } from "@/lib/supabase/client";

function Candado() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="2.5" y="6" width="9" height="6.5" rx="1.5" stroke="currentColor" />
      <path d="M4.5 6V4.2a2.5 2.5 0 0 1 5 0V6" stroke="currentColor" />
    </svg>
  );
}

/**
 * "Mis agentes": la persona arma su equipo. En Free solo trabaja Clara;
 * en One y Max elige entre los agentes de su plan (al menos uno).
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
  // Lo elegido que su plan permite; si ya no queda nada, todo lo que el plan incluye
  const validos = elegidosIniciales.filter((id) => plan.agentes.includes(id));
  const [elegidos, setElegidos] = useState<IdAgente[]>(libre ? (validos.length ? validos : [...plan.agentes]) : ["clara"]);
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
      <main className="contenedor pb-24 pt-10 sm:pt-12 lg:pt-16">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="pill">{plan.nombre}</p>
            <h1 className="t-display mt-4 !text-[clamp(2.25rem,1.6rem+2.6vw,3.5rem)]">Tu equipo.</h1>
            <p className="t-editorial mt-4 max-w-[540px]">
              {libre
                ? "Elige quién trabaja contigo. Puedes cambiarlo cuando quieras; solo los agentes de tu equipo aparecen en el chat."
                : "Con Atendel Free trabajas con Clara. Con Atendel One se suma Lola, y con Atendel Max tienes a todo el equipo y eliges a quien quieras."}
            </p>
          </div>
          <div className="tarjeta lg:col-span-5">
            <Uso usados={usados} plan={plan} />
          </div>
        </div>

        {error ? (
          <p role="alert" className="mt-6 text-error">
            {error}
          </p>
        ) : null}

        <ul className="mt-10 grid gap-4 md:grid-cols-2">
          {AGENTES_INFO.map((a) => {
            const permitido = plan.agentes.includes(a.id);
            const enEquipo = permitido && elegidos.includes(a.id);
            return (
              <li key={a.id} className="tarjeta flex flex-col !p-6">
                <div className="flex items-start justify-between gap-4">
                  <span
                    className={`marca-agente marca-agente--grande ${permitido ? "" : "opacity-60"}`}
                    style={{ "--agente": PERSONAJES[a.id].color } as CSSProperties}
                  >
                    <Personaje agente={a.id} avatar />
                  </span>
                  {!permitido ? (
                    <span className="pill">
                      <Candado />
                      Con {planMinimo(a.id).nombre}
                    </span>
                  ) : null}
                </div>
                <h2 className={`t-titulo mt-5 ${permitido ? "" : "!text-tenue"}`}>{a.nombre}</h2>
                <p className="t-chico">{a.area}</p>
                <p className="t-cuerpo mt-3">{a.lema}</p>
                <p className="t-chico mt-2">{a.capacidades.join(" · ")}</p>
                <div className="mt-auto flex flex-wrap items-center gap-3 pt-6">
                  {!permitido ? (
                    <Link href="/precios" className={claseBoton("suave")}>
                      Ver precios
                    </Link>
                  ) : libre ? (
                    <button
                      type="button"
                      className={claseBoton(enEquipo ? "suave" : "borde")}
                      aria-pressed={enEquipo}
                      onClick={() => alternar(a.id)}
                      disabled={guardando !== null}
                    >
                      {guardando === a.id ? <Spinner /> : enEquipo ? <Check className="h-4 w-4" /> : null}
                      {enEquipo ? "En tu equipo" : "+ Agregar"}
                    </button>
                  ) : (
                    <span className="pill pill--azul">
                      <Check className="h-3.5 w-3.5" />
                      En tu equipo
                    </span>
                  )}
                  {enEquipo ? (
                    <Link href={`/panel/chat?agente=${a.id}`} className={claseBoton("primario")}>
                      Hablar
                      <Arrow />
                    </Link>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>

        {plan.id !== "max" ? (
          <div className="tarjeta mt-8 flex flex-col items-start gap-4 !p-6 md:flex-row md:items-center md:justify-between lg:!p-8">
            <p className="t-cuerpo max-w-[600px]">
              {plan.id === "free" ? (
                <>
                  Con <span className="font-semibold text-tinta">Atendel One</span> se suma Lola, que atiende tu WhatsApp y tus
                  citas. Con <span className="font-semibold text-tinta">Atendel Max</span> tienes a los cuatro: Víctor trae de
                  regreso a tus clientes e Iris se encarga de la oficina.
                </>
              ) : (
                <>
                  Con <span className="font-semibold text-tinta">Atendel Max</span> tienes a los cuatro: Víctor trae de regreso a
                  tus clientes e Iris se encarga de la oficina.
                </>
              )}
            </p>
            <Link href="/precios" className={claseBoton("suave")}>
              Ver precios
              <Arrow />
            </Link>
          </div>
        ) : null}
      </main>
    </>
  );
}
