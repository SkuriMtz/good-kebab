import type { CSSProperties } from "react";
import { Borrador } from "@/components/Encabezado";
import { Acordeon } from "@/components/base/Acordeon";
import { Boton } from "@/components/base/Boton";
import { Etiqueta } from "@/components/base/Etiqueta";
import { EncabezadoSeccion, Seccion } from "@/components/base/Seccion";
import { TarjetaVidrio } from "@/components/base/TarjetaVidrio";
import { Personaje } from "@/components/agentes/Personaje";
import { AGENTE_POR_ID, esIdAgente } from "@/lib/agentes";
import { SEGMENTOS } from "@/lib/contenido";
import { PERSONAJES } from "@/lib/personajes";
import { planMinimo } from "@/lib/planes";

export type Segmento = (typeof SEGMENTOS)[number];

/** "Desde One": el plan más sencillo que trae a ese agente (src/lib/planes.ts). */
function desdePlan(agente: Parameters<typeof planMinimo>[0]) {
  return planMinimo(agente).nombre.replace("Atendel ", "");
}

/**
 * Las tareas de cada agente para un tipo de negocio, como renglones del
 * producto (una lista tipo "issues"): personaje, nombre y área, la tarea y,
 * a la derecha, desde qué plan está ese agente. Se usa en el inicio (dentro
 * del acordeón) y en /para-quien-es (dentro del marco de navegador).
 */
export function TareasNegocio({
  segmento,
  className = "",
}: {
  segmento: Segmento;
  className?: string;
}) {
  return (
    <ul className={`inf-tareas ${className}`}>
      {segmento.ayuda.map(([id, texto]) => {
        if (!esIdAgente(id)) return null;
        const a = AGENTE_POR_ID[id];
        return (
          <li key={id} className="inf-tareas__fila">
            <span
              className="marca-agente marca-agente--chica"
              style={{ "--agente": PERSONAJES[id].color } as CSSProperties}
            >
              <Personaje agente={id} avatar />
            </span>
            <div className="min-w-0">
              <p className="inf-tareas__quien">
                <strong>{a.nombre}</strong>
                <span aria-hidden="true"> · </span>
                <span className="inf-tareas__area">{a.area}</span>
              </p>
              <p className="inf-tareas__texto">{texto}</p>
            </div>
            <Etiqueta
              as="span"
              tono="tenue"
              className="inf-tareas__plan"
              title={`Lo trae ${planMinimo(id).nombre}`}
            >
              Desde {desdePlan(id)}
            </Etiqueta>
          </li>
        );
      })}
    </ul>
  );
}

/** Los personajes del negocio, encimados como los avatares de quien colabora (en el orden de sus tareas). */
export function PilaAgentes({ segmento }: { segmento: Segmento }) {
  return (
    <span className="inf-pila" aria-hidden="true">
      {segmento.ayuda.map(([id]) =>
        esIdAgente(id) ? (
          <span
            key={id}
            className="marca-agente marca-agente--mini"
            style={{ "--agente": PERSONAJES[id].color } as CSSProperties}
          >
            <Personaje agente={id} avatar />
          </span>
        ) : null,
      )}
    </span>
  );
}

/**
 * 6. Para quién es (Grupo 4 · G4-T2, "el producto manda"). Acordeón por
 * negocio dentro de una tarjeta de vidrio: cada fila lleva los personajes del
 * equipo encimados; al abrirla, la introducción (marcada como borrador) y las
 * tareas de cada agente como renglones del producto. Clínicas abre al llegar.
 */
export function ParaQuien() {
  const items = SEGMENTOS.map((s) => ({
    id: s.id,
    titulo: (
      <span className="inf-negocio">
        <PilaAgentes segmento={s} />
        <span className="inf-negocio__nombre">{s.nombre}</span>
      </span>
    ),
    contenido: (
      <div className="inf-negocio__panel">
        <p className="inf-negocio__intro">
          {s.intro} <Borrador />
        </p>
        <TareasNegocio segmento={s} className="inf-tareas--caja" />
        <p className="inf-negocio__pie">
          <Boton
            href={`/para-quien-es#${s.id}`}
            variante="fantasma"
            tam="chico"
            flecha
          >
            Ver {s.nombre.toLowerCase()} en detalle
          </Boton>
        </p>
      </div>
    ),
  }));

  return (
    <Seccion id="para-quien-es" etiquetadaPor="para-quien-titulo">
      <EncabezadoSeccion
        id="para-quien-titulo"
        adorno={<Personaje agente="victor" />}
        etiqueta="Para quién es"
        titulo="Para negocios que viven de atender, agendar y que sus clientes regresen"
        texto="Abre tu tipo de negocio y mira qué le toca a cada agente."
      />
      <TarjetaVidrio relleno="ninguno" className="inf-negocios">
        <Acordeon items={items} unoALaVez abiertos={["clinicas"]} />
      </TarjetaVidrio>
    </Seccion>
  );
}
