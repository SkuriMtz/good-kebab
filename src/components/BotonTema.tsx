"use client";

import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { Icono } from "./base/Iconos";
import { CLAVE_TEMA, EVENTO_TEMA, ponerTema, temaActual, type Tema } from "@/lib/tema";

/**
 * Modo claro, oscuro o "como el sistema".
 *
 * `src/lib/tema.ts` (de la base) sabe de dos modos: pinta `data-tema` antes
 * de cargar y lo guarda en `atendel-tema-v5`. Aquí se agrega la tercera
 * opción sin tocarlo: la PREFERENCIA (claro, oscuro o sistema) se guarda
 * aparte y el modo que resulta se sigue guardando en la clave de siempre,
 * así el script de antes de pintar acierta y no hay parpadeo.
 * (Pedido a la base: llevar "sistema" a tema.ts y a su script.)
 */

export type Preferencia = Tema | "sistema";

const CLAVE_PREFERENCIA = "atendel-tema-preferencia";
const EVENTO_PREFERENCIA = "atendel:tema-preferencia";
const CONSULTA_CLARO = "(prefers-color-scheme: light)";

function guardada(): Preferencia | null {
  try {
    const p = localStorage.getItem(CLAVE_PREFERENCIA);
    return p === "claro" || p === "oscuro" || p === "sistema" ? p : null;
  } catch {
    return null;
  }
}

function delSistema(): Tema {
  return window.matchMedia(CONSULTA_CLARO).matches ? "claro" : "oscuro";
}

function resolver(p: Preferencia): Tema {
  return p === "sistema" ? delSistema() : p;
}

/** La preferencia actual: la guardada o, si no hay, el modo que ya está puesto. */
export function preferenciaActual(): Preferencia {
  return guardada() ?? temaActual();
}

/** Elige claro, oscuro o sistema; avisa a todos los selectores de la página. */
export function elegirPreferencia(p: Preferencia) {
  const tema = resolver(p);
  try {
    localStorage.setItem(CLAVE_PREFERENCIA, p);
  } catch {
    // Sin almacenamiento (modo privado): igual cambia, solo no se recuerda
  }
  ponerTema(tema);
  try {
    // ponerTema no guarda si el modo ya era ese: se deja escrito para el script de antes de pintar
    localStorage.setItem(CLAVE_TEMA, tema);
  } catch {}
  window.dispatchEvent(new CustomEvent(EVENTO_PREFERENCIA, { detail: p }));
}

/** La preferencia, al día con los demás selectores y con cambios de modo hechos en otra parte (ej. el panel). */
export function usePreferenciaTema() {
  const [preferencia, setPreferencia] = useState<Preferencia | null>(null);

  useEffect(() => {
    setPreferencia(preferenciaActual());
    const alElegir = (e: Event) => setPreferencia((e as CustomEvent<Preferencia>).detail);
    // Si alguien más cambió el modo (ej. el menú del panel), esa elección manda
    const alCambiarTema = (e: Event) => {
      const tema = (e as CustomEvent<Tema>).detail;
      if (resolver(preferenciaActual()) === tema) return;
      try {
        localStorage.setItem(CLAVE_PREFERENCIA, tema);
      } catch {}
      setPreferencia(tema);
    };
    window.addEventListener(EVENTO_PREFERENCIA, alElegir);
    window.addEventListener(EVENTO_TEMA, alCambiarTema);
    return () => {
      window.removeEventListener(EVENTO_PREFERENCIA, alElegir);
      window.removeEventListener(EVENTO_TEMA, alCambiarTema);
    };
  }, []);

  return { preferencia, elegir: elegirPreferencia };
}

/**
 * Sin interfaz: si la preferencia es "sistema", sigue al teléfono o a la
 * computadora (ej. el iPhone que pasa a oscuro al anochecer). Va una vez en
 * cada página pública (Sitio.tsx).
 */
export function SincronizarTema() {
  useEffect(() => {
    const consulta = window.matchMedia(CONSULTA_CLARO);
    const aplicar = () => {
      if (guardada() === "sistema") ponerTema(delSistema());
    };
    aplicar();
    consulta.addEventListener("change", aplicar);
    return () => consulta.removeEventListener("change", aplicar);
  }, []);
  return null;
}

