"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { textosMezcla } from "./textos";

/**
 * A · La caja de la portada que escribe sola pedidos de ejemplo (como si alguien le estuviera
 * escribiendo a Atendel). Tocarla abre el chat de ejemplo (/pruebalo) con ese pedido ya
 * escrito. Solo escribe mientras se ve; con «reducir movimiento», queda quieta con el primero.
 */
export function CajaPide({ idioma, className = "" }: { idioma: string; className?: string }) {
  const { pidele, ejemplos } = textosMezcla(idioma);
  const ref = useRef<HTMLAnchorElement>(null);
  const [texto, setTexto] = useState("");
  const [actual, setActual] = useState(0);
  const [visible, setVisible] = useState(false);

  // Solo escribe cuando la caja está en pantalla (y la pestaña, abierta)
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return setVisible(true);
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTexto(ejemplos[0]);
      return;
    }
    if (!visible) return;
    let vivo = true;
    let reloj = 0;
    let i = actual;
    let n = 0;
    let modo: "escribe" | "borra" = "escribe";
    const paso = () => {
      if (!vivo) return;
      if (document.hidden) {
        reloj = window.setTimeout(paso, 500);
        return;
      }
      const frase = ejemplos[i];
      if (modo === "escribe") {
        n += 1;
        setTexto(frase.slice(0, n));
        if (n >= frase.length) {
          modo = "borra";
          reloj = window.setTimeout(paso, 1900);
        } else reloj = window.setTimeout(paso, 40 + Math.random() * 50);
      } else {
        n = Math.max(0, n - 2);
        setTexto(frase.slice(0, n));
        if (n === 0) {
          modo = "escribe";
          i = (i + 1) % ejemplos.length;
          setActual(i);
          reloj = window.setTimeout(paso, 350);
        } else reloj = window.setTimeout(paso, 18);
      }
    };
    reloj = window.setTimeout(paso, 700);
    return () => {
      vivo = false;
      window.clearTimeout(reloj);
    };
    // `actual` solo marca dónde retomar al volver a la pantalla
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, ejemplos]);

  const pedido = ejemplos[actual];
  return (
    <Link ref={ref} href={`/pruebalo?pide=${encodeURIComponent(pedido)}`} className={`caja-pide ${className}`} aria-label={`${pidele}: ${pedido}`}>
      <span className="caja-pide__marca" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
      <span className="caja-pide__texto" aria-hidden="true">
        {texto}
        <span className="caja-pide__cursor" />
      </span>
      <span className="caja-pide__enviar" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" />
        </svg>
      </span>
    </Link>
  );
}
