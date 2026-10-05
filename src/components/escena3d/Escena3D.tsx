"use client";

import { useEffect, useRef } from "react";

/**
 * El canvas fijo de la escena 3D, detrás de todo el contenido, con la
 * viñeta en las orillas. Three.js se carga aparte, después de la página.
 * Si el navegador no tiene WebGL, queda el fondo de la sección (el sitio funciona igual).
 *
 * - Normal (`/vista-3d`): la historia completa ligada al scroll (motor.ts).
 * - `tenue` (portada del inicio): el fondo mínimo (fondo.ts): pocos
 *   tetraedros lejos del texto, brillo bajo, colores de los tokens del modo
 *   activo (sirve en oscuro y en claro). Con movimiento reducido no se monta:
 *   la portada se queda solo con el halo.
 */
export function Escena3D({ tenue = false }: { tenue?: boolean } = {}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const movil = window.innerWidth < 768 || window.matchMedia("(pointer: coarse)").matches;
    if (tenue && quieto) return;
    let cancelado = false;
    let destruir = () => {};
    (async () => {
      if (tenue) {
        const { crearFondo } = await import("./fondo");
        if (cancelado) return;
        const fondo = crearFondo(canvas, { movil });
        if (!fondo) return;
        canvas.dataset.lista = "true";
        destruir = fondo.destruir;
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
