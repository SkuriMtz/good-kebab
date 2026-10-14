"use client";

import { useState } from "react";
import { Boton } from "@/components/base/Boton";
import { Icono } from "@/components/base/Iconos";
import { Insignia } from "@/components/base/Insignia";
import { Uso } from "@/components/app/Uso";
import { EncabezadoVista } from "@/components/dashboard/piezas";
import { TarjetasEquipo } from "@/components/dashboard/TarjetasEquipo";
import { AGENTES_INFO, type IdAgente } from "@/lib/agentes";
import { PLAN_POR_ID, planMinimo, type IdPlan } from "@/lib/planes";
import { createClient } from "@/lib/supabase/client";

/**
 * "Tu equipo" (vista Agentes del panel): la persona arma su equipo. En Free
 * solo trabaja Clara; en One y Max elige entre los agentes de su plan (al
 * menos uno). El plan se ve aquí, pero no se cambia desde aquí.
 */
export function MisAgentes({
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
    <div className="tb-vista">
      <EncabezadoVista
        titulo="Tu equipo"
        texto={
          libre
            ? "Elige quién trabaja contigo. Puedes cambiarlo cuando quieras; solo los agentes de tu equipo aparecen en el chat."
            : "Con Atendel Free trabajas con Clara. Con Atendel One se suma Lola, y con Atendel Max tienes a todo el equipo y eliges a quien quieras."
        }
      />

      <section id="plan" className="tb-caja tb-plan" aria-labelledby="plan-titulo">
        <div className="tb-plan__texto">
          <h2 id="plan-titulo" className="tb-plan__titulo">
            {plan.nombre} <Insignia tono="azul">{plan.nivel}</Insignia>
          </h2>
          <p className="tb-plan__detalle">{plan.resumen} El plan lo cambia Atendel por ti; aquí ves lo que incluye y cuánto llevas.</p>
          {plan.id !== "max" ? (
            <div className="tb-plan__acciones">
              <Boton href="/precios" variante="fantasma" tam="compacto" flecha>
                Ver qué trae cada plan
              </Boton>
            </div>
          ) : null}
        </div>
        <Uso usados={usados} plan={plan} />
      </section>

      {error ? (
        <p role="alert" className="tb-alerta">
          <Icono nombre="alerta" tam={16} />
          {error}
        </p>
      ) : null}

      <TarjetasEquipo
        puedeElegir={libre}
        guardando={guardando}
        alAlternar={alternar}
        miembros={AGENTES_INFO.map((a) => {
          const permitido = plan.agentes.includes(a.id);
          const enEquipo = permitido && elegidos.includes(a.id);
          return {
            id: a.id,
            estado: enEquipo ? { tono: "exito", texto: "En el chat" } : { tono: "neutro", texto: "Fuera del equipo" },
            incluido: permitido,
            enEquipo,
            hablar: { etiqueta: `Hablar con ${a.nombre}`, href: `/panel/chat?agente=${a.id}`, icono: "mensaje" },
            bloqueado: permitido ? undefined : { texto: `Con ${planMinimo(a.id).nombre}`, accion: { etiqueta: "Ver precios", href: "/precios" } },
          };
        })}
      />
    </div>
  );
}
