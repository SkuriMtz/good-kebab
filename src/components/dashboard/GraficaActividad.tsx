"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { Boton } from "@/components/base/Boton";
import { Icono } from "@/components/base/Iconos";
import { Personaje } from "@/components/agentes/Personaje";
import { AGENTE_POR_ID, type IdAgente } from "@/lib/agentes";
import { columnas, cortes, diaLargo, mesCorto, mesLargo, nivel, numero, totalDia, totalRango, type Filtro } from "./actividad";
import type { Actividad, DiaActividad } from "./tipos";

/**
 * La gráfica de actividad del equipo: un cuadro por día de las últimas
 * semanas (lunes arriba, domingo abajo), más oscuro mientras más trabajo
 * hicieron los agentes ese día. Arriba, los meses; abajo, la escala.
 *
 * - Filtro por agente (lista a un lado, como los años en un perfil de
 *   desarrollador): cambia la cuadrícula y la cifra del título.
 * - Pasar el cursor o recorrer con el teclado (flechas, Inicio, Fin) muestra
 *   el día y cuánto hizo cada quien. Un solo lugar en el orden de tabulación.
 * - "Ver como tabla": el mismo dato por mes, en números (para quien no ve
 *   bien los colores o prefiere leer).
 * Colores: un solo azul en cinco pasos (de nada a mucho), en los dos modos.
 */

type Celda = { col: number; fila: number };
// useLayoutEffect solo en el navegador (en el servidor no hay nada que medir)
const useEfectoDeMedida = typeof window !== "undefined" ? useLayoutEffect : useEffect;
const DIAS_FILA = ["Lun", "", "Mié", "", "Vie", "", ""];
const NOMBRE_FILA = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

function desglose(d: DiaActividad, agentes: IdAgente[]) {
  return agentes
    .map((id) => ({ id, n: d.porAgente[id] ?? 0 }))
    .filter((x) => x.n > 0)
    .map((x) => `${AGENTE_POR_ID[x.id].nombre} ${numero(x.n)}`)
    .join(" · ");
}

