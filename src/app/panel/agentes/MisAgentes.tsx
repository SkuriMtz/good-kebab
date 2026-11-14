"use client";

import { useEffect } from "react";
import { Enlace, TituloSeccion, claseBoton } from "@/components/panel/Piezas";
import { Seccion, TarjetaAgente } from "@/components/panel/Secciones";
import { AGENTES_INFO, type IdAgente } from "@/lib/agentes";

/**
 * Agentes: quién hace el trabajo. Le escribes a Atendel y él le pasa cada
 * tarea al agente que le toca; los cuatro trabajan siempre (todos los planes
 * los traen), así que aquí ya no se elige a nadie: se ve qué hace cada uno y
 * se llega a su parte del panel (Correo, Citas, pendientes). Sus reglas
 * están en Ajustes > Agentes.
 */
export function MisAgentes({
  enfocado,
  conGoogle,
}: {
  /** Llegó desde otra parte con ?agente=lola: se marca y se lleva a la vista. */
  enfocado?: IdAgente;
  conGoogle: boolean;
}) {
  useEffect(() => {
    if (!enfocado) return;
    const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(`agente-${enfocado}`)?.scrollIntoView({ block: "center", behavior: reducir ? "auto" : "smooth" });
  }, [enfocado]);

  return (
    <Seccion>
      <TituloSeccion
        titulo="Agentes"
        texto="Le escribes a Atendel y él le pasa cada tarea al agente que le toca, o a varios a la vez. Estos son los cuatro que hacen el trabajo."
      />
      <div className="pc-agentes">
        {AGENTES_INFO.map((a, i) => (
          <TarjetaAgente
            key={a.id}
            agente={a.id}
            indice={i}
            enfocado={enfocado === a.id}
            estado={a.id === "clara" && conGoogle ? { texto: "Conectada a tu Gmail", tono: "exito" } : { texto: "Trabajando para ti", tono: "exito" }}
            datos={
              <ul className="pc-agente__capacidades">
                {a.capacidades.slice(0, 3).map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            }
            acciones={
              <>
                {a.id === "clara" ? (
                  <Enlace href="/panel?vista=correo" className={claseBoton("borde", true)}>
                    Abrir Correo
                  </Enlace>
                ) : a.id === "lola" ? (
                  <Enlace href="/panel?vista=citas" className={claseBoton("borde", true)}>
                    Ver Citas
                  </Enlace>
                ) : (
                  <Enlace href="/panel?vista=pendientes" className={claseBoton("borde", true)}>
                    Ver pendientes
                  </Enlace>
                )}
                <Enlace href="/panel?vista=ajustes&seccion=agentes" className={claseBoton("fantasma", true)}>
                  Sus reglas
                </Enlace>
              </>
            }
          />
        ))}
      </div>
    </Seccion>
  );
}
