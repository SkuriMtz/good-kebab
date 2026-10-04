"use client";

import { useEffect, useRef } from "react";
import { Arrow, PillLink } from "../Buttons";
import { PERSONAJES, Personaje } from "./Personaje";
import { DETALLE } from "./detalle";
import { AGENTE_POR_ID, type IdAgente } from "@/lib/agentes";
import { PLANES, planMinimo } from "@/lib/planes";

/**
 * Ficha de un agente: qué es, todo lo que hace, una conversación de ejemplo
 * y en qué plan está. Es un <dialog> nativo: se cierra con el botón, con
 * Escape o tocando afuera, y mantiene el foco dentro mientras está abierto.
 */
export function AgenteModal({ agente, onClose }: { agente: IdAgente | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const abierto = agente !== null;

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.open) {
      d.showModal();
      d.scrollTop = 0;
      const html = document.documentElement;
      const previo = html.style.overflow;
      html.style.overflow = "hidden";
      return () => {
        html.style.overflow = previo;
      };
    }
    if (!abierto && d.open) d.close();
  }, [abierto, agente]);

  const info = agente ? AGENTE_POR_ID[agente] : null;
  const detalle = agente ? DETALLE[agente] : null;
  const planes = agente ? PLANES.filter((p) => p.agentes.includes(agente)) : [];
  const enFree = planes.some((p) => p.id === "free");

  return (
    <dialog
      ref={ref}
      className="agente-modal"
      aria-labelledby="agente-modal-titulo"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        // Clic en el fondo (fuera de la caja): el evento llega al propio <dialog>
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {info && detalle && agente ? (
        <div className="agente-modal__caja" key={agente}>
          <button type="button" className="agente-modal__cerrar" onClick={onClose} aria-label="Cerrar">
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden="true">
              <path d="M3 3l10 10M13 3 3 13" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>

          {/* Encabezado: personaje, nombre y frase */}
          <header className="grid items-center gap-6 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-10">
            <div className="mx-auto w-[132px] sm:mx-0 sm:w-[160px]">
              <Personaje agente={agente} className="h-auto w-full" />
            </div>
            <div className="text-center sm:text-left">
              <p className="font-cond text-base uppercase tracking-[0.04em] text-ash">
                {info.area} · {info.abarca}
              </p>
              <h2 id="agente-modal-titulo" className="titulo titulo--xl mt-3">
                {info.nombre}
              </h2>
              <p className="mt-4 text-body text-silver">{info.lema}</p>
            </div>
          </header>

          <div className="mt-14 grid gap-14 lg:grid-cols-2 lg:gap-16">
            <div className="flex flex-col gap-14">
              <section>
                <h3 className="agente-modal__titulo">Qué es y para qué sirve</h3>
                <p className="mt-4 text-body text-silver">{detalle.descripcion}</p>
              </section>

              <section>
                <h3 className="agente-modal__titulo">Todo lo que puede hacer</h3>
                <ul className="mt-4 border-b hairline">
                  {detalle.funciones.map((f) => (
                    <li key={f.titulo} className="grid grid-cols-[18px_minmax(0,1fr)] gap-x-3 border-t hairline py-4">
                      <svg className="mt-[0.5em] h-3 w-3" style={{ color: PERSONAJES[agente].color }} viewBox="0 0 12 12" fill="none" aria-hidden="true">
                        <path d="M2 6.4 4.8 9 10 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
                      </svg>
                      <span>
                        <span className="block font-medium text-bone">{f.titulo}</span>
                        <span className="mt-1 block text-[0.9375rem] leading-relaxed text-silver">{f.detalle}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <div className="flex flex-col gap-14">
              <section>
                <h3 className="agente-modal__titulo">Conversación de ejemplo</h3>
                <div className="tarjeta mt-4 overflow-hidden">
                  <p className="flex items-center justify-between px-5 pb-1 pt-4 text-[0.8125rem] text-ash">
                    <span>{detalle.canal}</span>
                    <span>Nombres de ejemplo</span>
                  </p>
                  <ol className="flex flex-col gap-3 px-5 py-6">
                    {detalle.conversacion.map((m, i) =>
                      m.de === "nota" ? (
                        <li key={i} className="mt-1 flex items-start gap-2 pt-3 text-[0.9375rem] text-bone">
                          <span className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: PERSONAJES[agente].color }} aria-hidden="true" />
                          {m.texto}
                        </li>
                      ) : (
                        <li
                          key={i}
                          className={`max-w-[88%] px-4 py-3 text-[0.9375rem] leading-relaxed ${
                            m.de === "otro"
                              ? "self-start rounded-[18px] rounded-bl-md bg-void text-bone"
                              : "self-end rounded-[18px] rounded-br-md bg-bone text-void"
                          }`}
                        >
                          <span className={`mb-1 block text-[0.75rem] font-medium ${m.de === "otro" ? "text-ash" : "opacity-60"}`}>
                            {m.de === "otro" ? m.quien : info.nombre}
                            {m.hora ? <span className="ml-2 tabular-nums">{m.hora}</span> : null}
                          </span>
                          {m.texto}
                        </li>
                      ),
                    )}
                  </ol>
                </div>
              </section>

              <section>
                <h3 className="agente-modal__titulo">En qué plan está</h3>
                <ul className="mt-4 grid grid-cols-3 gap-2">
                  {PLANES.map((p) => {
                    const incluido = p.agentes.includes(agente);
                    return (
                      <li key={p.id} className={`tarjeta !rounded-[20px] px-4 py-5 ${incluido ? "" : "opacity-45"}`}>
                        <span className="block font-cond text-[0.875rem] uppercase tracking-[0.04em] text-ash">Atendel</span>
                        <span className="mt-1 block text-[1.5rem] font-semibold leading-none tracking-[-0.04em]">{p.nombre.replace("Atendel ", "")}</span>
                        <span className={`mt-3 block text-[0.8125rem] ${incluido ? "text-bone" : "text-ash"}`}>
                          {incluido ? "Incluido" : "No incluido"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                  <PillLink href="/entrar">{enFree ? `Probar a ${info.nombre} gratis` : "Empezar gratis"}</PillLink>
                  <a href="/precios" className="btn-ghost">
                    Ver precios
                    <Arrow />
                  </a>
                </div>
                {!enFree ? (
                  <p className="mt-4 text-[0.875rem] leading-relaxed text-ash">
                    {info.nombre} llega con {planMinimo(agente).nombre}. Mientras, puedes empezar gratis con Clara.
                  </p>
                ) : null}
              </section>
            </div>
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
