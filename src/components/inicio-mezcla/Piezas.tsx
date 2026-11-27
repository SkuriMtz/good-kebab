"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { EnlaceFicha } from "@/components/agentes/BotonFicha";
import { Personaje } from "@/components/agentes/Personaje";
import { AGENTE_POR_ID, type IdAgente } from "@/lib/agentes";
import { LOGO_APP } from "@/lib/conexiones/logos";
import type { IdApp } from "@/lib/nucleo-tipos";
import { PERSONAJES } from "@/lib/personajes";
import { contenidoMezcla } from "./textos";

/**
 * Las piezas con movimiento de la landing combinada (vista previa en /vista-zapia), con el
 * estilo de la landing de siempre: tu equipo con sus casos del día a día, la barra de apps y
 * los permisos.
 * Solo se mueven cuando se ven; con «reducir movimiento», quietas y a la vista.
 */

const quieto = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const pedir = (texto: string) => `/pruebalo?pide=${encodeURIComponent(texto)}`;
/** El color de cada agente, como variable de CSS. */
const colorDe = (agente: IdAgente) => ({ "--mz-c": PERSONAJES[agente].color }) as CSSProperties;

/** Una app de la barra, ya con sus textos en el idioma de la página. */
export type AppBarra = { id: IdApp; nombre: string; categoria: string; puede: string; agentes: IdAgente[]; pide: string };

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

/** La etiqueta ámbar de siempre, que da un brinquito al aparecer. */
export function Etiqueta({ children }: { children: ReactNode }) {
  const [ref, visto] = useAparece<HTMLParagraphElement>();
  return (
    <p ref={ref} className="ini-etiqueta mz-etiqueta" data-visto={visto ? "" : undefined}>
      {children}
    </p>
  );
}

const ORDEN: IdAgente[] = ["lola", "clara", "victor", "iris"];

/**
 * Tu equipo y lo que resuelve, en un mismo lugar: a la izquierda los cuatro agentes (con su
 * barrita que avanza sola); en medio, el agente con una plática de ejemplo; a la derecha, qué
 * resolvió, «Pruébalo» (abre el chat de prueba con ese pedido) y «Ver su ficha». Si un agente
 * tiene dos casos, pasan los dos antes de seguir con el siguiente.
 */
export function Equipo({ idioma, cargos, verFicha }: { idioma: string; cargos: Record<IdAgente, string>; verFicha: string }) {
  const t = contenidoMezcla(idioma).casos;
  const lista = ORDEN.flatMap((a) => t.lista.filter((c) => c.agente === a));
  const [ref, visto] = useAparece<HTMLDivElement>("-15%", true);
  const [activo, setActivo] = useState(0);
  const [solo, setSolo] = useState(true);
  const [pausa, setPausa] = useState(false);
  const corre = solo && !pausa && visto;
  useEffect(() => {
    if (!corre || quieto()) return;
    const r = window.setTimeout(() => setActivo((a) => (a + 1) % lista.length), 5200);
    return () => window.clearTimeout(r);
  }, [activo, corre, lista.length]);
  const caso = lista[activo];
  return (
    <div ref={ref} className="mz-casos" style={colorDe(caso.agente)} onMouseEnter={() => setPausa(true)} onMouseLeave={() => setPausa(false)}>
      <ul className="mz-casos__lista" role="tablist">
        {ORDEN.map((ag) => (
          <li key={ag} style={colorDe(ag)}>
            <button
              type="button"
              role="tab"
              aria-selected={caso.agente === ag}
              className="mz-casos__opcion"
              data-corre={caso.agente === ag && corre ? "" : undefined}
              onClick={() => {
                setActivo(lista.findIndex((c) => c.agente === ag));
                setSolo(false);
              }}
            >
              <span className="mz-casos__barra" aria-hidden="true" key={activo} />
              <Personaje agente={ag} avatar className="mz-casos__cara" />
              <span className="mz-casos__quien">
                <b>{AGENTE_POR_ID[ag].nombre}</b>
                <span>{cargos[ag]}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <div className="mz-casos__platica" key={`p-${activo}`} role="tabpanel" aria-label={`${AGENTE_POR_ID[caso.agente].nombre}: ${caso.titulo}`}>
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
        <span className="mz-casos__botones">
          <Link href={pedir(caso.pide)} className="mz-boton">
            {t.probar}
          </Link>
          <EnlaceFicha agente={caso.agente} className="mz-boton mz-boton--contorno">
            {verFicha}
          </EnlaceFicha>
        </span>
      </div>
    </div>
  );
}

/**
 * Las apps: una barra a la izquierda, de arriba abajo, con todas las apps que se conectan, que
 * sube sola despacio y nunca se detiene. La que toques muestra a la derecha qué hace Atendel en
 * ella, quién de su equipo la usa y un pedido de ejemplo (abre el chat de prueba). Las marcas
 * son de sus dueños: solo dicen con qué se conecta.
 */
export function AppsBarra({
  apps,
  etiqueta,
  titulo,
  texto,
  usa,
  pide,
}: {
  apps: AppBarra[];
  etiqueta: string;
  titulo: string;
  texto: string;
  usa: string;
  pide: string;
}) {
  const [activa, setActiva] = useState(0);
  const app = apps[activa];
  const lista = (copia: boolean) => (
    <ul className="mz-barra__lista" aria-hidden={copia || undefined}>
      {apps.map((a, k) => (
        <li key={a.id}>
          <button
            type="button"
            className="mz-barra__app"
            aria-pressed={copia ? undefined : k === activa}
            aria-label={copia ? undefined : a.nombre}
            tabIndex={copia ? -1 : undefined}
            onClick={() => setActiva(k)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- logo chico y fijo */}
            <img src={LOGO_APP[a.id]} alt="" width={26} height={26} loading="lazy" decoding="async" />
          </button>
        </li>
      ))}
    </ul>
  );
  return (
    <div className="mz-barra">
      <div className="mz-barra__ventana" aria-label={titulo} role="group">
        <div className="mz-barra__pista">
          {lista(false)}
          {lista(true)}
        </div>
      </div>
      <div className="mz-cabeza">
        <Etiqueta>{etiqueta}</Etiqueta>
        <h2 id="apps-titulo" className="ini-titulo">
          {titulo}
        </h2>
        <p className="ini-cuerpo">{texto}</p>
      </div>
      <div className="mz-barra__info" key={app.id} aria-live="polite">
        {/* eslint-disable-next-line @next/next/no-img-element -- logo chico y fijo */}
        <img src={LOGO_APP[app.id]} alt="" width={40} height={40} />
        <p className="mz-barra__nombre">{app.nombre}</p>
        <p className="mz-barra__categoria">{app.categoria}</p>
        <p className="mz-barra__puede">{app.puede}</p>
        <p className="mz-barra__usa">
          <span>{usa}</span>
          {app.agentes.map((ag) => (
            <span key={ag} className="mz-barra__agente" style={colorDe(ag)}>
              <Personaje agente={ag} avatar className="mz-barra__cara" />
              {AGENTE_POR_ID[ag].nombre}
            </span>
          ))}
        </p>
        <Link href={pedir(app.pide)} className="mz-barra__pide">
          <span>{pide}</span>«{app.pide}»<span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}

/** Tus permisos, app por app: los interruptores se mueven solos un rato (y se pueden tocar). */
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
        <p className="mz-permisos__titulo">{t.permisosTitulo}</p>
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
    </div>
  );
}
