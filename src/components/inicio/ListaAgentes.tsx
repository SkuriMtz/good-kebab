"use client";

import gsap from "gsap";
import { useEffect, useRef, type ReactNode } from "react";
import { CURVA, DUR, prefiereQuieto } from "@/lib/movimiento";

/**
 * La lista de "Tu equipo" con su resaltado: una banda muy tenue detrás de la
 * fila bajo el mouse (o con el foco del teclado) que se desliza de una fila
 * a otra con gsap.quickTo, sin crear una animación nueva en cada movimiento.
 * - Aparece en su lugar (no viaja desde la fila anterior) y se apaga al salir.
 * - Con el teclado sigue al foco visible.
 * - En táctil no hay banda: la fila responde al tocarla (CSS :active).
 * - Con "reducir movimiento", la banda salta sin animación.
 * Solo se mueven transform y opacity.
 */
export function ListaAgentes({ children }: { children: ReactNode }) {
  const cajaRef = useRef<HTMLDivElement>(null);
  const bandaRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const caja = cajaRef.current;
    const banda = bandaRef.current;
    const lista = caja?.querySelector("ol");
    if (!caja || !banda || !lista) return;
    const quieto = prefiereQuieto();
    const sigue = quieto ? 0 : DUR.sigue;
    const irA = gsap.quickTo(banda, "y", { duration: sigue, ease: CURVA.entrada });
    const crecer = gsap.quickTo(banda, "scaleY", { duration: sigue, ease: CURVA.entrada });
    const ver = gsap.quickTo(banda, "opacity", { duration: quieto ? 0 : DUR.estado, ease: CURVA.estado });
    let base = 1;
    let encendida = false;

    // La banda mide lo que la primera fila; las demás la estiran apenas (scaleY), sin animar el alto
    const medir = () => {
      base = lista.querySelector("li")?.offsetHeight || 1;
      banda.style.height = `${base}px`;
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(lista);

    const resaltar = (fila: Element | null) => {
      if (!(fila instanceof HTMLElement) || !lista.contains(fila)) return;
      const y = fila.getBoundingClientRect().top - caja.getBoundingClientRect().top;
      const escala = fila.offsetHeight / base;
      if (encendida) {
        irA(y);
        crecer(escala);
      } else {
        irA(y, y);
        crecer(escala, escala);
        encendida = true;
      }
      ver(1);
    };
    const apagar = () => {
      encendida = false;
      ver(0);
    };

    const alPasar = (e: PointerEvent) => {
      if (e.pointerType === "mouse") resaltar((e.target as Element).closest("li"));
    };
    const alSalir = (e: PointerEvent) => {
      if (e.pointerType === "mouse") apagar();
    };
    const alEnfocar = (e: FocusEvent) => {
      const el = e.target as HTMLElement;
      if (el.matches(":focus-visible")) resaltar(el.closest("li"));
    };
    const alDesenfocar = (e: FocusEvent) => {
      if (!lista.contains(e.relatedTarget as Node | null)) apagar();
    };
    lista.addEventListener("pointerover", alPasar);
    lista.addEventListener("pointerleave", alSalir);
    lista.addEventListener("focusin", alEnfocar);
    lista.addEventListener("focusout", alDesenfocar);
    return () => {
      ro.disconnect();
      lista.removeEventListener("pointerover", alPasar);
      lista.removeEventListener("pointerleave", alSalir);
      lista.removeEventListener("focusin", alEnfocar);
      lista.removeEventListener("focusout", alDesenfocar);
      gsap.killTweensOf(banda);
    };
  }, []);

  return (
    <div ref={cajaRef} className="m1-lista-caja">
      <span ref={bandaRef} className="m1-resalte" aria-hidden="true" />
      {children}
    </div>
  );
}
