"use client";

import { useEffect } from "react";
import { MarcoAcceso } from "@/components/acceso/MarcoAcceso";
import { Boton } from "@/components/base/Boton";
import { useIdioma } from "@/i18n/Idioma";

/**
 * Error 500 del sitio, con el estilo de las páginas de acceso: fondo de
 * fragmentos y una tarjeta con la marca, el título, una línea y el botón
 * principal. Nunca se muestra el detalle técnico: solo va a la consola.
 */
export default function ErrorDePagina({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { d } = useIdioma();
  const P = d.errorPagina;
  useEffect(() => {
    console.error("Error de página", error.digest ?? "");
  }, [error]);
  return (
    <MarcoAcceso etiqueta={P.etiqueta} titulo={P.titulo} tituloId="error-titulo" texto={P.texto}>
      <div className="acc__botones">
        <Boton tam="grande" bloque onClick={() => reset()}>
          {P.reintentar}
        </Boton>
        <Boton href="/" tam="grande" variante="fantasma" bloque>
          {P.volver}
        </Boton>
      </div>
    </MarcoAcceso>
  );
}
