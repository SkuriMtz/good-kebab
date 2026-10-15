import type { CSSProperties } from "react";
import { Avatar } from "@/components/base/Avatar";
import { Etiqueta } from "@/components/base/Etiqueta";
import { Icono, type NombreIcono } from "@/components/base/Iconos";
import { Insignia } from "@/components/base/Insignia";
import { DETALLE } from "./detalle";
import { Personaje } from "./Personaje";
import { AGENTE_POR_ID, type IdAgente } from "@/lib/agentes";
import { PERSONAJES } from "@/lib/personajes";

/** El ícono del evento que cierra cada conversación (la cita creada, el correo enviado…). */
const ICONO_EVENTO: Record<IdAgente, NombreIcono> = {
  lola: "calendario",
  clara: "correo",
  victor: "calendario",
  iris: "documento",
};

/**
 * La conversación de ejemplo de un agente como un hilo del producto:
 * cada mensaje con su avatar (el personaje del agente o las iniciales de
 * quien escribe), nombre, sello "Agente" y hora en Mono; el agente habla
 * en una burbuja con tinte azul (es tu negocio el que contesta) y quien
 * escribe, en una neutra. Lo que pasa al final (la cita creada, el correo
 * enviado) aparece como un evento sobre la línea del hilo.
 * Los nombres y los datos son de ejemplo, y así se dice.
 */
export function ConversacionEjemplo({ agente, cabecera = false }: { agente: IdAgente; cabecera?: boolean }) {
  const detalle = DETALLE[agente];
  const nombre = AGENTE_POR_ID[agente].nombre;
  const color = { "--agente": PERSONAJES[agente].color } as CSSProperties;

  return (
    <div className="hilo">
      {cabecera ? (
        <Etiqueta as="p" tono="tenue" className="hilo__cabecera">
          Conversación de ejemplo · {detalle.canal}
        </Etiqueta>
      ) : null}
      <ol className="hilo__lista">
        {detalle.conversacion.map((m, i) =>
          m.de === "nota" ? (
            <li key={i} className="hilo__evento">
              <span className="hilo__icono" aria-hidden="true">
                <Icono nombre={ICONO_EVENTO[agente]} tam={16} />
              </span>
              <p className="hilo__evento-texto">{m.texto}</p>
            </li>
          ) : (
            <li key={i} className="hilo__mensaje" data-de={m.de}>
              {m.de === "agente" ? (
                <span className="hilo__avatar hilo__avatar--agente" style={color} aria-hidden="true">
                  <Personaje agente={agente} avatar />
                </span>
              ) : (
                <Avatar nombre={m.quien ?? "Cliente"} tam={32} className="hilo__avatar" />
              )}
              <div className="hilo__cuerpo">
                <p className="hilo__cabeza">
                  <span className="hilo__nombre">{m.de === "agente" ? nombre : m.quien}</span>
                  {m.de === "agente" ? <Insignia tono="neutra">Agente</Insignia> : null}
                  {m.hora ? <span className="hilo__hora">{m.hora}</span> : null}
                </p>
                <p className="hilo__burbuja">{m.texto}</p>
              </div>
            </li>
          ),
        )}
      </ol>
      <p className="hilo__aviso">Nombres y datos de ejemplo.</p>
    </div>
  );
}
