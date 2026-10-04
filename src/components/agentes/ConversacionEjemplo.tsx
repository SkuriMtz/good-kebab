import { PERSONAJES } from "@/lib/personajes";
import { DETALLE } from "./detalle";
import { AGENTE_POR_ID, type IdAgente } from "@/lib/agentes";

/**
 * La conversación de ejemplo de un agente, como una "captura" del producto:
 * tarjeta blanca con sombra, el canal arriba y los mensajes con nombres de ejemplo.
 */
export function ConversacionEjemplo({ agente }: { agente: IdAgente }) {
  const detalle = DETALLE[agente];
  const nombre = AGENTE_POR_ID[agente].nombre;
  const color = PERSONAJES[agente].color;

  return (
    <div className="tarjeta mockup overflow-hidden !p-0">
      <p className="flex items-center justify-between gap-4 border-b border-[var(--linea)] px-5 py-3 text-[0.8125rem] text-tenue">
        <span className="font-semibold text-tinta">{detalle.canal}</span>
        <span>Nombres de ejemplo</span>
      </p>
      <ol className="flex flex-col gap-2.5 px-4 py-5 sm:px-5">
        {detalle.conversacion.map((m, i) =>
          m.de === "nota" ? (
            <li key={i} className="mt-1 flex items-start gap-2 text-[0.875rem] font-medium">
              <span className="mt-[0.5em] h-2 w-2 shrink-0 rounded-full" style={{ background: color }} aria-hidden="true" />
              {m.texto}
            </li>
          ) : (
            <li
              key={i}
              className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[0.9375rem] leading-relaxed ${
                m.de === "otro" ? "self-start rounded-bl-md bg-tinta/[0.06]" : "self-end rounded-br-md bg-[rgb(var(--c-accion-suave))]"
              }`}
            >
              <span className="mb-0.5 block text-[0.75rem] font-semibold text-tenue">
                {m.de === "otro" ? m.quien : nombre}
                {m.hora ? <span className="ml-2 font-normal tabular-nums">{m.hora}</span> : null}
              </span>
              {m.texto}
            </li>
          ),
        )}
      </ol>
    </div>
  );
}
