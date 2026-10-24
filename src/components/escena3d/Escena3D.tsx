"use client";

import { useEffect, useRef } from "react";
import { EVENTO_TEMA } from "@/lib/tema";

/**
 * El canvas fijo de la escena 3D, detrás de todo el contenido, con la
 * viñeta en las orillas. Three.js se carga aparte, después de la página.
 * Si el navegador no tiene WebGL, queda el fondo de la portada (el sitio funciona igual).
 *
 * Modos:
 * - "historia" (por defecto): la escena completa ligada al scroll (/vista-3d).
 * - "polvo": el fondo de la portada del inicio. Polvo de estrellas casi
 *   imperceptible, con profundidad y parallax con el mouse; funciona en
 *   oscuro y en claro (lee los colores de los tokens). Con movimiento
 *   reducido no se monta: la portada se queda solo con el halo.
 * `tenue` (heredado): la historia con brillo bajo y oculta en modo claro.
 */
export function Escena3D({ tenue = false, modo = "historia" }: { tenue?: boolean; modo?: "historia" | "polvo" } = {}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const movil = window.innerWidth < 768 || window.matchMedia("(pointer: coarse)").matches;
    if (modo === "polvo" && quieto) return;
    let cancelado = false;
    let destruir = () => {};

    (async () => {
      if (modo === "polvo") {
        const { crearPolvo } = await import("./polvo");
        if (cancelado) return;
        const polvo = crearPolvo(canvas, { movil, observar: canvas.closest("section") });
        if (!polvo) return;
        canvas.dataset.lista = "true";
        // El modo claro/oscuro cambia el color y la mezcla de las partículas
        const alCambiarTema = () => polvo.recolorear();
        const cambios = new MutationObserver(alCambiarTema);
        cambios.observe(document.documentElement, { attributes: true, attributeFilter: ["data-tema"] });
        window.addEventListener(EVENTO_TEMA, alCambiarTema);
        destruir = () => {
          cambios.disconnect();
          window.removeEventListener(EVENTO_TEMA, alCambiarTema);
          polvo.destruir();
        };
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
  }, [modo]);

  const clase = ["escena3d", tenue ? "escena3d--tenue" : "", modo === "polvo" ? "escena3d--polvo" : ""].filter(Boolean).join(" ");
  return (
    <div className={clase} aria-hidden="true">
      <canvas ref={ref} />
    </div>
  );
}
