"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

/** Texto que "rueda" hacia arriba al pasar el mouse (microinteracción). */
export function Roll({ children }: { children: string }) {
  return (
    <span className="roll">
      <span className="roll__a">{children}</span>
      <span className="roll__b" aria-hidden="true">
        {children}
      </span>
    </span>
  );
}

export function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg className={`arrow h-3.5 w-3.5 ${className}`} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Indicador de carga: un triángulo de la marca que gira. */
export function TriSpinner({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={`tri-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2 20.66 17H3.34Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export function TriIcon({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2 20.66 17H3.34Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Efecto "magnético": el botón se inclina ligeramente hacia el cursor.
 * Solo en computadoras con mouse y si la persona no pidió menos movimiento.
 */
export function useMagnetic<T extends HTMLElement>(fuerza = 0.28, maximo = 9) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const conMouse = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const menosMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!conMouse || menosMovimiento) return;

    let raf = 0;
    const limitar = (v: number) => Math.max(-maximo, Math.min(maximo, v));
    const mover = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = limitar((e.clientX - (r.left + r.width / 2)) * fuerza);
      const y = limitar((e.clientY - (r.top + r.height / 2)) * fuerza);
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.translate = `${x}px ${y}px`;
      });
    };
    const soltar = () => {
      cancelAnimationFrame(raf);
      el.style.translate = "0px 0px";
    };
    el.addEventListener("pointermove", mover);
    el.addEventListener("pointerleave", soltar);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", mover);
      el.removeEventListener("pointerleave", soltar);
    };
  }, [fuerza, maximo]);

  return ref;
}

/** La acción principal de cada vista: píldora violeta con efecto magnético. */
export function PillLink({
  href,
  children,
  arrow = true,
  className = "",
}: {
  href: string;
  children: string;
  arrow?: boolean;
  className?: string;
}) {
  const ref = useMagnetic<HTMLAnchorElement>();
  return (
    <Link ref={ref} href={href} className={`btn-pill ${className}`}>
      <Roll>{children}</Roll>
      {arrow ? <Arrow /> : null}
    </Link>
  );
}
