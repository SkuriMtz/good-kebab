"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { conTransicion, puedeTransicion, rutaPintada } from "@/lib/transiciones";

/**
 * Lleva cada cambio de página por la transición (src/lib/transiciones.ts).
 * - Enlaces y botones: <Link> y router.push/replace pasan por el mismo
 *   router de Next; aquí se envuelven push y replace, así todo cambio de
 *   ruta (la barra, el pie, el panel, después de entrar) usa la transición.
 *   Si solo cambia el #ancla o el ?parámetro, no hay transición.
 * - Atrás y adelante del navegador: se detiene el aviso "popstate" antes de
 *   que lo lea Next, se toma la foto de salida y se le vuelve a mandar.
 * Va una sola vez, en el layout raíz. No pinta nada.
 */
export function TransicionPaginas() {
  const router = useRouter();
  const ruta = usePathname();
  const actual = useRef(ruta);

  useEffect(() => {
    actual.current = ruta;
    rutaPintada(ruta);
  }, [ruta]);

  useEffect(() => {
    const r = router as { push: typeof router.push; replace: typeof router.replace };
    const push = r.push;
    const replace = r.replace;
    const otraRuta = (href: string) => {
      try {
        const url = new URL(href, window.location.href);
        return url.origin === window.location.origin && url.pathname !== actual.current;
      } catch {
        return false;
      }
    };
    r.push = (href, opciones) => {
      if (otraRuta(href)) conTransicion(actual.current, () => push(href, opciones));
      else push(href, opciones);
    };
    r.replace = (href, opciones) => {
      if (otraRuta(href)) conTransicion(actual.current, () => replace(href, opciones));
      else replace(href, opciones);
    };

    let reenviando = false;
    const alVolver = (e: PopStateEvent) => {
      if (reenviando) return;
      const estado = e.state as { __NA?: boolean } | null;
      if (!estado?.__NA || window.location.pathname === actual.current || !puedeTransicion()) return;
      e.stopImmediatePropagation();
      conTransicion(actual.current, () => {
        reenviando = true;
        try {
          window.dispatchEvent(new PopStateEvent("popstate", { state: estado }));
        } finally {
          reenviando = false;
        }
      });
    };
    // En captura: corre antes que el de Next (que escucha sin captura)
    window.addEventListener("popstate", alVolver, true);
    return () => {
      r.push = push;
      r.replace = replace;
      window.removeEventListener("popstate", alVolver, true);
    };
  }, [router]);

  return null;
}
