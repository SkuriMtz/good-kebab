"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { createElement, useEffect, useRef, type ReactNode } from "react";
import { CON_MOVIMIENTO, SIN_MOVIMIENTO, esperarLetras, prepararGsap } from "@/lib/movimiento";

/**
 * El texto entra como en el video de referencia (MEDIDAS.md §7):
 * - "titulo": cada renglón vive en su ranura (overflow) y sube desde abajo,
 *   0.8 s con power3.out y 0.1 s entre renglones. Empieza cuando el título
 *   cruza el 88 % del alto de la pantalla.
 * - "parrafo": cada letra sube desde la ranura de su renglón, de izquierda
 *   a derecha (2.5 ms entre letras), y cada renglón empieza 0.1 s después
 *   del anterior. Empieza en el 82 %.
 * No se desvanece al salir: se va con el scroll.
 * Antes de que cargue JavaScript el texto se ve normal; con JavaScript se
 * esconde solo lo que todavía no entra (y si algo falla, a los 4 s aparece).
 * Con "reducir movimiento" el texto ya está. Al terminar, el texto vuelve a
 * ser texto normal (sin los span de cada letra).
 */
type Props = {
  children: ReactNode;
  tipo?: "titulo" | "parrafo";
  como?: "h1" | "h2" | "h3" | "p" | "div" | "span";
  className?: string;
  id?: string;
  /** Segundos de espera después de cruzar la línea. */
  retraso?: number;
  /** Línea de la pantalla en la que empieza (ScrollTrigger "start"). */
  inicio?: string;
};

export function TextoDala({ children, tipo = "parrafo", como = "p", className, id, retraso = 0, inicio }: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    prepararGsap();
    gsap.registerPlugin(SplitText);
    const mm = gsap.matchMedia();
    mm.add(SIN_MOVIMIENTO, () => {
      el.dataset.rt = "listo";
    });
    mm.add(CON_MOVIMIENTO, () => {
      let vivo = true;
      let split: SplitText | null = null;
      let tl: gsap.core.Timeline | null = null;
      let st: ScrollTrigger | null = null;
      esperarLetras(600).then(() => {
        if (!vivo) return;
        split = SplitText.create(el, {
          type: tipo === "titulo" ? "lines" : "lines,words,chars",
          mask: "lines",
          linesClass: "rt-linea",
          charsClass: "rt-letra",
          aria: "auto",
        });
        const lineas = split.lines as HTMLElement[];
        tl = gsap.timeline({
          paused: true,
          delay: retraso,
          onComplete: () => {
            split?.revert();
            split = null;
          },
        });
        if (tipo === "titulo") {
          gsap.set(lineas, { yPercent: 105 });
          tl.to(lineas, { yPercent: 0, duration: 0.8, ease: "power3.out", stagger: 0.1 });
        } else {
          lineas.forEach((linea, i) => {
            const letras = Array.from(linea.querySelectorAll<HTMLElement>(".rt-letra"));
            gsap.set(letras, { yPercent: 105 });
            tl!.to(letras, { yPercent: 0, duration: 0.6, ease: "expo.out", stagger: 0.0025 }, i * 0.1);
          });
        }
        el.dataset.rt = "listo";
        st = ScrollTrigger.create({
          trigger: el,
          start: inicio ?? (tipo === "titulo" ? "top 88%" : "top 82%"),
          once: true,
          onEnter: () => tl?.play(),
        });
      });
      return () => {
        vivo = false;
        st?.kill();
        tl?.kill();
        split?.revert();
        el.dataset.rt = "listo";
      };
    });
    return () => mm.revert();
  }, [tipo, retraso, inicio]);

  return createElement(como, { ref, id, className: `rt${className ? ` ${className}` : ""}` }, children);
}
