"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

/**
 * Fila de pestañas en píldora (radio 60px, borde 1px rgba(255,255,255,0.3),
 * padding 8px 16px). La activa lleva relleno blanco y texto oscuro; el
 * relleno es un indicador que se desliza de una a otra (solo transform, 0.2s).
 *
 * Accesible: role="tablist" / "tab" / "tabpanel", una sola pestaña en el
 * orden de tabulación (la activa), flechas ← → (y ↑ ↓), Inicio y Fin.
 * En celular la fila se desliza de lado, sin barra de scroll visible, y la
 * pestaña elegida se centra sola.
 *
 * Uso:
 *   <Pestanas etiqueta="Los agentes" pestanas={[{ id: "lola", etiqueta: "Lola", adorno: <Personaje …/>, contenido: … }]} />
 * Sin `contenido`, solo es el selector: usa `activa` + `alCambiar` y pinta tú el panel
 * (dale id={idPanel(base, id)} si quieres conservar la relación accesible).
 */

// useLayoutEffect solo en el navegador (en el servidor no hay nada que medir)
const useEfectoDeMedida = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export type Pestana = {
  id: string;
  etiqueta: ReactNode;
  /** Algo pequeño antes del texto (ej. el personaje del agente, 24px). */
  adorno?: ReactNode;
  contenido?: ReactNode;
  deshabilitada?: boolean;
};

export function Pestanas({
  pestanas,
  etiqueta,
  activa: activaControlada,
  inicial,
  alCambiar,
  alineacion = "centro",
  className = "",
  classNamePanel = "",
}: {
  pestanas: Pestana[];
  /** Nombre de la fila para lectores de pantalla (aria-label). */
  etiqueta: string;
  /** Pestaña activa (modo controlado). */
  activa?: string;
  /** Pestaña activa al principio (modo libre). Por defecto, la primera. */
  inicial?: string;
  alCambiar?: (id: string) => void;
  alineacion?: "centro" | "izquierda";
  className?: string;
  classNamePanel?: string;
}) {
  const base = useId().replace(/:/g, "");
  const [libre, setLibre] = useState(inicial ?? pestanas[0]?.id);
  const activa = activaControlada ?? libre;
  const listaRef = useRef<HTMLDivElement>(null);
  const desliza = useRef<HTMLDivElement>(null);
  const indicador = useRef<HTMLSpanElement>(null);
  const previa = useRef<{ x: number; ancho: number } | null>(null);
  const [medida, setMedida] = useState(false);

  const elegir = useCallback(
    (id: string) => {
      if (activaControlada === undefined) setLibre(id);
      alCambiar?.(id);
    },
    [activaControlada, alCambiar],
  );

  // Mueve el indicador a la pestaña activa. Técnica FLIP: el ancho cambia de
  // golpe y la diferencia se compensa con scaleX, así solo se anima transform.
  const colocar = useCallback(
    (animar: boolean) => {
      const lista = listaRef.current;
      const ind = indicador.current;
      if (!lista || !ind) return;
      const tab = lista.querySelector<HTMLElement>(`[data-pestana="${CSS.escape(activa ?? "")}"]`);
      if (!tab) return;
      const x = tab.offsetLeft;
      const ancho = tab.offsetWidth;
      ind.style.width = `${ancho}px`;
      ind.style.height = `${tab.offsetHeight}px`;
      const antes = previa.current;
      if (animar && antes && antes.ancho > 0) {
        ind.dataset.anima = "false";
        ind.style.transform = `translateX(${antes.x}px) scaleX(${antes.ancho / ancho})`;
        void ind.offsetWidth; // fija el punto de partida antes de animar
        ind.dataset.anima = "true";
      }
      ind.style.transform = `translateX(${x}px)`;
      previa.current = { x, ancho };
      setMedida(true);
    },
    [activa],
  );

  useEfectoDeMedida(() => {
    colocar(previa.current !== null);
    // Centra la pestaña elegida si la fila se desliza (celular)
    const cont = desliza.current;
    const tab = listaRef.current?.querySelector<HTMLElement>(`[data-pestana="${CSS.escape(activa ?? "")}"]`);
    if (cont && tab && cont.scrollWidth > cont.clientWidth) {
      const rc = cont.getBoundingClientRect();
      const rt = tab.getBoundingClientRect();
      const destino = cont.scrollLeft + (rt.left - rc.left) + rt.width / 2 - cont.clientWidth / 2;
      const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      cont.scrollTo({ left: destino, behavior: quieto ? "auto" : "smooth" });
    }
  }, [activa, colocar]);

  // Si cambia el tamaño (fuente cargada, giro de pantalla), se vuelve a medir sin animar
  useEffect(() => {
    const lista = listaRef.current;
    if (!lista || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => colocar(false));
    ro.observe(lista);
    return () => ro.disconnect();
  }, [colocar]);

  const habilitadas = pestanas.filter((p) => !p.deshabilitada);

  const alTeclear = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = habilitadas.findIndex((p) => p.id === activa);
    let siguiente: Pestana | undefined;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") siguiente = habilitadas[(i + 1) % habilitadas.length];
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") siguiente = habilitadas[(i - 1 + habilitadas.length) % habilitadas.length];
    else if (e.key === "Home") siguiente = habilitadas[0];
    else if (e.key === "End") siguiente = habilitadas[habilitadas.length - 1];
    if (!siguiente) return;
    e.preventDefault();
    elegir(siguiente.id);
    listaRef.current?.querySelector<HTMLElement>(`[data-pestana="${CSS.escape(siguiente.id)}"]`)?.focus();
  };

  const actual = pestanas.find((p) => p.id === activa);

  return (
    <div className={`pestanas ${alineacion === "centro" ? "pestanas--centro" : "pestanas--izquierda"} ${className}`} data-medida={medida ? "" : undefined}>
      <div className="pestanas__desliza" ref={desliza}>
        <div ref={listaRef} className="pestanas__lista" role="tablist" aria-label={etiqueta} onKeyDown={alTeclear}>
          <span ref={indicador} className="pestanas__indicador" aria-hidden="true" />
          {pestanas.map((p) => {
            const seleccionada = p.id === activa;
            return (
              <button
                key={p.id}
                type="button"
                role="tab"
                id={idPestana(base, p.id)}
                data-pestana={p.id}
                className="pestanas__pestana"
                aria-selected={seleccionada}
                aria-controls={seleccionada && p.contenido !== undefined ? idPanel(base, p.id) : undefined}
                tabIndex={seleccionada ? 0 : -1}
                disabled={p.deshabilitada}
                onClick={() => elegir(p.id)}
              >
                {p.adorno ? <span className="pestanas__adorno">{p.adorno}</span> : null}
                {p.etiqueta}
              </button>
            );
          })}
        </div>
      </div>
      {actual?.contenido !== undefined ? (
        <div
          key={actual.id}
          role="tabpanel"
          id={idPanel(base, actual.id)}
          aria-labelledby={idPestana(base, actual.id)}
          tabIndex={0}
          className={`pestanas__panel ${classNamePanel}`}
        >
          {actual.contenido}
        </div>
      ) : null}
    </div>
  );
}

export const idPestana = (base: string, id: string) => `${base}-pestana-${id}`;
export const idPanel = (base: string, id: string) => `${base}-panel-${id}`;
