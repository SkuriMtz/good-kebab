"use client";

import { useState } from "react";
import { Uso } from "@/components/app/Uso";
import { Boton } from "@/components/base/Boton";
import { Icono } from "@/components/base/Iconos";
import { Insignia } from "@/components/base/Insignia";
import { PuntoEstado } from "@/components/base/PuntoEstado";
import { FilaAgente } from "@/components/dashboard/FilaAgente";
import { PilaAgentes } from "@/components/dashboard/Piezas";
import { AGENTE_POR_ID, AGENTES_INFO, type IdAgente } from "@/lib/agentes";
import { PLAN_POR_ID, planMinimo, type IdPlan } from "@/lib/planes";
import { createClient } from "@/lib/supabase/client";

/**
 * Agentes ("Mis agentes"): la persona arma su equipo. En Free solo trabaja
 * Clara; en One y Max elige entre los agentes de su plan (al menos uno).
 * El plan no se cambia desde aquí: lo que el plan no incluye se ve con
 * candado y lleva a los precios.
 */
export function MisAgentes({
  userId,
  planId,
  elegidosIniciales,
  usados,
}: {
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

  const equipo = AGENTES_INFO.filter((a) => plan.agentes.includes(a.id) && elegidos.includes(a.id)).map((a) => a.id);

  return (
    <div className="dash-pagina dash-vista">
      <header className="dash-vista__cabeza">
        <div>
          <h1 className="t-app-titulo-grande">Agentes</h1>
          <p className="dash-vista__texto">
            {libre
              ? "Elige quién trabaja contigo. Puedes cambiarlo cuando quieras; solo los agentes de tu equipo aparecen en el chat."
              : "Con Atendel Free trabajas con Clara. Con Atendel One se suma Lola, y con Atendel Max tienes a todo el equipo y eliges a quien quieras."}
          </p>
        </div>
      </header>

      <div className="dash-rejilla">
        <div className="dash-centro">
          {error ? (
            <p role="alert" className="dash-alerta">
              <Icono nombre="alerta" tam={16} />
              {error}
            </p>
          ) : null}

          <ul className="dash-lista dash-lista--borde dash-agentes">
            {AGENTES_INFO.map((a) => {
              const permitido = plan.agentes.includes(a.id);
              const enEquipo = permitido && elegidos.includes(a.id);
              return (
                <FilaAgente
                  key={a.id}
                  id={a.id}
                  bloqueado={!permitido}
                  insignias={
                    !permitido ? (
                      <Insignia>
                        <Icono nombre="candado" tam={16} />
                        Con {planMinimo(a.id).nombre}
                      </Insignia>
                    ) : enEquipo ? (
                      <Insignia tono="exito" conPunto>
                        En tu equipo
                      </Insignia>
                    ) : (
                      <Insignia>Fuera de tu equipo</Insignia>
                    )
                  }
                  estado={
                    permitido ? (
                      <PuntoEstado
                        tono={enEquipo ? "exito" : "neutro"}
                        etiqueta={enEquipo ? "Aparece en tu chat" : "No aparece en tu chat"}
                        mostrarEtiqueta
                      />
                    ) : (
                      <span className="dash-nota">Tu plan no lo incluye. Así trabajaría contigo.</span>
                    )
                  }
                  acciones={
                    !permitido ? (
                      <Boton variante="fantasma" tam="compacto" href="/precios" flecha>
                        Ver los planes
                      </Boton>
                    ) : (
                      <>
                        {libre ? (
                          <Boton
                            variante="sutil"
                            tam="compacto"
                            aria-pressed={enEquipo}
                            cargando={guardando === a.id}
                            disabled={guardando !== null && guardando !== a.id}
                            icono={<Icono nombre={enEquipo ? "check" : "mas"} tam={16} />}
                            onClick={() => alternar(a.id)}
                            className="dash-alternar"
                          >
                            {enEquipo ? "En tu equipo" : "Agregar"}
                          </Boton>
                        ) : null}
                        {enEquipo ? (
                          <Boton variante="sutil" tam="compacto" href={`/panel/chat?agente=${a.id}`} icono={<Icono nombre="mensaje" tam={16} />}>
                            Hablar con {AGENTE_POR_ID[a.id].nombre}
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
            <p className="dash-correo__chat dash-agentes__mas">
              {plan.id === "free"
                ? "Con Atendel One se suma Lola, que atiende tu WhatsApp y tus citas. Con Atendel Max tienes a los cuatro: Víctor trae de regreso a tus clientes e Iris se encarga de la oficina."
                : "Con Atendel Max tienes a los cuatro: Víctor trae de regreso a tus clientes e Iris se encarga de la oficina."}
            </p>
          ) : null}
        </div>

        <aside className="dash-derecha" aria-label="Tu plan">
          <section id="plan" className="dash-tarjeta dash-plan" aria-labelledby="plan-titulo">
            <div className="dash-plan__fila dash-plan__fila--arriba">
              <h2 id="plan-titulo" className="dash-plan__plan">
                {plan.nombre}
              </h2>
              <Insignia tono="azul">Activo</Insignia>
            </div>
            <p className="dash-nota">{plan.resumen}</p>
            <Uso usados={usados} plan={plan} />
            <p className="dash-plan__equipo">
              <PilaAgentes ids={equipo} tam={20} />
              <span>
                {equipo.length === 1 ? "1 agente" : `${equipo.length} agentes`} en tu equipo
              </span>
            </p>
            <ul className="dash-plan__incluye">
              {plan.incluye.map((i) => (
                <li key={i}>
                  <Icono nombre="check" tam={16} />
                  {i}
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
