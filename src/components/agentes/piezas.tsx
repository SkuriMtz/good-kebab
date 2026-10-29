import { Etiqueta } from "@/components/base/Etiqueta";
import { Icono } from "@/components/base/Iconos";
import type { IdAgente } from "@/lib/agentes";
import { PLANES } from "@/lib/planes";
import { t, type Idioma } from "@/i18n";

/** Los planes que traen a este agente (de src/lib/planes.ts). */
export const planesCon = (agente: IdAgente) => PLANES.filter((p) => p.agentes.includes(agente));

/**
 * "Viene en: ATENDEL ONE · ATENDEL MAX": los planes que lo incluyen, como
 * píldoras en Mono. Sin inventar: sale de PLANES.
 */
export function PlanesDelAgente({ agente, className = "", idioma = "es" }: { agente: IdAgente; className?: string; idioma?: Idioma }) {
  const planes = planesCon(agente);
  return (
    <div className={`planes-agente ${className}`}>
      <Etiqueta tono="tenue" as="span">
        {t(idioma).paginaAgentes.vieneEn}
      </Etiqueta>
      <ul className="planes-agente__lista">
        {planes.map((p) => (
          <li key={p.id} className="pildora planes-agente__plan">
            <Icono nombre="check" tam={12} />
            {p.nombre}
          </li>
        ))}
      </ul>
    </div>
  );
}
