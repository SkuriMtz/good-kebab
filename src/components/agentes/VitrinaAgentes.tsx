"use client";

import { useId, useState } from "react";
import { Boton, claseBotonBase } from "@/components/base/Boton";
import { Etiqueta } from "@/components/base/Etiqueta";
import { Halo } from "@/components/base/Halo";
import { Icono } from "@/components/base/Iconos";
import { MarcoNavegador } from "@/components/base/MarcoNavegador";
import { Pestanas } from "@/components/base/Pestanas";
import { BotonFicha } from "./BotonFicha";
import { ConversacionEjemplo } from "./ConversacionEjemplo";
import { Personaje } from "./Personaje";
import { DETALLE } from "./detalle";
import { PlanesDelAgente } from "./piezas";
import { AGENTE_POR_ID, AGENTES_INFO, type IdAgente } from "@/lib/agentes";

/**
 * Los cuatro agentes como la fila de funciones de la portada de GitHub:
 * pestañas en píldora arriba (el indicador blanco se desliza de una a otra)
 * y debajo un solo panel de vidrio grande que no se mueve; solo cambia lo de
 * adentro. A la izquierda quién es y qué hace; a la derecha su conversación
 * de ejemplo dentro de una ventana del producto. Una sola vista que cambia,
 * no cuatro tarjetas iguales.
 */
export function VitrinaAgentes() {
  const [activa, setActiva] = useState<IdAgente>("lola");
  const a = AGENTE_POR_ID[activa];
  const detalle = DETALLE[activa];
  const idPanel = `${useId().replace(/:/g, "")}-vitrina`;

  return (
    <div className="vitrina">
      <Pestanas
        etiqueta="Elige un agente"
        activa={activa}
        alCambiar={(id) => setActiva(id as IdAgente)}
        idPanelExterno={idPanel}
        pestanas={AGENTES_INFO.map((ag) => ({
          id: ag.id,
          adorno: <Personaje agente={ag.id} avatar />,
          etiqueta: (
            <>
              {ag.nombre}
              <span className="vitrina__pestana-area">{ag.area}</span>
            </>
          ),
        }))}
      />

      <div id={idPanel} className="vitrina__panel vidrio vidrio--relleno vidrio--relleno-amplio con-halo" role="tabpanel" aria-label={`${a.nombre}: qué hace y una conversación de ejemplo`}>
        <Halo x="72%" y="46%" ancho="min(720px, 120%)" proporcion="4 / 3" suave />
        <div key={activa} className="vitrina__contenido columnas-asimetricas">
          <div className="vitrina__texto">
            <div className="vitrina__quien">
              <Personaje agente={activa} className="vitrina__personaje" />
              <div className="min-w-0">
                <p className="t-titulo">{a.nombre}</p>
                <Etiqueta tono="cielo">
                  {a.area} · {a.abarca}
                </Etiqueta>
              </div>
            </div>

            <h3 className="t-sub vitrina__lema">{a.lema}</h3>

            <ul className="vitrina__capacidades">
              {a.capacidades.map((c) => (
                <li key={c}>
                  <Icono nombre="check" tam={16} tono="cielo" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>

            <PlanesDelAgente agente={activa} className="vitrina__planes" />

            <div className="vitrina__acciones">
              <BotonFicha agente={activa} className={claseBotonBase("sutil")}>
                Ver su ficha
              </BotonFicha>
              <Boton href={`/agentes/${activa}`} variante="fantasma" flecha>
                Todo lo que hace {a.nombre}
              </Boton>
            </div>
          </div>

          <MarcoNavegador
            className="vitrina__marco"
            titulo={`Conversación de ejemplo con ${a.nombre}`}
            pestanas={[{ etiqueta: `${a.nombre} · ${detalle.canal}`, adorno: <Personaje agente={activa} avatar />, activa: true }]}
          >
            <ConversacionEjemplo agente={activa} animar />
          </MarcoNavegador>
        </div>
      </div>
    </div>
  );
}
