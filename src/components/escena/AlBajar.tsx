"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect } from "react";
import { CON_MOVIMIENTO, CURVA, DUR, ESCALONADO, SUBIDA, prepararGsap } from "@/lib/movimiento";

/**
 * Al bajar, cada pieza (`selector`, dentro de <main>) entra una sola vez:
 * fundido y 16px hacia arriba, 0.6 s con power3.out. Las que llegan juntas
 * a la pantalla entran como grupo, con 70 ms entre una y otra
 * (ScrollTrigger.batch).
 * - Solo opacidad (no visibility): lo que todavía no entra se puede enfocar
 *   con el teclado y leer con el lector de pantalla.
 * - Al terminar se quitan los estilos en línea: manda otra vez el CSS.
 * - Con "reducir movimiento" no hace nada: todo está a la vista.
 */
export function AlBajar({ selector }: { selector: string }) {
  useEffect(() => {
    const raiz = document.getElementById("contenido");
    if (!raiz) return;
    prepararGsap();
    const mm = gsap.matchMedia();
    mm.add(
      CON_MOVIMIENTO,
      () => {
        const piezas = Array.from(raiz.querySelectorAll<HTMLElement>(selector));
        if (!piezas.length) return;
        gsap.set(piezas, { opacity: 0, y: SUBIDA });
        const disparadores = ScrollTrigger.batch(piezas, {
          start: "top 90%",
          once: true,
          interval: 0.1,
          onEnter: (lote) =>
            gsap.to(lote, {
              opacity: 1,
              y: 0,
              duration: DUR.entrada,
              ease: CURVA.entrada,
              stagger: ESCALONADO,
              overwrite: true,
              clearProps: "opacity,transform",
            }),
        });
        return () => {
          disparadores.forEach((d) => d.kill());
          gsap.set(piezas, { clearProps: "opacity,transform" });
        };
      },
      raiz,
    );
    return () => mm.revert();
  }, [selector]);
  return null;
}
