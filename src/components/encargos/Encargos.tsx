"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Arrow, TriSpinner } from "../Buttons";
import { GALERIA, type AgenteGaleria, type Tarea } from "./datos";
import { Entrega } from "./Entrega";

const dos = (n: number) => String(n).padStart(2, "0");

// Ritmo de la "repetición" de cada tarea (milisegundos)
const POR_LETRA = 24;
const PAUSA = 380;
const POR_PASO = 720;

/** Repetición de una tarea: escribe el pedido, marca los pasos y entrega. */
function Repeticion({ tarea }: { tarea: Tarea }) {
  const ref = useRef<HTMLDivElement>(null);
  const [ms, setMs] = useState(-1); // -1 = todavía no empieza
  const [corrida, setCorrida] = useState(0);

  const escrito = tarea.pedido.length * POR_LETRA + PAUSA;
  const fin = escrito + tarea.pasos.length * POR_PASO + 150;

  // Empieza cuando se ve en pantalla
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setMs(Number.POSITIVE_INFINITY);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setMs((v) => (v < 0 ? 0 : v));
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -18% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [corrida]);

  // Reloj de la repetición
  const corriendo = ms >= 0 && ms < fin;
  useEffect(() => {
    if (!corriendo) return;
    const inicio = performance.now() - ms;
    const id = window.setInterval(() => setMs(performance.now() - inicio), 32);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [corriendo, corrida]);

  const letras = ms < 0 ? 0 : Math.min(tarea.pedido.length, Math.floor(ms / POR_LETRA));
  const pasoActual = ms < escrito ? -1 : Math.floor((ms - escrito) / POR_PASO);
  const listo = ms >= fin;

  return (
    <div ref={ref} className="px-4 pb-5 pt-5 sm:px-6 sm:pt-6">
      <div className="flex items-start justify-between gap-4">
        <p className="text-[0.8125rem] uppercase tracking-[0.06em] text-ash">Tú le pides</p>
        {listo ? (
          <button
            type="button"
            className="btn-ghost -mt-3 !min-h-[40px] !text-[0.8125rem]"
            onClick={() => {
              setMs(-1);
              setCorrida((c) => c + 1);
            }}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M13 8a5 5 0 1 1-1.5-3.6M13 2.5V5h-2.5" stroke="currentColor" strokeWidth="1.4" />
            </svg>
            Repetir
          </button>
        ) : (
          <span className="flex items-center gap-2 text-[0.8125rem] uppercase tracking-[0.04em] text-ash" aria-hidden="true">
            <TriSpinner className="h-3 w-3" />
            Trabajando
          </span>
        )}
      </div>
      <p className="editorial mt-2 text-[clamp(1.5rem,2.3vw,2.125rem)] leading-[1.12]">
        <span>{tarea.pedido.slice(0, letras)}</span>
        {letras < tarea.pedido.length ? <span className="caret" aria-hidden="true" /> : null}
        <span className="por-escribir">{tarea.pedido.slice(letras)}</span>
      </p>

      <ol className="mt-5 flex flex-col gap-1.5 text-[0.9375rem] text-silver">
        {tarea.pasos.map((p, i) => {
          const estado = listo || i < pasoActual ? "hecho" : i === pasoActual ? "haciendo" : "pendiente";
          return (
            <li key={p} className="paso flex items-center gap-3" data-estado={estado}>
              <span className="grid h-4 w-4 shrink-0 place-items-center" aria-hidden="true">
                {estado === "haciendo" ? (
                  <TriSpinner className="h-3 w-3" />
                ) : (
                  <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6.4 4.8 9 10 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
                  </svg>
                )}
              </span>
              {p}
            </li>
          );
        })}
      </ol>

      <div
        className="entrega mt-5 bg-papel px-4 py-4 text-[0.875rem] leading-[1.45] text-papel-tinta sm:px-5"
        data-on={listo ? "" : undefined}
      >
        <Entrega datos={tarea.entrega} />
      </div>
    </div>
  );
}

