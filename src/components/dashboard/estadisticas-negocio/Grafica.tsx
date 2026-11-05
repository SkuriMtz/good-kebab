"use client";

import { useRouter } from "next/navigation";
import { useContext, useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { ContextoNavegar } from "@/components/panel/Piezas";
import type { Dia } from "@/lib/estadisticas";
import { enlaceNegocio } from "@/lib/estadisticas-negocio";
import { cuenta, fechaConDia, fechaCorta } from "./formato";

/*
 * La gráfica de área (SVG a mano, sin librerías), al estilo de Mercury:
 * línea suave del periodo, la del periodo anterior punteada y un relleno
 * tenue que llega a los bordes de la tarjeta.
 * - Al aparecer, la línea se dibuja (stroke-dashoffset) y luego se funde el
 *   área (ANIMACIONES.md, punto 4). Con reducir movimiento, ya está puesta.
 * - Cruz de lectura (punto 5): línea vertical punteada, un punto en cada
 *   serie y una burbuja que sigue al puntero (transform). También con el
 *   dedo (arrastrar) y con el teclado (flechas, Inicio, Fin; Enter abre ese
 *   día). Picar un día lleva a la actividad de ese día; con el dedo, el
 *   primer toque muestra la burbuja y el segundo, en el mismo día, abre.
 * - Se mide el ancho real (ResizeObserver): el SVG se dibuja en píxeles y
 *   las líneas no se deforman.
 */

const ALTO = 220;
const ARRIBA = 16;
const ABAJO = 8;

type Punto = [number, number];

/** Curva suave que nunca se pasa de los puntos (monótona, Fritsch–Carlson). */
function trazo(p: Punto[]): string {
  const n = p.length;
  const f = (v: number) => Math.round(v * 10) / 10;
  if (!n) return "";
  if (n === 1) return `M${f(p[0][0])},${f(p[0][1])}`;
  const dx: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(p[i + 1][0] - p[i][0]);
    m.push((p[i + 1][1] - p[i][1]) / (dx[i] || 1));
  }
  const t: number[] = [m[0]];
  for (let i = 1; i < n - 1; i++) {
    t.push(m[i - 1] * m[i] <= 0 ? 0 : (3 * (dx[i - 1] + dx[i])) / ((2 * dx[i] + dx[i - 1]) / m[i - 1] + (dx[i] + 2 * dx[i - 1]) / m[i]));
  }
  t.push(m[n - 2]);
  let d = `M${f(p[0][0])},${f(p[0][1])}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += ` C${f(p[i][0] + h)},${f(p[i][1] + t[i] * h)} ${f(p[i + 1][0] - h)},${f(p[i + 1][1] - t[i + 1] * h)} ${f(p[i + 1][0])},${f(p[i + 1][1])}`;
  }
  return d;
}

/** Qué días llevan etiqueta abajo: unos 5 repartidos, sin el primero ni el último (como en Mercury). */
function etiquetas(n: number): number[] {
  if (n <= 2) return n === 2 ? [0, 1] : [0];
  if (n <= 7) return Array.from({ length: n }, (_, i) => i);
  const partes = 6;
  return Array.from({ length: partes - 1 }, (_, i) => Math.round(((i + 1) * (n - 1)) / partes));
}

export type PropsGrafica = {
  dias: Dia[];
  diasAntes: Dia[];
  actual: number[];
  antes: number[];
  /** "cliente" / "clientes". */
  una: string;
  varias: string;
  /** Raíz de los enlaces ("/panel" o "/pruebalo"): picar un día lleva a su actividad. */
  base: string;
  /** "Clientes por día, del 7 de octubre al 5 de noviembre…": lo que oye el lector de pantalla. */
  resumen: string;
};

export function Grafica({ dias, diasAntes, actual, antes, una, varias, base, resumen }: PropsGrafica) {
  const router = useRouter();
  // En /pruebalo la navegación es local (ContextoNavegar); en /panel, la del router
  const local = useContext(ContextoNavegar);
  const abrirDia = (i: number) => {
    const href = enlaceNegocio({ tipo: "dia", dia: dias[i] }, base);
    if (local) local(href);
    else router.push(href);
  };
  const idDegradado = `neg-deg-${useId().replace(/:/g, "")}`;
  const caja = useRef<HTMLDivElement>(null);
  const [ancho, setAncho] = useState(640);
  const [activo, setActivo] = useState<number | null>(null);
  const tocado = useRef<number | null>(null);
  // La burbuja viaja de un día a otro, pero al aparecer sale ya en su lugar
  const antes0 = useRef<number | null>(null);
  const entrando = activo !== null && antes0.current === null;
  useEffect(() => {
    antes0.current = activo;
  }, [activo]);

  useEffect(() => {
    const el = caja.current;
    if (!el) return;
    const medir = () => setAncho(Math.max(240, Math.round(el.getBoundingClientRect().width)));
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const n = dias.length;
  const maximo = Math.max(1, ...actual, ...antes.slice(0, n));
  const tope = maximo * 1.12;
  const xDe = (i: number) => (n <= 1 ? ancho / 2 : (i * ancho) / (n - 1));
  const yDe = (v: number) => ARRIBA + (1 - v / tope) * (ALTO - ARRIBA - ABAJO);
  const puntos: Punto[] = actual.map((v, i) => [xDe(i), yDe(v)]);
  const puntosAntes: Punto[] = antes.slice(0, n).map((v, i) => [xDe(i), yDe(v)]);
  const linea = trazo(puntos);
  const area = n > 1 ? `${linea} L${ancho},${ALTO} L0,${ALTO} Z` : "";

  const indiceDe = (clientX: number) => {
    const el = caja.current;
    if (!el || n === 0) return null;
    const r = el.getBoundingClientRect();
    const x = Math.min(Math.max(clientX - r.left, 0), r.width);
    return n <= 1 ? 0 : Math.round((x / r.width) * (n - 1));
  };

  const alMover = (e: PointerEvent<HTMLDivElement>) => {
    const i = indiceDe(e.clientX);
    if (i !== null && i !== activo) setActivo(i);
  };
  const alSoltar = (e: PointerEvent<HTMLDivElement>) => {
    const i = indiceDe(e.clientX);
    if (i === null) return;
    if (e.pointerType === "mouse") {
      abrirDia(i);
      return;
    }
    // Con el dedo: el primer toque lee, el segundo en el mismo día abre
    if (tocado.current === i) abrirDia(i);
    else {
      tocado.current = i;
      setActivo(i);
    }
  };
  const alTeclear = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!n) return;
    const actualI = activo ?? n - 1;
    let i: number | null = null;
    if (e.key === "ArrowRight") i = Math.min(n - 1, actualI + (activo === null ? 0 : 1));
    else if (e.key === "ArrowLeft") i = Math.max(0, actualI - (activo === null ? 0 : 1));
    else if (e.key === "Home") i = 0;
    else if (e.key === "End") i = n - 1;
    else if (e.key === "Enter" && activo !== null) {
      abrirDia(activo);
      return;
    } else if (e.key === "Escape") {
      setActivo(null);
      return;
    }
    if (i === null) return;
    e.preventDefault();
    setActivo(i);
  };

  const texto = (i: number) => {
    const ahora = `${fechaConDia(dias[i])}: ${cuenta(actual[i], una, varias)}`;
    const antesV = antes[i];
    return antesV === undefined || !diasAntes[i] ? ahora : `${ahora}; ${fechaConDia(diasAntes[i])}, en el periodo anterior: ${cuenta(antesV, una, varias)}`;
  };

  // La burbuja: se queda dentro de la tarjeta. Al irse, se funde en su lugar y con lo último que mostró
  const BURBUJA = 188;
  const ultimo = useRef<number | null>(null);
  if (activo !== null) ultimo.current = activo;
  const mostrado = activo ?? ultimo.current;
  const xActivo = activo === null ? 0 : xDe(activo);
  const xMostrado = mostrado === null ? 0 : xDe(mostrado);
  const xBurbuja = Math.min(Math.max(xMostrado - BURBUJA / 2, 8), Math.max(8, ancho - BURBUJA - 8));

  return (
    <div className="neg-grafica">
      <div
        ref={caja}
        className="neg-grafica__lienzo"
        role="application"
        aria-roledescription="gráfica"
        aria-label={`${resumen} Usa las flechas para leer cada día y Enter para abrirlo.`}
        tabIndex={0}
        onPointerMove={alMover}
        onPointerDown={alMover}
        onPointerUp={alSoltar}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse") setActivo(null);
        }}
        onKeyDown={alTeclear}
        onBlur={() => setActivo(null)}
      >
        <svg className="neg-grafica__svg" width="100%" height={ALTO} viewBox={`0 0 ${ancho} ${ALTO}`} preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id={idDegradado} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" style={{ stopColor: "var(--neg-serie)", stopOpacity: 0.24 }} />
              <stop offset="100%" style={{ stopColor: "var(--neg-serie)", stopOpacity: 0 }} />
            </linearGradient>
          </defs>
          {puntosAntes.length > 1 && <path className="neg-grafica__antes" d={trazo(puntosAntes)} />}
          {area && <path className="neg-grafica__area" d={area} fill={`url(#${idDegradado})`} />}
          {n > 1 ? (
            <path className="neg-grafica__linea" d={linea} pathLength={1} />
          ) : (
            puntos[0] && <circle className="neg-grafica__solo" cx={puntos[0][0]} cy={puntos[0][1]} r={4} />
          )}
          {activo !== null && (
            <g className="neg-grafica__cruz">
              <line x1={xActivo} x2={xActivo} y1={0} y2={ALTO} />
              {puntosAntes[activo] && <circle className="neg-grafica__punto neg-grafica__punto--antes" cx={xActivo} cy={puntosAntes[activo][1]} r={3.5} />}
              <circle className="neg-grafica__punto" cx={xActivo} cy={puntos[activo][1]} r={4.5} />
            </g>
          )}
        </svg>

        <div
          className="neg-burbuja"
          data-visible={activo !== null ? "" : undefined}
          data-entrando={entrando ? "" : undefined}
          style={{ transform: `translate3d(${xBurbuja}px, 0, 0)`, width: BURBUJA }}
          aria-hidden="true"
        >
          {mostrado !== null && mostrado < n && (
            <>
              <p className="neg-burbuja__fecha">{fechaConDia(dias[mostrado])}</p>
              <p className="neg-burbuja__fila">
                <span className="neg-burbuja__marca" />
                <span>{cuenta(actual[mostrado], una, varias)}</span>
              </p>
              {antes[mostrado] !== undefined && diasAntes[mostrado] && (
                <p className="neg-burbuja__fila neg-burbuja__fila--antes">
                  <span className="neg-burbuja__marca neg-burbuja__marca--antes" />
                  <span>
                    {antes[mostrado]} el {fechaCorta(diasAntes[mostrado])}
                  </span>
                </p>
              )}
            </>
          )}
        </div>
      </div>

      <div className="neg-grafica__eje" aria-hidden="true">
        {etiquetas(n).map((i) => (
          <span key={dias[i]} data-borde={n > 1 && i === 0 ? "inicio" : n > 1 && i === n - 1 ? "fin" : undefined} style={{ left: `${n <= 1 ? 50 : (i / (n - 1)) * 100}%` }}>
            {fechaCorta(dias[i])}
          </span>
        ))}
      </div>

      {/* Lo que va leyendo la cruz, para el lector de pantalla */}
      <p className="pc-oculto" aria-live="polite">
        {activo !== null ? texto(activo) : ""}
      </p>
    </div>
  );
}
