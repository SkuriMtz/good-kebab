import type { CSSProperties } from "react";
import { Etiqueta } from "@/components/base/Etiqueta";
import { Halo } from "@/components/base/Halo";
import { Seccion } from "@/components/base/Seccion";
import { Personaje } from "@/components/agentes/Personaje";
import type { IdAgente } from "@/lib/agentes";
import { AGENTE_POR_ID } from "@/lib/agentes";
import { PERSONAJES } from "@/lib/personajes";

/**
 * "Un día en la recepción": lo que el equipo resolvió, en orden de hora.
 * Sale tal cual de las conversaciones de ejemplo de cada agente
 * (src/components/agentes/detalle.ts). La de Iris no tiene hora en el
 * ejemplo, así que no se le inventa una: va al final, sin hora.
 */
const DIA: { hora: string | null; agente: IdAgente; canal: string; texto: string }[] = [
  {
    hora: "09:40",
    agente: "clara",
    canal: "Correo",
    texto: "Cambió la cita de Andrea Solís al martes a las 17:00 y le contestó desde tu correo.",
  },
  {
    hora: "10:44",
    agente: "lola",
    canal: "WhatsApp",
    texto: "Agendó a Mariana el jueves a las 16:30 para su primera visita. Un día antes le manda un recordatorio.",
  },
  {
    hora: "11:20",
    agente: "victor",
    canal: "WhatsApp",
    texto: "Le escribió a Paola, que preguntó por botox y no había agendado. Quedó para el viernes a las 12:00.",
  },
  {
    hora: null,
    agente: "iris",
    canal: "Oficina",
    texto: "Dejó el reporte de septiembre listo en Excel y en PDF.",
  },
];

/**
 * 4. Qué es Atendel (Grupo 4 · propuesta T3: tipografía protagonista, pocas cajas).
 * Una frase grande a todo lo ancho; debajo, los tres párrafos de siempre y,
 * a la derecha, la lista de un día con la hora en Mono como guía de lectura.
 * Sin tarjetas: la estructura la dan las divisiones de 1px.
 */
export function QueEs() {
  return (
    <Seccion id="que-es" etiquetadaPor="que-es-titulo" halo>
      <Halo x="16%" y="18%" ancho="min(760px, 120vw)" proporcion="16 / 9" suave />
      <Etiqueta>Qué es Atendel</Etiqueta>
      <h2 id="que-es-titulo" className="t-grande que-es__frase">
        Agentes de IA para negocios que atienden personas.
      </h2>

      <div className="que-es__cuerpo">
        <div className="que-es__texto">
          <p className="t-intro que-es__primero">
            Atendel es un equipo de cuatro agentes de inteligencia artificial para negocios que atienden personas.
          </p>
          <p className="t-intro">
            Atienden tu WhatsApp y tus citas, ordenan tu correo, traen de regreso a tus clientes y hacen el trabajo de oficina.
          </p>
          <p className="t-intro">
            Les hablas como a una persona y te entregan el trabajo hecho: mensajes, tablas, reportes y documentos.
          </p>
        </div>

        <figure className="dia" aria-labelledby="que-es-dia">
          <figcaption className="dia__cabeza">
            <Etiqueta as="span" tono="texto" id="que-es-dia">
              Un día en la recepción
            </Etiqueta>
            <Etiqueta as="span" tono="tenue">
              Ejemplo · nombres ficticios
            </Etiqueta>
          </figcaption>
          <ol className="dia__lista">
            {DIA.map((d) => {
              const agente = AGENTE_POR_ID[d.agente];
              return (
                <li key={d.agente} className="dia__fila">
                  {d.hora ? (
                    <time className="dia__hora" dateTime={d.hora}>
                      {d.hora}
                    </time>
                  ) : (
                    <span className="dia__hora dia__hora--sin">
                      <span aria-hidden="true">—</span>
                      <span className="sr-only">Sin hora</span>
                    </span>
                  )}
                  <span
                    className="marca-agente marca-agente--mini dia__personaje"
                    style={{ "--agente": PERSONAJES[d.agente].color } as CSSProperties}
                  >
                    <Personaje agente={d.agente} avatar />
                  </span>
                  <div className="dia__texto">
                    <p className="info-quien">
                      <span className="info-nombre">{agente.nombre}</span>
                      <Etiqueta as="span" tono="tenue">
                        {d.canal}
                      </Etiqueta>
                    </p>
                    <p className="t-cuerpo">{d.texto}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </figure>
      </div>
    </Seccion>
  );
}
