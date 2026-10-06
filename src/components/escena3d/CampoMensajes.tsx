"use client";

import { useEffect, useRef } from "react";
import { Halo } from "@/components/base/Halo";
import { EVENTO_TEMA } from "@/lib/tema";

/**
 * El fondo fijo de la portada: la escena de "los mensajes sin contestar"
 * (campo.ts) y, encima, el halo morado. Es una capa fija: el título y el
 * formulario se mueven con el scroll y el fondo se queda quieto; la sección
 * que viene después la tapa como una hoja. La portada recorta la capa
 * (clip-path) para que no se vea fuera de ella.
 *
 * - Con movimiento reducido o sin WebGL: solo el halo (el canvas nunca aparece).
 * - Three.js se carga aparte, cuando la página ya está lista.
 * - En modo claro la escena se vuelve a pintar con los tokens del claro.
 */
export function CampoMensajes() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const halo = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lienzo = canvas.current;
    const capa = halo.current;
    const portada = lienzo?.closest<HTMLElement>(".portada");
    if (!lienzo || !portada) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cancelado = false;
    let destruir = () => {};
    let recolorear = () => {};
    (async () => {
      const { crearCampo } = await import("./campo");
      if (cancelado) return;
      const campo = crearCampo(lienzo, {
        movil: window.innerWidth < 768 || window.matchMedia("(pointer: coarse)").matches,
        portada,
        halo: capa?.querySelector<HTMLElement>(".halo") ?? null,
      });
      if (!campo) return;
      lienzo.dataset.lista = "true";
      destruir = campo.destruir;
      recolorear = campo.recolorear;
    })();

    // El modo puede cambiar con el botón (evento) o desde otra pestaña (atributo)
    const alCambiarTema = () => requestAnimationFrame(() => recolorear());
    window.addEventListener(EVENTO_TEMA, alCambiarTema);
    const mo = new MutationObserver(alCambiarTema);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-tema"] });

    return () => {
      cancelado = true;
      window.removeEventListener(EVENTO_TEMA, alCambiarTema);
      mo.disconnect();
      destruir();
    };
  }, []);

  return (
    <div className="portada__fondo" aria-hidden="true">
      <canvas ref={canvas} className="portada__lienzo" />
      <div ref={halo} className="portada__halo">
        <Halo y="42%" ancho="min(1040px, 150vw)" />
      </div>
    </div>
  );
}
