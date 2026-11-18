"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useTransition, type ReactNode } from "react";
import { IDIOMA_COOKIE, IDIOMAS, NOMBRE_IDIOMA, esIdioma, t, type Idioma } from "./index";

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
 * El selector de idioma: un globo, el nombre del idioma y una flechita
 * (un <select> de verdad: en el celular abre la lista del sistema). Cambia el
 * idioma de todo el sitio público sin recargar.
 */
export function BotonIdioma({ className = "" }: { className?: string }) {
  const { idioma, d } = useIdioma();
  const { cambiar, cambiando } = useCambiarIdioma();
  return (
    <label className={`boton-idioma ${className}`} data-cambiando={cambiando ? "true" : undefined}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" />
      </svg>
      <select
        className="boton-idioma__select"
        value={idioma}
        aria-label={d.barra.idioma}
        onChange={(e) => {
          const nuevo = e.target.value;
          if (esIdioma(nuevo) && nuevo !== idioma) cambiar(nuevo);
        }}
      >
        {IDIOMAS.map((opcion) => (
          <option key={opcion} value={opcion} lang={opcion}>
            {NOMBRE_IDIOMA[opcion]}
          </option>
        ))}
      </select>
      <svg className="boton-idioma__flecha" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="m6 9 6 6 6-6" />
      </svg>
    </label>
  );
}
