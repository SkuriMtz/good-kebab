"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Personaje } from "./Personaje";
import { colorAgente } from "./PiezasAgente";
import { AGENTES_INFO, type IdAgente } from "@/lib/agentes";

const useEfectoDeMedida = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Índice de /agentes: una fila de píldoras pegada arriba (debajo de la barra)
 * que lleva a la sección de cada agente (#lola, #clara, #victor, #iris) y
 * marca en cuál vas. La píldora blanca se desliza de uno a otro (solo
 * transform, 0.2s, técnica FLIP como las pestañas de la base).
 * Son enlaces (no pestañas): cada sección sigue en la página.
 */
export function IndiceAgentes() {
  const [activo, setActivo] = useState<IdAgente>(AGENTES_INFO[0].id);
  const lista = useRef<HTMLDivElement>(null);
  const indicador = useRef<HTMLSpanElement>(null);
  const previa = useRef<{ x: number; ancho: number } | null>(null);
  const desliza = useRef<HTMLDivElement>(null);
  const [medido, setMedido] = useState(false);

  // ¿Qué sección está a la vista? La que cruza la franja de arriba de la pantalla.
  useEffect(() => {
    const secciones = AGENTES_INFO.map((a) => document.getElementById(a.id)).filter(Boolean) as HTMLElement[];
    if (!secciones.length || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) if (e.isIntersecting) setActivo(e.target.id as IdAgente);
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    secciones.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  const colocar = useCallback(
    (animar: boolean) => {
      const ind = indicador.current;
      const el = lista.current?.querySelector<HTMLElement>(`[data-agente="${activo}"]`);
      if (!ind || !el) return;
      const x = el.offsetLeft;
      const ancho = el.offsetWidth;
      ind.style.width = `${ancho}px`;
      ind.style.height = `${el.offsetHeight}px`;
      const antes = previa.current;
      if (animar && antes && antes.ancho > 0) {
        ind.dataset.anima = "false";
        ind.style.transform = `translateX(${antes.x}px) scaleX(${antes.ancho / ancho})`;
        void ind.offsetWidth;
        ind.dataset.anima = "true";
      }
      ind.style.transform = `translateX(${x}px)`;
      previa.current = { x, ancho };
      setMedido(true);
    },
    [activo],
  );

  useEfectoDeMedida(() => {
    colocar(previa.current !== null);
    // En celular, la píldora activa se acomoda a la vista
    const cont = desliza.current;
    const el = lista.current?.querySelector<HTMLElement>(`[data-agente="${activo}"]`);
    if (cont && el && cont.scrollWidth > cont.clientWidth) {
      cont.scrollTo({ left: el.offsetLeft - (cont.clientWidth - el.offsetWidth) / 2, behavior: "auto" });
    }
  }, [activo, colocar]);

  useEffect(() => {
    const ul = lista.current;
    if (!ul || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => colocar(false));
    ro.observe(ul);
    return () => ro.disconnect();
  }, [colocar]);

  return (
    <nav className="indice-agentes" aria-label="Ir a un agente" data-medido={medido ? "" : undefined}>
      <div className="indice-agentes__desliza" ref={desliza}>
        <div className="indice-agentes__pista" ref={lista}>
          <span ref={indicador} className="indice-agentes__indicador" aria-hidden="true" />
          <ul className="indice-agentes__lista">
          {AGENTES_INFO.map((a) => (
            <li key={a.id}>
              <a
                href={`#${a.id}`}
                data-agente={a.id}
                className="indice-agentes__enlace"
                aria-current={activo === a.id ? "location" : undefined}
                onClick={() => setActivo(a.id)}
              >
                <span className="indice-agentes__cara" style={colorAgente(a.id)} aria-hidden="true">
                  <Personaje agente={a.id} avatar />
                </span>
                {a.nombre}
                <span className="indice-agentes__area">{a.area}</span>
              </a>
            </li>
          ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}