export function GraficaActividad({ actividad, ejemplo = false }: { actividad: Actividad; ejemplo?: boolean }) {
  const { dias, agentes, unidad } = actividad;
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [tabla, setTabla] = useState(false);
  const cols = useMemo(() => columnas(dias), [dias]);
  const ultima = useMemo<Celda>(() => {
    const c = cols.length - 1;
    const fila = cols[c]?.findLastIndex((d) => d !== null) ?? 0;
    return { col: Math.max(0, c), fila: Math.max(0, fila) };
  }, [cols]);
  const [foco, setFoco] = useState<Celda>(ultima);
  const [mostrar, setMostrar] = useState<Celda | null>(null);
  const tablaRef = useRef<HTMLTableElement>(null);
  const marco = useRef<HTMLDivElement>(null);
  const globo = useRef<HTMLDivElement>(null);

  const valores = useMemo(() => dias.map((d) => totalDia(d, filtro)), [dias, filtro]);
  const c = useMemo(() => cortes(valores), [valores]);
  const total = useMemo(() => valores.reduce((s, v) => s + v, 0), [valores]);
  const porAgente = useMemo(() => agentes.map((id) => ({ id, total: totalRango(dias, id) })), [agentes, dias]);
  const totalEquipo = useMemo(() => totalRango(dias, "todos"), [dias]);
  const semanas = cols.length;

  // Meses arriba: empieza una etiqueta donde cambia el mes del primer día de la columna
  const meses = useMemo(() => {
    const grupos: { etiqueta: string; span: number }[] = [];
    let previo = "";
    cols.forEach((col) => {
      const d = col.find((x) => x !== null);
      const mes = d ? d.fecha.slice(0, 7) : previo;
      if (mes !== previo) {
        grupos.push({ etiqueta: d ? mesCorto(d.fecha) : "", span: 1 });
        previo = mes;
      } else if (grupos.length) grupos[grupos.length - 1].span += 1;
    });
    return grupos;
  }, [cols]);

  // Por mes, para la vista de tabla
  const porMes = useMemo(() => {
    const m = new Map<string, DiaActividad[]>();
    for (const d of dias) {
      const k = d.fecha.slice(0, 7);
      m.set(k, [...(m.get(k) ?? []), d]);
    }
    return Array.from(m.entries()).map(([k, ds]) => ({ mes: mesLargo(`${k}-01`), dias: ds }));
  }, [dias]);

  const diaEn = useCallback((p: Celda | null) => (p ? (cols[p.col]?.[p.fila] ?? null) : null), [cols]);

  const colocar = useCallback((p: Celda | null) => setMostrar(p), []);

  // Coloca el globo sobre la celda ya con su texto puesto (solo transform: no mueve nada más)
  useEfectoDeMedida(() => {
    if (!mostrar) return;
    const celda = tablaRef.current?.querySelector<HTMLElement>(`[data-celda="${mostrar.col}-${mostrar.fila}"]`);
    const g = globo.current;
    const m = marco.current;
    if (!celda || !g || !m) return;
    const rc = celda.getBoundingClientRect();
    const rm = m.getBoundingClientRect();
    const x = rc.left - rm.left + rc.width / 2;
    const y = rc.top - rm.top;
    // Que no se salga del marco por los lados
    const mitad = g.offsetWidth / 2;
    const desfase = Math.min(0, rm.width - (x + mitad)) + Math.max(0, mitad - x);
    g.style.setProperty("--x", `${Math.round(x)}px`);
    g.style.setProperty("--y", `${Math.round(y)}px`);
    g.style.setProperty("--desfase", `${Math.round(desfase)}px`);
  }, [mostrar, filtro]);

  const mover = (e: KeyboardEvent<HTMLTableElement>) => {
    let { col, fila } = foco;
    const ok = (p: Celda) => diaEn(p) !== null;
    const prueba = (p: Celda) => (ok(p) ? p : null);
    let siguiente: Celda | null = null;
    switch (e.key) {
      case "ArrowRight":
        siguiente = prueba({ col: col + 1, fila });
        break;
      case "ArrowLeft":
        siguiente = prueba({ col: col - 1, fila });
        break;
      case "ArrowDown":
        siguiente = prueba({ col, fila: fila + 1 });
        break;
      case "ArrowUp":
        siguiente = prueba({ col, fila: fila - 1 });
        break;
      case "Home": {
        col = 0;
        fila = cols[0]?.findIndex((d) => d !== null) ?? 0;
        siguiente = { col, fila };
        break;
      }
      case "End":
        siguiente = ultima;
        break;
      default:
        return;
    }
    e.preventDefault();
    if (!siguiente) return;
    setFoco(siguiente);
    tablaRef.current?.querySelector<HTMLElement>(`[data-celda="${siguiente.col}-${siguiente.fila}"]`)?.focus();
  };

  const visto = diaEn(mostrar);
  const nombreFiltro = filtro === "todos" ? "tu equipo" : AGENTE_POR_ID[filtro].nombre;
  const unidadTexto = (n: number) => (n === 1 ? unidad.una : unidad.varias);
  const sinNada = totalEquipo === 0;

  return (
    <section className="tb-caja tb-grafica" aria-labelledby="grafica-titulo">
      <header className="tb-grafica__cabeza">
        <h2 id="grafica-titulo" className="tb-grafica__titulo">
          <span className="tb-grafica__cifra">{numero(total)}</span> {unidadTexto(total)}
          {filtro === "todos" ? " de tu equipo" : ` de ${nombreFiltro}`} en las últimas {semanas} semanas
        </h2>
        <Boton
          variante="fantasma"
          tam="compacto"
          icono={<Icono nombre={tabla ? "grafica" : "documento"} />}
          aria-pressed={tabla}
          onClick={() => setTabla((t) => !t)}
          className="tb-grafica__cambiar"
        >
          {tabla ? "Ver cuadros" : "Ver como tabla"}
        </Boton>
      </header>

      <div className="tb-grafica__cuerpo">
        <div className="tb-grafica__filtros" role="radiogroup" aria-label="Ver la actividad de">
          {[{ id: "todos" as Filtro, total: totalEquipo }, ...porAgente].map((f) => {
            const elegido = filtro === f.id;
            return (
              <button
                key={f.id}
                type="button"
                role="radio"
                aria-checked={elegido}
                className="tb-filtro"
                onClick={() => setFiltro(f.id)}
              >
                {f.id === "todos" ? (
                  <span className="tb-filtro__caras" aria-hidden="true">
                    {agentes.slice(0, 4).map((id) => (
                      <span key={id} className="tb-filtro__cara" style={{ "--agente": `var(--agente-${id})` } as CSSProperties}>
                        <Personaje agente={id} avatar />
                      </span>
                    ))}
                  </span>
                ) : (
                  <span className="tb-filtro__cara tb-filtro__cara--sola" style={{ "--agente": `var(--agente-${f.id})` } as CSSProperties} aria-hidden="true">
                    <Personaje agente={f.id} avatar />
                  </span>
                )}
                <span className="tb-filtro__nombre">{f.id === "todos" ? "Todo el equipo" : AGENTE_POR_ID[f.id].nombre}</span>
                <span className="tb-filtro__total cifras">{numero(f.total)}</span>
              </button>
            );
          })}
        </div>

        <div className="tb-grafica__lienzo">
          {tabla ? (
            <div className="tb-grafica__tabla-datos">
              <table className="tb-datos">
                <caption className="sr-only">
                  {unidad.varias} por mes y por agente{ejemplo ? " (datos de ejemplo)" : ""}
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Mes</th>
                    <th scope="col">Equipo</th>
                    {agentes.map((id) => (
                      <th key={id} scope="col">
                        {AGENTE_POR_ID[id].nombre}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {porMes.map((m) => (
                    <tr key={m.mes}>
                      <th scope="row">{m.mes}</th>
                      <td className="cifras">{numero(totalRango(m.dias, "todos"))}</td>
                      {agentes.map((id) => (
                        <td key={id} className="cifras">
                          {numero(totalRango(m.dias, id))}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              ref={marco}
              className="tb-grafica__marco"
              style={{ "--semanas": semanas } as CSSProperties}
              onPointerLeave={() => colocar(null)}
            >
              <table
                ref={tablaRef}
                className="tb-grafica__tabla"
                role="grid"
                aria-readonly="true"
                aria-label={`${unidad.varias} de ${nombreFiltro} por día, últimas ${semanas} semanas${ejemplo ? " (datos de ejemplo)" : ""}`}
                onKeyDown={mover}
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) colocar(null);
                }}
              >
                <thead>
                  <tr className="tb-grafica__meses">
                    <td className="tb-grafica__esquina" />
                    {meses.map((m, i) => (
                      <td key={`${m.etiqueta}-${i}`} colSpan={m.span} className="tb-grafica__mes">
                        <span aria-hidden="true">{m.span >= 2 ? m.etiqueta : ""}</span>
                      </td>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DIAS_FILA.map((etq, fila) => (
                    <tr key={fila}>
                      <td className="tb-grafica__dia">
                        <span className="sr-only">{NOMBRE_FILA[fila]}</span>
                        <span aria-hidden="true">{etq}</span>
                      </td>
                      {cols.map((col, ci) => {
                        const d = col[fila];
                        if (!d) return <td key={ci} className="tb-grafica__hueco" aria-hidden="true" />;
                        const v = totalDia(d, filtro);
                        const enFoco = foco.col === ci && foco.fila === fila;
                        const hoy = ci === ultima.col && fila === ultima.fila;
                        return (
                          <td
                            key={ci}
                            role="gridcell"
                            tabIndex={enFoco ? 0 : -1}
                            data-celda={`${ci}-${fila}`}
                            data-nivel={nivel(v, c)}
                            data-hoy={hoy || undefined}
                            aria-label={`${v === 0 ? "Sin" : numero(v)} ${unidadTexto(v)}, ${diaLargo(d.fecha)}${hoy ? " (hoy)" : ""}`}
                            className="tb-grafica__celda"
                            onPointerEnter={() => colocar({ col: ci, fila })}
                            onFocus={() => {
                              setFoco({ col: ci, fila });
                              colocar({ col: ci, fila });
                            }}
                          />
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Globo con el detalle del día (sigue a la celda con transform) */}
              <div ref={globo} className="tb-grafica__globo" data-visible={visto ? "true" : undefined} aria-hidden="true">
                {visto ? (
                  <>
                    <strong className="cifras">
                      {totalDia(visto, filtro) === 0 ? "Sin" : numero(totalDia(visto, filtro))} {unidadTexto(totalDia(visto, filtro))}
                    </strong>{" "}
                    el {diaLargo(visto.fecha)}
                    {filtro === "todos" && totalDia(visto, "todos") > 0 ? <span className="tb-grafica__desglose">{desglose(visto, agentes)}</span> : null}
                  </>
                ) : null}
              </div>
            </div>
          )}

        </div>

        <footer className="tb-grafica__pie">
          <p className="tb-grafica__explica">
            {sinNada ? "Todavía no hay actividad. " : ""}
            {actividad.explicacion}
          </p>
          <div className="tb-grafica__escala" aria-hidden="true">
            <span>Menos</span>
            {[0, 1, 2, 3, 4].map((n) => (
              <span key={n} className="tb-grafica__celda tb-grafica__celda--muestra" data-nivel={n} />
            ))}
            <span>Más</span>
          </div>
        </footer>
      </div>
    </section>
  );
}
