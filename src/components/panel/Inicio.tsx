"use client";

import { useId, type CSSProperties, type ReactNode } from "react";
import { PERSONAJES, Personaje } from "@/components/agentes/Personaje";
import { Icono } from "@/components/base/Iconos";
import { AGENTE_POR_ID, type IdAgente } from "@/lib/agentes";
import { AREAS, type IdArea, type Pedido } from "./pedidos";
import { Marca } from "@/components/Logo";
import { COLORES_FRAGMENTO, Enlace, Pildoras, retrasoEscalon } from "./Piezas";

export type TarjetaPedido = {
  pedido: Pedido;
  href: string;
  bloqueado?: string;
  /** Una píldora en la miniatura: "WhatsApp · pronto" o "Conecta Gmail" (solo en /panel). */
  insignia?: { texto: string; tono: "neutro" | "atencion" };
};

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

/** Una tarjeta de 210 × 141: miniatura de 85px (la constelación y el personaje), título y una línea. */
function TarjetaPide({ pedido, href, bloqueado, insignia, indice }: TarjetaPedido & { indice: number }) {
  const info = AGENTE_POR_ID[pedido.agente];
  return (
    <Enlace
      href={href}
      className="pc-pide__tarjeta"
      scroll={false}
      aria-label={`${pedido.titulo}. ${bloqueado ? `${info.nombre}, ${bloqueado}` : `Con ${info.nombre}`}${insignia ? `. ${insignia.texto}` : ""}`}
    >
      <span className="pc-pide__mini" aria-hidden="true">
        <Constelacion agente={pedido.agente} semilla={indice * 7919 + pedido.id.length * 104729 + pedido.id.charCodeAt(0)} />
        <span className="pc-pide__personaje">
          <Personaje agente={pedido.agente} avatar />
        </span>
        <span className="pc-pide__quien">{info.nombre}</span>
        {insignia ? <span className={`pc-pide__insignia pc-pide__insignia--${insignia.tono}`}>{insignia.texto}</span> : null}
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

/** Números al azar repetibles (mulberry32): la misma constelación en el servidor y en el navegador. */
function azar(semilla: number) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Tri = { x: number; y: number; s: number; g: number; c: string; o: number; borroso?: boolean };

/**
 * La miniatura: una constelación de 45 a 70 triangulitos huecos (2.5 a 7px,
 * trazo de 1px) en halo alrededor del personaje, como el borde del cerebro
 * de la portada: tupida en el anillo, rala adentro y algunos sueltos hacia
 * afuera. Color del agente y dos acentos de la marca; los de afuera, más
 * grandes y tenues, y uno o dos apenas borrosos. Al pasar el cursor, el
 * anillo gira y se abre (600ms, solo transform; quieto con reducir movimiento).
 */
function Constelacion({ agente, semilla }: { agente: IdAgente; semilla: number }) {
  const id = useId().replace(/:/g, "");
  const r = azar(semilla);
  const propio = PERSONAJES[agente].color;
  // Dos acentos distintos de la marca (sin sort al azar: el mismo resultado en cualquier navegador)
  const a1 = Math.floor(r() * COLORES_FRAGMENTO.length);
  const a2 = (a1 + 1 + Math.floor(r() * (COLORES_FRAGMENTO.length - 1))) % COLORES_FRAGMENTO.length;
  const acentos = [COLORES_FRAGMENTO[a1], COLORES_FRAGMENTO[a2]];
  const color = () => {
    const k = r();
    return k < 0.6 ? propio : k < 0.85 ? acentos[0] : acentos[1];
  };
  const CX = 100;
  const CY = 42.5;
  const RX = 40;
  const RY = 27;
  const n = 45 + Math.floor(r() * 26);
  const anillo: Tri[] = [];
  const afuera: Tri[] = [];
  let borrosos = 0;
  for (let i = 0; i < n; i++) {
    const k = r();
    const ang = r() * Math.PI * 2;
    let f: number;
    let s: number;
    let o: number;
    if (k < 0.6) {
      f = 1 + (r() + r() - 1) * 0.16; // el anillo, tupido
      s = 2.5 + r() * 2;
      o = 0.62 + r() * 0.33;
    } else if (k < 0.72) {
      f = 0.62 + r() * 0.24; // adentro, ralo (sin tapar la cara)
      s = 2.5 + r() * 1.2;
      o = 0.38 + r() * 0.22;
    } else {
      f = 1.3 + r() * 1.15; // sueltos hacia afuera, más grandes y tenues
      s = 4 + r() * 3;
      o = 0.22 + r() * 0.26;
    }
    const t: Tri = { x: CX + Math.cos(ang) * RX * f * 1.15, y: CY + Math.sin(ang) * RY * f, s, g: Math.round(r() * 360), c: color(), o };
    if (k >= 0.72) {
      if (borrosos < 2 && r() < 0.18) {
        t.borroso = true;
        borrosos++;
      }
      afuera.push(t);
    } else anillo.push(t);
  }
  const dibujar = (t: Tri, i: number) => {
    const h = t.s * 0.866;
    return (
      <path
        key={i}
        d={`M0 ${(-h * 2) / 3} L${t.s / 2} ${h / 3} L${-t.s / 2} ${h / 3}Z`}
        transform={`translate(${t.x.toFixed(1)} ${t.y.toFixed(1)}) rotate(${t.g})`}
        fill="none"
        stroke={t.c}
        strokeOpacity={t.o.toFixed(2)}
        strokeWidth={1}
        strokeLinejoin="round"
        filter={t.borroso ? `url(#${id})` : undefined}
      />
    );
  };
  return (
    <svg className="pc-conste" viewBox="0 0 200 85" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.7" />
        </filter>
      </defs>
      <g className="pc-conste__afuera">{afuera.map(dibujar)}</g>
      <g className="pc-conste__anillo">{anillo.map(dibujar)}</g>
    </svg>
  );
}
