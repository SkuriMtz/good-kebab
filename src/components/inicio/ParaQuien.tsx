import type { CSSProperties } from "react";
import { Borrador } from "@/components/Encabezado";
import { Boton } from "@/components/base/Boton";
import { Etiqueta } from "@/components/base/Etiqueta";
import { Pestanas } from "@/components/base/Pestanas";
import { EncabezadoSeccion, Seccion } from "@/components/base/Seccion";
import { Personaje } from "@/components/agentes/Personaje";
import { AGENTE_POR_ID, esIdAgente } from "@/lib/agentes";
import { SEGMENTOS } from "@/lib/contenido";
import { PERSONAJES } from "@/lib/personajes";

/**
 * 6. Para quién es (Grupo 4). Versión base: una pestaña por tipo de negocio;
 * cada una con su introducción (borrador) y la tarea concreta de cada
 * agente, con su personaje al lado.
 */
export function ParaQuien() {
  const pestanas = SEGMENTOS.map((s) => ({
    id: s.id,
    etiqueta: s.nombre,
    contenido: (
      <div className="columnas-asimetricas">
        <div>
          <h3 className="t-titulo">{s.nombre}</h3>
          <p className="t-intro mt-[var(--spacing-12)]">{s.intro}</p>
          <p className="mt-[var(--spacing-12)]">
            <Borrador />
          </p>
          <Boton href={`/para-quien-es#${s.id}`} variante="fantasma" flecha className="mt-[var(--spacing-24)]">
            Ver {s.nombre.toLowerCase()}
          </Boton>
        </div>
        <ul className="flex flex-col">
          {s.ayuda.map(([agente, texto]) =>
            esIdAgente(agente) ? (
              <li
                key={agente}
                className="grid grid-cols-[40px_minmax(0,1fr)] gap-[var(--spacing-16)] border-t border-borde py-[var(--spacing-20)] first:border-t-0 first:pt-0"
              >
                <span className="marca-agente marca-agente--chica" style={{ "--agente": PERSONAJES[agente].color } as CSSProperties}>
                  <Personaje agente={agente} avatar />
                </span>
                <div>
                  <Etiqueta tono="cielo">
                    {AGENTE_POR_ID[agente].nombre} · {AGENTE_POR_ID[agente].area}
                  </Etiqueta>
                  <p className="t-editorial mt-[var(--spacing-4)]">{texto}</p>
                </div>
              </li>
            ) : null,
          )}
        </ul>
      </div>
    ),
  }));

  return (
    <Seccion id="para-quien-es" etiquetadaPor="para-quien-titulo">
      <EncabezadoSeccion
        id="para-quien-titulo"
        etiqueta="Para quién es"
        titulo="Para negocios que viven de atender, agendar y que sus clientes regresen"
      />
      <Pestanas etiqueta="Tipos de negocio" pestanas={pestanas} />
    </Seccion>
  );
}
