"use client";

import { useEffect, useRef, useState } from "react";
import { Reveal } from "./Reveal";

type Paso = { titulo: string; texto: string };

/** Lista de pasos: el que está a la mitad de la pantalla se ilumina al hacer scroll. */
export function Steps({ pasos }: { pasos: Paso[] }) {
  const [activo, setActivo] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (e.isIntersecting) setActivo(Number((e.target as HTMLElement).dataset.index));
        }
      },
      { rootMargin: "-42% 0px -42% 0px" },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <ol className="border-b hairline lg:my-[10vh]">
      {pasos.map((paso, i) => (
        <li
          key={paso.titulo}
          ref={(el) => {
            refs.current[i] = el;
          }}
          data-index={i}
          data-active={i === activo ? "true" : "false"}
          className="step border-t hairline py-10 lg:py-14"
        >
          <Reveal>
            <p className="eyebrow-plain flex items-center gap-3">
              <svg className="step__marker h-3 w-3 text-signal" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 2 20.66 17H3.34Z" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
              </svg>
              Paso {String(i + 1).padStart(2, "0")}
            </p>
            <h3 className="editorial mt-4 text-heading">{paso.titulo}</h3>
            <p className="step__text mt-4 max-w-[460px] text-body">{paso.texto}</p>
          </Reveal>
        </li>
      ))}
    </ol>
  );
}
