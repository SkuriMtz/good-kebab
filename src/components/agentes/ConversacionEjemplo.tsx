import { DETALLE } from "./detalle";
import { AGENTE_POR_ID, type IdAgente } from "@/lib/agentes";

/**
 * La conversación de ejemplo de un agente, como un guion: quién habla
 * (el agente en violeta), la hora y lo que dice. Sin cajas.
 */
export function ConversacionEjemplo({ agente }: { agente: IdAgente }) {
  const detalle = DETALLE[agente];
  const nombre = AGENTE_POR_ID[agente].nombre;

  return (
    <div>
      <p className="flex flex-wrap items-baseline justify-between gap-x-[var(--spacing-18)]">
        <span className="t-etiqueta">Conversación de ejemplo · {detalle.canal}</span>
        <span className="t-caption">Nombres de ejemplo</span>
      </p>
      <ol className="mt-[var(--spacing-18)] flex flex-col gap-[var(--spacing-18)]">
        {detalle.conversacion.map((m, i) =>
          m.de === "nota" ? (
            <li key={i} className="t-chico !text-[var(--c-acento)]">
              → {m.texto}
            </li>
          ) : (
            <li key={i}>
              <p className="t-rol" style={m.de === "otro" ? { color: "var(--c-tenue)" } : undefined}>
                {m.de === "otro" ? m.quien : nombre}
                {m.hora ? <span className="ml-[var(--spacing-6)] tabular-nums">{m.hora}</span> : null}
              </p>
              <p className="t-editorial mt-1">{m.texto}</p>
            </li>
          ),
        )}
      </ol>
    </div>
  );
}
