"use client";

import { useEffect } from "react";
import { FondoFiguras } from "@/components/escena/FondoFiguras";
import { ENLACES, esEscenaInicio, type EnlaceActivo, type EscenaInicio } from "@/lib/inicio";

/**
 * El fondo y la barra del inicio, según dónde va el scroll:
 * - El fondo de figuras lee solo las secciones (<section data-escena="caos">)
 *   y hace cada cambio en el mismo tramo de scroll que el video.
 * - La barra enciende su enlace (data-enlace-activo en <html>, que lee el
 *   CSS) cuando el borde de arriba de la sección cruza la línea medida en el
 *   video (ENLACES en src/lib/inicio.ts).
 * - Lee el scroll en cada cuadro del navegador: con Lenis, window.scrollY
 *   ya es el scroll suavizado, el mismo que mueve el texto.
 * - Mide las secciones al cargar, al cambiar de tamaño y cuando cargan las letras.
 */
export function FondoInicio() {
  useEffect(() => {
    const html = document.documentElement;
    let tops: Partial<Record<EscenaInicio, number>> = {};
    const medir = () => {
      const nuevos: Partial<Record<EscenaInicio, number>> = {};
      document.querySelectorAll<HTMLElement>("[data-escena]").forEach((el) => {
        const nombre = el.dataset.escena;
        if (esEscenaInicio(nombre)) nuevos[nombre] = el.getBoundingClientRect().top + window.scrollY;
      });
      tops = nuevos;
    };
    let enlace: EnlaceActivo = "";
    const revisar = () => {
      const y = window.scrollY;
      const alto = window.innerHeight;
      let nuevo: EnlaceActivo = "";
      for (const e of ENLACES) {
        const top = tops[e.bloque];
        if (top !== undefined && y + e.linea * alto >= top) nuevo = e.enlace;
      }
      if (nuevo !== enlace) {
        enlace = nuevo;
        if (enlace) html.dataset.enlaceActivo = enlace;
        else delete html.dataset.enlaceActivo;
      }
    };
    medir();
    revisar();
    let raf = 0;
    const cuadro = () => {
      revisar();
      raf = requestAnimationFrame(cuadro);
    };
    raf = requestAnimationFrame(cuadro);
    const ro = new ResizeObserver(() => {
      medir();
      revisar();
    });
    ro.observe(document.body);
    document.fonts?.ready.then(medir).catch(() => {});
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      delete html.dataset.enlaceActivo;
    };
  }, []);

  return <FondoFiguras />;
}