/** La ventana de un agente: sus tareas en pestañas y la repetición de la elegida. */
function Ventana({
  agente,
  numero,
  siguiente,
  onSiguiente,
}: {
  agente: AgenteGaleria;
  numero: number;
  siguiente: string;
  onSiguiente: () => void;
}) {
  const [tarea, setTarea] = useState(0);
  return (
    <div className="ventana border hairline bg-shale" role="group" aria-label={`Ejemplos de ${agente.nombre}`}>
      <div className="flex min-h-[52px] items-center gap-3 border-b hairline px-4 sm:px-5">
        <span className="hidden font-cond text-base leading-none tracking-[0.03em] text-ash lg:inline">{dos(numero)}</span>
        <span className="text-[0.875rem] font-medium uppercase tracking-[0.04em]">
          <span className="lg:hidden">Lo que hace</span>
          <span className="hidden lg:inline">
            {agente.nombre} · {agente.area}
          </span>
        </span>
      </div>
      {/* Sus tareas */}
      <div className="flex gap-x-5 overflow-x-auto border-b hairline px-4 sm:px-5" role="tablist" aria-label={`Tareas de ${agente.nombre}`}>
        {agente.tareas.map((t, i) => (
          <button
            key={t.titulo}
            type="button"
            role="tab"
            aria-selected={i === tarea}
            className="tarea-tab"
            onClick={() => setTarea(i)}
          >
            {t.titulo}
          </button>
        ))}
      </div>
      <Repeticion key={tarea} tarea={agente.tareas[tarea]} />
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 pb-4 sm:px-6">
        {agente.conectado ? (
          <Link href="/entrar" className="btn-ghost !text-bone">
            Probar a {agente.nombre} gratis
            <Arrow />
          </Link>
        ) : (
          <p className="text-[0.8125rem] text-ash">Nombres y cifras de ejemplo.</p>
        )}
        <button type="button" className="btn-ghost ml-auto" onClick={onSiguiente}>
          Siguiente: {siguiente}
          <Arrow />
        </button>
      </div>
    </div>
  );
}

/**
 * Los 4 agentes. Al elegir uno, su ventana muestra varias de sus tareas
 * (a la derecha en computadora, debajo del agente en celular).
 */
export function Encargos() {
  const [activo, setActivo] = useState(0);
  const elegidoPorToque = useRef(false);
  const listaRef = useRef<HTMLOListElement>(null);

  const elegir = (i: number) => {
    elegidoPorToque.current = true;
    setActivo(i);
  };

  // En celular, la ventana se abre debajo del agente: lo llevamos a la vista
  useEffect(() => {
    if (!elegidoPorToque.current) return;
    elegidoPorToque.current = false;
    if (window.matchMedia("(min-width: 1024px)").matches) return;
    const li = listaRef.current?.querySelector<HTMLElement>(`[data-i="${activo}"]`);
    li?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
  }, [activo]);

  const siguiente = (activo + 1) % GALERIA.length;
  const ventana = (
    <Ventana
      key={activo}
      agente={GALERIA[activo]}
      numero={activo + 1}
      siguiente={GALERIA[siguiente].nombre}
      onSiguiente={() => elegir(siguiente)}
    />
  );

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
      <ol ref={listaRef} className="border-b hairline lg:self-start">
        {GALERIA.map((a, i) => {
          const esActivo = i === activo;
          return (
            <li key={a.id} data-i={i} className="scroll-mt-[88px] border-t hairline">
              <button
                type="button"
                className="agente"
                data-active={esActivo ? "true" : "false"}
                aria-pressed={esActivo}
                onClick={() => elegir(i)}
              >
                <span className="agente__n">{dos(i + 1)}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-4">
                    <span className="agente__nombre agente__nombre--grande">{a.nombre}</span>
                    <span className="font-cond text-base uppercase tracking-[0.03em]">{a.area}</span>
                  </span>
                  <span className="agente__desc">{a.lema}</span>
                  <span className="agente__caps">{a.capacidades.join(" · ")}</span>
                </span>
              </button>
              {esActivo ? <div className="pb-6 lg:hidden">{ventana}</div> : null}
            </li>
          );
        })}
      </ol>

      <div className="hidden lg:block">
        <div className="sticky top-[96px]">{ventana}</div>
      </div>
    </div>
  );
}