/** Monitor: "como el sistema" (mismo trazo y rejilla que los íconos de la base). */
function IconoSistema() {
  return (
    <svg
      className="icono"
      style={{ "--icono-tam": "var(--icono-chico)" } as CSSProperties}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="3.5" y="4.5" width="17" height="11.5" rx="2" />
      <path d="M9 20h6M12 16v4" />
    </svg>
  );
}

const OPCIONES: { id: Preferencia; etiqueta: string; corta: string }[] = [
  { id: "claro", etiqueta: "Claro", corta: "Claro" },
  { id: "oscuro", etiqueta: "Oscuro", corta: "Oscuro" },
  { id: "sistema", etiqueta: "Como el sistema", corta: "Sistema" },
];

function IconoOpcion({ id }: { id: Preferencia }) {
  if (id === "sistema") return <IconoSistema />;
  return <Icono nombre={id === "claro" ? "sol" : "luna"} tam={16} />;
}

/**
 * Selector de tres opciones (pie y menú del celular): un grupo de radios con
 * forma de píldora y una pastilla que se desliza a la opción elegida (solo
 * transform). Las flechas cambian de opción, como en cualquier grupo de radios.
 */
export function SelectorTema({ className = "", bloque = false }: { className?: string; bloque?: boolean }) {
  const { preferencia, elegir } = usePreferenciaTema();
  const id = useId().replace(/:/g, "");
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const indice = OPCIONES.findIndex((o) => o.id === preferencia);

  const mover = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const paso = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
      if (!paso) return;
      e.preventDefault();
      const j = (Math.max(indice, 0) + paso + OPCIONES.length) % OPCIONES.length;
      elegir(OPCIONES[j].id);
      refs.current[j]?.focus();
    },
    [indice, elegir],
  );

  return (
    <div className={`tema-selector${bloque ? " tema-selector--bloque" : ""} ${className}`}>
      <span id={`${id}-tema`} className="tema-selector__nombre">
        Tema
      </span>
      <div
        role="radiogroup"
        aria-labelledby={`${id}-tema`}
        className="tema-selector__grupo"
        style={{ "--i": Math.max(indice, 0) } as CSSProperties}
        data-listo={indice >= 0 ? "true" : undefined}
        onKeyDown={mover}
      >
        <span className="tema-selector__pastilla" aria-hidden="true" />
        {OPCIONES.map((o, i) => {
          const elegida = preferencia === o.id;
          return (
            <button
              key={o.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={elegida}
              aria-label={o.etiqueta}
              title={o.etiqueta}
              tabIndex={elegida || (indice < 0 && i === 1) ? 0 : -1}
              className="tema-selector__opcion"
              onClick={() => elegir(o.id)}
            >
              <IconoOpcion id={o.id} />
              <span aria-hidden="true">{o.corta}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Botón de ícono con borde para la barra (como los de la barra del
 * dashboard): cambia entre claro y oscuro de un toque. Las tres opciones
 * completas viven en el pie y en el menú del celular.
 */
export function BotonTema({ className = "" }: { className?: string }) {
  const [tema, setTema] = useState<Tema | null>(null);

  useEffect(() => {
    setTema(temaActual());
    const alCambiar = (e: Event) => setTema((e as CustomEvent<Tema>).detail);
    window.addEventListener(EVENTO_TEMA, alCambiar);
    return () => window.removeEventListener(EVENTO_TEMA, alCambiar);
  }, []);

  const siguiente: Tema = tema === "claro" ? "oscuro" : "claro";
  const etiqueta = siguiente === "claro" ? "Cambiar a modo claro" : "Cambiar a modo oscuro";

  return (
    <button
      type="button"
      className={`boton-icono boton-icono--capa boton-icono--compacto barra-sitio__icono ${className}`}
      onClick={() => elegirPreferencia(siguiente)}
      aria-label={etiqueta}
      title={etiqueta}
    >
      <Icono nombre={tema === "claro" ? "luna" : "sol"} tam={16} />
    </button>
  );
}
