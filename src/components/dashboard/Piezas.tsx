"use client";

import Link from "next/link";
import { useId, type CSSProperties, type ReactNode } from "react";
import { Personaje } from "@/components/agentes/Personaje";
import { Icono, type NombreIcono } from "@/components/base/Iconos";
import type { IdAgente } from "@/lib/agentes";
import { Fragmentos } from "./Fragmentos";
import { completa, fechaDe, relativo } from "./tiempo";
import type { Accion } from "./tipos";

/* ---------------------------------------------------------------------
   Piezas chicas del dashboard. Todo con tokens de la base; el estilo
   vive en src/estilos/dashboard.css (prefijo .dash-).
   --------------------------------------------------------------------- */

type TamMarca = 20 | 24 | 28 | 32 | 40 | 64;
// Tamaños de la marca de agente de la base (clases completas para Tailwind)
const CLASE_TAM: Record<TamMarca, string> = {
  20: "marca-agente--20",
  24: "marca-agente--24",
  28: "marca-agente--28",
  32: "marca-agente--32",
  40: "marca-agente--40",
  64: "marca-agente--64",
};

/** El personaje de un agente en su círculo con un velo de su color (su "avatar"). */
export function MarcaAgente({ id, tam = 32, className = "" }: { id: IdAgente; tam?: TamMarca; className?: string }) {
  return (
    <span className={`dash-marca marca-agente ${CLASE_TAM[tam]} ${className}`} style={{ "--agente": `var(--agente-${id})` } as CSSProperties} aria-hidden="true">
      <Personaje agente={id} avatar />
    </span>
  );
}

/** Dos o más personajes encimados (un grupo, un relevo entre agentes). */
export function PilaAgentes({ ids, tam = 24, className = "" }: { ids: readonly IdAgente[]; tam?: TamMarca; className?: string }) {
  return (
    <span className={`dash-pila ${className}`} aria-hidden="true">
      {ids.map((id) => (
        <MarcaAgente key={id} id={id} tam={tam} />
      ))}
    </span>
  );
}

/**
 * Lo que lleva a algún lado: un enlace (href) o un botón que cambia de vista
 * (alElegir). Sin ninguno de los dos, es texto: nada finge que funciona.
 */
export function Accionable({
  accion,
  className = "",
  children,
  etiqueta,
  actual,
}: {
  accion: Accion;
  className?: string;
  children: ReactNode;
  etiqueta?: string;
  actual?: boolean;
}) {
  if (accion.href) {
    return (
      <Link href={accion.href} className={className} aria-label={etiqueta} aria-current={actual ? "page" : undefined} onClick={accion.alElegir}>
        {children}
      </Link>
    );
  }
  if (accion.alElegir) {
    return (
      <button type="button" className={className} onClick={accion.alElegir} aria-label={etiqueta} aria-current={actual ? "page" : undefined}>
        {children}
      </button>
    );
  }
  return <span className={className}>{children}</span>;
}

/** Hora relativa ("hace 12 min") con la fecha completa al pasar el cursor. Reserva su espacio mientras llega la hora. */
export function Hora({ item, ahora, className = "" }: { item: { fecha?: string; haceMin?: number }; ahora: Date | null; className?: string }) {
  const fecha = fechaDe(item, ahora);
  return (
    <time className={`dash-hora cifras ${className}`} dateTime={fecha?.toISOString()} title={completa(fecha)}>
      {relativo(fecha, ahora)}
    </time>
  );
}

/** Encabezado de un bloque: título, contador opcional y una acción a la derecha. */
export function CabezaBloque({
  id,
  titulo,
  extra,
  accion,
  nivel = 2,
}: {
  id?: string;
  titulo: string;
  extra?: ReactNode;
  accion?: ReactNode;
  nivel?: 2 | 3;
}) {
  const H = nivel === 2 ? "h2" : "h3";
  return (
    <div className="dash-cabeza">
      <H id={id} className="dash-cabeza__titulo">
        {titulo}
        {extra}
      </H>
      {accion ? <div className="dash-cabeza__accion">{accion}</div> : null}
    </div>
  );
}

/** Enlace de texto azul con flecha (la acción secundaria de un bloque: "Ver todas"). */
export function EnlaceMas({ accion, children, etiqueta }: { accion: Accion; children: ReactNode; etiqueta?: string }) {
  return (
    <Accionable accion={accion} className="dash-enlace" etiqueta={etiqueta}>
      {children}
      <Icono nombre="chevron-derecha" tam={16} />
    </Accionable>
  );
}

/**
 * Estado vacío: un ícono de contorno (sin círculo de color), qué es este
 * lugar, por qué está vacío y qué hacer. Nunca un hueco en blanco.
 */
