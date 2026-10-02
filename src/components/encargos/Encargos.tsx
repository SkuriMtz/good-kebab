"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Arrow, TriSpinner } from "../Buttons";
import { AGENTES, GRUPOS, type Agente } from "./datos";
import { Entrega } from "./Entrega";

const dos = (n: number) => String(n).padStart(2, "0");

// Ritmo de la "repetición" de cada tarea (milisegundos)
const POR_LETRA = 24;
const PAUSA = 380;
const POR_PASO = 720;

/**
 * La ventana donde se ve trabajar a un agente: escribe el pedido, va
 * marcando sus pasos y al final aparece lo que entrega.
 */
function Ventana({
  agente,
  numero,
  siguiente,
  onSiguiente,
}: {
  agente: Agente;
  numero: number;
  siguiente: string;
  onSiguiente: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [ms, setMs] = useState(-1); // -1 = todavía no empieza
  const [corrida, setCorrida] = useState(0);

  const escrito = agente.pedido.length * POR_LETRA + PAUSA;
  const fin = escrito + agente.pasos.length * POR_PASO + 150;

  // Empieza cuando la ventana se ve en pantalla
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

  const letras = ms < 0 ? 0 : Math.min(agente.pedido.length, Math.floor(ms / POR_LETRA));
  const pasoActual = ms < escrito ? -1 : Math.floor((ms - escrito) / POR_PASO);
  const listo = ms >= fin;

  return (
    <div
      ref={ref}
      className="ventana border hairline bg-shale"
      role="group"
      aria-label={`Ejemplo: agente de ${agente.nombre}`}
    >
      <div className="flex min-h-[52px] items-center justify-between gap-4 border-b hairline px-4 sm:px-5">
        <p className="flex items-baseline gap-3">
          <span className="hidden font-cond text-base leading-none tracking-[0.03em] text-ash lg:inline">{dos(numero)}</span>
          {/* En celular el nombre ya está justo arriba */}
          <span className="text-[0.875rem] font-medium uppercase tracking-[0.04em]">
            <span className="lg:hidden">Así lo resuelve</span>
            <span className="hidden lg:inline">Agente de {agente.nombre}</span>
          </span>
        </p>
        {listo ? (
          <button
            type="button"
            className="btn-ghost !min-h-[40px] !text-[0.8125rem]"
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

      <div className="px-4 pb-5 pt-5 sm:px-6 sm:pt-6">
        {/* El pedido, como si lo estuvieras escribiendo */}
        <p className="text-[0.8125rem] uppercase tracking-[0.06em] text-ash">Tú le pides</p>
        <p className="editorial mt-2 text-[clamp(1.5rem,2.3vw,2.125rem)] leading-[1.12]">
          <span>{agente.pedido.slice(0, letras)}</span>
          {letras < agente.pedido.length ? <span className="caret" aria-hidden="true" /> : null}
          <span className="por-escribir">{agente.pedido.slice(letras)}</span>
        </p>

        {/* Sus pasos */}
        <ol className="mt-5 flex flex-col gap-1.5 text-[0.9375rem] text-silver">
          {agente.pasos.map((p, i) => {
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

        {/* Lo que entrega */}
        <div className="entrega mt-5 bg-papel px-4 py-4 text-[0.875rem] leading-[1.45] text-papel-tinta sm:px-5" data-on={listo ? "" : undefined}>
          <Entrega datos={agente.entrega} />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
          {agente.disponible ? (
            <Link href="/entrar" className="btn-ghost !text-bone">
              Probarlo con mi correo
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
    </div>
  );
}

/**
 * Índice de los 15 agentes agrupados por lo que hacen. Al elegir uno,
 * su ventana muestra cómo resuelve un pedido (a la derecha en computadora,
 * debajo del agente en celular).
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

  const total = AGENTES.length;
  const siguiente = (activo + 1) % total;
  const ventana = (
    <Ventana
      key={activo}
      agente={AGENTES[activo]}
      numero={activo + 1}
      siguiente={AGENTES[siguiente].nombre}
      onSiguiente={() => elegir(siguiente)}
    />
  );

  let indice = -1;
  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
      <ol ref={listaRef} className="encargos">
        {GRUPOS.map((g) => (
          <li key={g.nombre} className="mb-8 last:mb-0 lg:mb-10">
            <p className="flex items-baseline justify-between border-b hairline pb-2 font-cond text-base uppercase leading-none tracking-[0.03em] text-ash">
              <span>{g.nombre}</span>
              <span>{g.agentes.length}</span>
            </p>
            <ul>
              {g.agentes.map((a) => {
                indice += 1;
                const i = indice;
                const esActivo = i === activo;
                return (
                  <li key={a.nombre} data-i={i} className="scroll-mt-[88px] border-b hairline">
                    <button
                      type="button"
                      className="agente"
                      data-active={esActivo ? "true" : "false"}
                      aria-pressed={esActivo}
                      onClick={() => elegir(i)}
                      style={{ "--i": i } as CSSProperties}
                    >
                      <span className="agente__n">{dos(i + 1)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="agente__nombre">{a.nombre}</span>
                        <span className="agente__desc">{a.descripcion}</span>
                      </span>
                      {a.disponible ? (
                        <span className="flex items-center gap-1.5 self-center whitespace-nowrap text-[0.75rem] uppercase tracking-[0.06em] text-silver">
                          <span className="h-1.5 w-1.5 rounded-full bg-signal" aria-hidden="true" />
                          Ya funciona
                        </span>
                      ) : null}
                    </button>
                    {esActivo ? <div className="pb-6 lg:hidden">{ventana}</div> : null}
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ol>

      <div className="hidden lg:block">
        <div className="sticky top-[96px]">{ventana}</div>
      </div>
    </div>
  );
}
