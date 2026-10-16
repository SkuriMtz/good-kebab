import Link from "next/link";
import type { CSSProperties } from "react";
import { Borrador } from "@/components/Encabezado";
import { Etiqueta } from "@/components/base/Etiqueta";
import { Icono } from "@/components/base/Iconos";
import { Pestanas } from "@/components/base/Pestanas";
import { EncabezadoSeccion, Seccion } from "@/components/base/Seccion";
import { Personaje } from "@/components/agentes/Personaje";
import { AGENTE_POR_ID, esIdAgente, type IdAgente } from "@/lib/agentes";
import { SEGMENTOS } from "@/lib/contenido";
import { PERSONAJES } from "@/lib/personajes";
import { planMinimo } from "@/lib/planes";

/** El color del agente para el fondo de su marca (`.marca-agente`). */
const colorAgente = (agente: IdAgente) => ({ "--agente": PERSONAJES[agente].color }) as CSSProperties;

/** En qué plan está cada agente, dicho corto (sale de planes.ts): Clara desde Free, Lola desde One, Víctor e Iris en Max. */
export function planCorto(agente: IdAgente) {
  const plan = planMinimo(agente);
  const nombre = plan.nombre.replace("Atendel ", "");
  return plan.id === "max" ? `En ${nombre}` : `Desde ${nombre}`;
}

/**
 * Las tareas de un negocio, una por agente, con su personaje al lado
 * (filas separadas por 1px, sin cajas). La usan el inicio y /para-quien-es.
 */
export function TareasPorAgente({
  ayuda,
  compacta = false,
}: {
  ayuda: readonly (readonly [string, string])[];
  compacta?: boolean;
}) {
  return (
    <ul className={`inf-tareas${compacta ? " inf-tareas--compacta" : ""}`}>
      {ayuda.map(([agente, texto]) =>
        esIdAgente(agente) ? (
          <li key={agente}>
            <span
              className={`marca-agente${compacta ? " marca-agente--chica" : ""}`}
              style={colorAgente(agente)}
              aria-hidden="true"
            >
              <Personaje agente={agente} avatar />
            </span>
            <div className="min-w-0">
              <p className="inf-tareas__quien">
                <span className="inf-nombre">{AGENTE_POR_ID[agente].nombre}</span>
                <Etiqueta as="span" tono="cielo">
                  {AGENTE_POR_ID[agente].area}
                </Etiqueta>
                <Etiqueta as="span" tono="tenue" className="inf-tareas__plan">
                  {planCorto(agente)}
                </Etiqueta>
              </p>
              <p className="t-cuerpo">{texto}</p>
            </div>
          </li>
        ) : null,
      )}
    </ul>
  );
}

/**
 * 6. Para quién es (Grupo 4 · propuesta T1). Como la fila de pestañas de la
 * portada de GitHub (Code / Plan / Collaborate…): una píldora por negocio y,
 * debajo, una sola vista que cambia. A la izquierda lo que vive ese negocio
 * (texto de ejemplo, marcado como borrador) y el enlace a su bloque en
 * /para-quien-es; a la derecha, la tarea concreta de cada agente con su
 * personaje al lado y en qué plan está.
 */
export function ParaQuien() {
  const pestanas = SEGMENTOS.map((s) => ({
    id: s.id,
    etiqueta: s.nombre,
    contenido: (
      <div className="inf-negocio">
        <div className="inf-negocio__lado">
          <h3 className="sr-only">{s.nombre}</h3>
          <p className="t-sub">{s.intro}</p>
          <Borrador />
          <Link href={`/para-quien-es#${s.id}`} className="inf-enlace">
            <span>Más sobre {s.nombre.toLowerCase()}</span>
            <Icono nombre="flecha" tam={16} />
          </Link>
        </div>
        <TareasPorAgente ayuda={s.ayuda} />
      </div>
    ),
  }));

  return (
    <Seccion id="para-quien-es" etiquetadaPor="para-quien-titulo">
      <EncabezadoSeccion
        id="para-quien-titulo"
        alineacion="izquierda"
        etiqueta="Para quién es"
        titulo="Para negocios que viven de atender, agendar y que sus clientes regresen"
        className="!mb-[var(--spacing-32)]"
      />
      <Pestanas etiqueta="Tipos de negocio" pestanas={pestanas} alineacion="izquierda" classNamePanel="!mt-[var(--spacing-40)]" />
    </Seccion>
  );
}
