"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Personaje } from "@/components/agentes/Personaje";
import { AGENTE_POR_ID, type IdAgente } from "@/lib/agentes";
import { LOGO_APP } from "@/lib/conexiones/logos";
import { PERSONAJES } from "@/lib/personajes";
import { Dibujo, PersonajeEchado } from "./Dibujos";
import { contenidoMezcla } from "./textos";

/**
 * Las piezas con movimiento de la landing combinada (vista previa en /vista-zapia), con el
 * estilo de la landing de siempre. Cada una lleva la letra de su parte aprobada (B a K).
 * Todo lo que se toca abre el chat de ejemplo (/pruebalo) o una página que ya existe. Solo se
 * mueven cuando se ven; con «reducir movimiento», quietas y a la vista.
 */

const quieto = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const pedir = (texto: string) => `/pruebalo?pide=${encodeURIComponent(texto)}`;
/** El color de cada agente, como variable de CSS. */
const colorDe = (agente: IdAgente) => ({ "--mz-c": PERSONAJES[agente].color }) as CSSProperties;

/** true cuando el elemento entra en pantalla (una vez, o cada vez con `siempre`). */
function useAparece<T extends HTMLElement>(margen = "-12%", siempre = false) {
  const ref = useRef<T>(null);
  const [visto, setVisto] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return setVisto(true);
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisto(true);
          if (!siempre) io.disconnect();
        } else if (siempre) setVisto(false);
      },
      { rootMargin: `0px 0px ${margen} 0px` },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [margen, siempre]);
  return [ref, visto] as const;
}

/** K · La etiqueta ámbar de siempre, que da un brinquito al aparecer. */
export function Etiqueta({ children }: { children: ReactNode }) {
  const [ref, visto] = useAparece<HTMLParagraphElement>();
  return (
    <p ref={ref} className="ini-etiqueta mz-etiqueta" data-visto={visto ? "" : undefined}>
      {children}
    </p>
  );
}

