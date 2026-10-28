"use client";

import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect } from "react";
import { prefiereQuieto, prepararGsap, salidaCubica } from "@/lib/movimiento";
import { enTransicion, trasLaTransicion } from "@/lib/transiciones";

/**
 * Scroll suave: con la rueda del mouse o el trackpad, la página se desliza y
 * frena despacio en vez de saltar.
 * - Corre en el reloj de GSAP (el mismo de la escena 3D) y le avisa a
 *   ScrollTrigger en cada movimiento.
 * - Firmeza: lerp 0.1 (el valor de Lenis; el inicio usa 0.08, el del video
 *   de referencia), sin multiplicar la rueda: se
 *   siente como el scroll del sistema, solo que sin tirones.
 * - Anclas (#lista, #precios…): bajan en 1.1 s con power3.out y quedan con
 *   el margen de scroll-margin-top (la barra + 24px), que Lenis ya respeta.
 * - En celular se deja el scroll normal del teléfono (syncTouch apagado).
 * - Lo que tiene su propio scroll (el chat, las fichas, el menú) se mueve normal.
 * - Con "reducir movimiento" no se activa.
 * - Cuando cargan las letras y las imágenes, ScrollTrigger vuelve a medir (prepararGsap).
 * - Al llegar de otra página: Next ya la dejó arriba antes de la foto de
 *   llegada (sin salto visible) y, al terminar la transición, ScrollTrigger
 *   vuelve a medir una vez.
 */
export function ScrollSuave({ lerp = 0.1 }: { lerp?: number } = {}) {
  useEffect(() => {
    prepararGsap();
    if (enTransicion()) trasLaTransicion().then(() => ScrollTrigger.refresh());
    if (prefiereQuieto()) return;
    const lenis = new Lenis({
      lerp,
      wheelMultiplier: 1,
      smoothWheel: true,
      syncTouch: false,
      anchors: { duration: 1.1, easing: salidaCubica },
      allowNestedScroll: true,
      autoRaf: false,
      prevent: (nodo) => !!nodo.closest?.("dialog, .chat, textarea, [data-lenis-prevent]"),
    });
    lenis.on("scroll", ScrollTrigger.update);
    const latido = (segundos: number) => lenis.raf(segundos * 1000);
    gsap.ticker.add(latido);
    gsap.ticker.lagSmoothing(0);
    // Mientras haya una ficha abierta, la página de atrás no se mueve
    const mo = new MutationObserver(() => {
      if (document.querySelector("dialog[open]")) lenis.stop();
      else lenis.start();
    });
    mo.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["open"] });
    return () => {
      mo.disconnect();
      gsap.ticker.remove(latido);
      gsap.ticker.lagSmoothing(500, 33); // el valor de fábrica, para el panel y el chat
      lenis.destroy();
    };
  }, [lerp]);
  return null;
}
