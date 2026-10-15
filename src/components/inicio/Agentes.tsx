"use client";

import { useState, type CSSProperties } from "react";
import { Boton } from "@/components/base/Boton";
import { Etiqueta } from "@/components/base/Etiqueta";
import { Icono } from "@/components/base/Iconos";
import { MarcoNavegador } from "@/components/base/MarcoNavegador";
import { Pestanas } from "@/components/base/Pestanas";
import { EncabezadoSeccion, Seccion } from "@/components/base/Seccion";
import { TarjetaVidrio } from "@/components/base/TarjetaVidrio";
import { BotonFicha } from "@/components/agentes/BotonFicha";
import { ConversacionEjemplo } from "@/components/agentes/ConversacionEjemplo";
import { Personaje } from "@/components/agentes/Personaje";
import { DETALLE } from "@/components/agentes/detalle";
import { AGENTES_INFO, type AgenteInfo, type IdAgente } from "@/lib/agentes";
import { planMinimo } from "@/lib/planes";

/**
 * 3. Los cuatro agentes (Grupo 3 · G3-T3). Una sola vista que cambia: la
 * fila de pestañas en píldora lleva a cada agente con su personaje chiquito
 * adentro; abajo, una tarjeta de vidrio con quién es, qué hace, en qué plan
 * está y su conversación de ejemplo dentro del marco del producto.
 * Al cambiar de pestaña, el contenido entra desde el lado hacia el que te
 * moviste (8px + opacidad, 0.4s con la curva de entrada).
 */
export function Agentes() {
  const [activa, setActiva] = useState<IdAgente>(AGENTES_INFO[0].id);
  const [sentido, setSentido] = useState(0);

  const cambiar = (id: string) => {
    const antes = AGENTES_INFO.findIndex((a) => a.id === activa);
    const despues = AGENTES_INFO.findIndex((a) => a.id === id);
    if (despues < 0) return;
    setSentido(Math.sign(despues - antes));
    setActiva(AGENTES_INFO[despues].id);
  };

  const pestanas = AGENTES_INFO.map((a) => ({
    id: a.id,
    etiqueta: (
      <span className="ag-pildora">
        <span>{a.nombre}</span>
        <span className="ag-pildora__area">{a.area}</span>
      </span>
    ),
    adorno: <Personaje agente={a.id} avatar />,
    contenido: <PanelAgente a={a} sentido={sentido} />,
  }));

  return (
    <Seccion id="agentes" etiquetadaPor="agentes-titulo">
      <EncabezadoSeccion
        id="agentes-titulo"
        etiqueta="Tu equipo"
        titulo="Cuatro agentes, un solo equipo"
        texto="Cada uno lleva un área de tu negocio: atención, correo, clientes y oficina. Elige uno para ver qué hace y cómo habla."
      />
      <Pestanas etiqueta="Los agentes de Atendel" pestanas={pestanas} activa={activa} alCambiar={cambiar} classNamePanel="ag-inicio__panel" />
    </Seccion>
  );
}

function PanelAgente({ a, sentido }: { a: AgenteInfo; sentido: number }) {
  const detalle = DETALLE[a.id];
  const plan = planMinimo(a.id);
  return (
    <TarjetaVidrio relleno="ninguno" className="ag-inicio">
      <div className="ag-inicio__mov" style={{ "--sentido": sentido } as CSSProperties}>
        <div className="ag-inicio__texto">
          <div className="ag-inicio__quien">
            <Personaje agente={a.id} className="ag-inicio__personaje" />
            <div className="min-w-0">
              <Etiqueta tono="cielo">
                {a.area} · {a.abarca}
              </Etiqueta>
              <h3 className="t-titulo mt-[var(--spacing-4)]">{a.nombre}</h3>
            </div>
          </div>
          <p className="t-intro mt-[var(--spacing-20)]">{a.lema}</p>
          <ul className="ag-lista mt-[var(--spacing-24)]">
            {a.capacidades.map((c) => (
              <li key={c}>
                <Icono nombre="check" tam={20} className="ag-lista__icono" />
                <span>{c}</span>
              </li>
            ))}
          </ul>
          <p className="ag-plan mt-[var(--spacing-24)]">
            <span className="pildora">{plan.id === "free" ? "Incluida en Atendel Free" : `Viene con ${plan.nombre}`}</span>
          </p>
          <div className="ag-inicio__acciones">
            <Boton href={`/agentes/${a.id}`} variante="sutil" flecha>
              Todo lo que hace {a.nombre}
            </Boton>
            <BotonFicha agente={a.id} className="boton boton--fantasma boton--solo-texto">
              Ver su ficha
            </BotonFicha>
          </div>
        </div>
        <MarcoNavegador
          className="ag-inicio__marco"
          titulo={`Conversación de ejemplo con ${a.nombre}`}
          pestanas={[{ etiqueta: `${a.nombre} · ${detalle.canal}`, adorno: <Personaje agente={a.id} avatar />, activa: true }]}
          relleno
        >
          <ConversacionEjemplo agente={a.id} encabezado={false} />
        </MarcoNavegador>
      </div>
    </TarjetaVidrio>
  );
}
