"use client";

import { useState } from "react";
import { Uso } from "@/components/app/Uso";
import { Boton } from "@/components/base/Boton";
import { Icono } from "@/components/base/Iconos";
import { Insignia } from "@/components/base/Insignia";
import { PuntoEstado } from "@/components/base/PuntoEstado";
import { EncabezadoVista, TarjetaAgente } from "@/components/dashboard/Agentes";
import { PieMinimo } from "@/components/dashboard/Columna";
import { AGENTES_INFO, type IdAgente } from "@/lib/agentes";
import { PLAN_POR_ID, planMinimo, type IdPlan } from "@/lib/planes";
import { createClient } from "@/lib/supabase/client";

/**
 * "Mis agentes": la persona arma su equipo. En Free solo trabaja Clara;
 * en One y Max elige entre los agentes de su plan (al menos uno).
 * El plan no se cambia desde aquí: solo se ve y se consulta en Precios.
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
    <div className="vista">
      <EncabezadoVista
        titulo="Tu equipo"
        texto={
          libre
            ? "Elige quién trabaja contigo. Puedes cambiarlo cuando quieras; solo los agentes de tu equipo aparecen en el chat."
            : "Con Atendel Free trabajas con Clara. Con Atendel One se suma Lola, y con Atendel Max tienes a todo el equipo y eliges a quien quieras."
        }
        extra={<Insignia tono="azul">{plan.nombre}</Insignia>}
      />

      <section id="plan" className="tarjeta-app equipo__plan" aria-labelledby="plan-titulo">
        <div className="equipo__plan-texto">
          <h2 id="plan-titulo" className="t-app-mediano">
            {plan.nombre}
          </h2>
          <p>{plan.resumen}</p>
        </div>
        <Uso usados={usados} plan={plan} />
      </section>

      {error ? (
        <p role="alert" className="correo__error">
          <Icono nombre="alerta" tam={16} />
          {error}
        </p>
      ) : null}

      <ul className="fichas">
        {AGENTES_INFO.map((a) => {
          const permitido = plan.agentes.includes(a.id);
          const enEquipo = permitido && elegidos.includes(a.id);
          return (
            <TarjetaAgente
              key={a.id}
              agente={a.id}
              apagado={!enEquipo}
              marcada={enEquipo && libre}
              estado={
                !permitido ? (
                  <span className="lateral__bloqueado">
                    <Icono nombre="candado" tam={16} />
                    Con {planMinimo(a.id).nombre}
                  </span>
                ) : enEquipo ? (
                  <PuntoEstado tono="exito" etiqueta="En tu equipo" mostrarEtiqueta />
                ) : (
                  <PuntoEstado tono="neutro" etiqueta="Fuera de tu equipo" mostrarEtiqueta />
                )
              }
              acciones={
                <>
                  {!permitido ? (
                    <Boton variante="sutil" tam="compacto" href="/precios">
                      Ver precios
                    </Boton>
                  ) : libre ? (
                    <Boton
                      variante={enEquipo ? "sutil" : "fantasma"}
                      tam="compacto"
                      aria-pressed={enEquipo}
                      onClick={() => alternar(a.id)}
                      disabled={guardando !== null}
                      cargando={guardando === a.id}
                      icono={enEquipo ? <Icono nombre="check" tam={16} /> : <Icono nombre="mas" tam={16} />}
                    >
                      {enEquipo ? "En tu equipo" : "Agregar"}
                    </Boton>
                  ) : (
                    <Insignia tono="azul" conPunto>
                      En tu equipo
                    </Insignia>
                  )}
                  {enEquipo ? (
                    <Boton variante="fantasma" tam="compacto" href={`/panel/chat?agente=${a.id}`} flecha>
                      Hablar con {a.nombre}
                    </Boton>
                  ) : null}
                </>
              }
            />
          );
        })}
      </ul>

      {plan.id !== "max" ? (
        <section className="tarjeta-app equipo__mas" aria-label="Lo que traen los otros planes">
          <p>
            {plan.id === "free" ? (
              <>
                Con <strong>Atendel One</strong> se suma Lola, que atiende tu WhatsApp y tus citas. Con <strong>Atendel Max</strong> tienes a los
                cuatro: Víctor trae de regreso a tus clientes e Iris se encarga de la oficina.
              </>
            ) : (
              <>
                Con <strong>Atendel Max</strong> tienes a los cuatro: Víctor trae de regreso a tus clientes e Iris se encarga de la oficina.
              </>
            )}
          </p>
          <Boton variante="sutil" tam="compacto" href="/precios" flecha>
            Ver precios
          </Boton>
        </section>
      ) : null}
      <PieMinimo />
    </div>
  );
}
