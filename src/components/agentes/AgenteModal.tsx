"use client";

import Link from "next/link";
import { useEffect, useRef, type CSSProperties } from "react";
import { Arrow, Check, claseBoton } from "../Buttons";
import { ConversacionEjemplo } from "./ConversacionEjemplo";
import { Personaje } from "./Personaje";
import { PERSONAJES } from "@/lib/personajes";
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

          {/* Encabezado: retrato, área, nombre y frase */}
          <header className="dos-columnas !items-end">
            <div>
              <p className="t-etiqueta">
                {info.area} · {info.abarca}
              </p>
              <h2 id="agente-modal-titulo" className="t-display mt-[var(--spacing-18)]">
                {info.nombre}
              </h2>
              <p className="t-editorial mt-[var(--spacing-18)] max-w-[480px]">{info.lema}</p>
            </div>
            <div className="w-full max-w-[260px] lg:justify-self-end">
              <span className="retrato" style={{ "--agente": color } as CSSProperties}>
                <Personaje agente={agente} avatar />
              </span>
            </div>
          </header>

          <div className="dos-columnas mt-[var(--spacing-60)] !items-start lg:mt-[var(--spacing-96)]">
            <div className="flex flex-col gap-[var(--spacing-60)]">
              <section>
                <h3 className="t-etiqueta">Qué es y para qué sirve</h3>
                <p className="t-cuerpo mt-[var(--spacing-12)]">{detalle.descripcion}</p>
              </section>

              <section>
                <h3 className="t-etiqueta">Todo lo que puede hacer</h3>
                <ul className="mt-[var(--spacing-18)] flex flex-col gap-[var(--spacing-18)]">
                  {detalle.funciones.map((f) => (
                    <li key={f.titulo}>
                      <p className="t-sub">{f.titulo}</p>
                      <p className="t-cuerpo mt-1">{f.detalle}</p>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <div className="flex flex-col gap-[var(--spacing-60)]">
              <section>
                <ConversacionEjemplo agente={agente} />
              </section>

              <section>
                <h3 className="t-etiqueta">En qué plan está</h3>
                <ul className="mt-[var(--spacing-18)] grid grid-cols-3 gap-[var(--spacing-18)]">
                  {PLANES.map((p) => {
                    const incluido = p.agentes.includes(agente);
                    return (
                      <li key={p.id}>
                        <span className="t-caption block">Atendel</span>
                        <span className={`t-titulo block ${incluido ? "" : "!text-[var(--c-tenue)]"}`}>{p.nombre.replace("Atendel ", "")}</span>
                        <span className={`mt-[var(--spacing-6)] flex items-center gap-1 t-chico ${incluido ? "!text-[var(--c-acento)]" : ""}`}>
                          {incluido ? <Check className="h-3.5 w-3.5" /> : null}
                          {incluido ? "Incluido" : "No incluido"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-[var(--spacing-36)] flex flex-wrap items-center gap-[var(--spacing-12)]">
                  <Link href="/entrar" className={claseBoton("primario")} onClick={onClose}>
                    {enFree ? `Probar a ${info.nombre} gratis` : "Empezar gratis"}
                  </Link>
                  <Link href="/precios" className={claseBoton("suave")} onClick={onClose}>
                    Ver precios
                    <Arrow />
                  </Link>
                </div>
                {!enFree ? (
                  <p className="t-chico mt-[var(--spacing-18)]">
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
