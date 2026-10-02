"use client";

import { useEffect, useState } from "react";
import { PillLink } from "./Buttons";

/**
 * En celular: el botón "Probar Atendel" queda a la mano abajo de la pantalla
 * después de la portada. Se esconde en las secciones indicadas (por ejemplo,
 * mientras ves a los agentes trabajar, para no tapar los ejemplos).
 */
export function MobileCta({ ocultarEn = ["empezar"] }: { ocultarEn?: string[] }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const enPantalla = new Set<Element>();
    const io = new IntersectionObserver((entradas) => {
      for (const e of entradas) {
        if (e.isIntersecting) enPantalla.add(e.target);
        else enPantalla.delete(e.target);
      }
      actualizar();
    });
    for (const id of ocultarEn) {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    }

    function actualizar() {
      setVisible(window.scrollY > window.innerHeight * 0.85 && enPantalla.size === 0);
    }
    actualizar();
    window.addEventListener("scroll", actualizar, { passive: true });
    return () => {
      window.removeEventListener("scroll", actualizar);
      io.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ocultarEn.join()]);

  return (
    <div
      className="mobile-cta lg:hidden"
      data-visible={visible ? "true" : "false"}
      aria-hidden={!visible}
    >
      <PillLink href="/entrar">
        Empezar gratis
      </PillLink>
    </div>
  );
}
