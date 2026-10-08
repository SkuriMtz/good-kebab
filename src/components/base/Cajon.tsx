"use client";

import { useEffect, useId, useRef, type PointerEvent as EventoPuntero, type ReactNode } from "react";
import { Icono } from "./Iconos";

/**
 * Cajón lateral para celular (estilo en globals.css, ".cajon"): el menú
 * lateral del dashboard en pantallas chicas.
 *
 * Es un <dialog> modal nativo: queda encima de todo (sin problemas de
 * z-index ni de barras con desenfoque), lo demás se vuelve inerte y el foco
 * se queda adentro (trampa de foco). Al cerrar, el foco vuelve a quien lo abrió.
 * - Entra deslizándose desde su orilla (0.4s, curva de entrada) con un velo
 *   detrás; sale más rápido (0.3s). Con movimiento reducido, solo un fundido.
 * - Se cierra con Esc, tocando el velo, con el botón ✕ o deslizándolo con
 *   el dedo hacia su orilla (sigue al dedo 1:1; se cierra si pasa el 30% de
 *   su ancho o si el gesto va rápido). De arriba a abajo, el contenido se desplaza.
 * - Bloquea el scroll de la página mientras está abierto.
 * - Respeta el área segura del iPhone (notch y barra de inicio).
 *
 *   const [abierto, setAbierto] = useState(false);
 *   <BotonIcono etiqueta="Abrir el menú" icono="barra-lateral" onClick={() => setAbierto(true)} aria-expanded={abierto} />
 *   <Cajon abierto={abierto} alCerrar={() => setAbierto(false)} titulo="Atendel">…menú lateral…</Cajon>
 */

/** Igual que en globals.css: --dur-grande × 0.75 (la salida). */
const DURACION_CIERRE = 300;
/** Hacia dónde se cierra (1 = derecha, −1 = izquierda). */
const SIGNO = { izquierda: -1, derecha: 1 } as const;

/** Resistencia al jalar más allá del tope (como un resorte): cuanto más jalas, menos se mueve. */
function resorte(distancia: number, dimension: number) {
  const c = 0.55;
  return (distancia * dimension * c) / (dimension + c * distancia);
}

type Arrastre = {
  id: number;
  x0: number;
  y0: number;
  activo: boolean;
  descartado: boolean;
  ultX: number;
  ultT: number;
  velocidad: number;
};

