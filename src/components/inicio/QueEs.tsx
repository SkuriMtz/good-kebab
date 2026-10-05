import type { CSSProperties } from "react";
import { Etiqueta } from "@/components/base/Etiqueta";
import { EncabezadoSeccion, Seccion } from "@/components/base/Seccion";
import { TarjetaVidrio } from "@/components/base/TarjetaVidrio";
import { Personaje } from "@/components/agentes/Personaje";
import type { IdAgente } from "@/lib/agentes";
import { AGENTE_POR_ID } from "@/lib/agentes";
import { PERSONAJES } from "@/lib/personajes";

/** Lo que el equipo resolvió en "un día de la recepción": sale de las conversaciones de ejemplo de cada agente (detalle.ts). */
const DIA: { agente: IdAgente; sello: string; texto: string }[] = [
  { agente: "clara", sello: "Correo · 09:40", texto: "Cambió la cita de Andrea al martes a las 17:00 y le contestó desde tu correo." },
  { agente: "lola", sello: "WhatsApp · 10:44", texto: "Agendó a Mariana el jueves a las 16:30 para limpieza facial." },
  { agente: "victor", sello: "WhatsApp · 11:20", texto: "Paola volvió a agendar: viernes a las 12:00." },
  { agente: "iris", sello: "Oficina", texto: "Dejó el reporte de septiembre listo en Excel y en PDF." },
];

/**
 * 4. Qué es Atendel (Grupo 4). Versión base: columnas asimétricas. A la
 * izquierda el título y el texto; a la derecha, un panel de vidrio con lo
 * que los agentes resolvieron en un día (sellos de hora en Mono).
 */
export function QueEs() {
  return (
    <Seccion id="que-es" etiquetadaPor="que-es-titulo">
      <div className="columnas-asimetricas lg:items-center">
        <div>
          <EncabezadoSeccion
            id="que-es-titulo"
            alineacion="izquierda"
            adorno={<Personaje agente="lola" />}
            etiqueta="Qué es Atendel"
            titulo="Agentes de IA para negocios que atienden personas"
            texto="Un equipo de cuatro agentes para clínicas, consultorios y estéticas. Les hablas como a una persona y te entregan el trabajo hecho: mensajes, tablas, reportes y documentos."
            className="!mb-0"
          />
        </div>
        <TarjetaVidrio as="figure" relleno="amplio" aria-labelledby="que-es-dia">
          <figcaption className="flex flex-wrap items-baseline justify-between gap-x-[var(--spacing-16)] gap-y-[var(--spacing-4)]">
            <Etiqueta as="span" tono="texto" id="que-es-dia">
              Un día en la recepción
            </Etiqueta>
            <Etiqueta as="span" tono="tenue">
              Ejemplo · nombres ficticios
            </Etiqueta>
          </figcaption>
          <ol className="mt-[var(--spacing-24)] flex flex-col">
            {DIA.map((d) => (
              <li
                key={d.agente}
                className="grid grid-cols-[40px_minmax(0,1fr)] gap-[var(--spacing-16)] border-t border-borde py-[var(--spacing-16)] first:border-t-0 first:pt-0 last:pb-0"
              >
                <span className="marca-agente marca-agente--chica" style={{ "--agente": PERSONAJES[d.agente].color } as CSSProperties}>
                  <Personaje agente={d.agente} avatar />
                </span>
                <div>
                  <Etiqueta tono="cielo">
                    {AGENTE_POR_ID[d.agente].nombre} · {d.sello}
                  </Etiqueta>
                  <p className="t-editorial mt-[var(--spacing-4)]">{d.texto}</p>
                </div>
              </li>
            ))}
          </ol>
        </TarjetaVidrio>
      </div>
    </Seccion>
  );
}
