"use client";

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { t, type Idioma } from "@/i18n";

/**
 * Un celular de muestra (en vez de la ventana de navegador) para enseñar una
 * conversación de ejemplo: marco con la isla de arriba, la hora, la batería y
 * la barrita de abajo; la pantalla se desliza si no cabe.
 *
 * Si le picas, sale un globito justo donde picaste y te dice algo («¡Aquí no! 👀»),
 * y el celular da un pequeño temblor (con «reducir movimiento», solo el
 * mensaje). Es de juego: no hace nada más.
 */

export function MarcoCelular({
  titulo,
  quien,
  idioma = "es",
  pantalla,
  className = "",
  children,
}: {
  titulo: string;
  quien: string;
  idioma?: Idioma;
  /** Color de la pantalla (claro: la hora y la batería se ven oscuras). Cambia con un fundido. */
  pantalla?: string;
  className?: string;
  children: ReactNode;
}) {
  const cuerpo = useRef<HTMLDivElement>(null);
  const ultimo = useRef(-1);
  const reloj = useRef<number | undefined>(undefined);
  const [aviso, setAviso] = useState<{ id: number; texto: string; x: number; y: number; abajo: boolean } | null>(null);

  useEffect(() => () => window.clearTimeout(reloj.current), []);

  const picar = (e: MouseEvent<HTMLDivElement>) => {
    const lista = t(idioma).conversacion.picar(quien);
    let i = Math.floor(Math.random() * lista.length);
    if (i === ultimo.current) i = (i + 1) % lista.length;
    ultimo.current = i;
    // El globito sale donde picaste (arriba del dedo; si es muy arriba, abajo), sin salirse del celular
    const caja = e.currentTarget.getBoundingClientRect();
    // Si el celular está achicado (el recorrido de /agentes en celular), se pasa a sus medidas reales
    const ancho = e.currentTarget.offsetWidth || caja.width;
    const k = caja.width / ancho || 1;
    const tocoX = e.clientX ? (e.clientX - caja.left) / k : ancho / 2;
    const tocoY = e.clientY ? (e.clientY - caja.top) / k : (e.currentTarget.offsetHeight || caja.height) / 2;
    const x = Math.min(Math.max(tocoX, 96), ancho - 96);
    setAviso({ id: Date.now(), texto: lista[i], x, y: tocoY, abajo: tocoY < 120 });
    window.clearTimeout(reloj.current);
    reloj.current = window.setTimeout(() => setAviso(null), 1900);
    // El temblor (se puede repetir aunque no haya terminado el anterior)
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      cuerpo.current?.animate(
        [{ transform: "rotate(0deg)" }, { transform: "rotate(-2.2deg)" }, { transform: "rotate(1.6deg)" }, { transform: "rotate(-0.8deg)" }, { transform: "rotate(0deg)" }],
        { duration: 420, easing: "cubic-bezier(0.36, 0.07, 0.19, 0.97)" },
      );
    }
  };

  return (
    <div className={`celular ${className}`} data-pintada={pantalla ? "" : undefined} style={pantalla ? ({ "--pantalla": pantalla } as CSSProperties) : undefined}>
      {/* Toda la pantalla se puede picar (de juego); se sigue pudiendo deslizar y leer igual */}
      <div ref={cuerpo} className="celular__cuerpo" role="group" aria-label={titulo} onClick={picar}>
        <div className="celular__pantalla">
          <div className="celular__estado" aria-hidden="true">
            <span>9:41</span>
            <span className="celular__iconos">
              <svg viewBox="0 0 18 12" width="18" height="12">
                <rect x="0" y="8" width="3" height="4" rx="1" />
                <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
                <rect x="10" y="3" width="3" height="9" rx="1" />
                <rect x="15" y="0" width="3" height="12" rx="1" />
              </svg>
              <svg viewBox="0 0 16 12" width="16" height="12">
                <path d="M8 2.2c2.3 0 4.4.9 6 2.4l1.3-1.4A10.3 10.3 0 0 0 8 .3 10.3 10.3 0 0 0 .7 3.2L2 4.6a8.4 8.4 0 0 1 6-2.4Zm0 3.8c1.3 0 2.5.5 3.4 1.3l1.3-1.4A6.8 6.8 0 0 0 8 4.1a6.8 6.8 0 0 0-4.7 1.8l1.3 1.4C5.5 6.5 6.7 6 8 6Zm0 3.7c.6 0 1.1.3 1.4.6L8 11.8l-1.4-1.5c.3-.3.8-.6 1.4-.6Z" />
              </svg>
              <span className="celular__bateria">
                <span />
              </span>
            </span>
          </div>
          <div className="celular__contenido">{children}</div>
          <div className="celular__barra" aria-hidden="true" />
        </div>
        <div className="celular__isla" aria-hidden="true" />
        {aviso ? (
          <div key={aviso.id} className="celular__aviso" data-abajo={aviso.abajo ? "" : undefined} style={{ left: aviso.x, top: aviso.y }} role="status">
            {aviso.texto}
          </div>
        ) : null}
      </div>
    </div>
  );
}
