"use client";

import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect } from "react";

/**
 * Scroll suave: con la rueda del mouse o el trackpad, la página se desliza y
 * frena despacio en vez de saltar.
 * - Corre en el reloj de GSAP (el mismo de la escena 3D) y le avisa a
 *   ScrollTrigger en cada movimiento.
 * - En celular se deja el scroll normal del teléfono, que ya es suave.
 * - Lo que tiene su propio scroll (el chat, las fichas, el menú) se mueve normal.
 * - Con "reducir movimiento" no se activa.
 */
export function ScrollSuave() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const lenis = new Lenis({
      lerp: 0.075,
      wheelMultiplier: 0.9,
      smoothWheel: true,
      anchors: { offset: -80 },
      allowNestedScroll: true,
      autoRaf: false,
      prevent: (nodo) => !!nodo.closest?.("dialog, .chat-app, .menu-movil, textarea, [data-lenis-prevent]"),
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
      lenis.destroy();
    };
  }, []);
  return null;
}
