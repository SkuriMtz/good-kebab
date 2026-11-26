"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from "react";
import { Personaje } from "@/components/agentes/Personaje";
import { APP_POR_ID } from "@/lib/conexiones/catalogo";
import { LOGO_APP } from "@/lib/conexiones/logos";
import { Dibujo } from "./Dibujos";
import { COLOR_DE, textosZapia, type Color } from "./textos";

/**
 * LAS PIEZAS CON MOVIMIENTO de la landing de prueba (/vista-zapia): el cuerpo
 * de Zapia (cómo se mueve cada parte) con la cabeza de Atendel (sus colores,
 * su equipo y sus fragmentos de fondo). Todo lo que se toca abre el chat de
 * ejemplo (/pruebalo). Con «reducir movimiento», todo quieto y a la vista.
 */

const quieto = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const pedir = (texto: string) => `/pruebalo?pide=${encodeURIComponent(texto)}`;

/** Se marca cuando entra en la pantalla (una vez). */
function useAparece<T extends HTMLElement>(margen = "-12%") {
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
      { rootMargin: `0px 0px ${margen} 0px` },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [margen]);
  return [ref, visto] as const;
}

/** Lo de adentro entra subiendo, uno tras otro, al llegar a la pantalla. */
export function Revela({ children, className = "", como: Como = "div" }: { children: ReactNode; className?: string; como?: ElementType }) {
  const [ref, visto] = useAparece<HTMLElement>();
  return (
    <Como ref={ref} className={`z-revela ${className}`} data-visto={visto ? "" : undefined}>
      {children}
    </Como>
  );
}

/** El globito de color con su colita (las etiquetas de cada sección). Salta al aparecer. */
export function Etiqueta({ color, children }: { color: Color | "blanco"; children: ReactNode }) {
  const [ref, visto] = useAparece<HTMLSpanElement>();
  return (
    <span ref={ref} className="z-etiqueta" data-color={color} data-visto={visto ? "" : undefined}>
      {children}
    </span>
  );
}

/** La caja del chat que escribe sola pedidos de ejemplo (y al tocarla, los abre en el chat). */
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
    <Link href={pedir(t.escribe[i])} className="z-caja" aria-label={`${t.enviar}: ${t.escribe[i]}`}>
      <span className="z-caja__mas" aria-hidden="true">
        +
      </span>
      <span className="z-caja__texto" aria-hidden="true">
        {texto}
        <span className="z-caja__cursor" />
      </span>
      <svg className="z-caja__mic" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
        <rect x="9" y="3.5" width="6" height="11" rx="3" />
        <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5" />
      </svg>
      <span className="z-caja__enviar" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" />
        </svg>
      </span>
    </Link>
  );
}

