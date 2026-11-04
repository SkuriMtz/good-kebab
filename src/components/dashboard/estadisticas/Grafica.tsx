"use client";

import { useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { escalaY, type Dia, type InfoMetrica } from "@/lib/estadisticas";
import { cifra, cifraCorta, cuenta, fechaConDia, fechaCorta } from "./formato";

/*
 * La gráfica grande, por día (SVG a mano, sin librerías).
 * - El SVG se estira a lo ancho (preserveAspectRatio="none") y sus líneas no
 *   se deforman (vector-effect). Lo que es texto (ejes y la burbuja) es HTML
 *   encima, colocado en %: se ve igual de nítido a 1440 que a 390 px.
 * - La línea se dibuja una sola vez al aparecer (un recorte que se abre con
 *   transform). Al cambiar de número solo se funde.
 * - Burbuja al pasar el mouse o el dedo, y con las flechas del teclado.
 */

const W = 1000;
const mayuscula = (t: string) => t.charAt(0).toLocaleUpperCase("es-MX") + t.slice(1);
const H = 300;

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

/** Qué días llevan etiqueta abajo: unos 7 repartidos (en angosto se ve la mitad). */
function etiquetasX(n: number): number[] {
  if (n <= 7) return Array.from({ length: n }, (_, i) => i);
  const paso = Math.ceil((n - 1) / 6);
  const lista: number[] = [];
  for (let i = 0; i < n; i += paso) lista.push(i);
  if (n - 1 - lista[lista.length - 1] >= paso / 2) lista.push(n - 1);
  else lista[lista.length - 1] = n - 1;
  return lista;
}

export type PropsGrafica = {
  info: InfoMetrica;
  valores: number[];
  anteriores: number[];
  dias: Dia[];
  diasAnteriores: Dia[];
  /** "los 30 días antes", para la leyenda. */
  contra: string;
};

export function Grafica({ info, valores, anteriores, dias, diasAnteriores, contra }: PropsGrafica) {
  const idRecorte = useId().replace(/:/g, "");
  const [activo, setActivo] = useState<number | null>(null);
  // El último día elegido: la burbuja se desvanece en su lugar, sin saltar ni vaciarse
  const ultimo = useRef<number | null>(null);
  const n = valores.length;
  const ant = anteriores.slice(0, n);

  const { tope, marcas } = escalaY(Math.max(0, ...valores, ...ant));
  const x = (i: number) => (n <= 1 ? W / 2 : (i / (n - 1)) * W);
  const y = (v: number) => H - (v / tope) * H;
  const xPct = (i: number) => (n <= 1 ? 50 : (i / (n - 1)) * 100);
  const yPct = (v: number) => (1 - v / tope) * 100;

  const linea = trazo(valores.map((v, i) => [x(i), y(v)]));
  const lineaAnt = trazo(ant.map((v, i) => [x(i), y(v)]));
  const area = n > 1 ? `${linea} L${W},${H} L0,${H} Z` : "";
  const etiquetas = etiquetasX(n);

  const total = valores.reduce((a, b) => a + b, 0);
  const iMax = valores.indexOf(Math.max(...valores));
  const resumen = n
    ? `${info.grafica}, ${fechaCorta(dias[0])} a ${fechaCorta(dias[n - 1])}. Total: ${cuenta(total, info.una, info.varias)}.${
        total ? ` El día con más: ${fechaConDia(dias[iMax])}, con ${cifra(valores[iMax])}.` : ""
      } Usa las flechas para recorrer los días.`
    : info.grafica;

  const desdePuntero = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (!r.width || !n) return;
    const i = Math.round(((e.clientX - r.left) / r.width) * (n - 1));
    setActivo(Math.min(n - 1, Math.max(0, i)));
  };

  const conTeclas = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!n) return;
    const actual = activo ?? n - 1;
    const nuevo = { ArrowLeft: actual - 1, ArrowRight: actual + 1, Home: 0, End: n - 1 }[e.key];
    if (e.key === "Escape") return setActivo(null);
    if (nuevo === undefined) return;
    e.preventDefault();
    setActivo(Math.min(n - 1, Math.max(0, nuevo)));
  };

  if (activo !== null && activo < n) ultimo.current = activo;
  const a = activo;
  const m = activo ?? (ultimo.current !== null && ultimo.current < n ? ultimo.current : null);
  const hayAnt = m !== null && m < ant.length;
  const lado = m !== null && xPct(m) > 58 ? "izq" : "der";
  const textoActivo =
    a === null
      ? ""
      : `${fechaConDia(dias[a])}: ${cuenta(valores[a], info.una, info.varias)}${a < ant.length ? `. Antes, ${fechaConDia(diasAnteriores[a])}: ${cifra(ant[a])}` : ""}.`;

  return (
    <div className="est-grafica">
      <div className="est-grafica__cabeza">
        <h2 className="est-grafica__titulo">{info.grafica}</h2>
        <ul className="est-leyenda" aria-label="Qué es cada línea">
          <li>
            <span className="est-leyenda__muestra" data-serie="actual" aria-hidden="true" />
            Este periodo
          </li>
          <li>
            <span className="est-leyenda__muestra" data-serie="anterior" aria-hidden="true" />
            {contra.replace(/^vs\. /, "").replace(/^./, (c) => c.toUpperCase())}
          </li>
        </ul>
      </div>

      <div className="est-grafica__marco">
        <div className="est-grafica__eje-y" aria-hidden="true">
          {marcas.map((v) => (
            <span key={v} style={{ top: `${yPct(v)}%` }}>
              {cifraCorta(v)}
            </span>
          ))}
        </div>

        <div
          className="est-grafica__plano"
          data-activo={a !== null || undefined}
          tabIndex={0}
          role="img"
          aria-label={resumen}
          onPointerMove={desdePuntero}
          onPointerDown={desdePuntero}
          onPointerLeave={(e) => e.pointerType === "mouse" && setActivo(null)}
          onKeyDown={conTeclas}
          onFocus={() => setActivo((v) => v ?? (n ? n - 1 : null))}
          onBlur={() => setActivo(null)}
        >
          <svg className="est-grafica__svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
            <defs>
              <clipPath id={idRecorte}>
                <rect className="est-grafica__revela" x={-4} y={-20} width={W + 8} height={H + 40} />
              </clipPath>
            </defs>
            {marcas.map((v) => (
              <line key={v} className="est-grafica__guia" data-cero={v === 0 || undefined} x1={0} x2={W} y1={y(v)} y2={y(v)} vectorEffect="non-scaling-stroke" />
            ))}
            {ant.length > 1 ? <path key={`a-${info.id}`} className="est-grafica__anterior" d={lineaAnt} vectorEffect="non-scaling-stroke" /> : null}
            <g clipPath={`url(#${idRecorte})`}>
              {area ? <path key={`r-${info.id}`} className="est-grafica__area" d={area} /> : null}
              <path key={`l-${info.id}`} className="est-grafica__linea" d={linea} vectorEffect="non-scaling-stroke" />
            </g>
          </svg>

          {n === 1 ? <span className="est-grafica__punto est-grafica__punto--fijo" style={{ left: "50%", top: `${yPct(valores[0])}%` }} /> : null}

          {/* Guía, puntos y burbuja del día elegido */}
          <span className="est-grafica__vertical" style={{ left: `${m === null ? 0 : xPct(m)}%` }} aria-hidden="true" />
          {a !== null && a < ant.length ? <span className="est-grafica__punto est-grafica__punto--ant" style={{ left: `${xPct(a)}%`, top: `${yPct(ant[a])}%` }} aria-hidden="true" /> : null}
          {a !== null ? <span className="est-grafica__punto" style={{ left: `${xPct(a)}%`, top: `${yPct(valores[a])}%` }} aria-hidden="true" /> : null}
          <div className="est-tip" data-lado={lado} style={{ left: `${m === null ? 0 : xPct(m)}%` }} aria-hidden="true">
            {m !== null ? (
              <>
                <p className="est-tip__fecha">{mayuscula(fechaConDia(dias[m]))}</p>
                <p className="est-tip__fila">
                  <span className="est-leyenda__muestra" data-serie="actual" />
                  <b className="est-tip__valor">{cifra(valores[m])}</b> {valores[m] === 1 ? info.una : info.varias}
                </p>
                {hayAnt ? (
                  <p className="est-tip__fila est-tip__fila--ant">
                    <span className="est-leyenda__muestra" data-serie="anterior" />
                    <b className="est-tip__valor">{cifra(ant[m])}</b> el {fechaConDia(diasAnteriores[m])}
                  </p>
                ) : null}
              </>
            ) : null}
          </div>
        </div>

        <div className="est-grafica__eje-x" aria-hidden="true">
          {etiquetas.map((i, k) => (
            <span
              key={i}
              data-impar={k % 2 === 1 || undefined}
              data-borde={i === 0 ? "inicio" : i === n - 1 ? "fin" : undefined}
              style={{ left: `${xPct(i)}%` }}
            >
              {fechaCorta(dias[i])}
            </span>
          ))}
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {textoActivo}
      </p>
    </div>
  );
}
