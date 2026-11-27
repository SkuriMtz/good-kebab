"use client";

import { useEffect, useRef, useState } from "react";
import { FondoFiguras } from "@/components/escena/FondoFiguras";
import { useIdioma } from "@/i18n/Idioma";
import { BotonLista } from "./BotonLista";

/**
 * El cierre del inicio al final de las demás páginas (apps, agentes, precios…): la marca de
 * Atendel hecha de fragmentos, «Tu negocio ya tiene quién atienda. Deja que Atendel lo haga.»
 * (en inglés, «Let Atendel handle it.») y el botón de la lista. La marca se arma solo cuando el
 * cierre se acerca a la pantalla, para no cargar la figura antes de tiempo.
 */
export function CierreMarca() {
  const { d } = useIdioma();
  const ref = useRef<HTMLElement>(null);
  const [cerca, setCerca] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return setCerca(true);
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setCerca(true);
          io.disconnect();
        }
      },
      { rootMargin: "400px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <section ref={ref} className="cierre-marca" aria-labelledby="cierre-marca-titulo">
      {cerca ? <FondoFiguras escena="cierre" className="cierre-marca__fondo" /> : null}
      <div className="cierre-marca__centro">
        <h2 id="cierre-marca-titulo" className="cierre-marca__texto">
          {d.inicio.cierre.linea1}
          <br />
          {d.inicio.cierre.linea2}
        </h2>
        <BotonLista />
      </div>
    </section>
  );
}
