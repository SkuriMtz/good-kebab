"use client";

import { useEffect, useId, useRef, type PointerEvent as EventoPuntero, type ReactNode } from "react";
import { BotonIcono } from "@/components/base/Boton";

/**
 * Hoja que sube desde abajo (celular): las acciones del "+" y los avisos.
 * Es la pareja vertical del <Cajon> de la base y se porta igual:
 * - <dialog> modal: queda encima de todo, el foco se queda adentro y vuelve
 *   a quien la abrió; lo demás se vuelve inerte.
 * - Entra subiendo (0.4s, curva de entrada) y sale más rápido (0.3s), por el
 *   mismo camino. Con movimiento reducido, solo un fundido.
 * - Se cierra con Esc, tocando el velo, con ✕ o jalándola hacia abajo con el
 *   dedo: sigue al dedo 1:1 desde la manija o cuando la lista está hasta
 *   arriba; se cierra si baja más de un cuarto o si el gesto va rápido.
 *   Hacia arriba resiste como resorte.
 * - Respeta la barra de inicio del iPhone y bloquea el scroll de atrás.
 */

const DURACION_CIERRE = 300;

function resorte(distancia: number, dimension: number) {
  const c = 0.55;
  return (distancia * dimension * c) / (dimension + c * distancia);
}

type Arrastre = { id: number; y0: number; x0: number; activo: boolean; descartado: boolean; ultY: number; ultT: number; velocidad: number };

export function Hoja({
  abierta,
  alCerrar,
  titulo,
  accion,
  children,
}: {
  abierta: boolean;
  alCerrar: () => void;
  titulo: string;
  /** Algo junto al título (ej. "Marcar como leídos"). */
  accion?: ReactNode;
  children: ReactNode;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const cuerpo = useRef<HTMLDivElement>(null);
  const velo = useRef<HTMLDivElement>(null);
  const previo = useRef<HTMLElement | null>(null);
  const temporizador = useRef<number | undefined>(undefined);
  const scrollAntes = useRef<string | null>(null);
  const arrastre = useRef<Arrastre | null>(null);
  const alCerrarRef = useRef(alCerrar);
  const idTitulo = `${useId().replace(/:/g, "")}-hoja`;

  useEffect(() => {
    alCerrarRef.current = alCerrar;
  }, [alCerrar]);

  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    const limpiar = () => {
      if (panel.current) panel.current.style.transform = "";
      if (velo.current) velo.current.style.opacity = "";
    };
    if (abierta) {
      window.clearTimeout(temporizador.current);
      delete d.dataset.cerrando;
      if (!d.open) {
        previo.current = document.activeElement as HTMLElement | null;
        limpiar();
        d.showModal();
        if (scrollAntes.current === null) {
          scrollAntes.current = document.documentElement.style.overflow;
          document.documentElement.style.overflow = "hidden";
        }
        void d.offsetWidth;
      }
      d.dataset.abierta = "true";
      return;
    }
    if (!d.open) return;
    d.dataset.cerrando = "true";
    delete d.dataset.abierta;
    temporizador.current = window.setTimeout(() => {
      d.close();
      delete d.dataset.cerrando;
      limpiar();
      if (scrollAntes.current !== null) {
        document.documentElement.style.overflow = scrollAntes.current;
        scrollAntes.current = null;
      }
      const volver = previo.current;
      previo.current = null;
      if (volver && document.contains(volver)) volver.focus();
    }, DURACION_CIERRE);
  }, [abierta]);

  useEffect(() => {
    const d = dialogo.current;
    return () => {
      window.clearTimeout(temporizador.current);
      if (d?.open) d.close();
      if (scrollAntes.current !== null) {
        document.documentElement.style.overflow = scrollAntes.current;
        scrollAntes.current = null;
      }
    };
  }, []);

  /* ---------- Jalar hacia abajo para cerrar ---------- */
  const alBajar = (e: EventoPuntero<HTMLDivElement>) => {
    if (e.pointerType === "mouse" || !e.isPrimary) return;
    const desdeManija = (e.target as HTMLElement).closest("[data-manija]") !== null;
    const listaArriba = (cuerpo.current?.scrollTop ?? 0) <= 0;
    if (!desdeManija && !listaArriba) return;
    arrastre.current = { id: e.pointerId, y0: e.clientY, x0: e.clientX, activo: false, descartado: false, ultY: e.clientY, ultT: e.timeStamp, velocidad: 0 };
  };

  const alMover = (e: EventoPuntero<HTMLDivElement>) => {
    const a = arrastre.current;
    const p = panel.current;
    const d = dialogo.current;
    if (!a || a.id !== e.pointerId || a.descartado || !p || !d) return;
    const dy = e.clientY - a.y0;
    const dx = e.clientX - a.x0;
    if (!a.activo) {
      // 10px antes de decidir: hacia abajo jala la hoja; de lado o hacia arriba, la lista se desplaza
      if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
        a.descartado = true;
        return;
      }
      if (dy < 10) {
        if (dy < -10) a.descartado = true;
        return;
      }
      a.activo = true;
      p.setPointerCapture(e.pointerId);
      d.dataset.arrastrando = "true";
    }
    const alto = p.offsetHeight || 1;
    const mov = dy >= 0 ? Math.min(dy, alto) : -resorte(-dy, alto);
    p.style.transform = `translateY(${mov}px)`;
    if (velo.current) velo.current.style.opacity = String(1 - Math.max(0, mov) / alto);
    const dt = e.timeStamp - a.ultT;
    if (dt > 0) a.velocidad = (e.clientY - a.ultY) / dt;
    a.ultY = e.clientY;
    a.ultT = e.timeStamp;
  };

  const alSoltar = (e: EventoPuntero<HTMLDivElement>) => {
    const a = arrastre.current;
    arrastre.current = null;
    const p = panel.current;
    const d = dialogo.current;
    if (!a?.activo || !p || !d) return;
    delete d.dataset.arrastrando;
    const alto = p.offsetHeight || 1;
    const dy = e.clientY - a.y0;
    if (e.type === "pointerup" && (dy > alto * 0.25 || a.velocidad > 0.11)) {
      // Sale desde donde la dejó el dedo, sin regresar primero
      d.dataset.cerrando = "true";
      p.style.transform = "translateY(100%)";
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
      className="hoja"
      aria-labelledby={idTitulo}
      onCancel={(e) => {
        e.preventDefault();
        alCerrarRef.current();
      }}
      onClose={() => {
        const d = dialogo.current;
        if (d?.dataset.abierta) {
          delete d.dataset.abierta;
          if (scrollAntes.current !== null) {
            document.documentElement.style.overflow = scrollAntes.current;
            scrollAntes.current = null;
          }
          alCerrarRef.current();
        }
      }}
    >
      <div ref={velo} className="hoja__velo" aria-hidden="true" onClick={() => alCerrarRef.current()} />
      <div ref={panel} className="hoja__panel" onPointerDown={alBajar} onPointerMove={alMover} onPointerUp={alSoltar} onPointerCancel={alSoltar}>
        <div className="hoja__manija" data-manija aria-hidden="true">
          <span />
        </div>
        <div className="hoja__cabeza" data-manija>
          <h2 id={idTitulo} className="t-app-mediano">
            {titulo}
          </h2>
          <div className="hoja__acciones">
            {accion}
            <BotonIcono etiqueta="Cerrar" icono="cerrar" onClick={() => alCerrarRef.current()} />
          </div>
        </div>
        <div ref={cuerpo} className="hoja__cuerpo">
          {children}
        </div>
      </div>
    </dialog>
  );
}
