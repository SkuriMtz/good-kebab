"use client";

import { useEffect, useRef } from "react";
import { ESCENAS_FIGURAS, esEscenaFiguras, REPOSO_VIDEO, type EscenaFiguras } from "./figuras/escenas";
import { MotorFiguras } from "./figuras/motor";

export { ESCENAS_FIGURAS, type EscenaFiguras } from "./figuras/escenas";

/** Lo que el laboratorio puede manejar a mano (para comparar cuadro por cuadro con el video). */
export type ControlFiguras = {
  motor: MotorFiguras;
  /** Avanza el reloj a mano (con reloj="manual"); `objetivo` fija la posición pedida (0 a 7). */
  avanzar: (dt: number, objetivo?: number) => void;
};

type Props = {
  /**
   * La escena que toca: portada, decisiones, caos, foco, globo, equipo, planes
   * o cierre. Si no se da, el fondo la deduce solo del scroll leyendo las
   * secciones con `data-escena` (cada sección reposa cuando su borde de arriba
   * llega al borde de arriba de la pantalla).
   */
  escena?: EscenaFiguras;
  /**
   * Opcional: qué tanto se ha avanzado de esta escena hacia la siguiente (0 a 1).
   * Con él, el cambio va atado al scroll como en el video. Sin él, al cambiar
   * `escena` la figura hace el cambio sola en ~1.6 s.
   */
  progreso?: number;
  /** "manual": no corre sola; la mueve quien tenga el control (laboratorio). */
  reloj?: "auto" | "manual";
  alListo?: (c: ControlFiguras) => void;
  className?: string;
};

/** Curva en S como la del scroll del video (arranca suave, crucero y frena). */
const enS = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * t * (t * (t * 6 - 15) + 10));

/**
 * El fondo de figuras del inicio: cerebro, polvo, foco, globo y la marca de Atendel hecha de
 * triangulitos, con los mismos cambios que los videos de referencia.
 * Uso: <FondoFiguras escena="globo" /> o <FondoFiguras escena="foco" progreso={0.3} />.
 */
