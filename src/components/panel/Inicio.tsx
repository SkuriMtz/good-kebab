"use client";

import type { CSSProperties, ReactNode } from "react";
import { Personaje } from "@/components/agentes/Personaje";
import { Icono } from "@/components/base/Iconos";
import { AGENTE_POR_ID } from "@/lib/agentes";
import { AREAS, type IdArea, type Pedido } from "./pedidos";
import { Marca } from "@/components/Logo";
import { FondoFragmentos } from "./FondoFragmentos";
import { COLORES_FRAGMENTO, Enlace, Pildoras, retrasoEscalon } from "./Piezas";

export type TarjetaPedido = { pedido: Pedido; href: string; bloqueado?: string };

/**
 * El Inicio del panel ES un chat nuevo, con la distribución de la captura
 * del dueño: el saludo en serif (su centro al ~38 % del alto) con la marca
 * de fragmentos, la caja de 672px, la fila de abajo (con quién hablas a la
 * izquierda; plan y uso a la derecha), la franja de pendientes y la
 * cuadrícula "Pídele a tu equipo" con sus píldoras. En claro, el
 * resplandor tenue de los fragmentos detrás (Luma).
 */
export function Inicio({
  saludo,
  caja,
  selector,
  uso,
  franja,
  area,
  hrefArea,
  tarjetas,
}: {
  saludo: string;
  caja: ReactNode;
  selector: ReactNode;
  uso: ReactNode;
  franja?: ReactNode;
  area: IdArea;
  hrefArea: (a: IdArea) => string;
  tarjetas: TarjetaPedido[];
}) {
  return (
    <div className="pc-inicio">
      <FondoFragmentos proteger={[".pc-saludo", ".pc-inicio__caja", ".pc-inicio__fila", ".pc-inicio__franja", ".pc-pide"]} />
      <div className="pc-inicio__resplandor" aria-hidden="true" />
      <div className="pc-inicio__centro">
        <h1 className="pc-saludo">
          <Marca className="pc-saludo__marca pc-logo-entra" />
          <span>{saludo}</span>
        </h1>
        <div className="pc-inicio__caja">{caja}</div>
        <div className="pc-inicio__fila">
          <div className="pc-inicio__izq">{selector}</div>
          <div className="pc-inicio__der">{uso}</div>
        </div>
        <div className="pc-inicio__franja">{franja}</div>
      </div>

      <section className="pc-pide" aria-labelledby="pc-pide-titulo">
        <div className="pc-pide__cabeza">
          <h2 id="pc-pide-titulo" className="pc-pide__titulo">
            Pídele a tu equipo
          </h2>
          <Pildoras etiqueta="Filtrar por área" activa={area} opciones={AREAS.map((a) => ({ id: a.id, etiqueta: a.etiqueta, href: hrefArea(a.id) }))} />
        </div>
        <ul className="pc-pide__rejilla" key={area}>
          {tarjetas.map((t, i) => (
            <li key={t.pedido.id} className="pc-entra" style={{ "--d": `${retrasoEscalon(i)}ms` } as CSSProperties}>
              <TarjetaPide {...t} indice={i} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/** Una tarjeta de 210 × 141: miniatura de 85px (fragmentos y el personaje), título y una línea. */
function TarjetaPide({ pedido, href, bloqueado, indice }: TarjetaPedido & { indice: number }) {
  const info = AGENTE_POR_ID[pedido.agente];
  return (
    <Enlace href={href} className="pc-pide__tarjeta" scroll={false} aria-label={`${pedido.titulo}. ${bloqueado ? `${info.nombre}, ${bloqueado}` : `Con ${info.nombre}`}`}>
      <span className="pc-pide__mini" aria-hidden="true">
        <Fragmentitos semilla={indice + pedido.id.length} />
        <span className="pc-pide__personaje">
          <Personaje agente={pedido.agente} avatar />
        </span>
        <span className="pc-pide__quien">{info.nombre}</span>
      </span>
      <span className="pc-pide__textos">
        <span className="pc-pide__nombre">
          <span className="pc-pide__nombre-texto">{pedido.titulo}</span>
          <Icono nombre={bloqueado ? "candado" : "chevron-derecha"} tam={14} trazo={2} />
        </span>
        <span className="pc-pide__detalle">{bloqueado ?? pedido.detalle}</span>
      </span>
    </Enlace>
  );
}

/** Unos triangulitos de contorno en la miniatura (posiciones fijas por semilla: igual en servidor y navegador). */
function Fragmentitos({ semilla }: { semilla: number }) {
  let a = (semilla * 2654435761) >>> 0;
  const r = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const lugares = [
    [12, 22],
    [30, 70],
    [62, 16],
    [80, 64],
    [90, 28],
  ];
  return (
    <svg className="pc-pide__frags" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      {lugares.map(([x, y], i) => {
        const giro = Math.round(r() * 360);
        const tam = 5 + r() * 4;
        const color = COLORES_FRAGMENTO[(semilla + i) % COLORES_FRAGMENTO.length];
        return (
          <path
            key={i}
            d={`M${x} ${y - tam} L${x + tam} ${y + tam * 0.7} L${x - tam} ${y + tam * 0.7}Z`}
            transform={`rotate(${giro} ${x} ${y})`}
            fill="none"
            stroke={color}
            strokeWidth={1.4}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
    </svg>
  );
}
