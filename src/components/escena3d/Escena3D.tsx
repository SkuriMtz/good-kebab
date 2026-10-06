"use client";

import { useEffect, useRef } from "react";

/**
 * El canvas fijo de la escena 3D, detrás de todo el contenido, con la
 * viñeta en las orillas. Three.js se carga aparte, después de la página.
 * Si el navegador no tiene WebGL, queda el fondo liso (el sitio funciona igual).
 *
 * variante:
 * - "historia" (por defecto, /vista-3d): la historia completa ligada al scroll
 *   (logo → cerebro → caos → burbuja → calendario), motor.ts.
 * - "portada" (inicio): solo el logo de las cuatro esferas, muy tenue, girando
 *   lento detrás del halo (portada.ts). Funciona en modo claro y oscuro.
 *   Con movimiento reducido no se monta: la portada se queda con el halo.
 *   Va dentro de una sección con clip-path, así solo se ve en la portada.
 */
export function Escena3D({ variante = "historia" }: { variante?: "historia" | "portada" } = {}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const movil = window.innerWidth < 768 || window.matchMedia("(pointer: coarse)").matches;
    if (variante === "portada" && quieto) return;
    let cancelado = false;
    let destruir = () => {};
    (async () => {
      if (variante === "portada") {
        const { crearMotorPortada } = await import("./portada");
        if (cancelado) return;
        const seccion = canvas.closest<HTMLElement>("section");
        const centro = seccion?.querySelector<HTMLElement>("[data-escena-centro]") ?? null;
        const motor = crearMotorPortada(canvas, { movil, seccion, centro });
        if (!motor) return;
        canvas.dataset.lista = "true";
        destruir = motor.destruir;
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
  }, [variante]);

  return (
    <div className={`escena3d${variante === "portada" ? " escena3d--portada" : ""}`} aria-hidden="true">
      <canvas ref={ref} />
    </div>
  );
}
