import { Avatar } from "@/components/base/Avatar";
import { Icono } from "@/components/base/Iconos";
import { DETALLE } from "./detalle";
import { Personaje } from "./Personaje";
import { AGENTE_POR_ID, type IdAgente } from "@/lib/agentes";

/**
 * La conversación de ejemplo de un agente, como se ve en el producto: tu lado
 * a la derecha (lo que el agente contesta por tu negocio, o lo que tú le
 * pides a Iris), la otra persona a la izquierda; quién habla y la hora en
 * Mono arriba de cada burbuja, y lo que quedó hecho ("Cita creada…") como
 * un sello al final. Los nombres son de ejemplo y así se dice.
 */
export function ConversacionEjemplo({ agente, encabezado = true }: { agente: IdAgente; encabezado?: boolean }) {
  const detalle = DETALLE[agente];
  const nombre = AGENTE_POR_ID[agente].nombre;
  // Si en la conversación hablas tú (Iris), tu lado eres tú; si no, el agente habla por tu negocio.
  const hablasTu = detalle.conversacion.some((m) => m.de === "otro" && m.quien === "Tú");

  return (
    <div className="conv">
      {encabezado ? (
        <div className="conv__cabeza">
          <span className="etiqueta etiqueta--tenue">Conversación de ejemplo · {detalle.canal}</span>
          <span className="t-caption">Nombres de ejemplo</span>
        </div>
      ) : null}
      <ol className="conv__lista">
        {detalle.conversacion.map((m, i) => {
          if (m.de === "nota") {
            return (
              <li key={i} className="conv__sello">
                <Icono nombre="check-circulo" tam={16} className="conv__sello-icono" />
                <span>{m.texto}</span>
              </li>
            );
          }
          const esAgente = m.de === "agente";
          const mio = hablasTu ? !esAgente : esAgente;
          const quien = esAgente ? nombre : m.quien ?? "";
          return (
            <li key={i} className={`conv__msj${mio ? " conv__msj--mio" : ""}`}>
              {esAgente ? (
                <Avatar nombre={nombre} tam={28} className="conv__avatar">
                  <Personaje agente={agente} avatar />
                </Avatar>
              ) : quien === "Tú" ? null : (
                <Avatar nombre={quien} tam={28} className="conv__avatar" />
              )}
              <div className="conv__globo">
                <p className="conv__quien">
                  <span>{quien}</span>
                  {m.hora ? <span className="cifras">{m.hora}</span> : null}
                </p>
                <p className="conv__texto">{m.texto}</p>
              </div>
            </li>
          );
        })}
      </ol>
      {encabezado ? null : <p className="conv__pie t-caption">Nombres de ejemplo</p>}
    </div>
  );
}
