"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition, type MouseEvent, type ReactNode } from "react";
import { claseBotonBase } from "@/components/base/Boton";
import {
  enlaceEstadisticas,
  hayDatos,
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
   Todo lo que se pica lleva a su sección ya filtrada; el periodo va en la
   URL, así el botón de atrás regresa al anterior.
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
};

export function VistaEstadisticas({ datos, periodo, base = "/panel", accionDe, insignia }: PropsVistaEstadisticas) {
  const router = useRouter();
  const [metrica, setMetrica] = useState<IdMetrica>("mensajes");
  const [cargando, empezar] = useTransition();
  /** El periodo que se acaba de pedir: se marca de inmediato, antes de que lleguen los datos. */
  const [pedido, setPedido] = useState<Periodo | null>(null);
  useEffect(() => setPedido(null), [datos]);

  const accion = useCallback((d: DestinoEstadisticas): Accion => accionDe?.(d) ?? { href: enlaceEstadisticas(d, base) }, [accionDe, base]);

  const marcado = pedido ?? periodo;
  const info = PERIODOS.find((p) => p.id === datos.periodo) ?? PERIODOS[0];
  const vacio = !hayDatos(datos);

  const elegirPeriodo = (p: Periodo, e: MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return; // abrir en otra pestaña
    e.preventDefault();
    if (p === marcado) return;
    const a = accion({ tipo: "periodo", periodo: p });
    setPedido(p);
    if (a.alElegir) a.alElegir();
    else if (a.href) empezar(() => router.push(a.href as string, { scroll: false }));
  };

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
            const a = accion({ tipo: "periodo", periodo: p.id });
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
          <Numeros datos={datos} metrica={metrica} onElegir={setMetrica} contra={info.contra} elegibles={!vacio} />
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
              valores={datos.serie.map((p) => p[metrica])}
              anteriores={datos.serieAnterior.map((p) => p[metrica])}
              dias={datos.serie.map((p) => p.dia)}
              diasAnteriores={datos.serieAnterior.map((p) => p.dia)}
              contra={info.contra}
            />
          )}
        </Tarjeta>

        <div className="est-rejilla" data-vacia={vacio || undefined} key={`r-${llave}`}>
          {vacio ? null : (
            <>
              <PorAgente datos={datos} accionDe={accion} />
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
