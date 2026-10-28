"use client";

import { useEffect, useState } from "react";
import { FondoFiguras } from "@/components/escena/FondoFiguras";
import { CAMBIOS, ENLACES, type EnlaceActivo, type EscenaInicio } from "@/lib/inicio";

/**
 * La coreografía del inicio: según dónde va el scroll, le dice al fondo qué
 * escena toca y a la barra qué enlace se enciende (data-enlace-activo en
 * <html>, que lee el CSS de la barra).
 * - Cada cambio ocurre cuando el borde de arriba del bloque de la escena
 *   (<section data-bloque="caos">) cruza su línea (src/lib/inicio.ts).
 * - Lee el scroll en cada cuadro del navegador: con Lenis, window.scrollY
 *   ya es el scroll suavizado, el mismo que mueve el texto.
 * - Mide los bloques al cargar, al cambiar de tamaño y cuando cargan las letras.
 */
export function FondoInicio() {
  const [escena, setEscena] = useState<EscenaInicio>("portada");

  useEffect(() => {
    const html = document.documentElement;
    let tops: Partial<Record<EscenaInicio, number>> = {};
    const medir = () => {
      const nuevos: Partial<Record<EscenaInicio, number>> = {};
      document.querySelectorAll<HTMLElement>("[data-bloque]").forEach((el) => {
        const nombre = el.dataset.bloque as EscenaInicio;
        nuevos[nombre] = el.getBoundingClientRect().top + window.scrollY;
      });
      tops = nuevos;
    };
    let actual: EscenaInicio = "portada";
    let enlace: EnlaceActivo = "";
    const revisar = () => {
      const y = window.scrollY;
      const alto = window.innerHeight;
      let nueva: EscenaInicio = "portada";
      for (const c of CAMBIOS) {
        const top = tops[c.escena];
        if (top !== undefined && y + c.linea * alto >= top) nueva = c.escena;
      }
      if (nueva !== actual) {
        actual = nueva;
        setEscena(nueva);
      }
      let nuevoEnlace: EnlaceActivo = "";
      for (const e of ENLACES) {
        const top = tops[e.bloque];
        if (top !== undefined && y + e.linea * alto >= top) nuevoEnlace = e.enlace;
      }
      if (nuevoEnlace !== enlace) {
        enlace = nuevoEnlace;
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

  return <FondoFiguras escena={escena} />;
}
