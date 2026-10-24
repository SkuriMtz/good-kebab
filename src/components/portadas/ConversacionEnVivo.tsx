"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { Personaje } from "../agentes/Personaje";
import { DETALLE } from "../agentes/detalle";
import { PERSONAJES } from "@/lib/personajes";

const MENSAJES = DETALLE.lola.conversacion;

/**
 * La conversación de ejemplo de Lola en WhatsApp, que se escribe sola:
 * cada mensaje aparece después de los tres puntos de "escribiendo…".
 * Al terminar espera unos segundos y vuelve a empezar.
 * Con "reducir movimiento" se muestra completa desde el inicio.
 */
export function ConversacionEnVivo() {
  const [vistos, setVistos] = useState(0);
  const [escribe, setEscribe] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVistos(MENSAJES.length);
      return;
    }
    let cancelado = false;
    const timers: number[] = [];
    const esperar = (ms: number) => new Promise<void>((ok) => timers.push(window.setTimeout(ok, ms)));
    (async () => {
      for (;;) {
        for (let i = 0; i < MENSAJES.length; i++) {
          if (cancelado) return;
          if (MENSAJES[i].de === "agente") {
            setEscribe(true);
            await esperar(1100);
            setEscribe(false);
          } else await esperar(i === 0 ? 500 : 900);
          if (cancelado) return;
          setVistos(i + 1);
        }
        await esperar(4200);
        if (cancelado) return;
        setVistos(0);
      }
    })();
    return () => {
      cancelado = true;
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  return (
    <div className="w-full max-w-[460px]">
      <div className="flex items-center gap-[var(--spacing-12)]">
        <span className="marca-agente" style={{ "--agente": PERSONAJES.lola.color } as CSSProperties}>
          <Personaje agente="lola" avatar />
        </span>
        <span>
          <span className="t-rol block">Atención · WhatsApp</span>
          <span className="t-sub block">Lola</span>
        </span>
        <span className="t-caption ml-auto">Nombres de ejemplo</span>
      </div>
      <ol className="mt-[var(--spacing-24)] flex min-h-[340px] flex-col gap-[var(--spacing-12)]" aria-live="polite">
        {MENSAJES.slice(0, vistos).map((m, i) =>
          m.de === "nota" ? (
            <li key={i} className="t-chico mt-[var(--spacing-6)] !text-[var(--c-acento)]">
              → {m.texto}
            </li>
          ) : (
            <li
              key={i}
              className={`max-w-[85%] rounded-[18px] px-[var(--spacing-18)] py-[var(--spacing-12)] text-[15px] leading-[1.45] ${
                m.de === "otro" ? "self-start rounded-bl-[6px] bg-[var(--c-velo-fuerte)]" : "self-end rounded-br-[6px] bg-[var(--c-velo)] text-[var(--c-texto)]"
              }`}
            >
              <span className="t-caption mb-1 block">
                {m.de === "otro" ? m.quien : "Lola"} · {m.hora}
              </span>
              {m.texto}
            </li>
          ),
        )}
        {escribe ? (
          <li className="chat-app__puntos self-end rounded-[18px] rounded-br-[6px] bg-[var(--c-velo)]" aria-label="Lola está escribiendo">
            <i />
            <i />
            <i />
          </li>
        ) : null}
      </ol>
    </div>
  );
}