/** B · Avisos de tu equipo que llegan uno tras otro, como notificaciones. */
export function Avisos({ idioma }: { idioma: string }) {
  const t = contenidoMezcla(idioma).avisos;
  const [ref, visto] = useAparece<HTMLUListElement>("-18%");
  return (
    <ul ref={ref} className="mz-avisos" data-visto={visto ? "" : undefined} aria-label={t.aria}>
      {t.lista.map((a, k) => (
        <li key={a.texto} className="mz-aviso" style={{ ...colorDe(a.agente), "--k": k } as CSSProperties}>
          <span className="mz-aviso__cara" aria-hidden="true">
            <Personaje agente={a.agente} avatar />
          </span>
          <span className="mz-aviso__cuerpo">
            <span className="mz-aviso__quien">
              <span>
                <b>{AGENTE_POR_ID[a.agente].nombre}</b> · Atendel
              </span>
              <time>{a.cuando}</time>
            </span>
            <span className="mz-aviso__texto">{a.texto}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** C · Cómo reparte el trabajo: tu pedido, y Atendel se lo encarga a quien le toca. Rota solo. */
export function Encargos({ idioma }: { idioma: string }) {
  const t = contenidoMezcla(idioma).encargos;
  const [ref, visto] = useAparece<HTMLDivElement>("-10%", true);
  const [escena, setEscena] = useState(0);
  const [paso, setPaso] = useState(0);
  useEffect(() => {
    if (quieto()) {
      setPaso(3);
      return;
    }
    if (!visto) return;
    const tiempos = [900, 1900, 2900, 5600];
    const relojes = tiempos.map((ms, k) =>
      window.setTimeout(() => {
        if (k < 3) setPaso(k + 1);
        else {
          setPaso(0);
          setEscena((e) => (e + 1) % t.escenas.length);
        }
      }, ms),
    );
    return () => relojes.forEach((r) => window.clearTimeout(r));
  }, [escena, visto, t.escenas.length]);
  const actual = t.escenas[escena];
  return (
    <div ref={ref} className="mz-encargos">
      <p className="ini-etiqueta">{t.etiqueta}</p>
      <div className="mz-encargos__tarjeta" key={escena}>
        <p className="mz-encargos__tu">
          <span>{t.tu}</span>
          {actual.pide}
        </p>
        <ul className="mz-encargos__lista">
          {actual.tareas.map((ta, k) => {
            const estado = paso < k + 1 ? "espera" : paso === k + 1 ? "trabajando" : "listo";
            return (
              <li key={ta.que} className="mz-encargo" data-estado={estado} style={colorDe(ta.agente)}>
                <span className="mz-encargo__cara" aria-hidden="true">
                  <Personaje agente={ta.agente} avatar />
                </span>
                <span className="mz-encargo__textos">
                  <span className="mz-encargo__quien">
                    {t.encarga} <b>{AGENTE_POR_ID[ta.agente].nombre}</b>
                  </span>
                  <span>{ta.que}</span>
                </span>
                <span className="mz-encargo__estado">
                  {estado === "listo" ? (
                    <>
                      <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="m3.5 8.5 3 3 6-7" />
                      </svg>
                      {t.listo}
                    </>
                  ) : (
                    <>
                      {t.trabajando}
                      <i aria-hidden="true" />
                    </>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/** D · Casos del día a día: la lista avanza sola (con su barrita), y al lado la plática de ejemplo. */
export function Casos({ idioma }: { idioma: string }) {
  const t = contenidoMezcla(idioma).casos;
  const [ref, visto] = useAparece<HTMLDivElement>("-15%", true);
  const [activo, setActivo] = useState(0);
  const [solo, setSolo] = useState(true);
  const [pausa, setPausa] = useState(false);
  const corre = solo && !pausa && visto;
  useEffect(() => {
    if (!corre || quieto()) return;
    const r = window.setTimeout(() => setActivo((a) => (a + 1) % t.lista.length), 5200);
    return () => window.clearTimeout(r);
  }, [activo, corre, t.lista.length]);
  const caso = t.lista[activo];
  return (
    <div ref={ref} className="mz-casos" style={colorDe(caso.agente)} onMouseEnter={() => setPausa(true)} onMouseLeave={() => setPausa(false)}>
      <ul className="mz-casos__lista" role="tablist" aria-label={t.titulo}>
        {t.lista.map((c, k) => (
          <li key={c.corto} style={colorDe(c.agente)}>
            <button
              type="button"
              role="tab"
              aria-selected={k === activo}
              className="mz-casos__opcion"
              data-corre={k === activo && corre ? "" : undefined}
              onClick={() => {
                setActivo(k);
                setSolo(false);
              }}
            >
              <span className="mz-casos__barra" aria-hidden="true" />
              {c.corto}
            </button>
          </li>
        ))}
      </ul>
      <div className="mz-casos__platica" key={`p-${activo}`} role="tabpanel" aria-label={caso.titulo}>
        <Personaje agente={caso.agente} className="mz-casos__personaje" />
        <p className="mz-burbuja mz-burbuja--tu">{caso.pide}</p>
        <p className="mz-burbuja mz-burbuja--agente">
          <span className="mz-burbuja__escribe" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="mz-burbuja__texto">{caso.responde}</span>
        </p>
      </div>
      <div className="mz-casos__texto" key={`t-${activo}`}>
        <h3 className="ini-titulo">{caso.titulo}</h3>
        <p className="ini-cuerpo">{caso.texto}</p>
        <Link href={pedir(caso.pide)} className="mz-boton">
          {t.probar}
        </Link>
      </div>
    </div>
  );
}

/** F · Qué hace en cada app: tocas una (o le pasas encima) y la tarjeta cambia. */
export function AppsQueHace({ idioma }: { idioma: string }) {
  const t = contenidoMezcla(idioma).apps;
  const [activa, setActiva] = useState(0);
  const app = t.lista[activa];
  return (
    <div className="mz-apps">
      <Etiqueta>{t.etiqueta}</Etiqueta>
      <p className="ini-cuerpo mz-apps__texto">{t.texto}</p>
      <ul className="mz-apps__chips">
        {t.lista.map((a, k) => (
          <li key={a.id}>
            <button type="button" className="mz-chip" aria-pressed={k === activa} aria-label={a.titulo} title={a.titulo} onClick={() => setActiva(k)} onMouseEnter={() => setActiva(k)} onFocus={() => setActiva(k)}>
              {/* eslint-disable-next-line @next/next/no-img-element -- logo chico y fijo */}
              <img src={LOGO_APP[a.id]} alt="" width={22} height={22} loading="lazy" />
            </button>
          </li>
        ))}
      </ul>
      <div className="mz-apps__tarjeta mz-tarjeta" key={app.id} style={colorDe(app.agente)}>
        <p className="mz-apps__titulo">
          {/* eslint-disable-next-line @next/next/no-img-element -- logo chico y fijo */}
          <img src={LOGO_APP[app.id]} alt="" width={26} height={26} />
          <span>
            {app.titulo}
            <span className="mz-apps__quien">
              <Personaje agente={app.agente} avatar className="mz-apps__cara" />
              {AGENTE_POR_ID[app.agente].nombre}
            </span>
          </span>
        </p>
        <ul className="mz-apps__cosas">
          {app.cosas.map((c, k) => (
            <li key={c} style={{ "--k": k } as CSSProperties}>
              {c}
            </li>
          ))}
        </ul>
        <p className="mz-apps__nota">{app.nota ?? t.nota}</p>
      </div>
      <Link href="/apps" className="mz-boton mz-boton--contorno">
        {t.todas}
      </Link>
    </div>
  );
}

/** Un ángulo que parece al azar pero no cambia entre el servidor y el navegador. */
const giro = (k: number) => [-1.6, 1.1, -0.8, 1.5][k % 4];

/** G · Ideas para pedirle (por agente), que se reparten; «Sorpréndeme» voltea una al azar. J · el personaje sentado en la orilla. */
export function Ideas({ idioma }: { idioma: string }) {
  const t = contenidoMezcla(idioma).ideas;
  const [ref, visto] = useAparece<HTMLDivElement>();
  const [cat, setCat] = useState(0);
  const [reparto, setReparto] = useState(0);
  const [volteada, setVolteada] = useState<number | null>(null);
  const categoria = t.categorias[cat];

  const sorprender = () => {
    const c = Math.floor(Math.random() * t.categorias.length);
    const i = Math.floor(Math.random() * t.categorias[c].ideas.length);
    if (c !== cat) {
      setCat(c);
      setReparto((r) => r + 1);
    }
    setVolteada(null);
    window.setTimeout(() => setVolteada(i), c !== cat ? 450 : 30);
  };

  return (
    <div ref={ref} className="mz-ideas" data-visto={visto ? "" : undefined}>
      <div className="mz-ideas__controles">
        <div className="mz-ideas__chips" role="tablist" aria-label={t.titulo}>
          {t.categorias.map((c, k) => (
            <button
              key={c.agente}
              type="button"
              role="tab"
              aria-selected={k === cat}
              className="mz-categoria"
              style={colorDe(c.agente)}
              onClick={() => {
                setCat(k);
                setReparto((r) => r + 1);
                setVolteada(null);
              }}
            >
              <Personaje agente={c.agente} avatar className="mz-categoria__cara" />
              {c.nombre}
            </button>
          ))}
        </div>
        <button type="button" className="mz-boton mz-boton--contorno" onClick={sorprender}>
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.5M20 4v4.5h-4.5M20 12a8 8 0 0 1-13.7 5.6L4 15.5M4 20v-4.5h4.5" />
          </svg>
          {t.sorprendeme}
        </button>
      </div>
      <div className="mz-ideas__mesa">
        <PersonajeEchado className="mz-echado" />
        <ul key={`${cat}-${reparto}`} className="mz-ideas__cartas" role="tabpanel" aria-label={categoria.nombre} style={colorDe(categoria.agente)}>
          {categoria.ideas.map((idea, k) => (
            <li key={idea.texto} style={{ "--k": k, "--giro": `${giro(k + cat)}deg` } as CSSProperties}>
              <Link href={pedir(idea.texto)} className="mz-carta mz-tarjeta" data-volteada={volteada === k ? "" : undefined}>
                <span className="mz-carta__texto">{idea.texto}</span>
                <Dibujo nombre={idea.dibujo} className="mz-carta__dibujo" />
                <span className="mz-carta__boton">
                  {t.probar}
                  <span aria-hidden="true">→</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** H · Tus permisos, app por app: los interruptores se mueven solos un rato (y se pueden tocar). */
export function Permisos({ idioma }: { idioma: string }) {
  const t = contenidoMezcla(idioma).privacidad;
  const [activos, setActivos] = useState(() => t.permisos.map((p) => p.activo));
  const [tocado, setTocado] = useState(false);
  const [ref, visto] = useAparece<HTMLDivElement>();
  useEffect(() => {
    if (!visto || tocado || quieto()) return;
    let k = 0;
    const r = window.setInterval(() => {
      setActivos((a) => a.map((v, i) => (i === (k + 2) % a.length ? !v : v)));
      k += 1;
      if (k >= 6) window.clearInterval(r);
    }, 1500);
    return () => window.clearInterval(r);
  }, [visto, tocado]);
  return (
    <div ref={ref} className="mz-permisos">
      <div className="mz-permisos__panel mz-tarjeta">
        <p className="mz-permisos__titulo">
          {t.permisosTitulo}
          <span>{t.ejemplo}</span>
        </p>
        {t.permisos.map((p, k) => (
          <div key={p.id} className="mz-permiso">
            {/* eslint-disable-next-line @next/next/no-img-element -- logo chico y fijo */}
            <img src={LOGO_APP[p.id]} alt="" width={22} height={22} loading="lazy" />
            <span className="mz-permiso__que" id={`mz-permiso-${p.id}`}>
              {p.que}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={activos[k]}
              aria-labelledby={`mz-permiso-${p.id}`}
              className="mz-interruptor"
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
      <p className="mz-permisos__globo">{t.globo}</p>
    </div>
  );
}

/** I · Las preguntas: una abierta a la vez, se abren deslizando. */
export function Preguntas({ items }: { items: { p: string; r: string }[] }) {
  const [abierta, setAbierta] = useState(0);
  return (
    <div className="mz-preguntas">
      {items.map((it, k) => (
        <div key={it.p} className="mz-pregunta" data-abierta={abierta === k ? "" : undefined}>
          <h3>
            <button type="button" id={`mz-pp-${k}`} aria-expanded={abierta === k} aria-controls={`mz-pr-${k}`} onClick={() => setAbierta((a) => (a === k ? -1 : k))}>
              {it.p}
              <span className="mz-pregunta__signo" aria-hidden="true" />
            </button>
          </h3>
          <div className="mz-pregunta__panel" id={`mz-pr-${k}`} role="region" aria-labelledby={`mz-pp-${k}`}>
            <div>
              <p>{it.r}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
