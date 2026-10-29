"use client";

import { useEffect, useState } from "react";
import { Personaje } from "./Personaje";
import { AGENTES_INFO, type IdAgente } from "@/lib/agentes";
import { useIdioma } from "@/i18n/Idioma";

/**
 * Fila de pestañas en píldora que se queda pegada debajo de la barra mientras
 * recorres /agentes (como la navegación local de las páginas de producto).
 * Lleva a #lola, #clara, #victor e #iris y marca en qué agente vas.
 */
export function NavAgentes() {
  const [actual, setActual] = useState<IdAgente | null>(null);
  const { d } = useIdioma();

  useEffect(() => {
    const secciones = AGENTES_INFO.map((a) => document.getElementById(a.id)).filter((s): s is HTMLElement => Boolean(s));
    const io = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) if (e.isIntersecting) setActual(e.target.id as IdAgente);
      },
      // Cuenta la sección que cruza la mitad de arriba de la pantalla
      { rootMargin: "-35% 0px -60% 0px" },
    );
    secciones.forEach((s) => io.observe(s));
    // Arriba de todo (en el encabezado) no hay ninguno marcado
    const arriba = () => {
      if (secciones[0] && secciones[0].getBoundingClientRect().top > window.innerHeight * 0.4) setActual(null);
    };
    window.addEventListener("scroll", arriba, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", arriba);
    };
  }, []);

  return (
    <nav className="nav-agentes" aria-label={d.paginaAgentes.irAgente}>
      <ul className="nav-agentes__lista">
        {AGENTES_INFO.map((a) => (
          <li key={a.id}>
            <a href={`#${a.id}`} className="nav-agentes__enlace" aria-current={actual === a.id ? "true" : undefined}>
              <Personaje agente={a.id} avatar className="nav-agentes__personaje" />
              {a.nombre}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