export function FondoFiguras({ escena, progreso, reloj = "auto", alListo, className = "" }: Props) {
  const refCaja = useRef<HTMLDivElement>(null);
  const refGl = useRef<HTMLCanvasElement>(null);
  const refLineas = useRef<HTMLCanvasElement>(null);
  const motorRef = useRef<MotorFiguras | null>(null);
  // Lo que pide la página (se lee en cada cuadro sin rehacer el efecto)
  const pedido = useRef<{ escena?: EscenaFiguras; progreso?: number }>({ escena, progreso });
  pedido.current = { escena, progreso };
  const alListoRef = useRef(alListo);
  alListoRef.current = alListo;

  useEffect(() => {
    const caja = refCaja.current;
    const canvas = refGl.current;
    const lineas = refLineas.current;
    if (!caja || !canvas || !lineas) return;
    let motor: MotorFiguras;
    try {
      motor = new MotorFiguras(canvas, lineas, { claro: document.documentElement.dataset.tema === "claro" });
    } catch {
      return; // sin WebGL: no hay fondo
    }
    motorRef.current = motor;
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const medir = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      motor.medir(w, h, Math.min(window.devicePixelRatio || 1, w < 700 ? 1.5 : 2));
    };
    medir();

    // Modo automático: posición en la historia según las secciones con data-escena
    const posicionPorScroll = (): number | null => {
      const secciones = Array.from(document.querySelectorAll<HTMLElement>("[data-escena]")).filter((el) => esEscenaFiguras(el.dataset.escena));
      if (!secciones.length) return null;
      const y = window.scrollY;
      // Ninguna escena puede reposar más abajo de donde llega el scroll (si no, la última nunca termina)
      const maximo = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const anclas = secciones
        .map((el) => ({ i: ESCENAS_FIGURAS.indexOf(el.dataset.escena as EscenaFiguras), top: Math.min(maximo, el.getBoundingClientRect().top + y) }))
        .sort((a, b) => a.top - b.top);
      if (y <= anclas[0].top) return anclas[0].i;
      const alto = window.innerHeight;
      for (let k = 0; k < anclas.length - 1; k++) {
        const a = anclas[k];
        const b = anclas[k + 1];
        if (y > b.top) continue;
        const tramo = Math.max(1, b.top - a.top);
        let f = (y - a.top) / tramo;
        // Si la sección es más alta que su tramo en el video (p. ej., Planes con tarjetas), el
        // cambio se hace en el último pedazo, del largo del video: mientras se lee, la figura
        // espera, y llega igual que en el video cuando aparece la siguiente escena.
        if (b.i === a.i + 1) {
          const tramoVideo = ((REPOSO_VIDEO[b.i] - REPOSO_VIDEO[a.i]) / 750) * alto;
          if (tramo > tramoVideo * 1.1) f = 1 - (b.top - y) / tramoVideo;
        }
        return a.i + Math.min(1, Math.max(0, f)) * (b.i - a.i);
      }
      return anclas[anclas.length - 1].i;
    };

    // Cambio solo (sin progreso): la posición pedida viaja en ~1.6 s con curva en S
    let viaje = { de: 0, a: 0, t0: 0, dur: 1.6 };
    let ultimoPedido: number | null = null;
    let ahora = 0;
    const objetivoActual = (): number => {
      const { escena: e, progreso: pr } = pedido.current;
      if (!e) return posicionPorScroll() ?? 0;
      const base = ESCENAS_FIGURAS.indexOf(e);
      if (pr !== undefined) return base + Math.min(1, Math.max(0, pr));
      if (ultimoPedido === null) {
        ultimoPedido = base;
        viaje = { de: base, a: base, t0: ahora, dur: 1.6 };
      } else if (base !== ultimoPedido) {
        const actual = viaje.de + (viaje.a - viaje.de) * enS((ahora - viaje.t0) / viaje.dur);
        viaje = { de: actual, a: base, t0: ahora, dur: 1.2 + 0.4 * Math.min(3, Math.abs(base - actual)) };
        ultimoPedido = base;
      }
      return viaje.de + (viaje.a - viaje.de) * enS((ahora - viaje.t0) / viaje.dur);
    };

    const avanzar = (dt: number, objetivo?: number) => {
      ahora += dt;
      motor.objetivo = objetivo ?? objetivoActual();
      motor.paso(dt, quieto);
      motor.dibujar();
      caja.dataset.posicion = motor.posicion.toFixed(3);
    };

    const moTema = new MutationObserver(() => {
      motor.claro = document.documentElement.dataset.tema === "claro";
    });
    moTema.observe(document.documentElement, { attributes: true, attributeFilter: ["data-tema"] });

    let raf = 0;
    let antes = 0;
    let corriendo = false;
    const cuadro = (ms: number) => {
      const dt = antes ? (ms - antes) / 1000 : 1 / 60;
      antes = ms;
      avanzar(dt);
      raf = requestAnimationFrame(cuadro);
    };
    const iniciar = () => {
      if (corriendo || reloj === "manual") return;
      corriendo = true;
      antes = 0;
      raf = requestAnimationFrame(cuadro);
    };
    const detener = () => {
      corriendo = false;
      cancelAnimationFrame(raf);
    };
    const alVisibilidad = () => (document.hidden ? detener() : iniciar());
    window.addEventListener("resize", medir);
    document.addEventListener("visibilitychange", alVisibilidad);

    // Las demás figuras se preparan cuando el navegador queda libre
    const libre = typeof window.requestIdleCallback === "function";
    const idle = libre ? window.requestIdleCallback(() => motor.prepararResto(), { timeout: 2500 }) : window.setTimeout(() => motor.prepararResto(), 1200);

    // El cerebro de malla real llega aparte (archivo de ~60 KB); mientras, hay polvo
    let vivo = true;
    motor.cargarCerebro("/figuras/cerebro.bin").then(() => {
      if (!vivo) return;
      alListoRef.current?.({ motor, avanzar });
      caja.dataset.cerebro = "true";
    });
    if (reloj === "manual") avanzar(1 / 60);
    else if (!document.hidden) iniciar();
    caja.dataset.listo = "true";

    return () => {
      vivo = false;
      if (libre) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      detener();
      moTema.disconnect();
      window.removeEventListener("resize", medir);
      document.removeEventListener("visibilitychange", alVisibilidad);
      motor.destruir();
      motorRef.current = null;
    };
  }, [reloj]);

  return (
    <div ref={refCaja} className={`escena-fondo fondo-figuras ${className}`} aria-hidden="true">
      <canvas ref={refGl} />
      <canvas ref={refLineas} />
    </div>
  );
}
