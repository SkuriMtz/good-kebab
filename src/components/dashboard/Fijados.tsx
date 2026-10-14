import type { ReactNode } from "react";
import { AGENTE_POR_ID } from "@/lib/agentes";
import { Icono } from "@/components/base/Iconos";
import { Insignia } from "@/components/base/Insignia";
import { PuntoEstado } from "@/components/base/PuntoEstado";
import { Cara, Caras } from "./Caras";
import { Destinable } from "./Navegacion";
import type { AgenteFijado, ConversacionReciente, Destino } from "./tipos";

/** Encabezado de un bloque del centro: título a la izquierda y un enlace discreto a la derecha. */
export function Cabeza({ id, titulo, enlace }: { id: string; titulo: string; enlace?: { etiqueta: string; destino: Destino } }) {
  return (
    <div className="dash-cabeza">
      <h2 id={id} className="dash-cabeza__titulo">
        {titulo}
      </h2>
      {enlace ? (
        <Destinable destino={enlace.destino} className="dash-cabeza__enlace">
          {enlace.etiqueta}
          <Icono nombre="chevron-derecha" tam={16} />
        </Destinable>
      ) : null}
    </div>
  );
}

/**
 * Agentes fijados: como los repositorios fijados de un perfil. Una tarjeta
 * por agente (2 × 2): personaje, nombre, área, lo que hace y, abajo, su
 * estado y un dato del día. Toda la tarjeta lleva a hablar con él.
 */
export function AgentesFijados({ agentes, todos }: { agentes: AgenteFijado[]; todos: Destino }) {
  return (
    <section aria-labelledby="dash-fijados">
      <Cabeza id="dash-fijados" titulo="Agentes fijados" enlace={{ etiqueta: "Ver tu equipo", destino: todos }} />
      <ul className="dash-fijados">
        {agentes.map((a) => {
          const info = AGENTE_POR_ID[a.id];
          return (
            <li key={a.id}>
              <Destinable destino={a.destino} className={`dash-fijado${a.bloqueado ? " dash-fijado--bloqueado" : ""}`}>
                <span className="dash-fijado__cabeza">
                  <Cara agente={a.id} tam="chica" />
                  <span className="dash-fijado__nombre">
                    <span className="dash-fijado__titulo">{info.nombre}</span>
                    <span className="dash-fijado__area">{info.abarca}</span>
                  </span>
                  {a.bloqueado ? (
                    <Insignia tono="pronto">
                      <Icono nombre="candado" tam={12} />
                      {a.bloqueado}
                    </Insignia>
                  ) : (
                    <Insignia>{info.area}</Insignia>
                  )}
                </span>
                <span className="dash-fijado__lema">{info.lema}</span>
                <span className="dash-fijado__pie">
                  {a.bloqueado ? (
                    <span className="dash-fijado__dato">{a.dato}</span>
                  ) : (
                    <>
                      <PuntoEstado tono={a.tono} etiqueta={a.estado} mostrarEtiqueta pulso={a.pulso} />
                      <span className="dash-fijado__dato">{a.dato}</span>
                    </>
                  )}
                </span>
              </Destinable>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Conversaciones recientes: una lista con filas de 56px (caras, nombre, último mensaje, hora y sin leer). */
export function ConversacionesRecientes({
  conversaciones,
  todas,
  vacio,
}: {
  conversaciones: ConversacionReciente[];
  todas: Destino;
  vacio: ReactNode;
}) {
  return (
    <section aria-labelledby="dash-recientes">
      <Cabeza id="dash-recientes" titulo="Conversaciones recientes" enlace={{ etiqueta: "Abrir el chat", destino: todas }} />
      {conversaciones.length ? (
        <ul className="dash-lista">
          {conversaciones.map((c) => (
            <li key={c.id}>
              <Destinable destino={c.destino} className="dash-lista__fila dash-conversacion">
                <Caras agentes={c.agentes} tam={c.agentes.length > 1 ? "mini" : "chica"} />
                <span className="dash-conversacion__texto">
                  <span className="dash-conversacion__nombre">
                    {c.nombre}
                    {c.agentes.length > 1 ? <span className="dash-conversacion__tipo">Grupo</span> : null}
                  </span>
                  <span className="dash-conversacion__previa">{c.vistaPrevia}</span>
                </span>
                <span className="dash-conversacion__extra">
                  <span className="dash-hora cifras">{c.cuando}</span>
                  {c.sinLeer ? <Insignia contador={c.sinLeer} solida etiqueta={`${c.sinLeer} sin leer`} /> : null}
                </span>
              </Destinable>
            </li>
          ))}
        </ul>
      ) : (
        vacio
      )}
    </section>
  );
}
