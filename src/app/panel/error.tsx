"use client";

import { useEffect } from "react";
import { Boton } from "@/components/base/Boton";
import { Seccion } from "@/components/panel/Secciones";
import { Vacio } from "@/components/panel/Piezas";

/**
 * Si una sección del panel se rompe, el menú se queda y aquí sale un aviso
 * claro con «Intentar de nuevo» (sin detalle técnico: va a la consola).
 */
export default function ErrorDelPanel({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Error del panel", error.digest ?? "");
  }, [error]);
  return (
    <Seccion>
      <Vacio
        icono="alerta"
        titulo="Algo no salió bien"
        texto="Fue de nuestro lado, no tuyo. Intenta de nuevo; si sigue, vuelve en unos minutos."
        accion={
          <div className="flex flex-wrap items-center gap-[var(--spacing-8)]">
            <Boton onClick={() => reset()}>Intentar de nuevo</Boton>
            <Boton href="/panel" variante="sutil">
              Ir a la Oficina
            </Boton>
          </div>
        }
      />
    </Seccion>
  );
}
