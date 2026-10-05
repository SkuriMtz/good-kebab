"use client";

import { useEffect, useRef } from "react";

/**
 * El canvas fijo de la escena 3D, detrás de todo el contenido, con la
 * viñeta en las orillas. Three.js se carga aparte, después de la página.
 * Si el navegador no tiene WebGL, queda el fondo casi negro (el sitio funciona igual).
 * `tenue`: como fondo de la portada del inicio, con brillo bajo (lección 7) y
 * oculta en modo claro (la escena se pinta sobre negro); ahí queda solo el halo.
 */
export function Escena3D({ tenue = false }: { tenue?: boolean } = {}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let cancelado = false;
    let destruir = () => {};
    (async () => {
      const { crearMotor } = await import("./motor");
      if (cancelado) return;
      const motor = crearMotor(canvas, {
        movil: window.innerWidth < 768 || window.matchMedia("(pointer: coarse)").matches,
        quieto: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      });
      if (!motor) return;
      canvas.dataset.lista = "true";
      destruir = motor.destruir;
    })();
    return () => {
      cancelado = true;
      destruir();
    };
  }, []);

  return (
    <div className={`escena3d${tenue ? " escena3d--tenue" : ""}`} aria-hidden="true">
      <canvas ref={ref} />
    </div>
  );
}
