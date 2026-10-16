import { Etiqueta } from "@/components/base/Etiqueta";
import { Icono } from "@/components/base/Iconos";
import { MarcoNavegador } from "@/components/base/MarcoNavegador";
import { DETALLE } from "@/components/agentes/detalle";
import { Personaje } from "@/components/agentes/Personaje";
import { AGENTE_POR_ID, type IdAgente } from "@/lib/agentes";

/**
 * La conversación de ejemplo de un agente (detalle.ts, nombres ficticios)
 * dentro del marco de navegador, con la densidad del producto: burbujas, hora
 * en Mono y la nota del sistema al final (la cita creada, el archivo listo).
 * Del lado derecho va "tu" lado: lo que el agente escribe por tu negocio o,
 * en el chat con Iris, lo que tú le pides.
 */
export function Conversacion({ agente }: { agente: IdAgente }) {
  const { canal, conversacion } = DETALLE[agente];
  const nombre = AGENTE_POR_ID[agente].nombre;
  const hablasTu = conversacion.some((m) => m.quien === "Tú");

  return (
    <MarcoNavegador
      titulo={`Conversación de ejemplo de ${nombre} · ${canal}`}
      pestanas={[{ etiqueta: `${nombre} · ${canal}`, adorno: <Personaje agente={agente} avatar />, activa: true }]}
    >
      <ol className="producto inf-chat">
        {conversacion.map((m, i) => {
          if (m.de === "nota") {
            return (
              <li key={i} className="inf-chat__nota t-app-etiqueta">
                <Icono nombre="check-circulo" tam={16} />
                {m.texto}
              </li>
            );
          }
          const quien = m.de === "agente" ? nombre : (m.quien ?? "");
          const derecha = m.de === "agente" ? !hablasTu : m.quien === "Tú";
          return (
            <li key={i} className="inf-chat__fila" data-lado={derecha ? "der" : "izq"}>
              <Etiqueta as="p" tono="cuerpo" className="inf-chat__meta">
                {quien}
                {m.hora ? <time className="cifras">{m.hora}</time> : null}
              </Etiqueta>
              <p className={`inf-burbuja t-app${derecha ? "" : " inf-burbuja--otro"}`}>{m.texto}</p>
            </li>
          );
        })}
      </ol>
    </MarcoNavegador>
  );
}
