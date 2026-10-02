"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Arrow, Roll } from "./Buttons";
import { ParticleShape } from "./particles/ParticleShape";
import type { ShapeName } from "./particles/shapes";

type Agente = { figura: ShapeName; nombre: string; disponible: boolean; titulo: string; texto: string };

// Fragmentos en blanco con una pizca de rojo
const COLORES = ["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#d9d9d9", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ff2936"];

/**
 * Agentes como "créditos de película": una lista grande a la izquierda y a la
 * derecha una sola figura de fragmentos que cambia de forma según el agente
 * activo (al pasar el mouse, al tocar o al hacer scroll).
 */
export function Agentes({ agentes }: { agentes: Agente[] }) {
  const [activo, setActivo] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (e.isIntersecting) setActivo(Number((e.target as HTMLElement).dataset.index));
        }
      },
      { rootMargin: "-48% 0px -48% 0px" },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
      {/* La figura: fija arriba en celular, a la derecha en computadora */}
      <div className="sticky top-0 z-10 -mx-6 bg-void px-6 pb-2 pt-[72px] lg:top-[16vh] lg:order-2 lg:mx-0 lg:self-start lg:bg-transparent lg:px-0 lg:pt-0">
        <div className="relative mx-auto aspect-square w-full max-w-[210px] sm:max-w-[280px] lg:max-w-[520px]">
          <ParticleShape shape={agentes[activo].figura} colors={COLORES} className="absolute inset-0 h-full w-full" />
        </div>
      </div>

      <ol className="border-b hairline lg:order-1">
        {agentes.map((a, i) => (
          <li
            key={a.figura}
            ref={(el) => {
              refs.current[i] = el;
            }}
            data-index={i}
            data-active={i === activo ? "true" : "false"}
            className="credito border-t hairline"
            onMouseEnter={() => setActivo(i)}
          >
            <button
              type="button"
              className="flex w-full items-baseline gap-5 py-6 text-left lg:py-8"
              aria-expanded={i === activo}
              onClick={() => setActivo(i)}
            >
              <span className="font-cond text-lg tracking-[0.03em]">{String(i + 1).padStart(2, "0")}</span>
              <span className="credito__nombre editorial text-heading">{a.nombre}</span>
              <span className="ml-auto flex items-center gap-2 font-cond text-lg tracking-[0.03em]">
                {a.disponible ? <span className="h-2 w-2 animate-pulse rounded-full bg-signal" aria-hidden="true" /> : null}
                {a.disponible ? "Disponible" : "Próximamente"}
              </span>
            </button>
            <div className="grid transition-[grid-template-rows] duration-700 ease-out-expo" style={{ gridTemplateRows: i === activo ? "1fr" : "0fr" }}>
              <div className="overflow-hidden">
                <div className="pb-8 pl-[3.25rem]">
                  <p className="text-heading-2xs text-bone">{a.titulo}</p>
                  <p className="mt-3 max-w-[520px] text-body text-silver">{a.texto}</p>
                  {a.disponible ? (
                    <Link href="/entrar" className="btn-ghost mt-3" tabIndex={i === activo ? 0 : -1}>
                      <Roll>Probarlo ahora</Roll>
                      <Arrow />
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
