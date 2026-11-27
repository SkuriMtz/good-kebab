"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Personaje } from "@/components/agentes/Personaje";
import { AGENTE_POR_ID, type IdAgente } from "@/lib/agentes";
import { LOGO_APP } from "@/lib/conexiones/logos";
import type { CategoriaApp, IdApp } from "@/lib/nucleo-tipos";

export type TipoApps = {
  id: CategoriaApp;
  nombre: string;
  texto: string;
  color: string;
  agentes: IdAgente[];
  apps: { id: IdApp; nombre: string; pronto: boolean }[];
  pide: string;
};

/** Un ángulo que parece al azar pero no cambia entre el servidor y el navegador. */
const giro = (k: number) => [-1.6, 1.2, -0.8, 1.6, -1.2][k % 5];

/**
 * /apps: una tarjeta de color por tipo de app (Correo, Mensajes, Agenda…), un poco ladeadas, en
 * una fila que se recorre con las flechas (o deslizando). Arriba, los tipos como botones: el que
 * toques trae su tarjeta. Cada tarjeta dice qué hace Atendel en ese tipo, sus apps (con logo),
 * quién del equipo las usa y un pedido de ejemplo que abre el chat de prueba.
 */
export function CarruselTipos({ tipos, t }: { tipos: TipoApps[]; t: { anterior: string; siguiente: string; probar: string; pidele: string; pronto: string } }) {
  const pista = useRef<HTMLUListElement>(null);
  const [actual, setActual] = useState(0);

  // El botón encendido sigue a la tarjeta que está a la izquierda de la fila
  useEffect(() => {
    const el = pista.current;
    if (!el) return;
    const medir = () => {
      const cartas = Array.from(el.children) as HTMLElement[];
      const izq = el.getBoundingClientRect().left;
      let mejor = 0;
      let dist = Infinity;
      cartas.forEach((c, k) => {
        const d = Math.abs(c.getBoundingClientRect().left - izq);
        if (d < dist) {
          dist = d;
          mejor = k;
        }
      });
      setActual(mejor);
    };
    medir();
    el.addEventListener("scroll", medir, { passive: true });
    return () => el.removeEventListener("scroll", medir);
  }, []);

  const ir = (k: number) => {
    const el = pista.current;
    const carta = el?.children[Math.max(0, Math.min(tipos.length - 1, k))] as HTMLElement | undefined;
    if (!el || !carta) return;
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: carta.offsetLeft - el.offsetLeft - parseFloat(getComputedStyle(el).paddingLeft || "0"), behavior: quieto ? "auto" : "smooth" });
  };

  return (
    <div className="tipos">
      <div className="tipos__chips">
        {tipos.map((tp, k) => (
          <button key={tp.id} type="button" className="tipos__chip" aria-pressed={k === actual} onClick={() => ir(k)}>
            {tp.nombre}
          </button>
        ))}
      </div>
      <ul ref={pista} className="tipos__pista">
        {tipos.map((tp, k) => (
          <li key={tp.id} className="tipo-carta" style={{ "--c": tp.color, "--giro": `${giro(k)}deg` } as CSSProperties} aria-labelledby={`tipo-${tp.id}`}>
            <h2 id={`tipo-${tp.id}`} className="tipo-carta__nombre">
              {tp.nombre}
            </h2>
            <p className="tipo-carta__texto">{tp.texto}</p>
            <ul className="tipo-carta__apps">
              {tp.apps.map((a) => (
                <li key={a.id} data-pronto={a.pronto ? "" : undefined} title={a.pronto ? `${a.nombre} · ${t.pronto}` : a.nombre}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- logo chico y fijo */}
                  <img src={LOGO_APP[a.id]} alt="" width={18} height={18} loading="lazy" decoding="async" />
                  {a.nombre}
                </li>
              ))}
            </ul>
            <div className="tipo-carta__pie">
              <span className="tipo-carta__equipo">
                {tp.agentes.map((ag) => (
                  <span key={ag} className="tipo-carta__agente">
                    <Personaje agente={ag} avatar />
                    {AGENTE_POR_ID[ag].nombre}
                  </span>
                ))}
              </span>
              <Link href={`/pruebalo?pide=${encodeURIComponent(tp.pide)}`} className="tipo-carta__boton">
                <span className="tipo-carta__pide">
                  {t.pidele}: «{tp.pide}»
                </span>
                <span className="tipo-carta__probar">
                  {t.probar} <span aria-hidden="true">→</span>
                </span>
              </Link>
            </div>
          </li>
        ))}
      </ul>
      <div className="tipos__flechas">
        <button type="button" className="tipos__flecha" aria-label={t.anterior} disabled={actual === 0} onClick={() => ir(actual - 1)}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <button type="button" className="tipos__flecha" aria-label={t.siguiente} disabled={actual >= tipos.length - 1} onClick={() => ir(actual + 1)}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
