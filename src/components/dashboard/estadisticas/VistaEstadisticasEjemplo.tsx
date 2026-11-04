"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Destino } from "@/lib/demo-dashboard";
import { periodoDe, PERIODO_INICIAL, type DestinoEstadisticas, type Periodo } from "@/lib/estadisticas";
import type { Accion } from "../tipos";
import { datosDeEjemplo } from "./ejemplo";
import { VistaEstadisticas } from "./VistaEstadisticas";

/*
 * Estadísticas en /pruebalo, con DATOS DE EJEMPLO. Lista para poner en
 * lugar de VistaEstadisticasDemo:
 *   <VistaEstadisticasEjemplo ir={ir} insignia={MARCA_EJEMPLO} />
 * - El periodo va en la dirección (/pruebalo?vista=estadisticas&periodo=7d)
 *   y atrás/adelante lo respetan.
 * - Lo demás se abre con `ir` (sin recargar), en la vista de /pruebalo que
 *   le toca: el chat del agente, Correo filtrado por remitente, Pendientes.
 */

/** A dónde lleva cada destino dentro de /pruebalo (null = un enlace normal). */
export function destinoPruebalo(d: DestinoEstadisticas): Destino | null {
  switch (d.tipo) {
    case "agente":
      return { vista: "conversaciones", con: d.agente };
    case "chat":
      return { vista: "conversaciones" };
    case "correo":
      return d.de ? { vista: "correo", de: d.de } : { vista: "correo" };
    case "pendientes":
      return { vista: "pendientes", tipo: "correos" };
    case "hora":
      return { vista: "actividad" };
    default:
      return null;
  }
}

const leerPeriodo = (): Periodo => periodoDe(new URLSearchParams(window.location.search).get("periodo"));

export function VistaEstadisticasEjemplo({ ir, insignia }: { ir: (d: Destino) => void; insignia?: ReactNode }) {
  const [periodo, setPeriodo] = useState<Periodo>(PERIODO_INICIAL);
  const [ahora] = useState(() => new Date());

  useEffect(() => {
    setPeriodo(leerPeriodo());
    const alVolver = () => setPeriodo(leerPeriodo());
    window.addEventListener("popstate", alVolver);
    return () => window.removeEventListener("popstate", alVolver);
  }, []);

  const datos = useMemo(() => datosDeEjemplo(periodo, ahora), [periodo, ahora]);

  const accionDe = useCallback(
    (d: DestinoEstadisticas): Accion => {
      if (d.tipo === "periodo") {
        return {
          alElegir: () => {
            const url = new URL(window.location.href);
            url.searchParams.set("vista", "estadisticas");
            url.searchParams.set("periodo", d.periodo);
            window.history.pushState(null, "", `${url.pathname}${url.search}`);
            setPeriodo(d.periodo);
          },
        };
      }
      if (d.tipo === "plan") return { href: "/precios" };
      const destino = destinoPruebalo(d);
      return destino ? { alElegir: () => ir(destino) } : {};
    },
    [ir],
  );

  return <VistaEstadisticas datos={datos} periodo={periodo} base="/pruebalo" accionDe={accionDe} insignia={insignia} />;
}
