import type { CSSProperties, ReactNode } from "react";
import { Avatar } from "@/components/base/Avatar";
import { Icono } from "@/components/base/Iconos";
import { Personaje } from "./Personaje";
import type { MensajeEjemplo } from "./detalle";
import type { IdAgente } from "@/lib/agentes";
import { agenteDe, t, type Idioma } from "@/i18n";

/** Archivos que el agente menciona en su mensaje ("precios-zona.xlsx"): se muestran como adjunto. */
const ARCHIVO = /\b[\w-]+\.(?:xlsx|pdf|docx)\b/g;

/**
 * La conversación de ejemplo de un agente, como se vería dentro del producto
 * (va dentro de un <MarcoNavegador>). Cada canal se ve como lo que es:
 * - WhatsApp (Lola, Víctor): burbujas; las del negocio a la derecha con
 *   tinte azul, las del cliente a la izquierda.
 * - Correo (Clara): un hilo de correos, uno debajo de otro, con remitente y hora.
 * - Chat con Iris: tú a la derecha, Iris a la izquierda, y el archivo que
 *   entrega como adjunto.
 * La "nota" final (cita creada, correos enviados) es un evento de la línea de
 * tiempo, con su palomita. Todos los datos salen de detalle.ts; los nombres
 * son de ejemplo y así se dice arriba.
 * `animar`: los mensajes entran uno tras otro (al cambiar de pestaña).
 */
export function ConversacionEjemplo({ agente, animar = false, idioma = "es" }: { agente: IdAgente; animar?: boolean; idioma?: Idioma }) {
  const d = t(idioma);
  const detalle = d.detalle[agente];
  const info = agenteDe(idioma, agente);
  const correo = agente === "clara";
  const conIris = agente === "iris";
  const otro = detalle.conversacion.find((m) => m.de === "otro")?.quien ?? "";

  const quienHabla = (m: MensajeEjemplo) => (m.de === "agente" ? info.nombre : m.quien ?? "");
  const avatarDe = (m: MensajeEjemplo, tam: 24 | 28 | 32) =>
    m.de === "agente" ? (
      <Avatar nombre={info.nombre} tam={tam} className="conv__avatar-agente">
        <Personaje agente={agente} avatar />
      </Avatar>
    ) : (
      <Avatar nombre={m.quien ?? ""} tam={tam} />
    );

  return (
    <div className={`conv${correo ? " conv--correo" : ""}${animar ? " conv--entra" : ""}`} data-canal={detalle.canal}>
      {/* Cabeza: con quién es la conversación y por dónde */}
      <div className="conv__cabeza">
        <div className="conv__quien">
          {conIris ? (
            <Avatar nombre={info.nombre} tam={32} className="conv__avatar-agente">
              <Personaje agente={agente} avatar />
            </Avatar>
          ) : (
            <Avatar nombre={otro} tam={32} />
          )}
          <div className="min-w-0">
            <p className="conv__nombre">{conIris ? info.nombre : otro}</p>
            <p className="conv__canal">
              <Icono nombre={correo ? "correo" : "mensaje"} tam={14} />
              {detalle.canal}
              {conIris ? null : d.conversacion.loAtiende(info.nombre)}
            </p>
          </div>
        </div>
        <span className="conv__ejemplo">{d.conversacion.ejemplo}</span>
      </div>

      <ol className="conv__mensajes">
        {detalle.conversacion.map((m, i) => {
          const estilo = { "--i": i } as CSSProperties;

          if (m.de === "nota") {
            return (
              <li key={i} className="conv__item conv__evento" style={estilo}>
                <span className="conv__evento-icono">
                  <Icono nombre="check" tam={14} />
                </span>
                <span>{m.texto}</span>
              </li>
            );
          }

          const archivos = m.de === "agente" ? m.texto.match(ARCHIVO) ?? [] : [];

          if (correo) {
            return (
              <li key={i} className="conv__item conv__correo" style={estilo}>
                {avatarDe(m, 32)}
                <div className="min-w-0">
                  <p className="conv__correo-cabeza">
                    <span className="conv__nombre">{quienHabla(m)}</span>
                    {m.de === "agente" ? <span className="conv__nota-quien">{d.conversacion.desdeTuCorreo}</span> : null}
                    {m.hora ? <time className="conv__hora">{m.hora}</time> : null}
                  </p>
                  <p className="conv__texto">{m.texto}</p>
                </div>
              </li>
            );
          }

          // Chat: el lado de "lo mío" es el negocio (Lola, Víctor) o tú (con Iris)
          const mio = conIris ? m.de === "otro" : m.de === "agente";
          // En un chat de dos, el nombre solo hace falta la primera vez que contesta el agente
          const cambia = m.de === "agente" && detalle.conversacion.findIndex((x) => x.de === "agente") === i;
          return (
            <li key={i} className={`conv__item conv__fila${mio ? " conv__fila--mia" : ""}`} style={estilo}>
              {cambia ? (
                <p className="conv__firma">
                  {m.de === "agente" ? <Personaje agente={agente} avatar className="conv__firma-personaje" /> : null}
                  {quienHabla(m)}
                  {m.de === "agente" && !conIris ? <span className="conv__nota-quien">· {info.area}</span> : null}
                </p>
              ) : null}
              <div className={`conv__burbuja${mio ? " conv__burbuja--mia" : ""}`}>
                <p className="conv__texto">{m.texto}</p>
                {m.hora ? <time className="conv__hora">{m.hora}</time> : null}
              </div>
              {archivos.length ? (
                <div className="conv__adjuntos">
                  {archivos.map((a) => (
                    <Adjunto key={a}>{a}</Adjunto>
                  ))}
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Adjunto({ children }: { children: ReactNode }) {
  return (
    <span className="conv__adjunto">
      <Icono nombre="documento" tam={16} />
      {children}
    </span>
  );
}
