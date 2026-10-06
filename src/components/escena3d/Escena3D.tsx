"use client";

import { useEffect, useRef } from "react";

/**
 * El canvas fijo de la escena 3D, detrás de todo el contenido, con la
 * viñeta en las orillas. Three.js se carga aparte, después de la página.
 * Si el navegador no tiene WebGL, queda el fondo (el sitio funciona igual).
 *
 * `tenue`: la escena de la portada del inicio. En lugar de la historia de
 * figuras (/vista-3d), monta el "horizonte" de partículas (horizonte.ts):
 * brillo bajo, colores de los tokens del modo actual, solo en la portada.
 * Con movimiento reducido no se monta: queda solo el halo.
 */
export function Escena3D({ tenue = false }: { tenue?: boolean } = {}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const movil = window.innerWidth < 768 || window.matchMedia("(pointer: coarse)").matches;
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (tenue && quieto) return;
    let cancelado = false;
    let destruir = () => {};
    (async () => {
      if (tenue) {
        const { crearHorizonte } = await import("./horizonte");
        if (cancelado) return;
        const zona = canvas.closest("section");
        const h = crearHorizonte(canvas, { movil, zona, fin: zona?.querySelector("[data-fin-portada]") });
        if (!h) return;
        canvas.dataset.lista = "true";
        destruir = h.destruir;
        return;
      }
      const { crearMotor } = await import("./motor");
      if (cancelado) return;
      const motor = crearMotor(canvas, { movil, quieto });
      if (!motor) return;
      canvas.dataset.lista = "true";
      destruir = motor.destruir;
    })();
    return () => {
      cancelado = true;
      destruir();
    };
  }, [tenue]);

  return (
    <div className={`escena3d${tenue ? " escena3d--tenue" : ""}`} aria-hidden="true">
      <canvas ref={ref} />
    </div>
  );
}
