"use client";

import { useEffect, useState } from "react";
import { PillLink } from "./Buttons";

/**
 * En celular: el botón "Probar Atendel" queda a la mano abajo de la pantalla
 * después de la portada, y se esconde cuando ya se ve la sección final.
 */
export function MobileCta({ ocultarEn = "empezar" }: { ocultarEn?: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let finalVisible = false;
    const final = document.getElementById(ocultarEn);
    const io = final
      ? new IntersectionObserver(([e]) => {
          finalVisible = e.isIntersecting;
          actualizar();
        })
      : null;
    if (final && io) io.observe(final);

    function actualizar() {
      setVisible(window.scrollY > window.innerHeight * 0.85 && !finalVisible);
    }
    actualizar();
    window.addEventListener("scroll", actualizar, { passive: true });
    return () => {
      window.removeEventListener("scroll", actualizar);
      io?.disconnect();
    };
  }, [ocultarEn]);

  return (
    <div
      className="mobile-cta lg:hidden"
      data-visible={visible ? "true" : "false"}
      aria-hidden={!visible}
    >
      <PillLink href="/entrar">
        Probar Atendel
      </PillLink>
    </div>
  );
}
