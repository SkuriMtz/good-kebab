"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useTransition, type ReactNode } from "react";
import { IDIOMA_COOKIE, t, type Idioma } from "./index";

const Contexto = createContext<Idioma>("en");

/**
 * Da el idioma a los componentes del navegador (lo pone el layout con la
 * cookie). `forzar` deja una parte del sitio en un idioma fijo (el panel y
 * /pruebalo, en español) y pone ese idioma en <html lang> mientras se ve.
 */
export function IdiomaProvider({ idioma, forzar = false, children }: { idioma: Idioma; forzar?: boolean; children: ReactNode }) {
  useEffect(() => {
    if (!forzar) return;
    const html = document.documentElement;
    const antes = html.lang;
    html.lang = idioma;
    return () => {
      html.lang = antes;
    };
  }, [forzar, idioma]);
  return <Contexto.Provider value={idioma}>{children}</Contexto.Provider>;
}

/** El idioma y sus textos: `const { idioma, d } = useIdioma()`. */
export function useIdioma() {
  const idioma = useContext(Contexto);
  return { idioma, d: t(idioma) };
}

/** Guarda el idioma en la cookie (un año) y vuelve a pedir la página al servidor. */
export function useCambiarIdioma() {
  const router = useRouter();
  const [cambiando, empezar] = useTransition();
  const cambiar = (nuevo: Idioma) => {
    document.cookie = `${IDIOMA_COOKIE}=${nuevo}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = nuevo;
    empezar(() => router.refresh());
  };
  return { cambiar, cambiando };
}

/**
 * "EN / ES": dos opciones en una píldora, la elegida encendida. Cambia el
 * idioma de todo el sitio público sin recargar.
 */
export function BotonIdioma({ className = "" }: { className?: string }) {
  const { idioma, d } = useIdioma();
  const { cambiar, cambiando } = useCambiarIdioma();
  return (
    <div className={`boton-idioma ${className}`} role="group" aria-label={d.barra.idioma} data-cambiando={cambiando ? "true" : undefined}>
      {(["en", "es"] as const).map((opcion) => (
        <button
          key={opcion}
          type="button"
          className="boton-idioma__opcion"
          lang={opcion}
          aria-pressed={idioma === opcion}
          aria-label={opcion === "en" ? "English" : "Español"}
          data-idioma-boton={opcion}
          onClick={() => idioma !== opcion && cambiar(opcion)}
        >
          {opcion.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