export function Vacio({
  icono,
  agente,
  titulo,
  texto,
  accion,
  compacto = false,
}: {
  icono?: NombreIcono;
  agente?: IdAgente;
  titulo: string;
  texto: ReactNode;
  accion?: ReactNode;
  compacto?: boolean;
}) {
  return (
    <div className={`dash-vacio pnl-vacio${compacto ? " dash-vacio--compacto" : ""}`}>
      <Fragmentos cantidad={compacto ? 4 : 6} semilla={titulo.length} tamMin={8} tamMax={16} className="pnl-vacio__frag" />
      {agente ? <MarcaAgente id={agente} tam={40} /> : icono ? <Icono nombre={icono} tam={24} className="dash-vacio__icono" /> : null}
      <p className="dash-vacio__titulo">{titulo}</p>
      <p className="dash-vacio__texto">{texto}</p>
      {accion ? <div className="dash-vacio__accion">{accion}</div> : null}
    </div>
  );
}

/* =====================================================================
   Piezas de tarjeta del panel (Resumen, Estadísticas, Agentes). Estilo en
   src/estilos/panel.css (prefijo .pnl-). Las comparte la vista de
   Estadísticas: tarjeta muy redondeada, su cabeza, "Ver todo", cifras que
   suben al aparecer, tendencia, lista de barras y dona.
   ===================================================================== */

const FORMATO = new Intl.NumberFormat("es-MX");

/** Una tarjeta grande y muy redondeada (24px) sobre el fondo gris. Título, subtítulo gris y una acción a la derecha. */
export function Tarjeta({
  titulo,
  subtitulo,
  accion,
  pie,
  nivel = 2,
  className = "",
  children,
}: {
  titulo?: ReactNode;
  subtitulo?: ReactNode;
  /** A la derecha de la cabeza: un enlace ("Ver todo ›"), flechas, un selector. */
  accion?: ReactNode;
  /** Al pie, a lo ancho (por ejemplo, <VerTodo>). */
  pie?: ReactNode;
  nivel?: 2 | 3;
  className?: string;
  children?: ReactNode;
}) {
  const id = useId().replace(/:/g, "");
  const H = nivel === 2 ? "h2" : "h3";
  return (
    <section className={`pnl-tarjeta ${className}`} aria-labelledby={titulo ? `${id}-t` : undefined}>
      {titulo ? (
        <header className="pnl-tarjeta__cabeza">
          <div className="pnl-tarjeta__textos">
            <H id={`${id}-t`} className="pnl-tarjeta__titulo">
              {titulo}
            </H>
            {subtitulo ? <p className="pnl-tarjeta__sub">{subtitulo}</p> : null}
          </div>
          {accion ? <div className="pnl-tarjeta__accion">{accion}</div> : null}
        </header>
      ) : null}
      {children}
      {pie}
    </section>
  );
}

/** El botón de ancho completo al pie de una tarjeta ("Ver todos los pendientes"). */
export function VerTodo({ accion, children, etiqueta }: { accion: Accion; children: ReactNode; etiqueta?: string }) {
  return (
    <Accionable accion={accion} className="pnl-vertodo" etiqueta={etiqueta}>
      {children}
    </Accionable>
  );
}

/**
 * Un número que sube al aparecer (solo transform y opacidad). Sin dato
 * (null), una raya "—": nunca un cero inventado. `indice` escalona la
 * entrada dentro de una fila.
 */
export function Cifra({
  valor,
  sufijo,
  indice = 0,
  formatear,
  className = "",
}: {
  valor: number | null | undefined;
  sufijo?: string;
  indice?: number;
  formatear?: (n: number) => string;
  className?: string;
}) {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) {
    return (
      <span className={`pnl-cifra pnl-cifra--vacia ${className}`}>
        <span aria-hidden="true">—</span>
        <span className="sr-only">Sin datos</span>
      </span>
    );
  }
  return (
    <span className={`pnl-cifra cifras-app ${className}`} style={{ "--i": indice } as CSSProperties}>
      <span className="pnl-cifra__valor">
        {formatear ? formatear(valor) : FORMATO.format(valor)}
        {sufijo}
      </span>
    </span>
  );
}

/**
 * Cambio contra el periodo anterior: flechita y porcentaje. Verde si va
 * bien, rojo si va mal (`mejorBaja` para lo que conviene que baje, como
 * los pendientes). Sin dato del periodo anterior, "—".
 */
