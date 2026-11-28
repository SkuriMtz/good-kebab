"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Personaje } from "@/components/agentes/Personaje";
import type { IdAgente } from "@/lib/agentes";
import { PERSONAJES } from "@/lib/personajes";
import type { Idea, IdCaso } from "./ideas";

type IdeaVista = Idea & { nombre: string; area: string };
type Textos = { subtitulo: string; todas: string; ver: string; ejemplo: string; ficticio: string; cerrar: string; tu: string; probar: string };

const color = (id: IdAgente) => ({ "--c": PERSONAJES[id].color }) as CSSProperties;

/**
 * /para-quien-es: muchas ideas de varios tipos en una cuadrícula de tarjetas de color (el color
 * y la cara del agente que lo hace). Arriba, los tipos como botones para filtrar. La tarjeta que
 * toques abre un chat de ejemplo: tu pedido, Atendel escribiendo y su respuesta, con «Pruébalo»
 * para abrir el chat de prueba con ese pedido ya escrito. Es un <dialog> nativo: se cierra con
 * Escape, con la X o tocando afuera, y devuelve el foco a la tarjeta.
 */
export function Ideas({ ideas, casos, t }: { ideas: IdeaVista[]; casos: { id: IdCaso; corto: string }[]; t: Textos }) {
  const [filtro, setFiltro] = useState<IdCaso | "todas">("todas");
  const [abierta, setAbierta] = useState<IdeaVista | null>(null);
  const [escribiendo, setEscribiendo] = useState(false);
  const dialogo = useRef<HTMLDialogElement>(null);
  const vistas = filtro === "todas" ? ideas : ideas.filter((x) => x.caso === filtro);

  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    if (abierta && !d.open) d.showModal();
    if (!abierta) return;
    // Atendel «escribe» un momento antes de contestar (sin animación con «reducir movimiento»)
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setEscribiendo(!quieto);
    if (quieto) return;
    const t = window.setTimeout(() => setEscribiendo(false), 900);
    return () => window.clearTimeout(t);
  }, [abierta]);

  const cerrar = () => dialogo.current?.close();

  return (
    <div className="ideas-pq">
      <div className="ideas-pq__filtros" role="group" aria-label={t.subtitulo}>
        {[{ id: "todas" as const, corto: t.todas }, ...casos].map((c) => (
          <button key={c.id} type="button" className="ideas-pq__filtro" aria-pressed={filtro === c.id} onClick={() => setFiltro(c.id)}>
            {c.corto}
          </button>
        ))}
      </div>

      <ul key={filtro} className="ideas-pq__rejilla">
        {vistas.map((x, k) => (
          <li key={x.id} style={{ ...color(x.agente), "--k": Math.min(k, 12) } as CSSProperties}>
            <button type="button" className="idea-pq" onClick={() => setAbierta(x)} aria-haspopup="dialog">
              <span className="idea-pq__pide">{x.pide}</span>
              <span className="idea-pq__pie">
                <span className="idea-pq__cara" aria-hidden="true">
                  <Personaje agente={x.agente} avatar />
                </span>
                <span className="idea-pq__ver">{t.ver}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogo}
        className="chat-pq"
        aria-labelledby="chat-pq-titulo"
        onClose={() => setAbierta(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) cerrar();
        }}
      >
        {abierta ? (
          <div className="chat-pq__caja" style={color(abierta.agente)}>
            <header className="chat-pq__cabeza">
              <span className="chat-pq__cara" aria-hidden="true">
                <Personaje agente={abierta.agente} avatar />
              </span>
              <span>
                <b id="chat-pq-titulo">
                  {abierta.nombre} · {abierta.area}
                </b>
                <span className="chat-pq__ejemplo">{t.ejemplo}</span>
              </span>
              <button type="button" className="chat-pq__cerrar" onClick={cerrar} aria-label={t.cerrar}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </header>
            <div className="chat-pq__mensajes" aria-live="polite">
              <p className="chat-pq__burbuja chat-pq__burbuja--tu">
                <span className="sr-only">{t.tu}: </span>
                {abierta.pide}
              </p>
              {escribiendo ? (
                <p className="chat-pq__burbuja chat-pq__burbuja--atendel chat-pq__escribe" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </p>
              ) : (
                <p className="chat-pq__burbuja chat-pq__burbuja--atendel">
                  <span className="sr-only">{abierta.nombre}: </span>
                  {abierta.responde}
                </p>
              )}
            </div>
            <footer className="chat-pq__pie">
              <span className="chat-pq__nota">{t.ficticio}</span>
              <Link href={`/pruebalo?con=${abierta.agente}&pide=${encodeURIComponent(abierta.pide)}`} className="chat-pq__probar">
                {t.probar} <span aria-hidden="true">→</span>
              </Link>
            </footer>
          </div>
        ) : null}
      </dialog>
    </div>
  );
}
