"use client";

import { useEffect, useState } from "react";
import { Boton } from "@/components/base/Boton";
import { Icono } from "@/components/base/Iconos";
import { VistaAgentes } from "@/components/dashboard/Agentes";
import { Lienzo } from "@/components/dashboard/Armazon";
import { Ayuda, TarjetaNegocio } from "@/components/dashboard/Columna";
import type { IdAgente } from "@/lib/agentes";
import { EVENTO_ELEGIR_AGENTE } from "@/lib/eventos";
import { PLAN_POR_ID, type IdPlan } from "@/lib/planes";
import { createClient } from "@/lib/supabase/client";

/**
 * "Mis agentes": la persona arma su equipo. En Free solo trabaja Clara;
 * en One y Max elige entre los agentes de su plan (al menos uno).
 * El plan no se cambia desde aquí.
 */
export function MisAgentes({
  email,
  userId,
  planId,
  elegidosIniciales,
  usados,
  negocio,
}: {
  email: string;
  userId: string;
  planId: IdPlan;
  elegidosIniciales: IdAgente[];
  usados: number;
  negocio?: string;
}) {
  const plan = PLAN_POR_ID[planId];
  const libre = plan.id !== "free";
  // Lo elegido que su plan permite; si ya no queda nada, todo lo que el plan incluye
  const validos = elegidosIniciales.filter((id) => plan.agentes.includes(id));
  const [elegidos, setElegidos] = useState<IdAgente[]>(libre ? (validos.length ? validos : [...plan.agentes]) : ["clara"]);
  const [guardando, setGuardando] = useState<IdAgente | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fecha, setFecha] = useState<Date | null>(null);
  useEffect(() => setFecha(new Date()), []);

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

  const negocioVisible = negocio && negocio !== "tu negocio" ? negocio : null;

  return (
    <Lienzo
      etiquetaColumna="Tu plan"
      columna={
        <>
          <TarjetaNegocio
            negocio={negocioVisible ?? email}
            giro={negocioVisible ? email : undefined}
            plan={plan}
            usados={usados}
            fecha={fecha}
            pie={
              plan.id !== "max" ? (
                <Boton variante="sutil" tam="compacto" bloque href="/precios" flecha>
                  Ver planes
                </Boton>
              ) : null
            }
          />
          <section id="plan" className="tb-tarjeta tb-incluye" aria-labelledby="tb-incluye">
            <h2 id="tb-incluye" className="tb-tarjeta__titulo">
              Qué incluye {plan.nombre}
            </h2>
            <ul className="tb-incluye__lista">
              {plan.incluye.map((i) => (
                <li key={i}>
                  <Icono nombre="check" tam={16} />
                  {i}
                </li>
              ))}
            </ul>
            <p className="tb-texto-2">Tu plan lo cambia el equipo de Atendel; aquí solo eliges quién trabaja contigo.</p>
          </section>
          <Ayuda contexto="Solo los agentes de tu equipo aparecen en el chat. Puedes cambiarlo cuando quieras." />
        </>
      }
    >
      <VistaAgentes
        plan={plan}
        elegidos={libre ? elegidos : ["clara"]}
        libre={libre}
        guardando={guardando}
        error={error}
        alAlternar={alternar}
        hablar={(id) => ({ href: `/panel/chat?agente=${id}` })}
        verFicha={(id) => window.dispatchEvent(new CustomEvent(EVENTO_ELEGIR_AGENTE, { detail: id }))}
      />
    </Lienzo>
  );
}
