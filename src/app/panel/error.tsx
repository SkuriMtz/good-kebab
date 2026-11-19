"use client";

import { useEffect } from "react";
import { Boton } from "@/components/base/Boton";
import { Seccion } from "@/components/panel/Secciones";
import { Vacio } from "@/components/panel/Piezas";

/**
 * Si una sección del panel se rompe, el menú se queda y aquí sale un aviso
 * claro con «Intentar de nuevo» (sin detalle técnico: va a la consola).
 *
 * Versión vieja abierta: si subimos una versión nueva mientras tenías el
 * panel abierto, al cambiar de pestaña la página vieja pide piezas que ya no
 * existen y truena. Ese error se reconoce y la página se recarga sola (una
 * vez por minuto como mucho, para nunca quedarse en un ciclo).
 */
const VERSION_VIEJA = /ChunkLoadError|Loading (CSS )?chunk [\w-]+ failed|Failed to fetch dynamically imported module|Importing a module script failed|reading 'call'|Failed to find Server Action|deployment/i;
const RECARGA = "atendel-recarga-version";
export default function ErrorDelPanel({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Error del panel", error.digest ?? "");
    if (!VERSION_VIEJA.test(`${error.name} ${error.message}`)) return;
    try {
      const antes = Number(sessionStorage.getItem(RECARGA) || 0);
      if (Date.now() - antes < 60_000) return;
      sessionStorage.setItem(RECARGA, String(Date.now()));
    } catch {
      return;
    }
    window.location.reload();
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
