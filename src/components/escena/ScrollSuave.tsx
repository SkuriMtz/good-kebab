"use client";

import Lenis from "lenis";
import { useEffect } from "react";

/**
 * Scroll suave (como en el sitio de Dala): con la rueda del mouse o el
 * trackpad, la página se desliza y frena despacio en vez de saltar.
 * - En celular se deja el scroll normal del teléfono, que ya es suave.
 * - Lo que tiene su propio scroll (el chat, las fichas, el menú) se mueve normal.
 * - Con "reducir movimiento" no se activa.
 */
export function ScrollSuave() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({
      lerp: 0.075,
      wheelMultiplier: 0.9,
      smoothWheel: true,
      anchors: { offset: -80 },
      allowNestedScroll: true,
      autoRaf: true,
      prevent: (nodo) => !!nodo.closest?.("dialog, .chat-app, .menu-movil, textarea, [data-lenis-prevent]"),
    });
    // Mientras haya una ficha abierta, la página de atrás no se mueve
    const mo = new MutationObserver(() => {
      if (document.querySelector("dialog[open]")) lenis.stop();
      else lenis.start();
    });
    mo.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["open"] });
    return () => {
      mo.disconnect();
      lenis.destroy();
    };
  }, []);
  return null;
}