export function Cajon({
  abierto,
  alCerrar,
  etiqueta,
  titulo,
  cabeza,
  lado = "izquierda",
  className = "",
  children,
}: {
  abierto: boolean;
  alCerrar: () => void;
  /** Nombre del cajón para lectores de pantalla si no hay `titulo` o si usas `cabeza` (ej. "Menú de Atendel"). */
  etiqueta?: string;
  /** Título visible arriba (también nombra al cajón). */
  titulo?: ReactNode;
  /** Algo propio en la cabecera en vez del título (ej. el logo). */
  cabeza?: ReactNode;
  lado?: "izquierda" | "derecha";
  className?: string;
  children: ReactNode;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const velo = useRef<HTMLDivElement>(null);
  const previo = useRef<HTMLElement | null>(null);
  const temporizador = useRef<number | undefined>(undefined);
  const scrollAntes = useRef<{ overflow: string; padding: string } | null>(null);
  const arrastre = useRef<Arrastre | null>(null);
  const alCerrarRef = useRef(alCerrar);
  const idTitulo = `${useId().replace(/:/g, "")}-titulo`;

  useEffect(() => {
    alCerrarRef.current = alCerrar;
  }, [alCerrar]);

  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;

    const bloquear = () => {
      if (scrollAntes.current) return;
      const html = document.documentElement;
      const barra = window.innerWidth - html.clientWidth;
      scrollAntes.current = { overflow: html.style.overflow, padding: html.style.paddingRight };
      html.style.overflow = "hidden";
      if (barra > 0) html.style.paddingRight = `${barra}px`;
    };
    const liberar = () => {
      const antes = scrollAntes.current;
      if (!antes) return;
      const html = document.documentElement;
      html.style.overflow = antes.overflow;
      html.style.paddingRight = antes.padding;
      scrollAntes.current = null;
    };
    const limpiarArrastre = () => {
      if (panel.current) panel.current.style.transform = "";
      if (velo.current) velo.current.style.opacity = "";
    };

    if (abierto) {
      window.clearTimeout(temporizador.current);
      delete d.dataset.cerrando;
      if (!d.open) {
        previo.current = document.activeElement as HTMLElement | null;
        limpiarArrastre();
        d.showModal();
        bloquear();
        void d.offsetWidth; // fija la posición de salida antes de animar la entrada
      }
      d.dataset.abierto = "true";
      return;
    }

    if (!d.open) return;
    d.dataset.cerrando = "true";
    delete d.dataset.abierto;
    temporizador.current = window.setTimeout(() => {
      d.close();
      delete d.dataset.cerrando;
      limpiarArrastre();
      liberar();
      const volver = previo.current;
      previo.current = null;
      if (volver && document.contains(volver)) volver.focus();
    }, DURACION_CIERRE);
  }, [abierto]);

  // Si el componente se va con el cajón abierto: se libera el scroll
  useEffect(() => {
    const d = dialogo.current;
    return () => {
      window.clearTimeout(temporizador.current);
      if (d?.open) d.close();
      const antes = scrollAntes.current;
      if (antes) {
        document.documentElement.style.overflow = antes.overflow;
        document.documentElement.style.paddingRight = antes.padding;
        scrollAntes.current = null;
      }
    };
  }, []);

  /* ---------- Deslizar con el dedo para cerrar ---------- */
  const alBajar = (e: EventoPuntero<HTMLDivElement>) => {
    if (e.pointerType === "mouse" || !e.isPrimary) return;
    arrastre.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, activo: false, descartado: false, ultX: e.clientX, ultT: e.timeStamp, velocidad: 0 };
  };

  const alMover = (e: EventoPuntero<HTMLDivElement>) => {
    const a = arrastre.current;
    const p = panel.current;
    const d = dialogo.current;
    if (!a || a.id !== e.pointerId || a.descartado || !p || !d) return;
    const dx = e.clientX - a.x0;
    const dy = e.clientY - a.y0;
    if (!a.activo) {
      // Umbral de 10px antes de decidir: de lado cierra, de arriba a abajo desplaza
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
        a.descartado = true;
        return;
      }
      if (Math.abs(dx) < 10) return;
      a.activo = true;
      p.setPointerCapture(e.pointerId);
      d.dataset.arrastrando = "true";
    }
    const ancho = p.offsetWidth || 1;
    const hacia = dx * SIGNO[lado]; // > 0: hacia la orilla (cerrar)
    const mov = hacia >= 0 ? Math.min(hacia, ancho) : -resorte(-hacia, ancho);
    p.style.transform = `translateX(${mov * SIGNO[lado]}px)`;
    if (velo.current) velo.current.style.opacity = String(1 - Math.max(0, mov) / ancho);
    const dt = e.timeStamp - a.ultT;
    if (dt > 0) a.velocidad = (e.clientX - a.ultX) / dt;
    a.ultX = e.clientX;
    a.ultT = e.timeStamp;
  };

  const alSoltar = (e: EventoPuntero<HTMLDivElement>) => {
    const a = arrastre.current;
    arrastre.current = null;
    const p = panel.current;
    const d = dialogo.current;
    if (!a?.activo || !p || !d) return;
    delete d.dataset.arrastrando;
    const ancho = p.offsetWidth || 1;
    const hacia = (e.clientX - a.x0) * SIGNO[lado];
    const rapido = a.velocidad * SIGNO[lado] > 0.11; // px/ms hacia la orilla: un gesto rápido basta
    if (e.type === "pointerup" && (hacia > ancho * 0.3 || rapido)) {
      // Sale desde donde la dejó el dedo, sin regresar primero
      d.dataset.cerrando = "true";
      p.style.transform = `translateX(${SIGNO[lado] * 100}%)`;
      if (velo.current) velo.current.style.opacity = "0";
      alCerrarRef.current();
    } else {
      p.style.transform = "";
      if (velo.current) velo.current.style.opacity = "";
    }
  };

  return (
    <dialog
      ref={dialogo}
      className={`cajon${lado === "derecha" ? " cajon--derecha" : ""} ${className}`}
      aria-labelledby={titulo && !cabeza ? idTitulo : undefined}
      aria-label={titulo && !cabeza ? undefined : etiqueta}
      onCancel={(e) => {
        // Esc: se cierra con su animación
        e.preventDefault();
        alCerrarRef.current();
      }}
      onClose={() => {
        // Cerrado por el navegador sin pasar por aquí: se avisa para que el estado no quede abierto
        const d = dialogo.current;
        if (d?.dataset.abierto) {
          delete d.dataset.abierto;
          const antes = scrollAntes.current;
          if (antes) {
            document.documentElement.style.overflow = antes.overflow;
            document.documentElement.style.paddingRight = antes.padding;
            scrollAntes.current = null;
          }
          alCerrarRef.current();
        }
      }}
    >
      <div ref={velo} className="cajon__velo" onClick={() => alCerrarRef.current()} aria-hidden="true" />
      <div
        ref={panel}
        className="cajon__panel"
        onPointerDown={alBajar}
        onPointerMove={alMover}
        onPointerUp={alSoltar}
        onPointerCancel={alSoltar}
      >
        <div className="cajon__cabeza">
          {cabeza ?? (titulo ? (
            <h2 id={idTitulo} className="cajon__titulo">
              {titulo}
            </h2>
          ) : (
            <span />
          ))}
          <button
            type="button"
            className="boton-icono boton-icono--capa boton-icono--compacto"
            aria-label="Cerrar"
            onClick={() => alCerrarRef.current()}
          >
            <Icono nombre="cerrar" />
          </button>
        </div>
        <div className="cajon__cuerpo">{children}</div>
      </div>
    </dialog>
  );
}
