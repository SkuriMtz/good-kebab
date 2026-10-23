import type { CSSProperties } from "react";
import { Etiqueta } from "@/components/base/Etiqueta";
import { Seccion } from "@/components/base/Seccion";
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
    texto: "Agendó a Mariana el jueves a las 16:30 para limpieza facial. Un día antes le manda un recordatorio.",
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

/** El marcador propio de Atendel (no el triángulo): los cuatro puntos del logo. */
function Marcador() {
  return (
    <span className="terminal__marca" aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </span>
  );
}

/**
 * 4. Qué es Atendel (estilo diseno/vercel: dos columnas). A la izquierda la
 * frase y los tres párrafos de siempre; a la derecha, un panel tipo
 * terminal en Geist Mono con lo que el equipo resolvió hoy: el marcador
 * propio de Atendel (los cuatro puntos) y palomitas ✓ verdes. Datos de
 * ejemplo, marcados como tales.
 */
export function QueEs() {
  return (
    <Seccion id="que-es" etiquetadaPor="que-es-titulo">
      <div className="dos-zonas">
        <div className="dos-zonas__texto">
          <Etiqueta>Qué es Atendel</Etiqueta>
          <h2 id="que-es-titulo" className="t-seccion">
            Agentes de IA para negocios que atienden personas.
          </h2>
          <p className="t-intro">
            Atendel es un equipo de cuatro agentes de inteligencia artificial para clínicas, consultorios y estéticas.
          </p>
          <p className="t-intro">
            Atienden tu WhatsApp y tus citas, ordenan tu correo, traen de regreso a tus clientes y hacen el trabajo de oficina.
          </p>
          <p className="t-intro">
            Les hablas como a una persona y te entregan el trabajo hecho: mensajes, tablas, reportes y documentos.
          </p>
        </div>

        <figure className="terminal" aria-labelledby="que-es-dia">
          <figcaption className="terminal__barra">
            <span className="terminal__puntos" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span id="que-es-dia" className="etiqueta">
              Hoy en la recepción
            </span>
            <span className="etiqueta etiqueta--tenue">Ejemplo · nombres ficticios</span>
          </figcaption>
          <ol className="terminal__cuerpo">
            <li className="terminal__linea">
              <Marcador />
              <span className="terminal__comando">atendel hoy</span>
            </li>
            {DIA.map((d) => {
              const agente = AGENTE_POR_ID[d.agente];
              return (
                <li key={d.agente} className="terminal__linea">
                  <span className="terminal__ok" aria-hidden="true">
                    ✓
                  </span>
                  <span className="terminal__fila">
                    <span className="terminal__tenue terminal__hora">
                      {d.hora ? <time dateTime={d.hora}>{d.hora}</time> : <span aria-label="Sin hora">--:--</span>}
                    </span>
                    <span className="terminal__quien">
                      <span
                        className="terminal__punto"
                        style={{ "--agente": PERSONAJES[d.agente].color } as CSSProperties}
                        aria-hidden="true"
                      />
                      {agente.nombre}
                      <span className="sr-only"> · {d.canal}:</span>
                    </span>
                    <span className="terminal__texto">{d.texto}</span>
                  </span>
                </li>
              );
            })}
            <li className="terminal__linea">
              <Marcador />
              <span className="terminal__tenue">
                {DIA.length} tareas resueltas · lo importante espera tu visto bueno
              </span>
            </li>
          </ol>
        </figure>
      </div>
    </Seccion>
  );
}
