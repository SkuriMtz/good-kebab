"use client";

import Link from "next/link";
import { useEffect, useRef, type CSSProperties } from "react";
import { Arrow, Check, claseBoton } from "../Buttons";
import { ConversacionEjemplo } from "./ConversacionEjemplo";
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
  const enFree = agente ? PLANES.some((p) => p.id === "free" && p.agentes.includes(agente)) : false;
  const color = agente ? PERSONAJES[agente].color : undefined;

  return (
    <dialog
      ref={ref}
      className="ficha"
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
        <div className="ficha__caja" key={agente}>
          <button type="button" className="ficha__cerrar" onClick={onClose} aria-label="Cerrar">
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden="true">
              <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>

          {/* Encabezado: personaje, nombre y frase */}
          <header className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-7">
            <div
              className="grid h-[104px] w-[104px] shrink-0 place-items-center rounded-tarjeta sm:h-[128px] sm:w-[128px]"
              style={{ background: color }}
            >
              <Personaje agente={agente} avatar className="h-[72%] w-[72%]" />
            </div>
            <div>
              <p className="pill">
                {info.area} · {info.abarca}
              </p>
              <h2 id="agente-modal-titulo" className="t-seccion mt-3">
                {info.nombre}
              </h2>
              <p className="t-editorial mt-2 max-w-[560px]">{info.lema}</p>
            </div>
          </header>

          <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-12">
            <div className="flex flex-col gap-10">
              <section>
                <h3 className="t-etiqueta">Qué es y para qué sirve</h3>
                <p className="t-cuerpo mt-3">{detalle.descripcion}</p>
              </section>

              <section>
                <h3 className="t-etiqueta">Todo lo que puede hacer</h3>
                <ul className="tarjeta mt-3 !p-0">
                  {detalle.funciones.map((f, i) => (
                    <li
                      key={f.titulo}
                      className={`grid grid-cols-[20px_minmax(0,1fr)] gap-3 px-5 py-4 ${i ? "border-t border-[var(--linea)]" : ""}`}
                    >
                      <Check className="mt-[3px] h-4 w-4 text-enlace" />
                      <span>
                        <span className="block font-semibold">{f.titulo}</span>
                        <span className="mt-1 block text-[0.9375rem] leading-relaxed text-grafito">{f.detalle}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <div className="flex flex-col gap-10">
              <section>
                <h3 className="t-etiqueta">Conversación de ejemplo</h3>
                <div className="panel-color en-acento mt-3" style={{ "--acento": color } as CSSProperties}>
                  <ConversacionEjemplo agente={agente} />
                </div>
              </section>

              <section>
                <h3 className="t-etiqueta">En qué plan está</h3>
                <ul className="mt-3 grid grid-cols-3 gap-2">
                  {PLANES.map((p) => {
                    const incluido = p.agentes.includes(agente);
                    return (
                      <li key={p.id} className={`tarjeta !p-4 ${incluido ? "" : "opacity-60"}`}>
                        <span className="block text-[0.75rem] font-medium text-tenue">Atendel</span>
                        <span className="mt-0.5 block text-[1.375rem] font-bold leading-none tracking-[-0.02em]">
                          {p.nombre.replace("Atendel ", "")}
                        </span>
                        <span className={`mt-3 flex items-center gap-1.5 text-[0.8125rem] ${incluido ? "font-medium text-tinta" : "text-tenue"}`}>
                          {incluido ? <Check className="h-3.5 w-3.5 text-enlace" /> : null}
                          {incluido ? "Incluido" : "No incluido"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Link href="/entrar" className={claseBoton("primario")} onClick={onClose}>
                    {enFree ? `Probar a ${info.nombre} gratis` : "Empezar gratis"}
                  </Link>
                  <Link href="/precios" className={claseBoton("texto")} onClick={onClose}>
                    Ver precios
                    <Arrow />
                  </Link>
                </div>
                {!enFree ? (
                  <p className="t-chico mt-4">
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
