"use client";

import { useId } from "react";
import { BotonIcono } from "@/components/base/Boton";
import { Insignia } from "@/components/base/Insignia";
import { Accionable, Hora, MarcaAgente, Vacio } from "./Piezas";
import type { Aviso } from "./tipos";
import { usePopover } from "@/components/base/Popover";

/**
 * La campana: cuántos avisos sin leer y, al abrirla, la lista (quién, qué
 * pasó, hace cuánto y un punto azul en lo no leído). Es un panel, no un menú:
 * cada aviso lleva a donde se resuelve. Usa el mismo panel flotante de la
 * base (.menu__panel: radio 14, sombra suave, entra desde la campana).
 */
export function Avisos({
  avisos,
  ahora,
  alLeerTodos,
  vacio = "Aquí te avisamos cuando un agente necesite algo de ti.",
}: {
  avisos: Aviso[];
  ahora: Date | null;
  alLeerTodos?: () => void;
  vacio?: string;
}) {
  const { abierto, setAbierto, cerrar, raiz, disparador, alSalirFoco } = usePopover<HTMLButtonElement>();
  const idPanel = `${useId().replace(/:/g, "")}-avisos`;
  const sinLeer = avisos.filter((a) => !a.leido).length;

  return (
    <div ref={raiz} className="menu menu--fin" onBlur={alSalirFoco}>
      <BotonIcono
        ref={disparador}
        etiqueta="Avisos"
        icono="campana"
        contador={sinLeer}
        etiquetaContador={sinLeer ? `${sinLeer} sin leer` : undefined}
        anillo="var(--c-barra)"
        aria-expanded={abierto}
        aria-controls={idPanel}
        aria-haspopup="dialog"
        onClick={() => setAbierto((v) => !v)}
      />
      <div id={idPanel} role="dialog" aria-label="Avisos" className="menu__panel dash-avisos" data-abierto={abierto ? "true" : undefined}>
        <div className="dash-avisos__cabeza">
          <p className="dash-avisos__titulo">
            Avisos
            {sinLeer ? <Insignia tono="azul">{sinLeer} sin leer</Insignia> : null}
          </p>
          {sinLeer && alLeerTodos ? (
            <button type="button" className="dash-enlace dash-enlace--chico" onClick={alLeerTodos}>
              Marcar como leídos
            </button>
          ) : null}
        </div>
        {avisos.length ? (
          <ul className="dash-avisos__lista">
            {avisos.map((a) => (
              <li key={a.id}>
                <Accionable
                  accion={{
                    href: a.href,
                    alElegir: a.alElegir
                      ? () => {
                          a.alElegir?.();
                          cerrar(false);
                        }
                      : undefined,
                  }}
                  className={`dash-aviso${a.leido ? "" : " dash-aviso--nuevo"}`}
                >
                  {a.agente ? <MarcaAgente id={a.agente} tam={32} /> : null}
                  <span className="dash-aviso__texto">
                    <span className="dash-aviso__titulo">{a.titulo}</span>
                    {a.detalle ? <span className="dash-aviso__detalle">{a.detalle}</span> : null}
                    <Hora item={a} ahora={ahora} />
                  </span>
                  {a.leido ? null : <Insignia punto tono="azul" etiqueta="Sin leer" />}
                </Accionable>
              </li>
            ))}
          </ul>
        ) : (
          <Vacio compacto icono="campana" titulo="No tienes avisos" texto={vacio} />
        )}
      </div>
    </div>
  );
}
