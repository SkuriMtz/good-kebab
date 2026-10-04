"use client";

import { useEffect, useRef } from "react";
import { esEscena, type NombreEscena } from "./escenas";

/**
 * El fondo vivo del sitio (como el de Dala): una figura en 3D hecha de miles
 * de triangulitos de colores, dibujada con Three.js (ver motor.ts).
 * - Cada sección dice qué escena lleva: <section data-escena="globo">.
 * - GSAP ScrollTrigger avisa qué sección está en pantalla: la escena cambia
 *   cuando la siguiente sección pasa el 85% de la pantalla.
 * - Three.js se carga aparte, después de la página, para no hacerla lenta.
 * - Con "reducir movimiento" la figura cambia sin animación.
 * - Si el navegador no tiene WebGL, no hay fondo (el sitio funciona igual).
 */
export function Escena() {
  const ref = useRef<HTMLCanvasElement>(null);
  const refCaja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const caja = refCaja.current;
    if (!canvas || !caja) return;
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cancelado = false;
    let limpiar = () => {};

    (async () => {
      const [{ crearMotor }, { default: gsap }, { ScrollTrigger }] = await Promise.all([
        import("./motor"),
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelado) return;
      gsap.registerPlugin(ScrollTrigger);
      const motor = crearMotor(canvas, { quieto, claro: document.documentElement.dataset.tema === "claro" });
      if (!motor) return;

      // Qué escena toca: la última sección cuya parte de arriba ya pasó el 85% de la pantalla
      // y cuya parte de abajo todavía no sube del 35%. Si ninguna, polvo.
      let disparadores: ScrollTrigger[] = [];
      const elegir = () => {
        let nueva: NombreEscena = "polvo";
        for (const d of disparadores) {
          const nombre = (d.trigger as HTMLElement).dataset.escena;
          if (d.isActive && esEscena(nombre)) nueva = nombre;
        }
        caja.dataset.escenaActiva = nueva;
        motor.ir(nueva);
      };
      disparadores = Array.from(document.querySelectorAll<HTMLElement>("[data-escena]")).map((el) =>
        ScrollTrigger.create({ trigger: el, start: "top 85%", end: "bottom 35%", onToggle: elegir }),
      );
      ScrollTrigger.refresh();
      elegir();

      const alBajar = () => motor.dibujarUnaVez();
      if (quieto) window.addEventListener("scroll", alBajar, { passive: true });
      const moTema = new MutationObserver(() => motor.tema(document.documentElement.dataset.tema === "claro"));
      moTema.observe(document.documentElement, { attributes: true, attributeFilter: ["data-tema"] });
      canvas.dataset.lista = "true";

      limpiar = () => {
        disparadores.forEach((d) => d.kill());
        window.removeEventListener("scroll", alBajar);
        moTema.disconnect();
        motor.destruir();
      };
    })();

    return () => {
      cancelado = true;
      limpiar();
    };
  }, []);

  return (
    <div ref={refCaja} className="escena" aria-hidden="true">
      <canvas ref={ref} />
    </div>
  );
}
