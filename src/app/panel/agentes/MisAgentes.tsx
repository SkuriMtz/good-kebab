"use client";

import { useState } from "react";
import { Boton } from "@/components/base/Boton";
import { Icono } from "@/components/base/Iconos";
import { Uso } from "@/components/app/Uso";
import { EncabezadoVista, TarjetaAgente } from "@/components/dashboard/Vistas";
import { AGENTES_INFO, type IdAgente } from "@/lib/agentes";
import { PLAN_POR_ID, planMinimo, type IdPlan } from "@/lib/planes";
import { createClient } from "@/lib/supabase/client";

/**
 * "Tu equipo" (/panel/agentes) dentro del armazón del dashboard: la persona
 * arma su equipo. En Free solo trabaja Clara; en One y Max elige entre los
 * agentes de su plan (al menos uno). El plan no se cambia desde aquí: solo
 * se ve qué incluye cada uno.
 */
export function MisAgentes({
  userId,
  planId,
  elegidosIniciales,
  usados,
  renueva,
  mes,
}: {
  userId: string;
  planId: IdPlan;
  elegidosIniciales: IdAgente[];
  usados: number;
  renueva: string;
  mes: string;
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
    <div className="dash-contenido dash-vista">
      <EncabezadoVista
        etiqueta={plan.nombre}
        titulo="Tu equipo"
        texto={
          libre
            ? "Elige quién trabaja contigo. Puedes cambiarlo cuando quieras; solo los agentes de tu equipo aparecen en el chat."
            : "Con Atendel Free trabajas con Clara. Con Atendel One se suma Lola, y con Atendel Max tienes a todo el equipo y eliges a quien quieras."
        }
        extra={
          <div className="dash-uso">
            <Uso usados={usados} plan={plan} mes={mes} detalle={renueva} conEnlace={false} />
          </div>
        }
      />

      {error ? (
        <p role="alert" className="dash-clara__error dash-agentes__error">
          <Icono nombre="alerta" tam={16} />
          {error}
        </p>
      ) : null}

      <ul className="dash-agentes">
        {AGENTES_INFO.map((a) => {
          const permitido = plan.agentes.includes(a.id);
          const enEquipo = permitido && elegidos.includes(a.id);
          return (
            <TarjetaAgente
              key={a.id}
              id={a.id}
              enEquipo={enEquipo}
              bloqueado={permitido ? undefined : `Con ${planMinimo(a.id).nombre}`}
              acciones={
                !permitido ? null : (
                  <>
                    {libre ? (
                      <Boton
                        variante={enEquipo ? "fantasma" : "sutil"}
                        tam="compacto"
                        aria-pressed={enEquipo}
                        cargando={guardando === a.id}
                        disabled={guardando !== null}
                        icono={<Icono nombre={enEquipo ? "check" : "mas"} />}
                        onClick={() => alternar(a.id)}
                      >
                        {enEquipo ? "En tu equipo" : "Agregar al equipo"}
                      </Boton>
                    ) : null}
                    {enEquipo ? (
                      <Boton variante="sutil" tam="compacto" href={`/panel/chat?agente=${a.id}`} icono={<Icono nombre="mensaje" />}>
                        Hablar con {a.nombre}
                      </Boton>
                    ) : null}
                  </>
                )
              }
            />
          );
        })}
      </ul>

      {plan.id !== "max" ? (
        <aside className="dash-nota dash-nota--fila" aria-label="Qué incluye cada plan">
          <p className="dash-nota__texto">
            {plan.id === "free" ? (
              <>
                Con <strong>Atendel One</strong> se suma Lola, que atiende tu WhatsApp y tus citas. Con <strong>Atendel Max</strong> tienes a
                los cuatro: Víctor trae de regreso a tus clientes e Iris se encarga de la oficina.
              </>
            ) : (
              <>
                Con <strong>Atendel Max</strong> tienes a los cuatro: Víctor trae de regreso a tus clientes e Iris se encarga de la oficina.
              </>
            )}
          </p>
          <Boton variante="sutil" tam="compacto" href="/precios" flecha>
            Ver planes
          </Boton>
        </aside>
      ) : null}
    </div>
  );
}
