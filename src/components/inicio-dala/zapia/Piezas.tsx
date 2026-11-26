"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Dibujo } from "./Dibujos";
import { textosZapia, type Color } from "./textos";

/**
 * LAS MICROINTERACCIONES ESTILO ZAPIA (prueba, /vista-zapia), sobre la
 * landing de Atendel (que no pierde nada):
 * - Etiqueta: un globito de color con su colita que «salta» al aparecer.
 * - CajaEscribe: la caja del chat que escribe sola pedidos de ejemplo.
 * - GlobosHabilidades: globos de pedidos que suben uno tras otro (el de en
 *   medio encendido, los demás de vidrio).
 * - Ideas: categorías, tarjetas que se reparten al cambiar y «Voy a tener
 *   suerte», que voltea una tarjeta al azar. Todo abre el chat de ejemplo.
 * Con «reducir movimiento» no hay animaciones (se ve todo quieto).
 */

const quieto = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const pedir = (texto: string) => `/pruebalo?pide=${encodeURIComponent(texto)}`;

/** Se marca cuando entra en la pantalla (una vez). */
function useAparece<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [visto, setVisto] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return setVisto(true);
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisto(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, visto] as const;
}

export function Etiqueta({ color, children }: { color: Color | "blanco"; children: ReactNode }) {
  const [ref, visto] = useAparece<HTMLSpanElement>();
  return (
    <span ref={ref} className="zp-etiqueta" data-color={color} data-visto={visto ? "" : undefined}>
      {children}
    </span>
  );
}

export function CajaEscribe({ idioma }: { idioma: string }) {
  const t = textosZapia(idioma);
  const [texto, setTexto] = useState("");
  const [i, setI] = useState(0);
  useEffect(() => {
    if (quieto()) {
      setTexto(t.escribe[0]);
      return;
    }
    let vivo = true;
    let n = 0;
    let modo: "escribe" | "espera" | "borra" = "escribe";
    let actual = 0;
    let reloj = 0;
    const paso = () => {
      if (!vivo) return;
      const frase = t.escribe[actual];
      if (modo === "escribe") {
        n++;
        setTexto(frase.slice(0, n));
        if (n >= frase.length) {
          modo = "espera";
          reloj = window.setTimeout(paso, 1700);
          return;
        }
        reloj = window.setTimeout(paso, 38 + Math.random() * 45);
      } else if (modo === "espera") {
        modo = "borra";
        reloj = window.setTimeout(paso, 20);
      } else {
        n = Math.max(0, n - 2);
        setTexto(frase.slice(0, n));
        if (n === 0) {
          modo = "escribe";
          actual = (actual + 1) % t.escribe.length;
          setI(actual);
          reloj = window.setTimeout(paso, 300);
          return;
        }
        reloj = window.setTimeout(paso, 16);
      }
    };
    reloj = window.setTimeout(paso, 900);
    return () => {
      vivo = false;
      window.clearTimeout(reloj);
    };
  }, [t]);
  return (
    <Link href={pedir(t.escribe[i])} className="zp-caja" aria-label={`${t.enviar}: ${t.escribe[i]}`}>
      <span className="zp-caja__mas" aria-hidden="true">
        +
      </span>
      <span className="zp-caja__texto" aria-hidden="true">
        {texto}
        <span className="zp-caja__cursor" />
      </span>
      <svg className="zp-caja__mic" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
        <rect x="9" y="3.5" width="6" height="11" rx="3" />
        <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5" />
      </svg>
      <span className="zp-caja__enviar" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5 19 5l-4.5 14-3-5.5-6.5-1Z" />
        </svg>
      </span>
    </Link>
  );
}