/** Los globos de pedidos que suben uno tras otro (el de en medio encendido, los demás de vidrio). */
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
    <div className="z-globos" aria-hidden="true">
      {t.globos.map((g, k) => {
        let lugar = (k - activo + total) % total;
        if (lugar > total / 2) lugar -= total;
        return (
          <div key={g.texto} className="z-globo" data-color={g.color} data-lugar={lugar} style={{ "--lugar": lugar } as CSSProperties}>
            <span className="z-globo__quien">{g.quien}</span>
            <span className="z-globo__texto">{g.texto}</span>
            <span className="z-globo__boton">
              {t.pidesela}
              <span aria-hidden="true">→</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** «Para lo que de verdad importa»: la lista de casos (pasa sola), el personaje con la plática y lo que hace. */
export function CasosDeUso({ idioma }: { idioma: string }) {
  const t = textosZapia(idioma).casos;
  const [activo, setActivo] = useState(0);
  const [solo, setSolo] = useState(true);
  const [pausa, setPausa] = useState(false);
  const [ref, visto] = useAparece<HTMLDivElement>();
  const caso = t.lista[activo];
  const color = COLOR_DE[caso.agente];
  useEffect(() => {
    if (!solo || pausa || !visto || quieto()) return;
    const r = window.setTimeout(() => setActivo((a) => (a + 1) % t.lista.length), 5200);
    return () => window.clearTimeout(r);
  }, [activo, solo, pausa, visto, t.lista.length]);
  return (
    <div ref={ref} className="z-casos" data-color={color} onMouseEnter={() => setPausa(true)} onMouseLeave={() => setPausa(false)}>
      <ul className="z-casos__lista" role="tablist" aria-label={t.titulo}>
        {t.lista.map((c, k) => (
          <li key={c.corto}>
            <button
              type="button"
              role="tab"
              aria-selected={k === activo}
              className="z-casos__opcion"
              data-color={COLOR_DE[c.agente]}
              data-corre={k === activo && solo && !pausa && visto ? "" : undefined}
              onClick={() => {
                setActivo(k);
                setSolo(false);
              }}
            >
              <span className="z-casos__barra" aria-hidden="true" />
              {c.corto}
            </button>
          </li>
        ))}
      </ul>
      <div className="z-casos__visual" key={activo} role="tabpanel">
        <Personaje agente={caso.agente} className="z-casos__personaje" />
        <p className="z-burbuja z-burbuja--tu">{caso.pide}</p>
        <p className="z-burbuja z-burbuja--atendel">
          <span className="z-burbuja__escribe" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="z-burbuja__texto">{caso.responde}</span>
        </p>
      </div>
      <div className="z-casos__texto" key={`t-${activo}`}>
        <h3 className="z-casos__titulo">{caso.titulo}</h3>
        <p>{caso.texto}</p>
        <Link href={pedir(caso.pide)} className="z-boton z-boton--blanco">
          {t.probar}
        </Link>
      </div>
    </div>
  );
}

/** «Conecta lo que ya usas»: la tarjeta grande cambia con la app que tocas (o le pasas encima). */
export function Conecta({ idioma }: { idioma: string }) {
  const t = textosZapia(idioma).conecta;
  const [activa, setActiva] = useState(0);
  const app = t.apps[activa];
  return (
    <div className="z-conecta">
      <div className="z-conecta__tarjeta" data-color={COLOR_DE[app.agente]} key={app.id}>
        <p className="z-conecta__titulo">
          {/* eslint-disable-next-line @next/next/no-img-element -- logo chico y fijo */}
          <img src={LOGO_APP[app.id]} alt="" width={28} height={28} />
          {app.titulo}
        </p>
        <ol className="z-conecta__cosas">
          {app.cosas.map((c, k) => (
            <li key={c} style={{ "--k": k } as CSSProperties}>
              <span className="z-conecta__num">{String(k + 1).padStart(2, "0")}</span>
              {c}
            </li>
          ))}
        </ol>
        <p className="z-conecta__nota">
          <span aria-hidden="true">●</span>
          {app.nota ?? t.nota}
        </p>
      </div>
      <div className="z-conecta__lado">
        <p className="z-conecta__texto">{t.texto}</p>
        <ul className="z-conecta__apps">
          {t.apps.map((a, k) => (
            <li key={a.id}>
              <button type="button" className="z-chip-app" aria-pressed={k === activa} onClick={() => setActiva(k)} onMouseEnter={() => setActiva(k)} onFocus={() => setActiva(k)}>
                {/* eslint-disable-next-line @next/next/no-img-element -- logo chico y fijo */}
                <img src={LOGO_APP[a.id]} alt="" width={20} height={20} loading="lazy" />
                {APP_POR_ID[a.id]?.nombre ?? a.id}
              </button>
            </li>
          ))}
          <li className="z-conecta__mas">
            <Link href="/apps" className="z-chip-app z-chip-app--mas">
              <span aria-hidden="true">+</span>
              {t.mas}
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}

/** «Te avisa primero»: los avisos llegan uno tras otro, como notificaciones del celular. */
export function Avisos({ idioma }: { idioma: string }) {
  const t = textosZapia(idioma).avisos;
  const [ref, visto] = useAparece<HTMLUListElement>("-20%");
  return (
    <ul ref={ref} className="z-avisos" data-visto={visto ? "" : undefined}>
      {t.lista.map((a, k) => (
        <li key={a.texto} className="z-aviso" data-color={COLOR_DE[a.agente]} style={{ "--k": k } as CSSProperties}>
          <span className="z-aviso__cara" aria-hidden="true">
            <Personaje agente={a.agente} avatar />
          </span>
          <span className="z-aviso__cuerpo">
            <span className="z-aviso__quien">
              Atendel · {a.quien}
              <span className="z-aviso__cuando">{a.cuando}</span>
            </span>
            <span className="z-aviso__texto">{a.texto}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** «Tus permisos»: los interruptores se mueven solos un rato al aparecer (y se pueden tocar). */
export function Permisos({ idioma }: { idioma: string }) {
  const t = textosZapia(idioma).privacidad;
  const [activos, setActivos] = useState(() => t.permisos.map((p) => p.activo));
  const [tocado, setTocado] = useState(false);
  const [ref, visto] = useAparece<HTMLDivElement>();
  useEffect(() => {
    if (!visto || tocado || quieto()) return;
    let k = 0;
    const r = window.setInterval(() => {
      setActivos((a) => a.map((v, i) => (i === k % a.length ? !v : v)));
      k++;
      if (k >= 6) window.clearInterval(r);
    }, 1400);
    return () => window.clearInterval(r);
  }, [visto, tocado]);
  return (
    <div ref={ref} className="z-permisos">
      <div className="z-permisos__panel">
        <p className="z-permisos__titulo">{t.permisosTitulo}</p>
        {t.permisos.map((p, k) => (
          <div key={p.id} className="z-permiso">
            {/* eslint-disable-next-line @next/next/no-img-element -- logo chico y fijo */}
            <img src={LOGO_APP[p.id]} alt="" width={28} height={28} loading="lazy" />
            <span className="z-permiso__textos">
              <b>{APP_POR_ID[p.id]?.nombre ?? p.id}</b>
              <span>{p.que}</span>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={activos[k]}
              aria-label={`${APP_POR_ID[p.id]?.nombre ?? p.id}: ${p.que}`}
              className="z-interruptor"
              onClick={() => {
                setTocado(true);
                setActivos((a) => a.map((v, i) => (i === k ? !v : v)));
              }}
            >
              <span />
            </button>
          </div>
        ))}
      </div>
      <p className="z-permisos__globo" data-color="azul">
        {t.globo}
      </p>
    </div>
  );
}

/** Las preguntas: una abierta a la vez, se abren deslizando. */
export function Preguntas({ items }: { items: { p: string; r: string }[] }) {
  const [abierta, setAbierta] = useState(0);
  return (
    <div className="z-preguntas">
      {items.map((it, k) => (
        <div key={it.p} className="z-pregunta" data-abierta={abierta === k ? "" : undefined}>
          <h3>
            <button type="button" aria-expanded={abierta === k} aria-controls={`z-pr-${k}`} id={`z-pp-${k}`} onClick={() => setAbierta((a) => (a === k ? -1 : k))}>
              {it.p}
              <span className="z-pregunta__signo" aria-hidden="true" />
            </button>
          </h3>
          <div className="z-pregunta__panel" id={`z-pr-${k}`} role="region" aria-labelledby={`z-pp-${k}`}>
            <div>
              <p>{it.r}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Un ángulo que parece al azar pero no cambia entre el servidor y el navegador. */
const giro = (k: number) => [-2.4, 1.6, -1.1, 2.2, -1.8, 1.2][k % 6];

/** Las ideas: categorías, tarjetas que se reparten al cambiar y «Voy a tener suerte», que voltea una al azar. */
export function Ideas({ idioma }: { idioma: string }) {
  const t = textosZapia(idioma).ideas;
  const [cat, setCat] = useState(0);
  const [reparto, setReparto] = useState(0);
  const [suerte, setSuerte] = useState(0);
  const [volteando, setVolteando] = useState(false);
  const [ref, visto] = useAparece<HTMLDivElement>();
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
    <div ref={ref} className="z-ideas" data-visto={visto ? "" : undefined}>
      <div className="z-ideas__suerte">
        <Link href={pedir(carta.texto)} className="z-carta z-carta--suerte" data-color={carta.color} data-volteando={volteando ? "" : undefined}>
          <span className="z-carta__texto">{carta.texto}</span>
          <Dibujo nombre={carta.dibujo} className="z-carta__dibujo" />
          <span className="z-carta__boton">{t.probar}</span>
        </Link>
        <button type="button" className="z-boton z-boton--gris" onClick={tenerSuerte}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.5M20 4v4.5h-4.5M20 12a8 8 0 0 1-13.7 5.6L4 15.5M4 20v-4.5h4.5" />
          </svg>
          {t.suerte}
        </button>
      </div>
      <h2 className="z-titulo z-titulo--centro">{t.titulo(todas.length)}</h2>
      <p className="z-sub z-sub--centro">{t.texto}</p>
      <div className="z-ideas__chips" role="tablist" aria-label={t.titulo(todas.length)}>
        {t.categorias.map((c, k) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={k === cat}
            className="z-chip"
            onClick={() => {
              setCat(k);
              setReparto((r) => r + 1);
            }}
          >
            {c.nombre}
          </button>
        ))}
      </div>
      <ul key={`${cat}-${reparto}`} className="z-ideas__cartas" role="tabpanel" aria-label={`${categoria.nombre} · ${categoria.quien}`}>
        {categoria.ideas.map((idea, k) => (
          <li key={idea.texto} style={{ "--k": k, "--giro": `${giro(k + cat)}deg` } as CSSProperties}>
            <Link href={pedir(idea.texto)} className="z-carta" data-color={categoria.color}>
              <span className="z-carta__texto">{idea.texto}</span>
              <Dibujo nombre={idea.dibujo} className="z-carta__dibujo" />
              <span className="z-carta__boton">{t.probar}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