export function Tendencia({ delta, mejorBaja = false, className = "" }: { delta: number | null | undefined; mejorBaja?: boolean; className?: string }) {
  if (delta === null || delta === undefined || !Number.isFinite(delta)) {
    return (
      <span className={`pnl-tendencia pnl-tendencia--nula ${className}`}>
        <span aria-hidden="true">—</span>
        <span className="sr-only">Sin periodo anterior para comparar</span>
      </span>
    );
  }
  const redondo = Math.round(delta);
  const sube = redondo > 0;
  const tono = redondo === 0 ? "" : sube !== mejorBaja ? " pnl-tendencia--bien" : " pnl-tendencia--mal";
  return (
    <span className={`pnl-tendencia${tono} ${className}`}>
      {redondo === 0 ? null : (
        <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" className={sube ? "" : "pnl-tendencia__baja"}>
          <path d="M6 2.5v7M2.75 5.75 6 2.5l3.25 3.25" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      <span className="cifras-app">{redondo === 0 ? "Igual" : `${Math.abs(redondo)}%`}</span>
      <span className="sr-only">{redondo === 0 ? " que el periodo anterior" : sube ? " más que el periodo anterior" : " menos que el periodo anterior"}</span>
    </span>
  );
}

export type FilaBarra = Accion & { id: string; etiqueta: string; valor: number; agente?: IdAgente; detalle?: string };

/**
 * Lista de barras (lo más usado): la barra va detrás del nombre y el
 * número a la derecha. Cada fila lleva a su sección ya filtrada.
 */
export function ListaBarras({
  filas,
  unidad,
  formatear,
}: {
  filas: FilaBarra[];
  /** Cómo se lee el número ("mensajes", "correos"). */
  unidad: string;
  formatear?: (n: number) => string;
}) {
  const max = Math.max(1, ...filas.map((f) => f.valor));
  return (
    <ul className="pnl-barras">
      {filas.map((f, i) => (
        <li key={f.id}>
          <Accionable accion={f} className="pnl-barra" etiqueta={`${f.etiqueta}${f.detalle ? `, ${f.detalle}` : ""}: ${formatear ? formatear(f.valor) : FORMATO.format(f.valor)} ${unidad}`}>
            <span
              className="pnl-barra__relleno"
              style={{ "--escala": f.valor / max, "--i": i, ...(f.agente ? { "--agente": `var(--agente-${f.agente})` } : {}) } as CSSProperties}
              data-agente={f.agente ? "" : undefined}
              aria-hidden="true"
            />
            <span className="pnl-barra__nombre">
              {f.agente ? <MarcaAgente id={f.agente} tam={20} /> : null}
              <span className="pnl-barra__texto">{f.etiqueta}</span>
              {f.detalle ? <span className="pnl-barra__detalle">{f.detalle}</span> : null}
            </span>
            <Cifra valor={f.valor} indice={i} formatear={formatear} className="pnl-barra__valor" />
          </Accionable>
        </li>
      ))}
    </ul>
  );
}

export type ParteDona = { id: string; valor: number; color: string; etiqueta?: string };

/**
 * Una dona (uso del plan, reparto por agente). La pista gris es el total;
 * cada parte, su color. Al centro, lo que se le pase (una cifra, un personaje).
 */
export function Dona({
  partes,
  total,
  tam = 128,
  grosor = 12,
  centro,
  etiqueta,
  className = "",
}: {
  partes: ParteDona[];
  /** El 100% de la dona; si no se da, la suma de las partes. */
  total?: number;
  tam?: number;
  grosor?: number;
  centro?: ReactNode;
  /** Cómo se lee la dona completa ("1,284 de 3,000 mensajes usados"). */
  etiqueta: string;
  className?: string;
}) {
  const suma = partes.reduce((s, p) => s + Math.max(0, p.valor), 0);
  const cien = Math.max(total ?? suma, 1);
  const r = (tam - grosor) / 2;
  const vuelta = 2 * Math.PI * r;
  let recorrido = 0;
  return (
    <div className={`pnl-dona ${className}`} style={{ width: tam, height: tam }} role="img" aria-label={etiqueta}>
      <svg viewBox={`0 0 ${tam} ${tam}`} width={tam} height={tam} aria-hidden="true">
        <circle cx={tam / 2} cy={tam / 2} r={r} fill="none" className="pnl-dona__pista" strokeWidth={grosor} />
        <g className="pnl-dona__partes" style={{ transformOrigin: "50% 50%" }}>
          {partes.map((p) => {
            const largo = (Math.min(Math.max(0, p.valor), cien) / cien) * vuelta;
            const desde = recorrido;
            recorrido += largo;
            if (largo <= 0) return null;
            return (
              <circle
                key={p.id}
                cx={tam / 2}
                cy={tam / 2}
                r={r}
                fill="none"
                stroke={p.color}
                strokeWidth={grosor}
                strokeLinecap={partes.length === 1 ? "round" : "butt"}
                strokeDasharray={`${largo} ${vuelta - largo}`}
                strokeDashoffset={-desde}
              />
            );
          })}
        </g>
      </svg>
      {centro ? <div className="pnl-dona__centro">{centro}</div> : null}
    </div>
  );
}
