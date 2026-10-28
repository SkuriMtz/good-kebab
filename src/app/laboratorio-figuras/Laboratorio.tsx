"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ESCENAS_FIGURAS, FondoFiguras, type ControlFiguras, type EscenaFiguras } from "@/components/escena/FondoFiguras";
import { posicionDesdeScrollVideo } from "@/components/escena/figuras/escenas";
import { CURVA_V1, CURVA_V2, FPS_CURVA } from "./curvas";

const NOMBRES: Record<EscenaFiguras, string> = {
  portada: "Portada",
  decisiones: "Decisiones",
  caos: "Caos",
  foco: "Foco",
  globo: "Globo",
  equipo: "Equipo",
  planes: "Planes",
  cierre: "Cierre",
};

/** Scroll del video en el segundo t (interpolado). */
function scrollEn(curva: number[], t: number) {
  const k = t * FPS_CURVA;
  const i = Math.min(curva.length - 2, Math.max(0, Math.floor(k)));
  const f = Math.min(1, Math.max(0, k - i));
  return curva[i] + (curva[i + 1] - curva[i]) * f;
}

type Modo = { tipo: "escena"; escena: EscenaFiguras } | { tipo: "posicion"; p: number } | { tipo: "video"; v: 1 | 2; t0: number };

declare global {
  interface Window {
    __figuras?: {
      /** Pone la historia en P (0 a 7) de golpe. */
      irA: (P: number) => void;
      /** Corre el video v desde t0 hasta t1 en pasos de 1/60 s (para capturas). */
      video: (v: 1 | 2, t0: number, t1: number) => number;
      posicion: () => number;
    };
  }
}

export function Laboratorio() {
  const [modo, setModo] = useState<Modo>({ tipo: "escena", escena: "portada" });
  const [tiempo, setTiempo] = useState(0);
  const [claro, setClaro] = useState(false);
  const [limpio, setLimpio] = useState(false);
  const [captura, setCaptura] = useState(false);
  const control = useRef<ControlFiguras | null>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.has("captura")) setCaptura(true);
    if (q.has("limpio") || q.has("captura")) setLimpio(true);
    const p = q.get("p");
    if (p !== null) setModo({ tipo: "posicion", p: Number(p) });
  }, []);

  useEffect(() => {
    document.documentElement.dataset.tema = claro ? "claro" : "oscuro";
  }, [claro]);

  // Repetir el scroll del video en tiempo real
  useEffect(() => {
    if (modo.tipo !== "video") return;
    let raf = 0;
    const curva = modo.v === 1 ? CURVA_V1 : CURVA_V2;
    const dur = (curva.length - 1) / FPS_CURVA;
    const cuadro = () => {
      const t = (performance.now() - modo.t0) / 1000;
      setTiempo(Math.min(t, dur));
      if (t < dur) raf = requestAnimationFrame(cuadro);
    };
    raf = requestAnimationFrame(cuadro);
    return () => cancelAnimationFrame(raf);
  }, [modo]);

  // Lo que se le pide al fondo
  let escena: EscenaFiguras = "portada";
  let progreso: number | undefined;
  if (modo.tipo === "escena") escena = modo.escena;
  else {
    const P = modo.tipo === "posicion" ? modo.p : posicionDesdeScrollVideo(scrollEn(modo.v === 1 ? CURVA_V1 : CURVA_V2, tiempo));
    const i = Math.min(ESCENAS_FIGURAS.length - 1, Math.floor(P));
    escena = ESCENAS_FIGURAS[i];
    progreso = i === ESCENAS_FIGURAS.length - 1 ? 0 : P - i;
  }

  // Control a mano para las capturas (reloj manual)
  const alListo = useCallback((c: ControlFiguras) => {
    control.current = c;
    window.__figuras = {
      irA: (P: number) => {
        c.motor.posicion = P;
        c.avanzar(1 / 60, P);
      },
      video: (v, t0, t1) => {
        const curva = v === 1 ? CURVA_V1 : CURVA_V2;
        const pasos = Math.max(1, Math.round((t1 - t0) * 60));
        for (let k = 1; k <= pasos; k++) {
          const t = t0 + (k / pasos) * (t1 - t0);
          c.avanzar((t1 - t0) / pasos, posicionDesdeScrollVideo(scrollEn(curva, t)));
        }
        return c.motor.posicion;
      },
      posicion: () => c.motor.posicion,
    };
  }, []);

  useEffect(() => {
    const alTecla = (e: KeyboardEvent) => {
      if (e.key === "h" || e.key === "H") setLimpio((v) => !v);
      const n = Number(e.key);
      if (n >= 1 && n <= 8) setModo({ tipo: "escena", escena: ESCENAS_FIGURAS[n - 1] });
    };
    window.addEventListener("keydown", alTecla);
    return () => window.removeEventListener("keydown", alTecla);
  }, []);

  const posActual = modo.tipo === "posicion" ? modo.p : modo.tipo === "escena" ? ESCENAS_FIGURAS.indexOf(modo.escena) : posicionDesdeScrollVideo(scrollEn(modo.v === 1 ? CURVA_V1 : CURVA_V2, tiempo));

  return (
    <div className="lab-figuras">
      {captura ? (
        <FondoFiguras reloj="manual" escena="portada" progreso={0} alListo={alListo} />
      ) : (
        <FondoFiguras escena={escena} progreso={progreso} alListo={alListo} />
      )}
      {!limpio && (
        <div className="lab-figuras__panel" role="region" aria-label="Controles del laboratorio">
          <p className="lab-figuras__titulo">Laboratorio de figuras</p>
          <div className="lab-figuras__fila" role="group" aria-label="Escenas">
            {ESCENAS_FIGURAS.map((e, i) => (
              <button
                key={e}
                type="button"
                className="lab-figuras__boton"
                aria-pressed={modo.tipo === "escena" && modo.escena === e}
                onClick={() => setModo({ tipo: "escena", escena: e })}
              >
                <span className="lab-figuras__num">{i + 1}</span> {NOMBRES[e]}
              </button>
            ))}
          </div>
          <label className="lab-figuras__barra">
            <span>Recorrer la historia (atado al scroll)</span>
            <input
              type="range"
              min={0}
              max={7}
              step={0.001}
              value={posActual}
              onChange={(ev) => setModo({ tipo: "posicion", p: Number(ev.target.value) })}
            />
            <output className="lab-figuras__valor">{posActual.toFixed(2)}</output>
          </label>
          <div className="lab-figuras__fila">
            <button type="button" className="lab-figuras__boton" onClick={() => setModo({ tipo: "video", v: 1, t0: performance.now() })}>
              Repetir scroll del video 1
            </button>
            <button type="button" className="lab-figuras__boton" onClick={() => setModo({ tipo: "video", v: 2, t0: performance.now() })}>
              Repetir scroll del video 2
            </button>
            {modo.tipo === "video" ? <span className="lab-figuras__valor">{tiempo.toFixed(1)} s</span> : null}
            <button type="button" className="lab-figuras__boton" aria-pressed={claro} onClick={() => setClaro((v) => !v)}>
              Modo claro
            </button>
            <span className="lab-figuras__ayuda">Teclas 1–8: escenas · H: ocultar controles</span>
          </div>
        </div>
      )}
    </div>
  );
}
