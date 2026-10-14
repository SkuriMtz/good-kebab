"use client";

import { useState } from "react";
import { ActividadEquipo, type IdPestana } from "./ActividadEquipo";
import { AgentesFijados } from "./AgentesFijados";
import { Bienvenida } from "./Bienvenida";
import { Ayuda, Metricas, Novedades, ProximasCitas, Sugerencias, TarjetaNegocio } from "./ColumnaDerecha";
import { ConversacionesRecientes } from "./ConversacionesRecientes";
import { GraficaActividad } from "./GraficaActividad";
import type { Accion, DatosResumen } from "./tipos";

/**
 * La vista Resumen (la misma en /pruebalo y en /panel; cambian los datos).
 * Centro: bienvenida → actividad de las últimas semanas (el momento
 * protagonista) → agentes fijados → actividad/pendientes/destacados →
 * conversaciones recientes. Derecha: tu negocio y el plan, próximas citas,
 * cifras de 30 días, sugerencias, novedades y ayuda.
 */
export function Resumen({
  datos,
  verEquipo,
  verAgenda,
  pestana,
  alCambiarPestana,
}: {
  datos: DatosResumen;
  verEquipo?: Accion;
  verAgenda?: Accion;
  pestana?: IdPestana;
  alCambiarPestana?: (p: IdPestana) => void;
}) {
  const [aprobados, setAprobados] = useState<Set<string>>(() => new Set());
  const porAprobar = datos.pendientes.filter((p) => p.aprobable && !aprobados.has(p.id)).length;

  return (
    <div className="tb-vista tb-resumen">
      <div className="tb-resumen__centro">
        <Bienvenida datos={datos.bienvenida} ejemplo={datos.ejemplo} pendientesVivos={datos.ejemplo ? porAprobar : undefined} />
        <GraficaActividad actividad={datos.actividad} ejemplo={datos.ejemplo} />
        <AgentesFijados fijados={datos.fijados} verEquipo={verEquipo} />
        <ActividadEquipo
          eventos={datos.eventos}
          eventosVacio={datos.eventosVacio}
          pendientes={datos.pendientes}
          pendientesVacio={datos.pendientesVacio}
          pendientesEtiqueta={datos.pendientesEtiqueta}
          destacados={datos.destacados}
          destacadosVacio={datos.destacadosVacio}
          pestana={pestana}
          alCambiarPestana={alCambiarPestana}
          aprobados={aprobados}
          alAprobar={(id) => setAprobados((s) => new Set(s).add(id))}
          alDeshacer={(id) =>
            setAprobados((s) => {
              const n = new Set(s);
              n.delete(id);
              return n;
            })
          }
        />
        <ConversacionesRecientes lista={datos.conversaciones} vacio={datos.conversacionesVacio} todas={datos.todasConversaciones} />
      </div>

      <aside className="tb-resumen__lado" aria-label="Tu negocio, cifras y novedades">
        <TarjetaNegocio negocio={datos.negocio} ejemplo={datos.ejemplo} />
        <ProximasCitas citas={datos.citas} vacio={datos.citasVacio} verAgenda={verAgenda} />
        <Metricas metricas={datos.metricas} />
        <Sugerencias lista={datos.recomendaciones} />
        <Novedades lista={datos.novedades} />
        <Ayuda />
      </aside>
    </div>
  );
}
