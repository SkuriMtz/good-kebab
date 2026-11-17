"use client";

import { useEffect } from "react";
import { Boton } from "@/components/base/Boton";
import { useIdioma } from "@/i18n/Idioma";

/**
 * Error 500 del sitio: si algo se rompe al armar una página, en vez de la
 * pantalla de Next sale esta, en el idioma de la persona y con el estilo de
 * la 404 (etiqueta en Mono, título grande, una línea y el botón principal).
 * Nunca se muestra el detalle técnico: solo va a la consola del servidor.
 */
export default function ErrorDePagina({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { d } = useIdioma();
  const P = d.errorPagina;
  useEffect(() => {
    console.error("Error de página", error.digest ?? "");
  }, [error]);
  return (
    <main id="contenido" className="encabezado-escena contenedor pagina-404" aria-labelledby="error-titulo">
      <div className="encabezado-escena__texto">
        <p className="t-etiqueta">{P.etiqueta}</p>
        <h1 id="error-titulo" className="t-portada mt-[var(--spacing-18)]">
          {P.titulo}
        </h1>
        <p className="d-parrafos max-w-[460px]">{P.texto}</p>
        <div className="mt-[var(--spacing-36)] flex flex-wrap items-center gap-[var(--spacing-12)]">
          <Boton tam="grande" onClick={() => reset()}>
            {P.reintentar}
          </Boton>
          <Boton href="/" tam="grande" variante="sutil">
            {P.volver}
          </Boton>
        </div>
      </div>
    </main>
  );
}
