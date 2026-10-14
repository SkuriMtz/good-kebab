"use client";

import { Insignia } from "@/components/base/Insignia";
import { CabezaSeccion, CarasAgentes, EnlaceAccion, Vacio } from "./piezas";
import type { Accion, ConversacionReciente, Vacio as DatosVacio } from "./tipos";

/** Las últimas conversaciones con los agentes, en lista (filas de 56px). */
export function ConversacionesRecientes({
  lista,
  vacio,
  todas,
}: {
  lista: ConversacionReciente[];
  vacio: DatosVacio;
  todas: Accion;
}) {
  return (
    <section aria-labelledby="recientes-titulo" className="tb-bloque">
      <CabezaSeccion id="recientes-titulo" titulo="Conversaciones recientes" accion={lista.length ? todas : undefined} />
      <div className="tb-caja tb-caja--lista">
        {lista.length ? (
          <ul className="tb-convs">
            {lista.map((c) => (
              <li key={c.id}>
                <EnlaceAccion accion={c.accion} className="tb-conv">
                  <CarasAgentes ids={c.agentes} tam={32} />
                  <span className="tb-conv__texto">
                    <span className="tb-conv__titulo">
                      {c.titulo}
                      {c.agentes.length > 1 ? <span className="tb-conv__tipo">Grupo</span> : null}
                    </span>
                    <span className="tb-conv__vista">{c.vista}</span>
                  </span>
                  <span className="tb-conv__lado">
                    <time className="tb-conv__hora cifras">{c.hora}</time>
                    {c.sinLeer ? <Insignia tono="azul" contador={c.sinLeer} etiqueta={`${c.sinLeer} sin leer`} /> : null}
                  </span>
                </EnlaceAccion>
              </li>
            ))}
          </ul>
        ) : (
          <Vacio vacio={vacio} icono="conversaciones" />
        )}
      </div>
    </section>
  );
}
