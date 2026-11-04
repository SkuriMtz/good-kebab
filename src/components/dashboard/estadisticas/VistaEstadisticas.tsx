"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition, type MouseEvent, type ReactNode } from "react";
import { claseBotonBase } from "@/components/base/Boton";
import { Icono } from "@/components/base/Iconos";
import { AGENTE_POR_ID, type IdAgente } from "@/lib/agentes";
import {
  enlaceEstadisticas,
  esMetricaAgente,
  filtrosEstadisticas,
  hayDatos,
  METRICA_INICIAL,
  METRICA_POR_ID,
  PERIODOS,
  type DatosEstadisticas,
  type DestinoEstadisticas,
  type IdMetrica,
  type Periodo,
} from "@/lib/estadisticas";
import { Fragmentos } from "../Fragmentos";
import { Accionable, Tarjeta, Vacio } from "../Piezas";
import type { Accion } from "../tipos";
import { rangoTexto } from "./formato";
import { Grafica } from "./Grafica";
import { Numeros } from "./Numeros";
import { Acciones, Horas, PorAgente, Remitentes, UsoPlan } from "./Reportes";
import "./estadisticas.css";

/* =====================================================================
   Estadísticas (?vista=estadisticas&periodo=30d), al estilo de un panel
   de analítica: la fila de números con su cambio, la gráfica grande por
   día y tarjetas con listas de barras. Sirve igual en /panel (datos reales
   de cargarEstadisticas) y en /pruebalo (VistaEstadisticasEjemplo).
   Todo lo que se pica lleva a su sección ya filtrada. La URL manda:
   ?vista=estadisticas&periodo=7d|30d|mes&metrica=…&agente=<id>
   (el periodo cambia de página; la métrica y el agente se cambian aquí
   mismo, sin recargar, y quedan en la URL).
   Va dentro del armazón (.pnl) y pinta su propia .pnl-pagina.
   ===================================================================== */

export type PropsVistaEstadisticas = {
  datos: DatosEstadisticas;
  periodo: Periodo;
  /** Raíz de los enlaces: "/panel". */
  base?: string;
  /**
   * Para cambiar a dónde lleva cada cosa (en /pruebalo, cambiar de vista sin
   * recargar). Sin esto, cada destino es un enlace dentro de `base`.
   */
  accionDe?: (d: DestinoEstadisticas) => Accion;
  /** Junto al título (en /pruebalo, la insignia "Datos de ejemplo"). */
  insignia?: ReactNode;
  /** La métrica y el agente de la URL (?metrica=, ?agente=). Si no se pasan, se leen de la URL al abrir. */
  metrica?: IdMetrica;
  agente?: IdAgente | null;
};

/** Cambia un parámetro de la URL sin recargar ni sumar un paso al botón de atrás. */
function ponerEnUrl(clave: string, valor: string | null) {
  const url = new URL(window.location.href);
  if (valor === null) url.searchParams.delete(clave);
  else url.searchParams.set(clave, valor);
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
}

