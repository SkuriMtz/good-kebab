import type { CSSProperties } from "react";
import { Borrador } from "@/components/Encabezado";
import { Boton } from "@/components/base/Boton";
import { Etiqueta } from "@/components/base/Etiqueta";
import { Pestanas } from "@/components/base/Pestanas";
import { Seccion } from "@/components/base/Seccion";
import { Personaje } from "@/components/agentes/Personaje";
import { AGENTE_POR_ID, esIdAgente } from "@/lib/agentes";
import { SEGMENTOS } from "@/lib/contenido";
import { PERSONAJES } from "@/lib/personajes";

/**
 * 6. Para quién es (Grupo 4 · propuesta T3).
 * Pestañas en píldora, una por negocio. Cada una en dos columnas: a la
 * izquierda cómo es ese negocio (texto de ejemplo, marcado como borrador) y,
 * a la derecha, la tarea concreta de cada agente con su personaje, en una
 * rejilla de 2 × 2 separada por líneas de 1px (sin tarjetas).
 */
export function ParaQuien() {
  const pestanas = SEGMENTOS.map((s) => ({
    id: s.id,
    etiqueta: s.nombre,
    contenido: (
      <div className="negocio">
        <div className="negocio__intro">
          <h3 className="sr-only">{s.nombre}</h3>
          <p className="t-sub negocio__frase">{s.intro}</p>
          <p>
            <Borrador />
          </p>
          <Boton href={`/para-quien-es#${s.id}`} variante="fantasma" flecha className="negocio__enlace">
            Todo sobre {s.nombre.toLowerCase()}
          </Boton>
        </div>
        <ul className="tareas" aria-label={`Qué hace cada agente en ${s.nombre.toLowerCase()}`}>
          {s.ayuda.map(([id, texto]) => {
            if (!esIdAgente(id)) return null;
            const agente = AGENTE_POR_ID[id];
            return (
              <li key={id} className="tarea">
                <span className="marca-agente marca-agente--chica" style={{ "--agente": PERSONAJES[id].color } as CSSProperties}>
                  <Personaje agente={id} avatar />
                </span>
                <div>
                  <p className="info-quien">
                    <span className="info-nombre">{agente.nombre}</span>
                    <Etiqueta as="span" tono="tenue">
                      {agente.area}
                    </Etiqueta>
                  </p>
                  <p className="t-cuerpo">{texto}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    ),
  }));

  return (
    <Seccion id="para-quien-es" etiquetadaPor="para-quien-titulo">
      <header className="negocios__cabeza">
        <Etiqueta>Para quién es</Etiqueta>
        <h2 id="para-quien-titulo" className="t-seccion">
          Para negocios que viven de atender, agendar y que sus clientes regresen
        </h2>
      </header>
      <Pestanas etiqueta="Tipos de negocio" pestanas={pestanas} alineacion="izquierda" classNamePanel="negocios__panel" />
    </Seccion>
  );
}
