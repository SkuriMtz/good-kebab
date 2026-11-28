"use client";

import { useEffect, useRef } from "react";
import { ESCENAS_FIGURAS, esEscenaFiguras, REPOSO_VIDEO, type EscenaFiguras } from "./figuras/escenas";
import { MotorFiguras } from "./figuras/motor";
import { suave } from "./figuras/formas";
import { ChatPortada } from "./ChatPortada";

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
  /**
   * "chat" (prueba): en la portada y en decisiones, en lugar del cerebro, un chat con Atendel; al
   * bajar hacia el caos se deshace en triangulitos. "flujo" (el inicio): sin cerebro, solo polvo
   * suelto en la portada y en decisiones (el flujo de información lo dibuja FlujoInfo encima).
   * Por defecto, el cerebro.
   */
  variante?: "cerebro" | "chat" | "flujo";
  /** El idioma de los textos del chat ("es" o "en"). */
  idioma?: string;
  /** El inicio («/»): el cerebro pasa de derecha a izquierda más parejo y suave. */
  parejo?: boolean;
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
export function FondoFiguras({ escena, progreso, reloj = "auto", alListo, className = "", variante = "cerebro", idioma, parejo = false }: Props) {
  const refCaja = useRef<HTMLDivElement>(null);
  const refChat = useRef<HTMLDivElement>(null);
  const conChat = variante === "chat";
  /** Sin cerebro: el chat de prueba o el flujo de información del inicio. */
  const sinCerebro = conChat || variante === "flujo";
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
    motor.modoChat = sinCerebro;
    motor.suave = parejo;
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /**
     * El chat (variante "chat"), donde estaba el cerebro. En compu se queda quieto a la derecha y,
     * al bajar hacia decisiones, se encoge un poco y se desvanece en su lugar (sin cruzar la
     * pantalla). En celular va arriba de la portada como parte de la página (se va al bajar, sin
     * quedar detrás del texto); su alto se le pasa al CSS (--portada-chat-alto) para dejarle lugar.
     */
    let altoChat = "";
    const colocarChat = (P: number) => {
      const el = refChat.current;
      if (!el) return;
      const W = caja.clientWidth || window.innerWidth;
      const H = caja.clientHeight || window.innerHeight;
      const cw = el.offsetWidth;
      const ch = el.offsetHeight;
      let cx: number;
      let cy: number;
      let esc: number;
      let ver = 1;
      if (W < 900) {
        esc = Math.min((W - 40) / cw, 0.8);
        cx = W / 2;
        cy = 72 + (ch * esc) / 2 - window.scrollY;
        ver = cy + (ch * esc) / 2 < 0 ? 0 : 1;
        const alto = `${Math.round(ch * esc)}px`;
        if (altoChat !== alto) {
          altoChat = alto;
          document.documentElement.style.setProperty("--portada-chat-alto", alto);
        }
      } else {
        const sale = suave(0.3, 0.85, P);
        cx = W * 0.765;
        cy = H * 0.54;
        esc = Math.min(1.05, (H * 0.74) / ch) * (1 - 0.12 * sale);
        ver = 1 - sale;
      }
      el.style.transform = `translate(${(cx - cw / 2).toFixed(1)}px, ${(cy - ch / 2).toFixed(1)}px) scale(${esc.toFixed(3)})`;
      el.style.opacity = ver.toFixed(3);
      el.style.visibility = ver < 0.01 ? "hidden" : "";
    };

    // El tamaño del fondo: el de su caja, que mide el alto GRANDE de la pantalla (100lvh, ver
    // globals.css). En el celular, al bajar se esconde la barra del navegador y cambia el alto de
    // la ventana; si eso volviera a medir el lienzo (se borra y se redibuja), la figura daba un
    // tirón justo al empezar a bajar. Solo se vuelve a medir si de verdad cambió el tamaño.
    let medida = "";
    const medir = () => {
      const w = caja.clientWidth || window.innerWidth;
      const h = caja.clientHeight || window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, w < 700 ? 1.5 : 2);
      const nueva = `${w}x${h}@${dpr}`;
      if (nueva === medida) return;
      medida = nueva;
      motor.medir(w, h, dpr);
    };
    medir();

    // Dónde empieza cada escena: se mide una vez (y al cambiar el tamaño de la página), no en
    // cada cuadro; en cada cuadro solo se lee el scroll
    let anclas: { i: number; top: number }[] = [];
    let alto = caja.clientHeight || window.innerHeight;
    const medirAnclas = () => {
      const y = window.scrollY;
      // Ninguna escena puede reposar más abajo de donde llega el scroll (si no, la última nunca termina)
      const maximo = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      anclas = Array.from(document.querySelectorAll<HTMLElement>("[data-escena]"))
        .filter((el) => esEscenaFiguras(el.dataset.escena))
        .map((el) => ({ i: ESCENAS_FIGURAS.indexOf(el.dataset.escena as EscenaFiguras), top: Math.min(maximo, el.getBoundingClientRect().top + y) }))
        .sort((a, b) => a.top - b.top);
      alto = caja.clientHeight || window.innerHeight;
    };
    medirAnclas();
    const roPagina = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => medirAnclas());
    roPagina?.observe(document.body);

    // Modo automático: posición en la historia según las secciones con data-escena
    const posicionPorScroll = (): number | null => {
      if (!anclas.length) return null;
      const y = window.scrollY;
      if (y <= anclas[0].top) return anclas[0].i;
      for (let k = 0; k < anclas.length - 1; k++) {
        const a = anclas[k];
        const b = anclas[k + 1];
        if (y > b.top) continue;
        const tramo = Math.max(1, b.top - a.top);
        let f = (y - a.top) / tramo;
        // Si la sección es un poco más alta que su tramo en el video (p. ej., Planes con
        // tarjetas), el cambio se hace en el último pedazo, del largo del video: mientras se lee,
        // la figura espera, y llega igual que en el video cuando aparece la siguiente escena.
        // Si el tramo es mucho más largo (varias secciones sin escena propia, como Tu equipo,
        // las apps y la privacidad antes de Planes), el cambio se reparte en todo el tramo: la
        // figura sigue moviéndose con el scroll en lugar de quedarse quieta varias pantallas.
        if (b.i === a.i + 1) {
          const tramoVideo = ((REPOSO_VIDEO[b.i] - REPOSO_VIDEO[a.i]) / 750) * alto;
          if (tramo > tramoVideo * 1.1 && tramo <= tramoVideo * 2) f = 1 - (b.top - y) / tramoVideo;
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
      if (conChat) colocarChat(motor.posicion);
      // A mano (laboratorio) se dibuja una sola vez por cuadro del navegador, aunque se avance
      // muchas veces seguidas (si no, las capturas esperan cientos de dibujos atrasados)
      if (reloj !== "manual") motor.dibujar();
      else if (!dibujoPendiente)
        dibujoPendiente = requestAnimationFrame(() => {
          dibujoPendiente = 0;
          motor.dibujar();
        });
      // Para el laboratorio y las pruebas: la posición (a mano, cada cuadro; sola, cada 6) y los ms
      // de cálculo por cuadro (cada medio segundo). Escribir en la página cada cuadro cuesta.
      ++cuadros;
      if (reloj === "manual" || cuadros % 6 === 0) caja.dataset.posicion = motor.posicion.toFixed(3);
      if (cuadros % 30 === 0) caja.dataset.ms = motor.msCalculo.toFixed(2);
    };
    let cuadros = 0;
    let dibujoPendiente = 0;

    // Parallax leve con el cursor: solo donde hay mouse y sin movimiento reducido
    const conCursor = !quieto && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const alCursor = (e: PointerEvent) => {
      motor.cursor = [(e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1];
    };
    if (conCursor) window.addEventListener("pointermove", alCursor, { passive: true });

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
    const alCambiarTamano = () => {
      medir();
      medirAnclas();
    };
    window.addEventListener("resize", alCambiarTamano);
    document.addEventListener("visibilitychange", alVisibilidad);

    // Las demás figuras se preparan cuando el navegador queda libre
    const libre = typeof window.requestIdleCallback === "function";
    const idle = libre ? window.requestIdleCallback(() => motor.prepararResto(), { timeout: 2500 }) : window.setTimeout(() => motor.prepararResto(), 1200);

    // El cerebro de malla real llega aparte (archivo de ~150 KB; ~65 KB en celular); mientras, hay polvo
    let vivo = true;
    // (sin cerebro no hace falta: no se descarga)
    (sinCerebro ? Promise.resolve() : motor.cargarCerebro(motor.N < 8000 ? "/figuras/cerebro-chico.bin" : "/figuras/cerebro.bin")).then(() => {
      if (!vivo) return;
      alListoRef.current?.({ motor, avanzar });
      caja.dataset.cerebro = "true";
    });
    if (reloj === "manual") avanzar(1 / 60);
    else if (!document.hidden) iniciar();
    caja.dataset.listo = "true";

    return () => {
      vivo = false;
      if (conChat) document.documentElement.style.removeProperty("--portada-chat-alto");
      if (libre) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      detener();
      cancelAnimationFrame(dibujoPendiente);
      moTema.disconnect();
      roPagina?.disconnect();
      window.removeEventListener("resize", alCambiarTamano);
      window.removeEventListener("pointermove", alCursor);
      document.removeEventListener("visibilitychange", alVisibilidad);
      motor.destruir();
      motorRef.current = null;
    };
  }, [reloj, conChat, sinCerebro, parejo]);

  return (
    <div ref={refCaja} className={`escena-fondo fondo-figuras ${className}`} aria-hidden="true">
      <canvas ref={refGl} />
      <canvas ref={refLineas} />
      {conChat ? <ChatPortada ref={refChat} idioma={idioma} /> : null}
    </div>
  );
}