export function GlobosHabilidades({ idioma }: { idioma: string }) {
  const t = textosZapia(idioma);
  const total = t.globos.length;
  const [activo, setActivo] = useState(0);
  useEffect(() => {
    if (quieto()) return;
    const r = window.setInterval(() => setActivo((a) => (a + 1) % total), 2600);
    return () => window.clearInterval(r);
  }, [total]);
  return (
    <div className="zp-globos" aria-hidden="true">
      {t.globos.map((g, k) => {
        // Lugar relativo al encendido: -1 arriba (de vidrio), 0 encendido, 1 abajo (de vidrio), los demás escondidos
        let lugar = (k - activo + total) % total;
        if (lugar > total / 2) lugar -= total;
        return (
          <div key={g.texto} className="zp-globo" data-color={g.color} data-lugar={lugar} style={{ "--lugar": lugar } as CSSProperties}>
            <span className="zp-globo__quien">{g.quien}</span>
            <span className="zp-globo__texto">{g.texto}</span>
            <span className="zp-globo__boton">
              {t.pidesela}
              <span aria-hidden="true">→</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Un ángulo que parece al azar pero no cambia entre el servidor y el navegador. */
const giro = (k: number) => [-2.4, 1.6, -1.1, 2.2, -1.8, 1.2][k % 6];

export function Ideas({ idioma }: { idioma: string }) {
  const t = textosZapia(idioma).ideas;
  const [cat, setCat] = useState(0);
  const [reparto, setReparto] = useState(0);
  const [suerte, setSuerte] = useState(0);
  const [volteando, setVolteando] = useState(false);
  const [ref, visto] = useAparece<HTMLElement>();
  const todas = t.categorias.flatMap((c) => c.ideas.map((i) => ({ ...i, color: c.color })));
  const carta = todas[(suerte * 7 + 5) % todas.length];
  const categoria = t.categorias[cat];

  const tenerSuerte = () => {
    if (quieto()) return setSuerte((s) => s + 1);
    setVolteando(true);
    window.setTimeout(() => setSuerte((s) => s + 1 + Math.floor(Math.random() * 3)), 180);
    window.setTimeout(() => setVolteando(false), 420);
  };

  return (
    <section ref={ref} className="zp-ideas" data-visto={visto ? "" : undefined} aria-labelledby="zp-ideas-titulo">
      <div className="zp-ideas__suerte">
        <Link href={pedir(carta.texto)} className="zp-carta zp-carta--suerte" data-color={carta.color} data-volteando={volteando ? "" : undefined}>
          <span className="zp-carta__texto">{carta.texto}</span>
          <Dibujo nombre={carta.dibujo} className="zp-carta__dibujo" />
          <span className="zp-carta__boton">{t.probar}</span>
        </Link>
        <button type="button" className="zp-suerte" onClick={tenerSuerte}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.5M20 4v4.5h-4.5M20 12a8 8 0 0 1-13.7 5.6L4 15.5M4 20v-4.5h4.5" />
          </svg>
          {t.suerte}
        </button>
      </div>
      <h2 id="zp-ideas-titulo" className="zp-ideas__titulo">
        {t.titulo}
      </h2>
      <p className="zp-ideas__texto">{t.texto}</p>
      <div className="zp-ideas__chips" role="tablist" aria-label={t.titulo}>
        {t.categorias.map((c, k) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={k === cat}
            className="zp-chip"
            onClick={() => {
              setCat(k);
              setReparto((r) => r + 1);
            }}
          >
            {c.nombre}
          </button>
        ))}
      </div>
      <ul key={`${cat}-${reparto}`} className="zp-ideas__cartas" role="tabpanel" aria-label={`${categoria.nombre} · ${categoria.quien}`}>
        {categoria.ideas.map((idea, k) => (
          <li key={idea.texto} style={{ "--k": k, "--giro": `${giro(k + cat)}deg` } as CSSProperties}>
            <Link href={pedir(idea.texto)} className="zp-carta" data-color={categoria.color}>
              <span className="zp-carta__texto">{idea.texto}</span>
              <Dibujo nombre={idea.dibujo} className="zp-carta__dibujo" />
              <span className="zp-carta__boton">{t.probar}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