export function VistaEstadisticas({ datos, periodo, base = "/panel", accionDe, insignia, metrica: metricaInicial, agente: agenteInicial }: PropsVistaEstadisticas) {
  const router = useRouter();
  const [metrica, setMetrica] = useState<IdMetrica>(metricaInicial ?? METRICA_INICIAL);
  const [agente, setAgente] = useState<IdAgente | null>(agenteInicial ?? null);
  // Sin props: lo que diga la URL al abrir
  useEffect(() => {
    const f = filtrosEstadisticas(Object.fromEntries(new URLSearchParams(window.location.search)));
    if (metricaInicial === undefined) setMetrica(f.metrica);
    if (agenteInicial === undefined) setAgente(f.agente);
  }, [metricaInicial, agenteInicial]);

  const elegirMetrica = (m: IdMetrica) => {
    setMetrica(m);
    ponerEnUrl("metrica", m === METRICA_INICIAL ? null : m);
  };
  const quitarAgente = () => {
    setAgente(null);
    ponerEnUrl("agente", null);
  };
  const [cargando, empezar] = useTransition();
  /** El periodo que se acaba de pedir: se marca de inmediato, antes de que lleguen los datos. */
  const [pedido, setPedido] = useState<Periodo | null>(null);
  useEffect(() => setPedido(null), [datos]);

  const accion = useCallback((d: DestinoEstadisticas): Accion => accionDe?.(d) ?? { href: enlaceEstadisticas(d, base) }, [accionDe, base]);

  const marcado = pedido ?? periodo;
  const info = PERIODOS.find((p) => p.id === datos.periodo) ?? PERIODOS[0];
  const vacio = !hayDatos(datos);

  const destinoPeriodo = (p: Periodo): DestinoEstadisticas => ({ tipo: "periodo", periodo: p, metrica, agente });

  const elegirPeriodo = (p: Periodo, e: MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return; // abrir en otra pestaña
    e.preventDefault();
    if (p === marcado) return;
    const a = accion(destinoPeriodo(p));
    setPedido(p);
    if (a.alElegir) a.alElegir();
    else if (a.href) empezar(() => router.push(a.href as string, { scroll: false }));
  };

  /** Picar un día de la gráfica: la actividad de ese día. */
  const elegirDia = (i: number) => {
    const dia = datos.serie[i]?.dia;
    if (!dia) return;
    const a = accion({ tipo: "dia", dia });
    if (a.alElegir) a.alElegir();
    else if (a.href) router.push(a.href);
  };

  // La gráfica de un solo agente (?agente=), en lo que se puede separar por agente
  const serieAgente = agente ? datos.seriesAgente[agente] : undefined;
  const porAgente = Boolean(serieAgente && esMetricaAgente(metrica));
  const valores = serieAgente && esMetricaAgente(metrica) ? serieAgente.actual[metrica] : datos.serie.map((p) => p[metrica]);
  const anteriores = serieAgente && esMetricaAgente(metrica) ? serieAgente.anterior[metrica] : datos.serieAnterior.map((p) => p[metrica]);
  const indiceAgente = agente ? datos.porAgente.findIndex((a) => a.agente === agente) : -1;

  // Una llave por periodo: al cambiarlo, los números vuelven a subir y la línea se dibuja otra vez
  const llave = `${datos.periodo}-${datos.actual.hasta}`;

  return (
    <div className="pnl-pagina est" aria-busy={cargando || undefined}>
      <header className="pnl-vista__cabeza est-cabeza">
        <span className="est-cabeza__frag" aria-hidden="true">
          <Fragmentos cantidad={7} semilla={23} tamMin={8} tamMax={15} />
        </span>
        <div className="est-cabeza__texto">
          <h1 className="pnl-vista__titulo">
            Estadísticas
            {insignia}
          </h1>
          <p className="pnl-vista__texto">{rangoTexto(datos.actual.desde, datos.actual.hasta)}</p>
        </div>
        <nav className="pnl-filtros est-periodos" aria-label="Periodo">
          {PERIODOS.map((p) => {
            const a = accion(destinoPeriodo(p.id));
            const actual = p.id === marcado;
            const clase = `pnl-filtro pnl-picable est-periodo${actual ? " pnl-filtro--actual" : ""}`;
            return a.href ? (
              <Link key={p.id} href={a.href} scroll={false} className={clase} aria-current={actual ? "page" : undefined} onClick={(e) => elegirPeriodo(p.id, e)}>
                {p.etiqueta}
              </Link>
            ) : (
              <button key={p.id} type="button" className={clase} aria-pressed={actual} onClick={(e) => elegirPeriodo(p.id, e)}>
                {p.etiqueta}
              </button>
            );
          })}
        </nav>
      </header>

      <div className="est-cuerpo" data-cargando={cargando || undefined}>
        <Tarjeta key={llave} className="est-principal">
          <Numeros datos={datos} metrica={metrica} onElegir={elegirMetrica} contra={info.contra} elegibles={!vacio} />
          {vacio ? (
            <div className="est-vacio">
              <Vacio
                icono="grafica"
                titulo="Aquí vas a ver lo que hace tu equipo"
                texto="Todavía no hay mensajes ni correos resumidos en este periodo. Cuando hables con tus agentes o Clara resuma un correo, los números aparecen aquí, día por día."
                accion={
                  <span className="est-vacio__acciones">
                    <Accionable accion={accion({ tipo: "chat" })} className={claseBotonBase("principal", "compacto")}>
                      Hablar con tu equipo
                    </Accionable>
                    <Accionable accion={accion({ tipo: "correo" })} className={claseBotonBase("sutil", "compacto")}>
                      Resumir un correo
                    </Accionable>
                  </span>
                }
              />
            </div>
          ) : (
            <Grafica
              info={METRICA_POR_ID[metrica]}
              valores={valores}
              anteriores={anteriores}
              dias={datos.serie.map((p) => p.dia)}
              diasAnteriores={datos.serieAnterior.map((p) => p.dia)}
              contra={info.contra}
              deQuien={porAgente && agente ? AGENTE_POR_ID[agente].nombre : undefined}
              onElegirDia={elegirDia}
              filtro={
                agente ? (
                  <span className="est-filtro">
                    <button type="button" className="pnl-filtro pnl-filtro--quitar pnl-picable" onClick={quitarAgente} aria-label={`Quitar el filtro: ${AGENTE_POR_ID[agente].nombre}`}>
                      {AGENTE_POR_ID[agente].nombre}
                      <Icono nombre="cerrar" tam={12} />
                    </button>
                    {porAgente ? null : <span className="est-filtro__nota">Los correos los resume Clara: aquí se ven todos.</span>}
                  </span>
                ) : undefined
              }
            />
          )}
        </Tarjeta>

        <div className="est-rejilla" data-vacia={vacio || undefined} key={`r-${llave}`}>
          {vacio ? null : (
            <>
              <PorAgente datos={datos} accionDe={accion} marcado={indiceAgente} />
              <Acciones datos={datos} accionDe={accion} />
              <Remitentes datos={datos} accionDe={accion} />
              <Horas datos={datos} accionDe={accion} />
            </>
          )}
          <UsoPlan datos={datos} accionDe={accion} />
        </div>

        {datos.recortado ? (
          <p className="est-nota">Hay muchísimo movimiento: para que cargue rápido, las cuentas del periodo anterior pueden quedarse un poco cortas.</p>
        ) : null}
      </div>
    </div>
  );
}
