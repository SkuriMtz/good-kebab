"use client";

import { useEffect, useState } from "react";
import { Icono } from "@/components/base/Iconos";
import { Enlace, TituloSeccion, claseBoton } from "@/components/panel/Piezas";
import { Seccion, TarjetaAgente } from "@/components/panel/Secciones";
import { AGENTES_INFO, type IdAgente } from "@/lib/agentes";
import { PLAN_POR_ID, planMinimo, type IdPlan } from "@/lib/planes";
import { createClient } from "@/lib/supabase/client";

/**
 * Agentes: la persona arma su equipo. En Free solo trabaja Clara; en One y
 * Max elige entre los agentes de su plan (al menos uno). El plan no se
 * cambia desde aquí: lo que el plan no incluye se ve con candado y lleva a
 * los precios. La lógica es la de siempre; cambió la forma (tarjetas del
 * panel nuevo, con el personaje de cada agente).
 */
export function MisAgentes({
  userId,
  planId,
  elegidosIniciales,
  enfocado,
  conGoogle,
}: {
  userId: string;
  planId: IdPlan;
  elegidosIniciales: IdAgente[];
  /** Llegó desde otra parte con ?agente=lola: se marca y se lleva a la vista. */
  enfocado?: IdAgente;
  conGoogle: boolean;
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

  useEffect(() => {
    if (!enfocado) return;
    const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(`agente-${enfocado}`)?.scrollIntoView({ block: "center", behavior: reducir ? "auto" : "smooth" });
  }, [enfocado]);

  return (
    <Seccion>
      <TituloSeccion
        titulo="Agentes"
        texto={
          libre
            ? "Elige quién trabaja contigo. Puedes cambiarlo cuando quieras; solo los agentes de tu equipo aparecen en el chat."
            : "Con Atendel Free trabajas con Clara. Con Atendel One se suma Lola, y con Atendel Max tienes a todo el equipo."
        }
      />
      {error ? (
        <p role="alert" className="pc-error pc-error--bloque">
          <Icono nombre="alerta" tam={16} />
          {error}
        </p>
      ) : null}
      <div className="pc-agentes">
        {AGENTES_INFO.map((a, i) => {
          const permitido = plan.agentes.includes(a.id);
          const enEquipo = permitido && elegidos.includes(a.id);
          const estado = !permitido
            ? { texto: `Con ${planMinimo(a.id).nombre}`, tono: "neutro" as const }
            : !enEquipo
              ? { texto: "Fuera de tu equipo", tono: "neutro" as const }
              : a.id === "clara"
                ? { texto: conGoogle ? "Conectada a tu Gmail" : "Lista en el chat", tono: "exito" as const }
                : { texto: "Lista en el chat", tono: "exito" as const };
          return (
            <TarjetaAgente
              key={a.id}
              agente={a.id}
              indice={i}
              enfocado={enfocado === a.id}
              estado={estado}
              interruptor={
                permitido && libre ? (
                  <label className="pc-interruptor">
                    <input type="checkbox" role="switch" checked={enEquipo} disabled={guardando !== null} onChange={() => alternar(a.id)} aria-label={`${a.nombre} en tu equipo`} />
                    <span className="pc-interruptor__pista" aria-hidden="true" />
                    <span className="pc-interruptor__texto">{guardando === a.id ? "Guardando" : "En tu equipo"}</span>
                  </label>
                ) : null
              }
              datos={
                <ul className="pc-agente__capacidades">
                  {a.capacidades.slice(0, 3).map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              }
              acciones={
                enEquipo ? (
                  <>
                    <Enlace href={`/panel?agente=${a.id}`} className={claseBoton("borde", true)}>
                      Hablar con {a.nombre}
                    </Enlace>
                    {a.id === "clara" ? (
                      <Enlace href="/panel?vista=correo" className={claseBoton("fantasma", true)}>
                        Abrir Correo
                      </Enlace>
                    ) : a.id === "lola" ? (
                      <Enlace href="/panel?vista=citas" className={claseBoton("fantasma", true)}>
                        Ver Citas
                      </Enlace>
                    ) : null}
                  </>
                ) : !permitido ? (
                  <Enlace href="/precios" className={claseBoton("fantasma", true)}>
                    <Icono nombre="candado" tam={14} />
                    Ver los planes
                  </Enlace>
                ) : null
              }
            />
          );
        })}
      </div>
    </Seccion>
  );
}
